# Deploy bundle — piotr-marciniak.com

Static HTML files ready to drop into your `Featres.github.io` repo.
No build step, no React, no dependencies — just HTML + CSS + one tiny JS
file for the dark-mode toggle.

## Files

```
deploy/
├── index.html                                 ← homepage (copy to repo root)
├── styles.css                                 ← shared stylesheet
├── dark.js                                    ← shared dark-mode toggle
├── sub-page-template.html                     ← blank template for new sub-pages
└── statistics/
    └── ols-simulator/
        └── index.html                         ← demo sub-page (filled in)
```

## How to deploy

1. Clone your `Featres/Featres.github.io` repo.
2. Copy the contents of `deploy/` into the repo root, preserving the folder
   structure shown above.
3. Commit & push. GitHub Pages will rebuild automatically.

Your live URLs will be:
- `https://piotr-marciniak.com/`                              → home
- `https://piotr-marciniak.com/statistics/ols-simulator/`     → OLS Simulator

## Adding a new sub-page

1. Copy `sub-page-template.html` to a new folder, e.g.
   `studying/convex-optimization/index.html`.
2. Fix the `<link>` and `<script>` paths — from the template's `styles.css`
   and `dark.js` (root-adjacent) to `../../styles.css` and `../../dark.js`
   for a two-levels-deep file.
3. Replace every `{{ placeholder }}`.
4. Add the new entry to `index.html` inside `<section class="cell worklog">`
   following the pattern of the existing `<a class="entry">` rows.

## Dark mode

The toggle lives in the top nav on every page, labeled "Dark" / "Light".
State is stored in `localStorage` under the key `dark` (`"1"` = dark),
and applied to `<html>` before the document paints, so there's no flash on
refresh.

## Files you'll also want

- `files/main.pdf` — your CV, referenced by the "download cv.pdf" button on
  the homepage. Copy this into the repo root's `files/` folder.
