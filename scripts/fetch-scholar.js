#!/usr/bin/env node
/**
 * Syncs data/publications.json and data/metrics.json from a Google Scholar
 * profile.
 *
 * Google Scholar has no public API and blocks cross-origin/scripted
 * requests from a browser, so this cannot run client-side on the page
 * itself. Instead it runs server-side on a schedule (see
 * .github/workflows/update-publications.yml), fetching the profile HTML
 * directly and writing the parsed results into the repo. The site's
 * front-end (assets/js/publications.js) only ever reads the resulting
 * static JSON, so the live page stays fast and available even when
 * Scholar is slow, rate-limiting, or serving a captcha to this script.
 *
 * Usage: node scripts/fetch-scholar.js
 * Env:   SCHOLAR_USER_ID (defaults to Ashok Dahal's profile id below)
 */

"use strict";

const fs = require("fs");
const path = require("path");

const SCHOLAR_USER_ID = process.env.SCHOLAR_USER_ID || "yqDUVTUAAAAJ";
const PROFILE_URL =
  `https://scholar.google.com/citations?user=${SCHOLAR_USER_ID}&hl=en&cstart=0&pagesize=100`;

const DATA_DIR = path.join(__dirname, "..", "data");
const PUBLICATIONS_PATH = path.join(DATA_DIR, "publications.json");
const METRICS_PATH = path.join(DATA_DIR, "metrics.json");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ---------------------------------------------------------------- helpers

function decodeEntities(str) {
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ""));
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function classifyType(venue) {
  const v = venue.toLowerCase();
  if (v.includes("arxiv") || v.includes("eartharxiv") || v.includes("egusphere") || v.includes("preprint")) {
    return "preprint";
  }
  if (v.includes("assembly") || v.includes("conference") || v.includes("symposium") || v.includes("proceedings") || v.includes("egu")) {
    return "conference";
  }
  return "journal-article";
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  if (!res.ok) {
    throw new Error(`Request to ${url} failed with status ${res.status}`);
  }
  const html = await res.text();
  if (/id="gs_captcha_f"|our systems have detected unusual traffic/i.test(html)) {
    throw new Error("Google Scholar returned a captcha/block page — skipping this run.");
  }
  return html;
}

// ------------------------------------------------------------- parsing

function parseMetrics(html) {
  const values = [];
  const cellRe = /<td class="gsc_rsb_std">(\d+)<\/td>/g;
  let m;
  while ((m = cellRe.exec(html)) !== null) values.push(parseInt(m[1], 10));

  if (values.length < 6) {
    throw new Error("Could not find the expected citation metrics table on the profile page.");
  }

  return {
    citations: values[0],
    citationsSince2021: values[1],
    hIndex: values[2],
    hIndexSince2021: values[3],
    i10Index: values[4],
    i10IndexSince2021: values[5]
  };
}

function parsePublications(html) {
  const rows = html.match(/<tr class="gsc_a_tr">[\s\S]*?<\/tr>/g) || [];

  return rows.map((row) => {
    const titleMatch = row.match(/class="gsc_a_at"[^>]*>([\s\S]*?)<\/a>/);
    const grayDivs = [...row.matchAll(/<div class="gs_gray">([\s\S]*?)<\/div>/g)].map((d) =>
      stripTags(d[1])
    );
    const citeMatch = row.match(/class="gsc_a_ac[^"]*"[^>]*>(\d*)</);
    const yearMatch = row.match(/class="gsc_a_h[^"]*"[^>]*>(\d{4})</);

    const title = titleMatch ? stripTags(titleMatch[1]) : null;
    const authors = grayDivs[0] || "";
    const venue = grayDivs[1] || "";
    const citations = citeMatch && citeMatch[1] ? parseInt(citeMatch[1], 10) : null;
    const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

    return { title, authors, venue, citations, year };
  }).filter((p) => p.title && p.year);
}

// -------------------------------------------------------------- merge

function mergePublications(existing, scraped) {
  const byNormTitle = new Map(existing.map((p) => [normalizeTitle(p.title), p]));
  let updated = 0;
  let added = 0;

  scraped.forEach((s) => {
    const key = normalizeTitle(s.title);
    const match = byNormTitle.get(key);

    if (match) {
      if (typeof s.citations === "number" && s.citations !== match.citations) {
        match.citations = s.citations;
        updated += 1;
      }
    } else {
      const entry = {
        id: `${key.split(" ").slice(0, 3).join("-")}-${s.year}`.slice(0, 60),
        title: s.title,
        authors: s.authors || "Dahal, A., et al.",
        venue: s.venue || "",
        year: s.year,
        type: classifyType(s.venue || ""),
        citations: s.citations
      };
      existing.push(entry);
      byNormTitle.set(key, entry);
      added += 1;
    }
  });

  return { publications: existing, updated, added };
}

// ---------------------------------------------------------------- main

async function main() {
  console.log(`Fetching Google Scholar profile: ${PROFILE_URL}`);
  const html = await fetchHtml(PROFILE_URL);

  const metrics = parseMetrics(html);
  const scraped = parsePublications(html);
  console.log(`Parsed ${scraped.length} publications and citation metrics from Scholar.`);

  if (scraped.length === 0) {
    throw new Error("Parsed zero publications — Scholar's markup may have changed. Aborting without writing files.");
  }

  const existingData = JSON.parse(fs.readFileSync(PUBLICATIONS_PATH, "utf8"));
  const { publications, updated, added } = mergePublications(existingData.publications, scraped);

  const today = new Date().toISOString().slice(0, 10);

  const newPublicationsData = {
    generatedBy: "scripts/fetch-scholar.js",
    lastUpdated: today,
    publications
  };
  const newMetricsData = {
    source: "Google Scholar",
    profileUrl: `https://scholar.google.com/citations?user=${SCHOLAR_USER_ID}&hl=en`,
    citations: metrics.citations,
    citationsSince2021: metrics.citationsSince2021,
    hIndex: metrics.hIndex,
    hIndexSince2021: metrics.hIndexSince2021,
    i10Index: metrics.i10Index,
    i10IndexSince2021: metrics.i10IndexSince2021,
    lastUpdated: today
  };

  fs.writeFileSync(PUBLICATIONS_PATH, JSON.stringify(newPublicationsData, null, 2) + "\n");
  fs.writeFileSync(METRICS_PATH, JSON.stringify(newMetricsData, null, 2) + "\n");

  console.log(`Done. ${updated} citation count(s) updated, ${added} new publication(s) added.`);
  console.log(`Metrics: ${metrics.citations} citations, h-index ${metrics.hIndex}, i10-index ${metrics.i10Index}.`);
  if (added > 0) {
    console.log("New publications were classified automatically by venue text — please review their \"type\" field.");
  }
}

main().catch((err) => {
  console.error("fetch-scholar.js failed:", err.message);
  console.error("Leaving existing data/publications.json and data/metrics.json untouched.");
  process.exit(1);
});
