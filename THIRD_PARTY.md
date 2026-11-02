# Reference material and attribution

Original project: **Grids — DES Season 03**, by **Obys**, https://grids03.obys.agency/.

The public website was retrieved over HTTPS on 2026-11-02 to reproduce the experience requested by the user. Supplied recordings were used as visual references and are not shipped with the application.

Retained from the public website:

- `src/reference/runtime.js`, from `/assets/index-DG09JV5w.js`.
- `src/reference/style.css`, from `/assets/index-DESn0ymm.css`.
- Images, font, trailer, and icons under `public/`; original paths and hashes appear in `reference-assets.json`.
- Introductory text, course descriptions, credits, and outbound links.

The runtime includes bundled animation, smooth-scrolling, and WebGL rendering code. The downloaded runtime and stylesheet are preserved without modification. Original creators retain their respective rights.

Credits shown by the reference:

- Idea: Olha Olianishyna.
- Design: Viacheslav Olianishyn.
- Typography: OTF Obys NG by Obys.

The local Vite wrapper, integration styles, documentation, and validation scripts were added for this project. The reference's Google Analytics integration is not included.

## SHIFT identity

SHIFT adds original modular lettering, an electric violet and acid lime palette, and locally served Space Grotesk and IBM Plex Mono fonts. Runtime branding is applied by `scripts/brand-runtime.mjs` during Vite transformation; the downloaded reference file remains intact.

Space Grotesk and IBM Plex Mono were obtained from the corresponding Fontsource 5.3.0 packages. Both are distributed under the SIL Open Font License; license texts are retained next to the fonts in `public/fonts/`.
