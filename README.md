# ZeroGravity — Club Website

A single-page site for ZeroGravity, IT Department, SKNCOE. Plain HTML/CSS/JS —
no build step, no framework, no node_modules. Open `index.html` in a browser
and it runs.

## 1. Preview it
Just double-click `index.html`, or for a cleaner local preview:
```
cd zerogravity-site
python3 -m http.server 8000
```
then open `http://localhost:8000`.

## 2. Add real content (do this first)

| What | Where | Filename rule |
|---|---|---|
| Club group photo | `assets/images/hero/` | must be exactly `group-photo.jpg` |
| Core team photos | `assets/images/core-team/` | see `PUT_PHOTOS_HERE.txt` in that folder for exact names per person |
| Event photos | `assets/images/events/` | see `PUT_PHOTOS_HERE.txt` in that folder |
| ZeroGravity logo | `assets/images/logos/zerogravity-logo.svg` | replace the placeholder file, keep the same filename (PNG/SVG both fine — just update the `<img src>` extension in `index.html` if you change format) |
| Sinhgad logo | `assets/images/logos/sinhgad-logo.svg` | same as above |

No code edits needed for photos — the site checks if a file exists at that
exact path and swaps it in automatically. If it's missing, a clean
placeholder shows instead of a broken image icon.

## 3. Text you should review and edit
Everything from the office order (names, positions) is in **live**. These are
**draft copy** you should rewrite in your own voice before launch:
- **Hero tagline** — currently `DEFY · EXPLORE · INNOVATE` (`index.html`,
  search `hero-tagline`, also used in the loader — `js/script.js`,
  the `preloader-word` spans in `index.html`). Swap in your club's actual
  tagline/motto if it has one.
- **About section copy** — `index.html`, `<section class="about">`.
- **Event descriptions** — one-line blurbs per event in `js/script.js`
  (`EVENTS` array near the top) — flagged `[Editable draft]`.

## 4. Where things live (for quick edits)
- **Colors** — `css/style.css`, the `:root { }` block at the top. Change
  `--red`, `--blue`, `--yellow` to retune the palette; everything else
  derives from those.
- **Fonts** — same `:root` block (`--font-display`, `--font-body`,
  `--font-mono`), loaded via Google Fonts `<link>` in `index.html` `<head>`.
- **Core team roster** — `js/script.js`, top of file: `LEADERSHIP`,
  `DEPARTMENTS`, `PR_TEAM` arrays. Add/remove/rename people here — cards
  render automatically, no HTML editing required.
- **Events** — same file, `EVENTS` array. Set `wide: true` on one event to
  feature it as the flagship (currently TechnoSpark).
- **Register form link** — currently points to the Google Form; it's used
  in 4 places (nav button, mobile menu, hero CTA, register section). Find
  and replace the URL if it ever changes.
- **Contact details / footer** — bottom of `index.html`, `<footer>`.

## 5. Deploy it
It's static — any of these work with zero config:
- **GitHub Pages**: push this folder to a repo, enable Pages on the `main`
  branch.
- **Netlify / Vercel**: drag-and-drop this folder into their dashboard.
- **College server**: upload the whole folder via FTP; `index.html` is the
  entry point.

## 6. Notes on the design
- Colors: black base with red / blue / yellow signal accents, per your brief.
- Fonts: Orbitron (headings), Space Grotesk (body), Space Mono (labels/data).
- Custom cursor and the loader auto-disable on touch devices and for anyone
  with "reduce motion" turned on in their OS — this is accessibility best
  practice, not a bug.
- The whole team/event roster renders from the JS data arrays described
  above — this was a deliberate choice so future committees can update the
  site by editing a short list, not hunting through HTML.

See `PROMPT.md` if you want to hand this project to an AI coding agent
(e.g. Antigravity) for further changes — it's written as a full design
brief the agent can act on directly.
