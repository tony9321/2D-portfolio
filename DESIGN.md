# 2D Portfolio Design Doc

## Status

Draft for implementation planning. This document is based on a full read of the current repository, a local production build, a comparison against the deployed `gh-pages` branch, and current official documentation for Vite, Kaboom, Tiled, and KAPLAY.

## Summary

This repository is a small Vite + Kaboom interactive portfolio project. The current `master` branch is the source branch, while the live GitHub Pages site is served from a separate `gh-pages` branch that contains older built artifacts.

The main issue is that current `master` uses hardcoded asset URLs under `/2D-portfolio/public/...`, but Vite copies `public` assets to the root of `dist/`, not to `dist/public/`. A local production build confirms the mismatch and leaves at least one font reference unresolved at build time. The current live site works because the deployed `gh-pages` branch still contains older relative asset paths.

The implementation plan in this document prioritizes:

1. Fixing runtime asset paths and deployment assumptions.
2. Making deployment reproducible from source.
3. Upgrading outdated tooling with known advisories.
4. Cleaning UI and event-handling issues without changing the project concept.

## Current Repository Shape

Top-level files:

- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `README.md`
- `src/constants.js`
- `src/kaboomCtx.js`
- `src/main.js`
- `src/utils.js`
- `public/map.json`
- `public/map.png`
- `public/spritesheet.png`
- `public/monogram.ttf`

Current dependencies:

- `kaboom` `^3000.1.17`
- `vite` `^5.2.0`, resolved locally to `5.2.10`
- `terser` `^5.30.4`

Current project characteristics:

- Single-page Vite app.
- Single Kaboom scene.
- Tiled-authored room layout.
- Raster map rendering plus JSON-driven collision/interactables.
- Dialogue UI rendered in DOM, not in canvas.
- No tests.
- No linting or formatting config.
- No checked-in CI or deployment workflow.

## Existing Behavior

### Rendering Model

The map is not constructed dynamically from tile data at runtime. Instead:

- `map.png` is rendered as a single background sprite.
- `map.json` is fetched only for object layer metadata such as boundaries and spawnpoints.
- The player sprite is animated from a spritesheet and moved inside the room.

This is a good fit for the project size and should be preserved unless there is a deliberate redesign.

### Input Model

The app supports:

- Mouse click / touch-to-mouse movement toward a target point.
- Arrow-key movement.
- Camera follow centered around the player with a fixed vertical offset.

Dialogue blocks interaction while open.

### Content Model

Named interactables in `map.json` map directly to keys in `dialogueData`:

- `exit`
- `bed`
- `sofa-table`
- `tv`
- `pc`
- `cs-degree`
- `resume`
- `library`
- `projects`

The content is hard-coded and link-heavy, which is acceptable for a small portfolio. The current content system is simple enough that a data-driven CMS or markdown ingestion would be overkill.

## Key Findings

### 1. Asset Pathing Is Incorrect on `master`

Current source files use:

- `/2D-portfolio/public/monogram.ttf`
- `/2D-portfolio/public/spritesheet.png`
- `/2D-portfolio/public/map.png`
- `/2D-portfolio/public/map.json`

This conflicts with how Vite handles the `public` directory:

- Assets in `public/` are served from `/` during development.
- Assets in `public/` are copied to the root of `dist/` during build.

That means a built site will have:

- `dist/monogram.ttf`
- `dist/spritesheet.png`
- `dist/map.png`
- `dist/map.json`

It will not have:

- `dist/public/monogram.ttf`
- `dist/public/spritesheet.png`
- `dist/public/map.png`
- `dist/public/map.json`

Local confirmation:

- `npm run build` succeeded.
- Vite emitted a warning that the font URL in `index.html` did not resolve at build time.
- The built JS bundle still contained `/2D-portfolio/public/...` asset references.

Conclusion:

- `master` is not deployment-safe as currently written.

### 2. Deployment Is Not Reproducible From Source

`origin/gh-pages` contains a working older built bundle that uses relative asset paths such as:

- `./spritesheet.png`
- `./map.png`
- `./map.json`
- `monogram.ttf`

This differs from current `master`.

Conclusion:

- The live site is effectively an older deployment artifact, not a faithful publication of the current source branch.
- Any future deployment process should build from source and publish that exact build output.

### 3. Tooling Is Outdated

`npm audit` reported 4 vulnerabilities across the toolchain:

- `vite`
- `rollup`
- `esbuild`
- `nanoid`

These are primarily development and build-chain concerns, not runtime gameplay bugs, but they should still be corrected.

### 4. Dialogue Handling Has Technical Debt

The current dialogue utility:

- appends a new global `keypress` listener every time a dialogue opens,
- uses `setInterval(..., 1)` for the typewriter effect,
- writes through `innerHTML` on every character.

Current impact:

- likely listener accumulation over time,
- fragile behavior around embedded HTML links,
- unnecessary DOM churn.

### 5. Minor UI and Code Hygiene Issues Exist

Observed issues:

- CSS uses `ui.text` while the actual class is `.ui-text`.
- `kaboomCtx.js` imports `scaleFactor` without using it.
- There are multiple commented-out alternative path lines that obscure the intended production behavior.
- The HTML title is still `Vite App`.
- The README does not explain how the project is built or deployed.

