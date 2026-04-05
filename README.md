# 2D Portfolio

Interactive portfolio built with Vite, Kaboom.js, and a Tiled-authored map.

Live site: <https://tony9321.github.io/2D-portfolio/>

## Stack

- Vite for development and production builds
- Kaboom.js for the game loop, camera, collisions, and sprite animation
- Tiled for map layout and interaction metadata
- HTML/CSS for dialogue UI layered over the canvas

## Local Development

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm ci
```

Start the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

- `index.html`: app shell, inline UI styles, and the dialogue overlay
- `src/main.js`: scene setup, asset loading, input handling, camera behavior, and collisions
- `src/utils.js`: dialogue rendering and responsive camera scaling
- `src/constants.js`: scale factor and dialogue content
- `src/kaboomCtx.js`: Kaboom initialization
- `public/`: static assets copied directly into the build output

## Asset Path Rules

This project is deployed under the GitHub Pages project-site base path `/2D-portfolio/`.

Important rules:

- Assets inside `public/` are copied to the root of `dist/`
- Do not reference public assets through `/public/...`
- Runtime asset URLs in JavaScript should use `import.meta.env.BASE_URL`
- Document-relative URLs like `monogram.ttf` are safe in `index.html` because `index.html` and the copied asset end up in the same output directory

Examples:

- `spritesheet.png` should be loaded from `${import.meta.env.BASE_URL}spritesheet.png`
- `map.json` should be loaded from `${import.meta.env.BASE_URL}map.json`
- `monogram.ttf` can be referenced as `url("monogram.ttf")` from `index.html`

## Deployment

The intended deployment model is GitHub Pages via GitHub Actions.

Expected setup:

1. In the repository Pages settings, choose `GitHub Actions` as the build and deployment source.
2. Push to `master`.
3. Let the workflow build the site and publish `dist/`.

The build uses the configured Vite base path in `vite.config.js`, so Pages deploys should stay under `/2D-portfolio/`.
