/**
 * Renders the publications list and citation metrics.
 *
 * Data comes from same-origin JSON files (data/publications.json,
 * data/metrics.json) rather than a live request to Google Scholar in the
 * browser: Scholar has no public API, blocks cross-origin/scripted
 * requests, and will show a captcha to repeat automated traffic. Fetching
 * it directly from every visitor's browser would be unreliable and could
 * get flagged. Instead, scripts/fetch-scholar.js (Node) runs on a
 * schedule via GitHub Actions, scrapes the profile server-side, and
 * commits the refreshed JSON here — see .github/workflows/update-publications.yml.
 * The page you're looking at just reads that JSON and is always fast and
 * reliable regardless of Scholar's availability.
 */
(function () {
  "use strict";

  var TYPE_META = {
    "journal-article": { label: "Journal Articles", order: 0 },
    "book-chapter": { label: "Book Chapters", order: 1 },
    "conference": { label: "Conference Contributions", order: 2 },
    "preprint": { label: "Preprints", order: 3 }
  };
  var TYPE_ORDER = ["journal-article", "book-chapter", "conference", "preprint"];
  // Matches both the curated "Dahal, A." style and Scholar's raw "A Dahal" style.
  var AUTHOR_SELF_PATTERN = /Dahal,\s*A\.?|\bA\.?\s*Dahal\b/g;

  var root = document.getElementById("publicationsRoot");
  var controls = document.getElementById("pubControls");
  var activeType = "all";
  var publications = [];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightSelf(authors) {
    return escapeHtml(authors).replace(AUTHOR_SELF_PATTERN, function (m) {
      return '<span class="self">' + m + "</span>";
    });
  }

  function groupByType(pubs) {
    var groups = {};
    pubs.forEach(function (p) {
      var type = TYPE_META[p.type] ? p.type : "journal-article";
      if (!groups[type]) groups[type] = [];
      groups[type].push(p);
    });
    Object.keys(groups).forEach(function (type) {
      groups[type].sort(function (a, b) {
        if (b.year !== a.year) return b.year - a.year;
        return a.title.localeCompare(b.title);
      });
    });
    return groups;
  }

  function renderControls(groups) {
    if (!controls) return;
    var types = TYPE_ORDER.filter(function (t) { return groups[t] && groups[t].length; });
    var total = publications.length;

    var buttons = [
      { key: "all", label: "All", count: total }
    ].concat(types.map(function (t) {
      return { key: t, label: TYPE_META[t].label, count: groups[t].length };
    }));

    controls.innerHTML = buttons.map(function (b) {
      var selected = b.key === activeType ? "true" : "false";
      return (
        '<button type="button" class="pub-filter" data-type="' + b.key + '" ' +
        'role="tab" aria-selected="' + selected + '">' +
        escapeHtml(b.label) + " (" + b.count + ")</button>"
      );
    }).join("");

    controls.querySelectorAll(".pub-filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeType = btn.getAttribute("data-type");
        renderList(groups);
        renderControls(groups);
      });
    });
  }

  function pubItemHtml(p) {
    var cites = (typeof p.citations === "number")
      ? '<div class="pub-cites"><strong>' + p.citations + '</strong>citations</div>'
      : "";
    var note = p.note ? ' <span class="badge">' + escapeHtml(p.note) + "</span>" : "";
    var venue = p.venue && p.venue.trim()
      ? '<p class="pub-venue">' + escapeHtml(p.venue) + "</p>"
      : "";

    return (
      '<li class="pub-item">' +
        '<div class="pub-year">' + p.year + "</div>" +
        '<div class="pub-body">' +
          '<p class="pub-title">' + escapeHtml(p.title) + note + "</p>" +
          '<p class="pub-authors">' + highlightSelf(p.authors) + "</p>" +
          venue +
        "</div>" +
        cites +
      "</li>"
    );
  }

  function renderList(groups) {
    if (!root) return;
    var types = TYPE_ORDER.filter(function (t) {
      return groups[t] && groups[t].length && (activeType === "all" || activeType === t);
    });

    if (!types.length) {
      root.innerHTML = '<p class="pub-loading">No publications in this category yet.</p>';
      return;
    }

    root.innerHTML = types.map(function (t) {
      var items = groups[t];
      return (
        '<div class="pub-group">' +
          '<h3 class="pub-group-title">' + TYPE_META[t].label +
          '<span class="pub-group-count">' + items.length + "</span></h3>" +
          '<ul class="pub-list">' + items.map(pubItemHtml).join("") + "</ul>" +
        "</div>"
      );
    }).join("");
  }

  function renderMetrics(metrics) {
    var citations = document.getElementById("metricCitations");
    var hIndex = document.getElementById("metricHIndex");
    var i10 = document.getElementById("metricI10");
    var updated = document.getElementById("metricUpdated");

    if (citations) citations.textContent = metrics.citations != null ? metrics.citations : "—";
    if (hIndex) hIndex.textContent = metrics.hIndex != null ? metrics.hIndex : "—";
    if (i10) i10.textContent = metrics.i10Index != null ? metrics.i10Index : "—";
    if (updated && metrics.lastUpdated) {
      updated.textContent = "Updated " + metrics.lastUpdated;
    }
  }

  function showError() {
    if (root) {
      root.innerHTML =
        '<p class="pub-error">Publications could not be loaded right now. ' +
        'See the full, up-to-date list on ' +
        '<a href="https://scholar.google.com/citations?user=yqDUVTUAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar ↗</a>.</p>';
    }
  }

  function init() {
    var pubsRequest = fetch("data/publications.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("publications.json " + r.status); return r.json(); });

    var metricsRequest = fetch("data/metrics.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("metrics.json " + r.status); return r.json(); })
      .catch(function () { return null; });

    Promise.all([pubsRequest, metricsRequest])
      .then(function (results) {
        var pubData = results[0];
        var metrics = results[1];

        publications = pubData.publications || [];
        var groups = groupByType(publications);

        renderControls(groups);
        renderList(groups);

        if (metrics) renderMetrics(metrics);
      })
      .catch(function (err) {
        console.error("Failed to load publications:", err);
        showError();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
