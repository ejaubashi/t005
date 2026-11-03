import { chapters } from './chapters.js';

export function mountGallery() {
  const arrow = '<svg class="shift-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
  document.documentElement.classList.add('is-gallery', 'is-up');
  document.querySelector('[data-preloader]')?.remove();
  document.querySelector('.page').innerHTML = `
    <header class="gallery-header"><a href="#" aria-label="SHIFT home">SHIFT</a><span>FORM / SPACE / MOTION</span></header>
    <section class="gallery-intro" aria-labelledby="gallery-title">
      <p class="gallery-kicker">Independent design study <span>Edition 001</span></p>
      <h1 id="gallery-title">SHIFT<span aria-hidden="true">${arrow}</span></h1>
      <p class="gallery-deck">A different way<br>to see the same world.</p>
      <div class="gallery-intro-foot"><span>18 studies in composition</span><a href="#chapter-00">Start exploring ↓</a></div>
    </section>
    <section class="gallery-chapters" aria-label="Chapter gallery">${chapters.map(chapter => `
      <article class="gallery-card" id="${chapter.id}" tabindex="-1">
        <div class="gallery-card-meta"><span>STUDY ${chapter.number}</span><span>${chapter.duration}</span></div>
        ${chapter.index === 0 ? '<button class="gallery-play" type="button" aria-label="Play introduction trailer">' : '<div class="gallery-picture">'}
          <img src="${chapter.image}" alt="" loading="${chapter.index < 2 ? 'eager' : 'lazy'}" width="800" height="600" decoding="async">
          ${chapter.index === 0 ? `<span class="gallery-play-label">Watch the introduction ${arrow}</span></button>` : '</div>'}
        <h2>${chapter.title}</h2><p>${chapter.description}</p>
      </article>`).join('')}</section>
    <footer class="gallery-footer"><p>Keep looking.<br>Keep shifting.</p>
      <a href="https://des.obys.agency/grids/" target="_blank" rel="noreferrer">Explore the original course ${arrow}</a>
      <small>SHIFT · Based on Grids S03 by <a href="https://obys.agency/" target="_blank" rel="noreferrer">Obys</a></small>
    </footer>`;
  const player = document.createElement('dialog');
  player.className = 'shift-player';
  player.setAttribute('aria-label', 'Introduction trailer');
  player.innerHTML = `<form method="dialog"><button class="shift-button" aria-label="Close trailer">Close ×</button></form>
    <video controls playsinline preload="none" src="${import.meta.env.BASE_URL}video/trailer.mp4" aria-label="Introduction trailer"></video>`;
  document.body.append(player);
  const video = player.querySelector('video');
  document.querySelector('.gallery-play').addEventListener('click', () => {
    player.showModal();
    video.play().catch(() => { /* Native controls remain available. */ });
  });
  player.addEventListener('close', () => video.pause());
  player.addEventListener('click', event => { if (event.target === player) player.close(); });
  const scrollToChapter = index => {
    const card = document.getElementById(chapters[index].id);
    card.scrollIntoView({ behavior: 'instant', block: 'start' });
    card.focus({ preventScroll: true });
  };
  return { scrollToChapter, targets: [...document.querySelectorAll('.gallery-card')] };
}
