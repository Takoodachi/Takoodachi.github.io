# Duc Luong Tran · portfolio

Hand-written HTML, CSS and JavaScript. No build step and no dependencies beyond Google Fonts.

```
index.html            all content
css/style.css         design tokens at the top, then one block per section
js/main.js            hero type, rulers, scroll effects, project previews, Inspect mode
js/numberlink.js      puzzle rules (no DOM, so Node can test them)
tests/                node tests/numberlink.test.js
```

## Run locally

```bash
python -m http.server 8137
```

Then open http://localhost:8137.

## Deploy to GitHub Pages

1. Create a repo named `Takoodachi.github.io` (serves at https://takoodachi.github.io) or any other name (serves at `/repo-name/`).
2. Push these files to `main`.
3. Settings → Pages → Deploy from branch → `main` / root.

## Editing content

Projects, jobs and coursework are plain HTML in `index.html`. Each project card sets its preview colour with `--p-accent` in its `style` attribute.
