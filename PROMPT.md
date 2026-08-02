# Master Prompt — ZeroGravity Club Website

Paste everything below into an AI coding agent (e.g. Antigravity, Claude Code,
Cursor) to extend this project, or to rebuild it from scratch if you'd rather
not use the provided code. Attach the two logo files when you send it.

---

## Project brief

Build a single-page website for **ZeroGravity**, the official technical club
of the Department of Information Technology at Smt. Kashibai Navale College
of Engineering (Sinhgad Technical Education Society), Pune. Audience:
engineering students deciding whether to join, plus current members checking
event info. Tone: sharp, technical, a little bit "mission control" — not
corporate, not cutesy.

Stack: plain HTML/CSS/JS, no framework, no build step required. Single
`index.html`, `css/style.css`, `js/script.js`. Must run by opening the file
directly — no server, no bundler.

## Design tokens

**Color** (mission-control black with signal-color accents — do not default
to a single-accent minimal palette; this brief calls for red **and** blue
**and** yellow used deliberately):
- `--void: #08080c` — base background
- `--panel: #15151e` — card/panel surface
- `--white: #f4f4f2` — primary text
- `--muted: #9797a3` — secondary text
- `--red: #e8384f` — primary CTA / alerts / leadership tier
- `--blue: #3d8bfd` — links / secondary accent / hover states
- `--yellow: #ffc72c` — highlights / eyebrow labels / active states

**Type:**
- Display/headings: `Orbitron` (700–900 weight) — geometric, technical, used
  with restraint (headlines, section titles, card names only — never body
  copy).
- Body: `Space Grotesk` — everything readable.
- Labels/data/eyebrows: `Space Mono` — small caps-style tags, timestamps,
  panel labels, nav numbering. This is what keeps the page feeling like a
  schematic instead of a template.

**Layout language:** angular, not rounded. Clipped-corner buttons (not
`border-radius`), hairline borders (`1px solid rgba(244,244,242,0.12)`),
corner-bracket accents on hover (like a targeting reticle) rather than drop
shadows, a faint fixed background grid (blueprint texture) at ~5% opacity.

**Signature element:** an animated dashed orbit ring with a traveling dot,
used in the hero and the preloader — this is the one "big" visual idea; keep
everything else disciplined around it. Don't add a second competing
signature element (e.g. don't also add a big 3D globe or particle explosion
— one idea, done well).

## Required sections (in order)

1. **Preloader** — brand boot-sequence: orbit ring fills as a progress
   indicator, the three-word tagline appears word-by-word, percentage
   counter. Should feel like a systems check, not a spinner.
2. **Fixed navbar** — Sinhgad Institutes logo + ZeroGravity logo on the
   left (clicking the ZeroGravity logo smooth-scrolls to top), nav links
   (About / Core Team / Events / Contact) with a numbered mono-font tag
   next to each, a highlighted "Register" button linking to the Google
   Form. Transparent over the hero, solid/blurred once scrolled. Hamburger
   + full-screen overlay menu under ~900px.
3. **Hero** — full-bleed club group photo (placeholder until supplied,
   see Assets below) with a dark scrim, big "ZERO GRAVITY" headline (second
   word outline-only style), three-word tagline, one supporting sentence,
   two CTAs ("Register to Join" → Google Form, "Explore Events" → anchor
   scroll).
4. **About** — two columns: club description copy on the left, a compact
   "status panel" on the right listing Status / Department / Institution /
   Society / Base address as label-value rows (mono labels).
5. **Core Team** — data-driven from a JS array, NOT hardcoded HTML per
   person (so future committees can edit a list, not markup). Three tiers:
   - Leadership row (President, Vice-President, Chief Coordinator) — larger
     cards, red role label.
   - Department grid — Head + Co-Head paired per card, one card per
     department (Treasurer, Execution, Documentation, Magazine, Technical,
     Event Management, Social Media).
   - PR block — three PR Heads, no co-head, smaller row.
   - Every person gets a photo slot (square, dashed border, camera icon +
     name-specific label when empty) that auto-swaps to a real photo if a
     correctly-named file exists in `assets/images/core-team/` — check via
     `new Image()` `onload`/`onerror`, don't hardcode `<img>` tags that
     would 404.
   - **Do not include anyone whose listed position is plain "Member"** —
     leadership, Heads, Co-Heads, and PR Heads only.
