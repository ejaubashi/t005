import { mountSculpture } from './sculpture.js';

const base = import.meta.env.BASE_URL;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const studies = [
  { id: 'refraction', number: '01', title: 'Between the lines', category: 'REFRACTION / IDENTITY', image: '106', description: 'A face becomes a landscape. Familiar details dissolve into something that asks you to look a little longer.', note: 'What happens when the things between us become part of what we see?' },
  { id: 'presence', number: '02', title: 'The shape of quiet', category: 'FORM / NEGATIVE SPACE', image: '118', description: 'An object. A shadow. The space around both. A study in how absence gives form its presence.', note: 'Sometimes the most expressive part of a composition is the part we leave alone.' },
  { id: 'tension', number: '03', title: 'Held in the air', category: 'BALANCE / MOVEMENT', image: '669', description: 'A line stretches across an open field. Structure begins to feel like movement, and stillness holds a little tension.', note: 'Nothing is really still. We are just looking at a very small moment.' },
];

export function mountExhibition() {
  document.querySelector('#app').innerHTML = `
    <a class="skip-link" href="#selected">Skip to selected studies</a>
    <header class="art-header"><a class="art-logo" href="#" aria-label="SHIFT home">SHIFT<span>*</span></a><p>Independent experiments<br>in seeing differently.</p>
      <nav aria-label="Main navigation"><a href="#selected">The studies <sup>03</sup></a><a href="#about">The idea</a></nav>
      <button class="motion-button" aria-pressed="false" aria-label="Pause sculpture motion"><i aria-hidden="true"></i><span>Motion on</span></button>
    </header>
    <main>
      <section class="art-hero" aria-labelledby="hero-title">
        <div class="hero-topline"><span>A STUDY IN PERCEPTION</span><span>VOL. 001 — ALWAYS IN FLUX</span></div>
        <h1 id="hero-title">SHIFT</h1>
        <canvas class="art-sculpture" role="img" aria-label="An iridescent, intertwined sculptural form in lavender and coral"></canvas>
        <div class="hero-sticker" aria-hidden="true"><span>NOTHING<br>STANDS<br>STILL.</span><svg viewBox="0 0 60 60"><path d="M30 2v56M2 30h56M10 10l40 40M10 50l40-40"/></svg></div>
        <div class="hero-bottom"><p class="hero-poem">A change in<br><em>perspective.</em></p><p class="hero-caption">A little less expected.<br>A little more felt.<br><span>Move around. Stay curious.</span></p><a class="scroll-link" href="#selected" aria-label="Explore selected studies">Scroll to feel <span>↓</span></a></div>
        <span class="sculpture-caption">FIG. 01 / LIQUID THOUGHT</span>
      </section>
      <section class="art-statement" aria-label="A different way of looking"><p>New ways of seeing<br>begin with a little <em>disorder.</em></p><span class="statement-star" aria-hidden="true">✳</span><small>WE MAKE ROOM FOR THE UNEXPECTED.</small></section>
      <section class="art-selected" id="selected" aria-labelledby="selected-title"><div class="section-label"><h2 id="selected-title">Selected studies</h2><span>01 — 03 / AN OPEN EXPLORATION</span></div>
        <div class="art-studies">${studies.map((study, index) => `<article class="art-study study-${index + 1}" id="${study.id}"><div class="study-topline"><span>STUDY / ${study.number}</span><span>${study.category}</span></div><button class="study-open" data-study="${study.id}" aria-label="Open ${study.title}"><span class="study-image"><img src="${base}pictures/image-${study.image}.webp" alt="${index === 0 ? 'A face seen through textured glass' : index === 1 ? 'A sculptural chair in an open architectural space' : 'An abstract study of intersecting lines'}" loading="lazy" width="900" height="1100"></span><span class="study-view">Look closer ${arrow}</span></button><div class="study-title"><h3>${study.title}</h3><span aria-hidden="true">${arrow}</span></div><p>${study.description}</p></article>`).join('')}</div>
      </section>
      <section class="art-about" id="about" aria-labelledby="about-title"><div class="about-orbit" aria-hidden="true"><i></i><i></i><i></i>${arrow}</div><div class="art-about-copy"><span class="eyebrow">THE IDEA BEHIND SHIFT</span><h2 id="about-title">Not everything<br>needs to make sense.<br><em>Some things need<br>to make you feel.</em></h2><p>SHIFT is an ongoing exploration of form, space, and perception. A place for unexpected combinations, imperfect balance, and the beautiful things that happen when you look twice.</p><button class="film-button">Watch the original film <span>${arrow}</span></button></div></section>
      <footer class="art-footer"><div class="footer-top"><span>KEEP YOUR EYES OPEN.</span><a href="#">Back to the beginning ↑</a></div><p>Same world.<br><em>Different</em> SHIFT.</p><div class="footer-bottom"><span>AN INDEPENDENT VISUAL STUDY / 2026</span><span>Photography & original inspiration: <a href="https://obys.agency/" target="_blank" rel="noreferrer">Obys ↗</a></span></div></footer>
    </main>
    <dialog class="art-detail" aria-labelledby="detail-title"><button class="art-close" aria-label="Close study">Close ×</button><div class="detail-layout"><img alt=""><div><span class="detail-category"></span><h2 id="detail-title"></h2><p class="detail-description"></p><p class="detail-note"></p><button class="detail-next">Next study ${arrow}</button></div></div></dialog>
    <dialog class="art-film" aria-label="Original film"><form method="dialog"><button class="art-close" aria-label="Close film">Close ×</button></form><video controls playsinline preload="none" src="${base}video/trailer.mp4" aria-label="Original Grids S03 film by Obys"></video></dialog>`;
  const canvas = document.querySelector('.art-sculpture');
  const motionButton = document.querySelector('.motion-button');
  mountSculpture(canvas, motionButton);
  const updateMotionLabel = () => motionButton.setAttribute('aria-label', motionButton.getAttribute('aria-pressed') === 'true' ? 'Resume sculpture motion' : 'Pause sculpture motion');
  new MutationObserver(updateMotionLabel).observe(motionButton, { attributes: true, attributeFilter: ['aria-pressed'] });
  updateMotionLabel();
  const detail = document.querySelector('.art-detail');
  let current = 0;
  function showStudy(index) {
    current = index;
    const study = studies[index];
    const image = detail.querySelector('img');
    image.src = `${base}pictures/image-${study.image}.webp`;
    image.alt = document.querySelector(`[data-study="${study.id}"] img`).alt;
    detail.querySelector('.detail-category').textContent = `STUDY ${study.number} / ${study.category}`;
    detail.querySelector('h2').textContent = study.title;
    detail.querySelector('.detail-description').textContent = study.description;
    detail.querySelector('.detail-note').textContent = study.note;
    if (!detail.open) detail.showModal();
  }
  document.querySelectorAll('[data-study]').forEach((button, index) => button.addEventListener('click', () => showStudy(index)));
  detail.querySelector('.art-close').addEventListener('click', () => detail.close());
  detail.querySelector('.detail-next').addEventListener('click', () => showStudy((current + 1) % studies.length));
  const film = document.querySelector('.art-film');
  const video = film.querySelector('video');
  document.querySelector('.film-button').addEventListener('click', () => { film.showModal(); video.play().catch(() => {}); });
  film.addEventListener('close', () => video.pause());
  const syncModalState = () => document.documentElement.classList.toggle('modal-open', Boolean(document.querySelector('dialog[open]')));
  for (const dialog of [detail, film]) {
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', syncModalState);
    new MutationObserver(syncModalState).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
  }), { threshold: .1 });
  document.querySelectorAll('.art-study, .art-statement, .art-about-copy').forEach(element => observer.observe(element));
}
