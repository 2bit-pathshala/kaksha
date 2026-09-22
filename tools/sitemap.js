#!/usr/bin/env node
/* sitemap.js - writes sitemap.xml from the page table.

   Run it with:  node tools/sitemap.js
   Check it with: node tools/sitemap.js --check   (exits non-zero if stale)

   lastmod is the date that page's file was last touched in git, not the date
   this ran, so a rebuild does not tell every crawler that every page changed.
   tools/check.js runs the --check form, which is what stops a new page from
   being added to the site and forgotten here. */

const fs = require("fs"), path = require("path"), cp = require("child_process");
const { ORIGIN, PAGES } = require("./pages.js");
const ROOT = path.join(__dirname, "..");

const lastmod = file => {
  try {
    const d = cp.execSync(`git log -1 --format=%cI -- ${JSON.stringify(file)}`,
                          { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (d) return d.slice(0, 10);
  } catch (e) { /* not a git checkout, or the file is new and unstaged */ }
  return new Date().toISOString().slice(0, 10);
};

const entries = PAGES.filter(p => p.index).map(p =>
  ["  <url>",
   `    <loc>${ORIGIN}${p.path}</loc>`,
   `    <lastmod>${lastmod(p.file)}</lastmod>`,
   `    <changefreq>${p.changefreq}</changefreq>`,
   `    <priority>${p.priority}</priority>`,
   "  </url>"].join("\n"));

const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
             ...entries, "</urlset>", ""].join("\n");

const out = path.join(ROOT, "sitemap.xml");
if (process.argv.includes("--check")) {
  const have = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
  // lastmod moves with every commit to a page, so compare the URL set, which is
  // the part a human has to remember to update
  const locs = s => (s.match(/<loc>[^<]*<\/loc>/g) || []).join("\n");
  if (locs(have) !== locs(xml)) {
    console.error("sitemap.xml is out of date. Run: node tools/sitemap.js");
    process.exit(1);
  }
  console.log(`sitemap.xml lists ${entries.length} urls, matching tools/pages.js`);
} else {
  fs.writeFileSync(out, xml);
  console.log(`wrote sitemap.xml with ${entries.length} urls`);
}
