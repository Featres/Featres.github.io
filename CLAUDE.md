# CLAUDE.md — Featres.github.io

Personal academic portfolio and study notes site for Piotr Marciniak (MSc Statistics, ETH Zürich).
Deployed at **piotr-marciniak.com** via GitHub Pages (`git@github.com:Featres/Featres.github.io.git`).

No build step. Pure HTML/CSS/JS — everything deploys as-is from the repository root.

---

## Project structure

```
Featres.github.io/
├── index.html                  # Homepage (bento grid layout)
├── styles.css                  # Shared: theme variables, topbar, grid, worklog
├── lecture.css                 # Lecture notes only: typography, callouts, MathJax fixes
├── dark.js                     # Theme switcher (localStorage key: "theme")
├── studying-template.html      # Template for new lecture summary pages
├── sub-page-template.html      # Template for new project sub-pages
├── CNAME                       # piotr-marciniak.com
├── README.md                   # Deployment notes
│
├── files/
│   ├── logo.png                # Favicon
│   ├── main.pdf                # CV
│   ├── search-index.json       # Full-text search index across all lecture notes (578 KB)
│   ├── introduction-to-machine-learning/   (16 HTML files)
│   ├── convex-optimization/                (6 HTML files)
│   ├── computational-statistics/           (8 HTML files)
│   ├── high-dimensional-statistics/        (9 HTML files)
│   └── core-concepts-in-statistical-learning/ (7 HTML files)
│
├── studying/index.html         # Study notes index (links all 46 lectures)
├── athena/index.html           # Project: quantitative research system
├── optimsim/index.html         # Project: data analyst at OptimSim
├── sibelco/index.html          # Project: Sibelco research internship
├── statistics/ols-simulator/   # Interactive OLS demo
└── legacy/                     # Pre-redesign archive — do not touch
```

---

## Theme system

Four colour themes, applied via `data-theme` attribute on `<html>`:

| Theme   | Background | Ink        | Accent    | Scheme |
|---------|------------|------------|-----------|--------|
| `grain` | `#f5ede0`  | `#2c1d08`  | `#c47a0a` | light (default) |
| `stone` | `#efede6`  | `#14120e`  | `#1f6b3a` | light  |
| `dark`  | `#0c0d0e`  | `#e6e4df`  | `#d7ff64` | dark   |
| `ocean` | `#0b1622`  | `#c8dff0`  | `#22d3ee` | dark   |

All colours are CSS custom properties (`--bg`, `--ink`, `--muted`, `--dim`, `--panel`, `--panel-hi`, `--rule`, `--accent`, `--cv-ink`) defined in `styles.css`. Never hardcode colours — always reference these variables.

**Theme persistence:** `dark.js` reads/writes `localStorage.getItem('theme')`. Every page loads `dark.js` at the bottom of `<body>` and has a pre-paint inline script in `<head>` to apply the saved theme before first render (prevents flash):

```html
<script>
  try { var t=localStorage.getItem('theme')||'grain'; if(t) document.documentElement.setAttribute('data-theme',t); } catch(e){}
</script>
```

---

## Stylesheets

### styles.css
Loaded on every page. Owns:
- CSS variable definitions for all 4 themes
- Global reset: `*, *::before, *::after { box-sizing: border-box; }` and `html, body { margin: 0; padding: 0; }`
- Body: JetBrains Mono, 13px, `text-rendering: optimizeLegibility`
- Topbar (`.topbar`, `.theme-switcher`, `.theme-dot`)
- Bento grid (`.grid`, `.cell`, `.span-4/5/7/8/12`)
- Identity, status, now, worklog, about, contact, footer cells
- Sub-page components: `.subhead`, `.modules`, `.sum`, `.content`, `.subnav`
- Mobile breakpoint at `max-width: 900px`