6. **Events** — data-driven cards for: **TechnoSpark** (2-day flagship —
   give this one a wide/featured card), **Sessions**, **Oath Ceremony**,
   **Innovio**, **No Congestion**. Each card: image slot (same
   auto-swap-or-placeholder pattern as team photos), a mono eyebrow tag,
   title, one-line description. Descriptions are drafts — mark them
   clearly as editable, don't present invented facts as confirmed history.
7. **Register CTA band** — full-width banner, one headline, one sentence,
   one large button to the Google Form.
8. **Footer** — logo + club name, Instagram / email / phone icon links,
   quick nav links, contact block, full address, copyright line.

## Content to use verbatim

- Instagram: `https://www.instagram.com/zerogravity.club.in/`
- Email: `theclubzerogravity@gmail.com`
- Phone: `+91 98604 76527` (raw PDF value: `9860476527`)
- Register form: `https://docs.google.com/forms/d/e/1FAIpQLSc1SPpZSj6PO8xCcBF_iml9N-ELFkR-QLSEeaFvonpDVKirDQ/viewform`
- Address: `S.No. 44/1, Vadgaon (Budruk), Off Sinhgad Road, Pune – 411 041, Maharashtra`
- Core team names/positions: pull from the attached office order PDF
  (A.Y. 2026-27), excluding anyone listed simply as "Member."

## Assets to integrate

Two logo files will be attached/shared alongside this prompt:
1. **ZeroGravity club logo** → save as `assets/images/logos/zerogravity-logo`
   (svg or png), reference in the navbar (left, clickable → scroll to top)
   and footer.
2. **Sinhgad Institutes logo** → save as
   `assets/images/logos/sinhgad-logo` (svg or png), reference in the navbar
   next to the club logo (hide on mobile if space is tight — club logo
   takes priority).

Until real photos exist, every photo slot (hero, each team member, each
event) must show a styled placeholder — never a broken-image icon — and
must automatically pick up the real file the moment it's added at the
documented path, with **no code change required** to swap it in.

## Interaction / motion requirements

- **Custom cursor**: small dot exactly on the pointer + a larger trailing
  ring with lag/easing (lerp, not 1:1), low opacity, subtly enlarges on
  hoverable elements (links, buttons, cards). Disable entirely on touch
  devices and when `prefers-reduced-motion: reduce` is set — fall back to
  the system cursor.
- **Loader**: boot-sequence style, built around the club's three-word
  tagline (currently placeholder `DEFY / EXPLORE / INNOVATE` — replace with
  the club's real motto if it has one), each word activating in sequence as
  progress increases.
- **Scroll reveals**: fade/slide-up on section entry via
  `IntersectionObserver`, staggered per card grid, not applied so heavily
  that it slows down reading.
- **Ambient motion**: a lightweight starfield/particle drift behind the
  hero (canvas, cheap — a few dozen slow-moving dots in the brand colors),
  respecting reduced-motion.
- Respect `prefers-reduced-motion` globally — collapse all animation
  durations to near-zero for users who've asked for it.

## Technical constraints

- No inline `<img>` tags for anything without a guaranteed file — use the
  load-or-placeholder JS pattern throughout.
- No fabricated statistics ("500+ members", "50 events run") — this club's
  copy should only state what's actually known (department, institution,
  status, A.Y.). Don't invent numbers to make the page feel more
  "impressive."
- Mobile-first responsive down to ~360px width; test the leadership row,
  department grid, and events grid at that width specifically — they're
  the densest sections.
- Visible keyboard focus states on every interactive element.
- Semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`, proper
  heading order) — this is a real club site that should be readable by
  screen readers and indexable by search engines, not a visual-only bundle.

## What "done" looks like

A single folder that opens directly in a browser with no build step, looks
distinctly like a space/mission-control themed technical club (not a
generic SaaS template), has every current core-team member and event
correctly represented, and where adding a real photo is a drag-and-drop
operation — not a code change.
