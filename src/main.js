/**
 * Local entry for the Grids S03 public browser experience.
 * See THIRD_PARTY.md for provenance and reference-assets.json for media hashes.
 * The reference runtime is loaded after its initial DOM and CSS are ready.
 */
import './reference/style.css';
import './style.css';

import './features/features.css';
import { mountNavigation } from './features/navigation.js';

const compact = matchMedia('(max-width: 1199px), (pointer: coarse)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
// Reload cleanly when the experience changes so WebGL and scroll pins are disposed.
compact.addEventListener('change', () => location.reload());
reduced.addEventListener('change', () => location.reload());

if (compact.matches || reduced.matches) {
  const { mountGallery } = await import('./features/gallery.js');
  const gallery = mountGallery();
  mountNavigation({
    ...gallery,
    scrollToChapter(index) {
      if (index < 0) { window.scrollTo(0, 0); document.querySelector('.gallery-header a').focus({ preventScroll: true }); }
      else gallery.scrollToChapter(index);
    },
  });
} else {
  const runtime = await import('./reference/runtime.js');
  const { prepareDesktop } = await import('./features/desktop.js');
  mountNavigation(await prepareDesktop(runtime));
}