### lecture.css
Loaded **only on lecture note pages** alongside `styles.css`. Owns:
- Global element reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`
- Body override: Inter 17px, line-height 1.75, `text-rendering: auto` (overrides `optimizeLegibility` from styles.css — critical for MathJax)
- Typography: h1/h2/h3/h4, p, a, code, pre, ul/ol, table, figure
- Math block: `.math-block { margin: 1.25rem 0; margin-left: 1rem; overflow-x: auto; }`
- Callout boxes: `.callout-definition` (blue), `.callout-example` (green), `.callout-note` / `.callout-warning` (yellow)
- MathJax layout fixes (see Math section below)

---

## Math rendering — CRITICAL RULES

All lecture note pages use **MathJax 3 CHTML renderer** loaded from CDN.

### Delimiters — the only correct form

| Math type    | Delimiter       | Example                    |
|--------------|-----------------|----------------------------|
| Inline math  | `\(...\)`       | `\(f(x) = x^2\)`          |
| Display math | `\[...\]`       | `\[ \nabla f(x) = 0 \]`   |

**Never use `$...$` or `$$...$$` in lecture HTML files.** The `$` delimiter causes MathJax's DOM manipulation to misplace closing `</em>` tags, leaking italic styling into surrounding text and collapsing word-spaces (words appear joined: "forany", "dependson").

### MathJax script block (required in every lecture page `<head>`)

```html
<script>
    MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
      },
      chtml: {}
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" async></script>
```

**Config notes:**
- Use `tex-chtml.js`, not `tex-svg.js`. SVG mode causes word-spacing collapse around inline math.
- `inlineMath` and `displayMath` must use **double backslashes** in JavaScript string literals: `'\\('` produces the string `\(` that MathJax needs. Single backslash `'\('` evaluates to `(` in JS and breaks the delimiter.
- The `$` and `$$` entries are kept for fallback but should not appear in content.

### Required CSS for MathJax (in lecture.css)

```css
/* Undo global box-sizing reset — MathJax CHTML layout assumes content-box */
mjx-container, mjx-container * { box-sizing: content-box; }

/* Breathing room around inline math; correct baseline alignment */
mjx-container[jax="CHTML"] { margin: 0 0.08em; vertical-align: -0.1em; }

/* Display math: block layout */
mjx-container[jax="CHTML"][display="true"] { margin: 1em 0; display: block; vertical-align: 0; }
```

Also required on body in lecture.css:
```css
text-rendering: auto;
```
This overrides `text-rendering: optimizeLegibility` set in styles.css, which causes aggressive kerning that collapses word-spaces adjacent to inline-block MathJax containers.

### Display math HTML pattern

```html
<div class="math-block">
  \[ \nabla f(x) = 0 \]
</div>
```

### Inline math — avoid adjacent to `<em>` without spacing

If inline math appears directly before/after an `<em>` element, ensure there is a space in the source:

```html
<!-- Good: space between </em> and \( -->
<em>always</em> satisfied for small enough \(t\)

<!-- Bad: math jammed against em tag -->
<em>always</em>\(t\) is satisfied
```

---

## Adding new lecture pages

1. Copy `studying-template.html` to `files/<course-name>/<lecture-name>.html`
2. Update `<title>`, `<h1>`, and `.meta` span content
3. Update the `href` in `../../` back-links (topbar and header)
4. Write content using the structure below
5. Add the page to `studying/index.html`
6. Add an entry to `files/search-index.json`

### Lecture page structure

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lecture N — Course Name</title>
  <link rel="icon" type="image/png" href="../../files/logo.png" />
  <script>
    try { var t=localStorage.getItem('theme')||'grain'; if(t) document.documentElement.setAttribute('data-theme',t); } catch(e){}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../styles.css" />
  <link rel="stylesheet" href="../../lecture.css" />
  <script>
      MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']]
        },
        chtml: {}
      };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" async></script>
</head>
<body>
<div class="topbar"> ... </div>
<header>
  <h1>Lecture N: Topic</h1>
  <div class="meta">
    <span>Course Name</span>
    <span>Lecture N</span>
    <span>Lecture Summary</span>
  </div>
</header>
<main>
  <section>
    <!-- content -->
  </section>
</main>
<script src="../../dark.js"></script>
</body>
</html>
```

### Callout box types

```html
<div class="callout-definition">
  <div class="callout-title">Definition — Name</div>
  <p>Content.</p>
</div>

<div class="callout-example">
  <div class="callout-title">Example — Name</div>
  <p>Content.</p>
</div>

<div class="callout-note">
  <div class="callout-title">Note</div>
  <p>Content.</p>
</div>
```

---

## Adding new project pages

1. Copy `sub-page-template.html` to `<project-name>/index.html`
2. Update heading, modules, summary, and content sections
3. Link it from the worklog in `index.html`

Project pages use **styles.css only** (no lecture.css). They support: `.subhead`, `.modules`, `.sum`, `.content` (with `.head`, `section`, `h2`, `p`, `ul`, `.content pre`, `.note`).

---

## Lecture courses

| Folder | Course | Lectures |
|---|---|---|
| `introduction-to-machine-learning/` | Introduction to Machine Learning | 16 |
| `convex-optimization/` | Convex Optimization — Through the Lens of Algorithms and Applications | 6 |
| `computational-statistics/` | Computational Statistics | 8 |
| `high-dimensional-statistics/` | High-Dimensional Statistics | 9 |
| `core-concepts-in-statistical-learning/` | Core Concepts in Statistical Learning | 7 |

All 46 lecture files are linked from `studying/index.html` and indexed in `files/search-index.json`.

---

## search-index.json

Full-text search index for client-side search on the study notes page. Each entry:

```json
{
  "href": "introduction-to-machine-learning/lecture1-summary.html",
  "title": "Lecture 1 - Introduction to Machine Learning",
  "subject": "Introduction to Machine Learning",
  "content": "... full text of the lecture ..."
}
```

When adding a new lecture page, append an entry here. The `content` field should be the plain-text body of the page (strip HTML tags).

---

## Topbar pattern

Every page (lecture and project) shares the same topbar structure:

```html
<div class="topbar">
  <div class="left">
    <div class="theme-switcher">
      <button class="theme-dot" data-theme="stone" onclick="setTheme('stone')" title="stone"></button>
      <button class="theme-dot" data-theme="dark"  onclick="setTheme('dark')"  title="dark"></button>
      <button class="theme-dot" data-theme="ocean" onclick="setTheme('ocean')" title="ocean"></button>
      <button class="theme-dot" data-theme="grain" onclick="setTheme('grain')" title="grain"></button>
      <span class="theme-label">themes</span>
    </div>
    <span class="host">piotr@marciniak</span>
    <span class="path">~/files/course-short-name</span>
  </div>
  <div class="right">
    <a href="../../">← home</a>
    <a href="../../studying/">← notes</a>
  </div>
</div>
```

Adjust `../../` depth and the `<span class="path">` content per page location.

---

## Fonts

Loaded from Google Fonts on every page:

- **Inter** (400/500/600/700) — body text, headings, UI labels on lecture pages
- **JetBrains Mono** (400/500) — code, topbar, monospace UI elements on all pages

Always include the preconnect hints before the font link:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Deployment

Deployed automatically by GitHub Pages from the `main` branch root. Push to main = live.

```bash
git add <files>
git commit -m "description"
git push
```

The CNAME file sets the custom domain `piotr-marciniak.com`.

---

## What not to do

- Do not use `$...$` or `$$...$$` math delimiters in lecture HTML files — use `\(...\)` and `\[...\]`
- Do not use `tex-svg.js` — use `tex-chtml.js`
- Do not use single-backslash `'\('` in the MathJax JS config — use double `'\\('`
- Do not touch the `legacy/` folder
- Do not add `text-rendering: optimizeLegibility` on `body` in lecture.css (styles.css sets it globally; lecture.css overrides it back to `auto`)
- Do not hardcode colours — use CSS variables from styles.css
- Do not add `font-style: italic` to paragraph-level elements on lecture pages (it conflicts with math rendering)
