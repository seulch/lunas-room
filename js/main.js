/* =========================================================
   MAIN — the front door, then wire the room up
   ========================================================= */
(function () {
  'use strict';
  const { $, $$, esc, store, openModal, closeModal, confetti, reduced } = App;

  document.title = CONTENT.tabTitle || 'For you';
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------------- front door ---------------- */
  $('#revealTease').textContent = CONTENT.reveal.tease;
  $('#revealBtn').textContent   = CONTENT.reveal.button;
  $('#lockHint').textContent    = CONTENT.reveal.hint || '';

  const door  = $('#door');
  const form  = $('#lockForm');
  const input = $('#lockInput');
  const CODE  = String(CONTENT.reveal.passcode || '');

  if (CODE) door.classList.add('is-locked');

  door.addEventListener('click', () => {
    if (!CODE) return enter();
    form.hidden = false;
    input.focus();
  });

  /* digits only, and try as soon as the last one lands */
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, CODE.length);
    if (digits !== input.value) input.value = digits;
    $('#lockErr').hidden = true;
    if (digits.length === CODE.length) tryCode();
  });

  form.addEventListener('submit', e => { e.preventDefault(); tryCode(); });

  function tryCode() {
    if (input.value === CODE) {
      door.classList.remove('is-locked');
      enter();
      return;
    }
    $('#lockErr').hidden = false;
    form.classList.remove('wrong');
    void form.offsetWidth;              // restart the shake
    form.classList.add('wrong');
    input.value = '';
    input.focus();
  }

  let entered = false;
  function enter() {
    if (entered) return;
    entered = true;
    door.classList.add('open');
    confetti();
    setTimeout(() => {
      $('#reveal').classList.add('gone');
      $('#stage').setAttribute('aria-hidden', 'false');
      $('#stage').classList.add('on');
      document.body.classList.remove('locked');
      setTimeout(() => { $('#reveal').style.display = 'none'; }, 900);
      Luna.start();
    }, reduced ? 100 : 900);
  }

  /* ---------------- build the room ---------------- */
  Room.build();
  Room.paintLight();
  setInterval(Room.paintLight, 30000);

  /* On a phone the room is wider than the screen — start in the middle. */
  const box = $('.scene__box');
  const centre = () => { box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2; };
  centre();
  addEventListener('resize', centre);

  /* sparkles disappear once she's opened a thing */
  const SEEN = 'room.seen.v1';
  let seen = new Set(store.get(SEEN, []));
  function paintHints() {
    $$('.hint').forEach(h => h.classList.toggle('done', seen.has(h.dataset.hint)));
  }
  paintHints();

  /* ---------------- open things ---------------- */
  function open(id) {
    if (id === '__feed') return Luna.feed();
    if (id === '__play') return Luna.play();

    const make = PANELS[id];
    if (!make) return;
    const p = make();
    openModal(p.title, p.html, p.mount, p.aria);

    if (!seen.has(id)) { seen.add(id); store.set(SEEN, [...seen]); paintHints(); }
  }

  $('#scene').addEventListener('click', e => {
    const sub = e.target.closest('.sub');          // album / jar share a shelf
    const hot = e.target.closest('.hot');
    const id = (sub && sub.dataset.open) || (hot && hot.dataset.open);
    if (id) open(id);
  });
  $('#scene').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('.sub, .hot');
    if (!el || !el.dataset.open) return;
    e.preventDefault();
    open(el.dataset.open);
  });

  /* ---------------- modal chrome ---------------- */
  $('#modalX').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* keep focus inside the modal while it's open */
  $('#modal').addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])', $('#modalCard'))
      .filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
