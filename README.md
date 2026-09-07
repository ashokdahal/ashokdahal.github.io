# ashokdahal.github.io

Academic homepage for Ashok Dahal (Assistant Professor of Artificial Intelligence, Faculty ITC,
University of Twente), published via GitHub Pages. Plain HTML/CSS/JS — no build step.

## Structure

- `index.html`, `assets/css`, `assets/js` — the site itself.
- `data/publications.json`, `data/metrics.json` — publication list and citation metrics
  (citations, h-index, i10-index), read by `assets/js/publications.js` at page load.
- `scripts/fetch-scholar.js` — Node script that scrapes the Google Scholar profile and
  refreshes the two files above.
- `.github/workflows/update-publications.yml` — runs the script weekly (and on demand via
  the Actions tab) and commits any changes.

## Why publications aren't fetched live from the browser

Google Scholar has no public API and blocks cross-origin, scripted requests from a browser, so
the page itself never talks to Scholar directly. Instead `scripts/fetch-scholar.js` runs
server-side on a schedule, and the page reads the resulting static JSON — fast, and unaffected
by Scholar being slow or rate-limiting.

To refresh publications manually:

```bash
node scripts/fetch-scholar.js
```

New publications discovered on Scholar are added automatically with a best-effort type
guess (journal article / book chapter / conference / preprint) — check the diff and correct
`type` if needed after a manual run. Citation counts on existing entries are updated in place;
titles, authors, and venues you've curated by hand are left untouched.

If Scholar blocks the request (rate limiting or a captcha, which does happen from shared CI
IPs), the script exits without touching the committed data, and the next scheduled run tries
again.
