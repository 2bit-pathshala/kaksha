# 2BIT Pathshala

Interview prep notes. Two ways in:

- **Concepts** (`concept.html`), one concept per page, in a fixed order: a stepped visual,
  plain words, why it works from first principles, the same hard part again in Hinglish,
  the maths worked step by step with real numbers, costs and traps, pseudocode plus
  Python / Java / C++ / JavaScript, questions to check yourself, and practice. The explanations are language-agnostic; language specifics live in
  their own table.
- **Revision** (`revise.html`), every concept as the one line worth remembering, with its
  questions. Answer them out loud, then open them.

- **Design Lab** (`design.html`), nine real systems worked end to end. Each architecture is
  grown stage by stage, and a stage may only add a box if it can name the pressure that broke
  the previous one. Click any box for why it exists, what lost the argument, what it costs and
  how it fails.

Plus the original sheets: DSA notes, a one-day sheet, the patterns roadmap, and LLD / HLD /
HR one-pagers.

This is a shared repo, so nothing records what any reader has done, no checkboxes, no
progress meters, no per-person state. The only things kept in the browser are the colour
theme and which code tab you last looked at.

## Run locally

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Layout

Pages stay in the root so their URLs are stable; everything else is grouped by kind.

```
/                     the HTML pages, served as-is by GitHub Pages
  index.html          hub
  concept.html        the deep page for one concept
  revise.html         recall lines and questions
  dsa-notes.html      DSA notes (topic notes + practice)
  dsa-sheet.html      DSA one-day sheet
  dsa-patterns.html   pattern roadmap + practice questions
  lld.html hld.html   system-design notes
  design.html         Design Lab, systems grown stage by stage
  hr.html  ai.html    HR notes; AI placeholder
  study.html dsa.html dsa-cheatsheet.html   redirects to the above
css/                  learn.css (concept/revise), style.css (hub)
js/                   viz.js (stepped visuals), script.js (hub)
data/                 *-data.js, the single source of content per section
docs/                 CONTENT-GUIDE.md, how to write a new concept
check.js              build check: run before every commit
```

Each page loads its matching `data/<name>-data.js`; `concept.html` and `revise.html`
share `data/concept-data.js`, and `dsa-notes.html` and `dsa-patterns.html` share
`data/dsa-data.js`.

## Deploy on GitHub Pages

1. Push the repo to GitHub.
2. **Settings → Pages**.
3. Source: **Deploy from a branch**, branch **`main`**, folder **`/ (root)`**.