## Goals

### Primary Goals

- Make `master` deployable without relying on stale built artifacts.
- Keep the same visual experience and interaction model.
- Make asset loading correct in both Vite dev mode and GitHub Pages production mode.
- Make deployment reproducible from source.
- Reduce obvious maintenance and reliability risks.

### Secondary Goals

- Improve repo clarity and documentation.
- Remove small but recurring runtime issues in the dialogue system.
- Upgrade build tooling to supported versions.

## Non-Goals

- Rewriting the project into React or another UI framework.
- Replacing Kaboom immediately.
- Rebuilding the room with fully dynamic tile rendering.
- Adding a CMS or dynamic content backend.
- Changing the visual theme or content direction of the portfolio.

## Proposed Design

### Phase 1: Fix Runtime Asset Resolution

#### Intent

Make the current source branch load assets correctly under Vite and GitHub Pages.

#### Changes

#### `src/main.js`

Replace hardcoded absolute strings under `/2D-portfolio/public/...` with a path strategy based on `import.meta.env.BASE_URL`.

Target shape:

- define `const base = import.meta.env.BASE_URL`
- resolve runtime asset URLs from `${base}spritesheet.png`
- resolve `${base}map.png`
- resolve `${base}map.json`

Rationale:

- Vite documents `base` as the public base path for deployed assets.
- `BASE_URL` is the supported way to reference that path at runtime.
- This keeps the project working under the configured `/2D-portfolio/` base while avoiding incorrect `/public/` URLs.

#### `index.html`

Update the `@font-face` URL so it resolves the built font location correctly.

Design constraint:

- the final URL must align with Vite’s output model,
- and must not assume a `/public/` subfolder exists after build.

Potential implementation approaches:

- switch to a correct root-relative path that matches the build output,
- or move the font loading into a CSS/JS path that Vite can rewrite.

Preferred direction:

- choose the least invasive path that makes the build output correct and predictable.

#### `vite.config.js`

Keep a single active configuration:

- `base: '/2D-portfolio/'`
- production minification

Remove obsolete commented alternatives so the intended deployment model is unambiguous.

#### Validation

After implementation:

- run `npm run build`,
- inspect `dist/index.html` and the built JS bundle,
- verify there are no `/public/` references left in emitted output,
- verify the generated asset URLs are rooted under `/2D-portfolio/` or otherwise correctly relative to the Pages deployment.

### Phase 2: Make Deployment Source-Driven

#### Intent

Stop relying on a hand-maintained `gh-pages` artifact branch as the canonical production representation.

#### Changes

Add an automated deployment workflow that:

- installs dependencies,
- builds the site from the current source branch,
- publishes `dist/` to GitHub Pages.

#### Expected Outcome

- `master` becomes the single source of truth.
- published output always corresponds to version-controlled source.
- stale asset path differences between branches disappear.

#### Repository Updates

Potential additions:

- `.github/workflows/deploy.yml`
- README deployment instructions

#### Validation

- verify a clean workflow run on GitHub,
- verify Pages serves the newly built site,
- confirm asset URLs work on the deployed URL,
- confirm the old `gh-pages` branch workflow is no longer manually required.

### Phase 3: Upgrade Tooling

#### Intent

Reduce build-chain risk and remove known advisories.

#### Changes

Update:

- `vite`
- lockfile transitive dependencies

Re-run:

- `npm install` or equivalent lockfile refresh,
- `npm audit`

#### Constraints

- Keep the project on a compatible Vite major unless a major bump is necessary.
- Avoid changing app code unless the new Vite version requires minor compatibility fixes.

#### Validation

- successful `npm run build`
- successful `npm run preview` smoke check if needed
- reduced or cleared audit findings

### Phase 4: Stabilize the Dialogue System

#### Intent

Keep the current UX while removing avoidable fragility.

#### Changes

#### `src/utils.js`

Refactor dialogue lifecycle so:

- Enter-to-close logic does not register uncontrolled global listeners,
- listeners are attached and removed predictably,
- the typewriter effect does not depend on reparsing arbitrary partial HTML every millisecond.

#### Design Guidance

The dialogue strings include anchor tags, so the current raw-character `innerHTML` typing approach is not robust.

Safer directions:

- type only plain text and render final HTML at completion,
- or tokenize the content in a controlled way before incremental rendering.

Preferred direction:

- use the simplest implementation that preserves links and avoids malformed partial DOM.

#### Validation

- open and close multiple dialogues repeatedly,
- verify only one close action fires,
- verify Enter closes reliably,
- verify links still render and remain clickable.

### Phase 5: UI and Repo Hygiene

#### Intent

Clean up small issues that reduce maintainability or polish.

#### Changes

#### `index.html`

- fix `ui.text` to `.ui-text`
- update the page title

#### `src/kaboomCtx.js`

- remove unused imports

#### `src/main.js`

- remove outdated commented path lines once pathing is stable

#### `README.md`

Replace the bare URL with:

- project description
- local dev instructions
- build instructions
- deployment notes
- stack summary

#### Validation

