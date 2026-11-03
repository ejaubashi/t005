# SHIFT — Form, Space & Motion

A modern visual identity applied to the [Grids S03 experience by Obys](https://grids03.obys.agency/). SHIFT uses Sora display typography, Manrope body text and labels, cobalt blue lettering, soft coral, and an ice-blue background. A new modular SHIFT wordmark runs through the preloader, sidebar, and finale. The desktop grid layouts, scroll choreography, photographs, and trailer remain from the supplied reference.

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
- `src/features/`: chapter metadata, searchable navigation, accessible trailer enhancements, gallery edition, and interface styles.
- `scripts/brand-runtime.mjs`: checked build-time name and modular wordmark overrides; leaves the reference file intact.
- `src/reference/runtime.js`: public reference runtime, including animation and rendering libraries.
- `src/reference/style.css`: public reference styles.
- `public/`: local photography, font, trailer, and icons.
- `reference-assets.json`: media paths, sizes, and SHA-256 hashes.

Keep local overrides outside `src/reference/` so the reference snapshot remains auditable. Larger customization would benefit from rewriting the relevant portions of the bundled runtime into separate source modules.

## Viewport behavior

Full animation runs at widths of 1200 px and above with a fine pointer. Phones, smaller screens, and reduced-motion users get an accessible gallery of all 18 chapters with local images, chapter navigation, and a native trailer player. The large animation runtime is not loaded in the gallery. Changing between those modes reloads the page to dispose of the previous renderer and scroll pins cleanly.

## Interaction upgrades

- Open **Index** (or press **K**) to search chapter titles and descriptions, then jump directly to a study. The URL hash can be shared or reloaded to reopen that chapter.
- Toggle a composition grid with **Grid** or **G**. The button announces its current state.
- Reading progress and a back-to-top control are available in both editions.
- The desktop trailer supports keyboard activation, a visible close button, focus containment, and focus restoration. The gallery uses native video controls.
- Keyboard focus and all interface text retain the blue palette. The browser check rejects black or near-black text.

Hardware-accelerated WebGL is recommended for the interactive photographs. Headless validation needs a software WebGL renderer enabled.

## Browser validation

With Python Playwright and Chromium installed, start the dev server, then run:

```sh
python -u scripts/smoke.py
```

Set `GRIDS_TEST_URL` to validate another server, for example the production preview. `CHROMIUM_PATH` can override the default system Chromium executable. The check covers loading, local media, chapter search, navigation and focus, reading progress, grid toggling, trailer controls, scroll sections, resizing, fresh touch-device visits, and the reduced-motion edition.
