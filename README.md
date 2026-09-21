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

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Hub |
| `concept.html` | Concepts, the deep page for one concept |
| `revise.html` | Revision, recall lines and questions |
| `concept-data.js` | All concept content (single source for both pages) |
| `viz.js` | Step-through SVG visuals, the player and the visuals themselves |
| `learn.css` | Styles for `concept.html` and `revise.html` |
| `style.css` | Styles for the hub and the placeholder page |
| `CONTENT-GUIDE.md` | How to write a new concept |
| `dsa-notes.html` | DSA notes (topic notes + practice) |
| `dsa-sheet.html` | DSA one-day sheet |
| `dsa-patterns.html` | Pattern roadmap + practice questions |
| `dsa-data.js` | Shared DSA content |
| `design.html` / `design-data.js` | Design Lab, worked HLD and LLD examples with stepped diagrams |
| `lld.html` / `lld-data.js` | LLD notes (OOP, concurrency, patterns, machine coding) |
| `hld.html` / `hld-data.js` | HLD notes (scalability, databases, caching, APIs) |
| `hr.html` / `hr-data.js` | HR + manager notes (STAR / CAR / HERO, résumé stories, why company / leave, salary) |
| `ai.html` | AI, not written yet |
| `study.html`, `dsa-cheatsheet.html`, `dsa.html` | Redirects to the pages above |

## Deploy on GitHub Pages

1. Push the repo to GitHub.
2. **Settings → Pages**.
3. Source: **Deploy from a branch**, branch **`main`**, folder **`/ (root)`**.
