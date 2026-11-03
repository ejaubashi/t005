# SHIFT — A Change in Perspective

An independent digital exhibition built around expressive typography, a custom iridescent sculpture, and three asymmetric photographic studies. The identity keeps SHIFT and colored interface text, with cobalt, warm paper, coral, and lilac. Sora and Manrope are paired with Cormorant Garamond italic.

## Run locally

Node.js 20.19+ or 22.12+ is required; Node.js 24 was validated.

```sh
npm ci
npm run dev
```

## Build and publish

```sh
npm run build
npm run preview
```

For a subdirectory, use `PAGES_BASE_PATH=/t005/ npm run build`. Pushes to `main` deploy through `.github/workflows/pages.yml` to https://ejaubashi.github.io/t005/.

## Current experience

- A hand-built 3D torus-knot sculpture with smooth, per-pixel WebGL shading and a Canvas 2D fallback. Its iridescent surface rotates subtly and responds to the pointer. The motion control pauses or resumes it.
- Three image studies with sculptural crops, scroll reveals, poetic descriptions, and accessible closer-look dialogs.
- A local original film, with native playback controls and pause-on-close behavior.
- Responsive desktop and mobile compositions. Reduced-motion preferences stop automatic sculpture movement and disable transitions. Rendering also stops offscreen and in hidden tabs.
- All interface text uses colored inks. No external services, credentials, or remote asset requests are needed.

`src/exhibition.js` defines the exhibition and dialogs, `src/sculpture.js` builds and animates the mesh, and `src/art.css` defines the art direction. The previous reference runtime and feature prototypes remain in the repository for history/provenance but are not imported into the current application. There is no playground or floating toolbar in the current experience.

The photographs and original film are retained from the Obys reference; attribution and font licenses are recorded in `THIRD_PARTY.md` and `public/fonts/`.

## Validation

With Python Playwright and system Chromium installed:

```sh
python -u scripts/smoke.py
```

Set `GRIDS_TEST_URL` to test a production preview and `CHROMIUM_PATH` to use another Chromium executable. The check exercises actual sculpture rendering, pause/resume, study cycling, focus restoration, film playback, colored text, reduced motion, 390/320px touch layouts, and browser/HTTP errors. The old `scripts/lab-smoke.py` belongs to the previous prototype and does not apply to this exhibition.
