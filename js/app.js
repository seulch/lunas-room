/* =========================================================
   APP — shared helpers, the modal, confetti, toasts
   ========================================================= */
window.App = (function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- modal ---------------- */
  let lastFocus = null, onClose = null;

  function openModal(title, html, mount, aria) {
    lastFocus = document.activeElement;
    const t = $('#modalTitle');
    t.textContent = title || '';
    t.hidden = !title;                          // a panel can go without a heading
    $('#modal').setAttribute('aria-label', title || aria || 'Dialog');
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    document.body.classList.add('modal-open');
    onClose = null;
    if (mount) onClose = mount($('#modalBody')) || null;
    $('#modalX').focus();
  }

  function closeModal() {
    if ($('#modal').hidden) return;
    if (typeof onClose === 'function') { try { onClose(); } catch (_) {} }
    onClose = null;
    $('#modal').hidden = true;
    $('#modalBody').innerHTML = '';
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------- confetti ---------------- */
  function confetti(count = 140) {
    if (reduced) return;
    const cvs = $('#confetti'), ctx = cvs.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = cvs.width = innerWidth * dpr, H = cvs.height = innerHeight * dpr;
    cvs.style.width = innerWidth + 'px'; cvs.style.height = innerHeight + 'px';
    const colors = ['#FF5C8A', '#FFC93C', '#2EC4B6', '#7B5CFF', '#5CC8FF', '#FFF6E9'];
    const bits = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: -Math.random() * H * .4,
      w: (6 + Math.random() * 8) * dpr, h: (9 + Math.random() * 12) * dpr,
      vy: (2.2 + Math.random() * 3.4) * dpr, vx: (Math.random() - .5) * 2.4 * dpr,
      rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .22,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const b of bits) {
        b.x += b.vx; b.y += b.vy; b.rot += b.vr; b.vy += .03 * dpr;
        if (b.y < H + 40 * dpr) alive = true;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      }
      if (alive && ++f < 420) requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ---------------- hearts / particles from a point ---------------- */
  function burst(clientX, clientY, chars = ['💛', '💗', '✨']) {
    if (reduced) return;
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('span');
      s.className = 'heart';
      s.textContent = chars[(Math.random() * chars.length) | 0];
      s.style.left = clientX + 'px';
      s.style.top = clientY + 'px';
      s.style.setProperty('--dx', ((Math.random() - .5) * 120).toFixed(0) + 'px');
      s.style.setProperty('--dy', (-70 - Math.random() * 90).toFixed(0) + 'px');
      s.style.animationDelay = (i * 0.05) + 's';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
  }

  /* ---------------- tiny audio: purr / meow ---------------- */
  let actx = null;
  const ctx = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());

  function meow() {
    try {
      const c = ctx(), t = c.currentTime;
      const osc = c.createOscillator(), vib = c.createOscillator();
      const vg = c.createGain(), g = c.createGain(), f = c.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + .12);
      osc.frequency.exponentialRampToValueAtTime(400, t + .52);
      vib.frequency.value = 17; vg.gain.value = 24;
      vib.connect(vg).connect(osc.frequency);
      f.type = 'lowpass'; f.frequency.value = 1400; f.Q.value = 6;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.2, t + .06);
      g.gain.exponentialRampToValueAtTime(.0001, t + .6);
      osc.connect(f).connect(g).connect(c.destination);
      osc.start(t); vib.start(t); osc.stop(t + .62); vib.stop(t + .62);
    } catch (_) {}
  }

  function purr() {
    try {
      const c = ctx(), t = c.currentTime;
      const osc = c.createOscillator(), lfo = c.createOscillator();
      const lg = c.createGain(), g = c.createGain(), f = c.createBiquadFilter();
      osc.type = 'sawtooth'; osc.frequency.value = 42;
      lfo.frequency.value = 26; lg.gain.value = .06;
      lfo.connect(lg).connect(g.gain);
      f.type = 'lowpass'; f.frequency.value = 260;
      g.gain.setValueAtTime(.07, t);
      g.gain.setValueAtTime(.07, t + 1.1);
      g.gain.linearRampToValueAtTime(.0001, t + 1.5);
      osc.connect(f).connect(g).connect(c.destination);
      osc.start(t); lfo.start(t); osc.stop(t + 1.55); lfo.stop(t + 1.55);
    } catch (_) {}
  }

  /* ---------------- a stand-in card for a missing image ---------------- */
  const CARD = [['#FF5C8A','#7B5CFF'],['#2EC4B6','#5CC8FF'],['#FFC93C','#FF8A5C'],
                ['#7B5CFF','#2EC4B6'],['#FF8A5C','#FF5C8A'],['#5CC8FF','#7B5CFF']];
  function cardImage(text, seed, w, h) {
    let n = 0;
    for (let i = 0; i < String(seed).length; i++) n = (n * 31 + String(seed).charCodeAt(i)) >>> 0;
    const [a, b] = CARD[n % CARD.length];
    const lines = [];
    let cur = '';
    for (const word of String(text || '').split(' ')) {
      if ((cur + ' ' + word).trim().length > 14) { lines.push(cur.trim()); cur = word; }
      else cur += ' ' + word;
    }
    if (cur.trim()) lines.push(cur.trim());
    const top = h / 2 + 30 - (lines.length - 1) * 14;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`
      + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
      + `<stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs>`
      + `<rect width="${w}" height="${h}" fill="url(#g)"/>`
      + `<circle cx="${w * 0.8}" cy="${h * 0.2}" r="${w * 0.2}" fill="#fff" opacity=".13"/>`
      + `<circle cx="${w * 0.18}" cy="${h * 0.84}" r="${w * 0.28}" fill="#fff" opacity=".1"/>`
      + `<text x="${w / 2}" y="${h / 2 - 20}" text-anchor="middle" font-size="${w * 0.16}" opacity=".85">📷</text>`
      + lines.slice(0, 3).map((l, i) =>
          `<text x="${w / 2}" y="${top + i * 28}" text-anchor="middle" fill="#fff" opacity=".9"`
          + ` font-family="Verdana,sans-serif" font-size="19">`
          + l.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + `</text>`).join('')
      + `</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* Show `src`, but fall back to a stand-in card if it can't load. */
  function imageOrCard(el, src, text, seed, w, h) {
    const attr = el.tagName.toLowerCase() === 'image' ? 'href' : 'src';
    const onerr = () => {
      el.removeEventListener('error', onerr);
      el.setAttribute(attr, cardImage(text, seed, w || 300, h || 400));
    };
    el.addEventListener('error', onerr);
    el.setAttribute(attr, src);
  }

  /* ---------------- safe localStorage ---------------- */
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); }
      catch (_) { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };

  return { $, $$, reduced, esc, openModal, closeModal, confetti, burst, meow, purr, store,
           cardImage, imageOrCard };
})();
