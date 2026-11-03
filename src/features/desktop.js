import { chapters } from './chapters.js';

export async function prepareDesktop(runtime) {
  await new Promise(resolve => {
    const ready = () => document.querySelectorAll('.grid-entry__frame').length === chapters.length
      && document.documentElement.classList.contains('lenis')
      && !document.documentElement.classList.contains('lenis-stopped');
    if (ready()) return resolve();
    const observer = new MutationObserver(() => { if (ready()) { observer.disconnect(); resolve(); } });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  });
  const titles = [...document.querySelectorAll('.grid-entry__title')];
  const targets = titles;
  document.querySelector('.intro__title').tabIndex = -1;
  const labInvite = document.createElement('button');
  labInvite.className = 'shift-lab-invite';
  labInvite.dataset.openLab = '';
  labInvite.setAttribute('aria-haspopup', 'dialog');
  labInvite.innerHTML = 'Play with the grid <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
  document.querySelector('.intro').append(labInvite);
  titles.forEach((title, index) => { title.id = chapters[index].id; title.tabIndex = -1; });
  const trigger = document.querySelector('[data-trailer]');
  trigger.tabIndex = 0;
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('aria-label', 'Play introduction trailer');
  const keyboardClick = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); event.currentTarget.click(); } };
  trigger.addEventListener('keydown', keyboardClick);
  const trailer = document.querySelector('.trailer');
  const film = trailer.querySelector('video');
  trailer.setAttribute('role', 'dialog');
  trailer.setAttribute('aria-modal', 'true');
  trailer.setAttribute('aria-label', 'Introduction trailer');
  film.tabIndex = 0;
  film.setAttribute('role', 'button');
  film.setAttribute('aria-label', 'Pause trailer');
  film.addEventListener('keydown', keyboardClick);
  film.addEventListener('play', () => film.setAttribute('aria-label', 'Pause trailer'));
  film.addEventListener('pause', () => film.setAttribute('aria-label', 'Play trailer'));
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'shift-button shift-video-close';
  close.textContent = 'Close ×';
  close.setAttribute('aria-label', 'Close trailer');
  close.addEventListener('click', event => { event.stopPropagation(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
  trailer.append(close);
  let returnFocus = null;
  new MutationObserver(() => {
    const open = !trailer.hidden;
    const navigation = document.querySelector('.shift-navigation');
    if (navigation) navigation.inert = open;
    document.querySelector('.page').inert = open;
    if (open) { returnFocus = document.activeElement; close.focus(); }
    else returnFocus?.focus({ preventScroll: true });
  }).observe(trailer, { attributes: true, attributeFilter: ['hidden'] });
  trailer.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    (document.activeElement === close ? film : close).focus();
  });
  return {
    targets,
    scrollToChapter(index) {
      if (index < 0) { runtime.jumpTo(0); document.querySelector('.intro__title').focus({ preventScroll: true }); return; }
      runtime.jumpTo(Math.max(0, targets[index].getBoundingClientRect().top + scrollY - 140));
      titles[index].focus({ preventScroll: true });
    },
  };
}