- quick visual review
- confirm no dead comments remain that conflict with actual behavior

## Medium-Term Consideration: Kaboom vs KAPLAY

The current codebase is valid on Kaboom 3000.x and does not need an immediate framework rewrite. However:

- Kaboom is no longer actively maintained,
- KAPLAY appears to be the active successor ecosystem.

Recommendation:

- do not migrate as part of the initial stabilization work,
- document KAPLAY migration as a future option if the project grows.

Reason:

- the immediate problems are deployment and pathing, not engine capability.

## Detailed File Plan

### `index.html`

Planned changes:

- correct font asset pathing
- fix `.ui-text` selector
- update title
- remove stale commented script/path lines if no longer needed

Risk:

- low, but font pathing must be tested in built output, not just dev mode.

### `vite.config.js`

Planned changes:

- preserve `base: '/2D-portfolio/'`
- remove legacy commented config

Risk:

- low

### `src/main.js`

Planned changes:

- move runtime asset URLs to `import.meta.env.BASE_URL`
- remove conflicting old path comments

Risk:

- medium, because partial fixes can create dev/prod divergence.

### `src/utils.js`

Planned changes:

- fix event lifecycle
- redesign incremental dialogue rendering

Risk:

- medium, because link rendering and timing behavior can regress if done too aggressively.

### `src/kaboomCtx.js`

Planned changes:

- remove unused import

Risk:

- very low

### `README.md`

Planned changes:

- replace placeholder content with actual project documentation

Risk:

- none

### `.github/workflows/deploy.yml`

Planned changes:

- add automated Pages deployment

Risk:

- medium operational risk until first successful run, but low code risk.

## Rollout Order

Recommended order:

1. Fix runtime asset paths.
2. Verify production build output.
3. Add automated deployment.
4. Upgrade Vite and refresh the lockfile.
5. Refactor dialogue handling.
6. Clean small UI and repo issues.

This order keeps the highest-risk production issue first and avoids mixing deployment fixes with UI cleanup.

## Verification Plan

### Build Verification

- run `npm run build`
- inspect emitted files in `dist/`
- verify no references remain to `/public/`
- verify `map.json`, `map.png`, `spritesheet.png`, and `monogram.ttf` are resolved correctly

### Runtime Verification

Check all of the following:

- page loads on the deployed base path
- font is applied
- map background renders
- player sprite renders and animates
- click / tap movement works
- arrow-key movement works
- camera follows correctly
- all named interactables open the correct dialogue
- Enter closes dialogue correctly
- Close button works repeatedly without duplicated handlers

### Deployment Verification

- confirm the GitHub Pages URL serves the exact current build
- confirm no manual `gh-pages` artifact maintenance is required

## Risks and Mitigations

### Risk: Asset paths work in dev but fail in production

Mitigation:

- validate only against `npm run build` output and deployed Pages behavior, not dev server behavior alone.

### Risk: Dialogue refactor breaks link rendering

Mitigation:

- treat link-containing entries as required test cases,
- prefer a conservative rendering strategy.

### Risk: Deployment automation changes the release workflow unexpectedly

Mitigation:

- document the new workflow in the README,
- verify one successful end-to-end publish before removing old habits.

### Risk: Tooling upgrade causes subtle behavior changes

Mitigation:

- separate Vite upgrade from pathing fixes,
- build and smoke-test after each phase.

## Open Questions

- Should the Pages deployment remain project-site based at `/2D-portfolio/`, or should the repo eventually move to a custom domain or user-site deployment model?
- Should the custom font continue to be loaded from inline CSS in `index.html`, or should font loading move into a dedicated stylesheet/module-managed asset pipeline?
- Is the dialogue typing effect expected to preserve the current character-by-character reveal exactly, or is a simpler staged reveal acceptable if it makes link rendering safer?
- Is there any intent to extend this project significantly, in which case a future KAPLAY migration should be planned sooner?

## Recommended Immediate Next Step

Implement Phase 1 only:

- fix asset URL strategy in `index.html` and `src/main.js`,
- verify the built output no longer references `/public/`,
- confirm the project is deployable from current source.

This has the highest value and lowest ambiguity.

## External References

- Vite build and public base path: <https://vite.dev/guide/build>
- Vite config and `publicDir`: <https://v2.vite.dev/config/>
- Kaboom homepage and API docs: <https://kaboomjs.com/>
- Kaboom publishing guidance: <https://kaboomjs.com/doc/publishing>
- Tiled layer documentation: <https://doc.mapeditor.org/en/stable/manual/layers/>
- KAPLAY docs: <https://kaplayjs.com/docs/guides/>

## Appendix: Confirmed Local Observations

- `npm run build` succeeded locally.
- The build warned that the font URL under `/2D-portfolio/public/monogram.ttf` did not resolve at build time.
- `dist/` contained `map.json`, `map.png`, `spritesheet.png`, and `monogram.ttf` at the root of the output directory.
- Current built output still contained `/2D-portfolio/public/...` references.
- `npm audit` reported 4 vulnerabilities in the build toolchain.
- `origin/gh-pages` contains an older bundle with relative asset paths and is not identical to current `master`.
