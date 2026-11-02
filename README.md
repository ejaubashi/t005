# Grids — DES Season 03

A local reproduction of [Grids S03 by Obys](https://grids03.obys.agency/), matching the supplied screen recordings. Includes the modular type preloader, contents, fixed title and animated sidebar, scroll-driven grid lessons, photography, image interaction effects, kinetic typography, credits, and trailer overlay.

The reference site's public browser runtime, styles, typography, and media are retained locally for fidelity. This is a runnable snapshot of the public experience, not the original unbundled development source. See [THIRD_PARTY.md](./THIRD_PARTY.md) for provenance.

## Development

Requires Node.js 20.19+ or 22.12+; validated with Node.js 24.

```sh
cd /workspace/t005
npm ci
npm run dev
```

The application and media run locally without credentials or external services. Outbound course, social, and Obys links retain their original destinations. Google Analytics is omitted.

## Production

```sh
npm run build
npm run preview
```

By default the build runs at the server root. For a subdirectory, set `PAGES_BASE_PATH`, for example `PAGES_BASE_PATH=/t005/ npm run build`. The Vite integration adjusts the reference runtime's media paths without modifying the reference source. The local trailer accounts for approximately 30 MB of the build; it is loaded on demand.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and deploys pushes to `main`. In the repository's Settings → Pages, select **GitHub Actions** as the source. The project URL is `https://ejaubashi.github.io/t005/` once the deployment succeeds. The workflow can also be started manually from the Actions tab.

## Project layout

- `index.html`: initial document, local font preload, and reload position reset.
- `src/main.js`: Vite entry and runtime initialization.
- `src/style.css`: local integration and keyboard focus styles.
- `src/reference/runtime.js`: public reference runtime, including animation and rendering libraries.
- `src/reference/style.css`: public reference styles.
- `public/`: local photography, font, trailer, and icons.
- `reference-assets.json`: media paths, sizes, and SHA-256 hashes.

Keep local overrides outside `src/reference/` so the reference snapshot remains auditable. Larger customization would benefit from rewriting the relevant portions of the bundled runtime into separate source modules.

## Viewport behavior

The original is a desktop experience. Full animation runs at widths of 1200 px and above with a fine pointer. Smaller or touch viewports show the reference's animated modular wordmark and desktop notice, with links to DES and Obys. This behavior is preserved intentionally.

Hardware-accelerated WebGL is recommended for the interactive photographs. Headless validation needs a software WebGL renderer enabled.

## Browser validation

With Python Playwright and Chromium installed, start the dev server, then run:

```sh
python -u scripts/smoke.py
```

Set `GRIDS_TEST_URL` to validate another server, for example the production preview. `CHROMIUM_PATH` can override the default system Chromium executable. The check exercises loading, local media, trailer playback controls, scroll sections, resizing, and a fresh touch-device visit.
