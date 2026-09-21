# Content guide, how to write a concept

Everything on `concept.html` and `revise.html` comes from one array in `concept-data.js`.
Add a concept by adding one object. Follow these rules and the two pages stay consistent
as the file grows.

## The design in one paragraph

A concept is taught in a **fixed order of ten sections**, the same order every time. The
order is not decorative: you meet the idea as a sentence, then as a picture, then as words,
then as reasoning, then again in Hinglish if the reasoning slipped, then worked out in
actual arithmetic, then as numbers to quote, then as code, then as a test. Nothing on the
page tracks what any reader has done. This repo is shared, so there are no checkboxes,
meters or per-person state.

| # | Section | Field | Job |
|---|---------|-------|-----|
| 1 | In one line | `one` | The sentence you say in an interview |
| 2 | See it work | `viz`, `see` | Watch the mechanism, one step at a time |
| 3 | In plain words | `plain` | What and why, no jargon, one analogy |
| 4 | Why it works | `why` | Build it up from nothing |
| 5 | In Hinglish | `hing` | The same hard part, easier language |
| 6 | The maths, step by step | `math` | The working, with real numbers in it |
| 7 | Costs and traps | `costs`, `traps`, `impl` | Numbers to quote, mistakes to avoid |
| 8 | The template | `code`, `codecap` | Pseudocode plus four languages |
| 9 | Check yourself | `q` | Answer out loud, then open |
| 10 | Practice | `p` | Problems, easiest first |

`revise.html` reads only `one` and `q`. That is deliberate: **the revision page can only be
as good as the recall line**, so spend real effort on `one`.

## Rules per field

**`one`**, under 30 words. State the mechanism, not the name. Bold the load-bearing phrase.
Weak: "Sliding window is a technique for subarray problems." Strong: "Consecutive windows
overlap, so never recompute one from scratch: subtract what leaves, add what joins."

