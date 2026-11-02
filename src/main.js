/**
 * Local entry for the Grids S03 public browser experience.
 * See THIRD_PARTY.md for provenance and reference-assets.json for media hashes.
 * The reference runtime is loaded after its initial DOM and CSS are ready.
 */
import './reference/style.css';
import './style.css';

// Kept separate from the runtime so the surrounding application stays editable.
await import('./reference/runtime.js');
