/* pages.js - the site's page table, and the one place its public address is
   written down. The sitemap generator, the SEO check and anything else that
   needs to know what this site consists of all read it from here, so a new page
   is added once rather than in three files that quietly disagree.

   Addresses are extensionless because Cloudflare Pages redirects /concept.html
   to /concept with a 308. A canonical or a sitemap entry has to name the URL a
   visitor actually ends up on, not the one that bounces. */

const ORIGIN = "https://pathshala.2bit.in";

/* index: true  puts the page in the sitemap and lets search engines keep it.
   index: false is for pages with nothing to rank: the three redirect stubs kept
   for old links, and the AI placeholder, which is a promise rather than a page. */
const PAGES = [
  { file: "index.html",          path: "/",              priority: "1.0", changefreq: "weekly",  index: true },
  { file: "concept.html",        path: "/concept",       priority: "0.9", changefreq: "weekly",  index: true },
  { file: "revise.html",         path: "/revise",        priority: "0.9", changefreq: "weekly",  index: true },
  { file: "dsa-notes.html",      path: "/dsa-notes",     priority: "0.8", changefreq: "weekly",  index: true },
  { file: "dsa-patterns.html",   path: "/dsa-patterns",  priority: "0.8", changefreq: "weekly",  index: true },
  { file: "dsa-sheet.html",      path: "/dsa-sheet",     priority: "0.8", changefreq: "weekly",  index: true },
  { file: "hld.html",            path: "/hld",           priority: "0.8", changefreq: "weekly",  index: true },
  { file: "lld.html",            path: "/lld",           priority: "0.8", changefreq: "weekly",  index: true },
  { file: "hr.html",             path: "/hr",            priority: "0.8", changefreq: "weekly",  index: true },
  { file: "design.html",         path: "/design",        priority: "0.8", changefreq: "weekly",  index: true },
  { file: "ai.html",             path: "/ai",             index: false },

  /* The three stubs kept alive for links published under the old names. Their
     canonical names the page they forward to, which is the whole job: pointing
     a stub at itself would ask a crawler to index the redirect. */
  { file: "study.html",          path: "/study",          index: false, canonical: "/dsa-notes" },
  { file: "dsa.html",            path: "/dsa",            index: false, canonical: "/dsa-patterns" },
  { file: "dsa-cheatsheet.html", path: "/dsa-cheatsheet", index: false, canonical: "/dsa-sheet" },

  /* A 404 is not a place, so it gets no canonical at all. */
  { file: "404.html",            path: "/404",            index: false, canonical: null },
];

module.exports = { ORIGIN, PAGES };