**`plain`**, 2–4 short paragraphs of HTML. Written for someone meeting the idea for the
first time, so it assumes nothing: no term is used before it is explained, and a term that
has to appear gets its gloss in the same sentence ("<b>contiguous</b>, meaning a run of
items sitting next to each other with no gaps"). Start from the problem, not the structure.
End with one concrete **analogy** from outside programming. Around 180 words.

**`why`**, 5–6 steps of `{t, d}`, and keep them short. Each step must follow from the one
before, so a reader could have guessed the next. Start from a requirement or a constraint,
never from the name of the structure. Somewhere near the end, say what the idea **cannot**
do. Plain words beat precise words: if a sentence needs re-reading, cut it in half. Never
write "it can be shown that", show it.

**`hing`**. Roman script, natural Hindi-English mix, technical terms left in English
(*hash function*, *load factor*, *amortised*). Do not translate section 4 line by line:
re-teach the two or three hardest moves and add the interview-facing advice.

**`math`**, 3 to 5 steps of `{ t, d, w }`. This is the section that shows its working.
`t` names what is being derived, `d` is a sentence or two of setup, and `w` is the working
itself: a monospace block, **68 columns maximum**, because it sits in the prose column and
not in the full-width code listing. There is a test for the width and a test that no step
has a title with nothing under it.

The rule that makes this section worth having: **put real numbers in it**. Not
"O(n log n) is better than O(n²)", but `n = 10^5: 1.7 x 10^6 versus 5 x 10^9`. A reader
who has seen the two numbers side by side does not need to be told which to pick. Derive
the bound where a derivation fits in six lines (the halvings that give `log n`, the
geometric sum behind amortised append, the `n!` argument for the sorting bound), and where
it does not, work a small case by hand instead. Use ASCII throughout: `x` for multiply,
`^` for powers, `<=` for comparisons, so the block lines up in every font.

**`variants`** (optional), for umbrella topics with a family of algorithms underneath:
`[{ n, cost, idea, when, watch }]`. It renders as an extra section, "Which one, and when",
placed straight after the reasoning. Use it where the parent page teaches the *theory* and
each family member needs a paragraph rather than a page: sorting has ten, shortest paths
has seven, string search has six. `cost` is a one-line summary, `when` is the situation
that should make you reach for it, `watch` is the thing that will bite you. If a member
needs its own derivation, its own visual and its own code, it wants a page instead.

**`costs`**, `[operation, cost, why]`. The `why` column is what makes it stick; never let it
restate the first two columns.

**`traps`**, 3–5 mistakes that actually cost marks or cause a timeout, not generic advice.

**`impl`**, `[language, what it is called, what to watch for]` for Python, Java, C++ and
JavaScript. All language specifics belong here, so the prose above can stay neutral.

**`code`**, an object with `pseudo`, `py`, `java`, `cpp`, `js`. **Write `pseudo` first**: it
is the concept, the rest are translations. Keep every version to the same few templates. This is not a library tour. Comment the *why*, not the syntax.

**`q`**, 4–6 `[question, answer]` pairs, each answerable from section 4 alone. If a question
needs a fact that appears nowhere above it, the concept is incomplete.

**`p`**, `[leetcodeNumber, "slug", "Title, what it drills", "E|M|H"]`, or
`["SRC", "https://…", "Title", "E"]` for anything else. Easiest first.

## Plain enough for a first reader

Three rules, and a test that enforces the first one.

**No sentence over 28 words**, in `plain`, `why`, `hing` or a `math` step. This is checked
by `check.js` and it fails the build. The limit is not a style preference: a sentence that
runs past it is almost always two ideas that were never separated, and the reader has to
hold the first one while parsing the second. Split it at the comma that was doing the work
of a full stop. A bold lead-in, a `<br>` and the end of a paragraph all count as breaks,
so a heading is never charged to the sentence after it.

**Numbers beat adjectives.** Not "this is much slower", but `n = 10^5: 5 x 10^9 versus
2 x 10^5`. The reader who has seen the two numbers does not need to be told which to pick.

**Prove it on an instance, not in symbols.** The fastest way to lose a beginner is a
proof written in letters: "if b x = b y then m divides b(x - y)". Walk it on real values
first, then state the general rule in one line at the end. Every derivation on the site
that used to be algebra is now a small case worked by hand, and the `math` section exists
to carry exactly that.

## Voice

Write like someone who has debugged this at 2am, not like a reference manual.

**No em-dashes.** Not one. Use a comma, a colon, a full stop or brackets, and if a
sentence only works with a dash, the sentence needs rewriting. There is a test that
fails the build over this, which should tell you how seriously it is meant.

**Dry, not zany.** The humour lands on the trap, the language, or the tooling. Never on
the reader, who is here because they are trying to learn something. "The compiler will
not warn you. The compiler has never warned anyone about this." is the register. Jokes
that need explaining, or that come at the cost of an accurate sentence, are cut.

**Earn the aside.** One good line per section beats five. If a page reads as though it is
trying to be funny, it has stopped teaching, and the reader will feel talked at rather
than taught.

**Say the uncomfortable part.** "It works on your test data and fails in production."
"Asked about far more often than it is needed." "Which is at least honest." Naming what
actually goes wrong is more useful than a neutral description of the happy path.

## Three standing rules

**Language-agnostic.** The concept is the thing; the language is an implementation detail.
Sections 1, 3, 4 and 5 must hold in *any* language. If a sentence is only true in one, move
it to `impl` or `traps`, or name the languages explicitly. Where languages genuinely
disagree, say so. That disagreement is itself worth teaching (C++ `priority_queue` is a
max-heap while most others default to min; C++ `std::string` is mutable while Python, Java
and JavaScript strings are not).

**No tracking, no personal details.** No progress bars, checkboxes, streaks, confidence
markers or "you have done N of M". The only thing kept in `localStorage` is which code tab
and colour theme you last used, which is a view preference, not a record. No names, no
personal links.

**Emoji: chrome plain, content free.** Buttons, tabs, navigation, section headings and
footers carry no emoji, a theme toggle says "Dark", not a moon. Inside the content an
emoji is fine wherever it does a job: marking a warning, a hint, or identifying a topic in
a long single-page sheet. The test is whether removing it loses meaning.

## Visuals

Visuals live in `viz.js` as frame lists, not as images, so they follow the colour theme,
never break, stay diffable in git, and can be stepped one frame at a time.

Four kinds are available: `cells` (a row of boxes: arrays, windows, pointers, stacks,
queues, binary search), `curve` (growth curves), `tree` (nodes and edges, with per-frame
relabelling for swaps and return values), `hash` (keys, hash function, buckets).

Every frame needs a `cap`. **The caption is the teaching**, the drawing shows *what*
changed, the caption says *why*. Aim for 5–8 frames: the first sets up the naive approach,
the middle ones do the work, the last states the complexity.

Labels are auto-shrunk to fit their box by the `fit()` helper in `viz.js`. If you add a new
shape, size its text through `fit()` too, or long labels will spill out.

Add one with `VIZ["my-id"] = { kind, …, frames: [...] }`, then reference it as
`viz: ["my-id"]`. A concept may list more than one.

## Before committing

```bash
node --check concept-data.js && node --check viz.js
```

Then open `concept.html?c=<id>` and confirm: ten sections render, every visual plays and
nothing overflows its box, no derivation block scrolls sideways on a phone, all five code
tabs have content, and each answer is genuinely derivable from section 4.

# Adding a Design Lab project

Everything on `design.html` comes from one array in `design-data.js`. The schema is in the
comment at the top of that file. These are the rules the schema does not tell you.

## The rule that makes it teach

**A stage may only add a box if it can name the pressure that broke the previous stage.**
Stage 0 is always the version that genuinely works for about a day. Every stage after it
has a `pressure` (what forced this), a `say` (the sentence you would use in the room) and a
`breaks` (what fails next, which is the next stage's `pressure` seen from the other side).
The last stage has no `breaks`. If you cannot write the `pressure`, the box has not earned
its place, and the fix is to delete the box rather than to write vaguer prose.

Six stages is the working size: fewer and the jumps are too big to follow, more and the
diagrams stop changing enough between clicks to be worth stepping.

## Every box carries its own reasoning

A card without `alts`, `cons` and `fails` is a label, not a lesson. The three columns that
do the teaching are **considered instead** (what lost the argument and why), **disadvantages**
(say them, the design is not a sales pitch) and **how it fails** (the specific 3am story).
`say` is optional and is the one sentence worth memorising for the interview.

## Layout, and the one thing that will bite you

Boxes sit on a grid of `{col, row}` and edges are routed with elbows. There is no clever
router, so **an edge that spans two columns runs straight through whatever sits between
them**. Keep every edge between adjacent columns, or between two rows of the same column
with nothing in between. `check.js` fails the build with the crossing named, which is
usually faster than reasoning about it.

Two more layout facts. `bend` (0 to 1) moves the vertical part of an elbow inside the
gutter, which is how several arrows leave the same box without stacking on one line. And an
arrow label lives in the 72px gutter between two columns, so keep it under about twelve
characters. The renderer places it on the run where it fits and stacks labels arriving at
the same box, but it cannot make a long one narrow. There is a test for that too.

## Roles, and the glyph each one draws

`client, edge, svc, store, cache, queue, work, ext` for HLD, and
`client, svc, entity, value, iface, impl, store` for LLD. The role picks the colour, the
glyph in the corner of the box and the legend chip, so pick the one a reader would guess:
a `store` is drawn as a database cylinder rather than a rectangle, `queue` gets a
partitioned log, `cache` a lightning bolt, `ext` a dashed cloud, `iface` the UML lollipop.
Adding a role means adding its glyph to `ICON`, its colour pair to the `.r-*` block, and
its legend chip to `.lg-*`, all in `design.html`.

## Before committing

```bash
node --check design-data.js && node check.js
```

Then open `design.html?p=<id>`, step every stage with the arrow keys, and click every box.
