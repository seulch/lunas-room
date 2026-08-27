/* =========================================================
   POSTERS — resolves an image for each title.

   Order of preference:
     1. a "poster" field on the title (your own file)
     2. a poster remembered from TMDB (fetched once, then cached)
     3. a generated placeholder card, so nothing is ever broken

   Nothing here downloads or stores anyone's artwork in the repo —
   TMDB serves its own images, which is what its API is for.
   ========================================================= */
window.Posters = (function () {
  'use strict';
  const { store } = App;
  const CACHE = 'movies.posters.v1';
  const IMG = 'https://image.tmdb.org/t/p/w342';

  /* ---- normalise whatever shape the watchlist entry is in ---- */
  function film(entry) {
    if (typeof entry === 'string') return { title: entry };
    return { title: entry.title, year: entry.year, poster: entry.poster };
  }
  const all = () => ((CONTENT.movies && CONTENT.movies.list) || []).map(film);

  /* ---- the placeholder, drawn as a data-URI SVG ---- */
  const PALETTE = [
    ['#FF5C8A', '#7B5CFF'], ['#2EC4B6', '#5CC8FF'], ['#FFC93C', '#FF8A5C'],
    ['#7B5CFF', '#2EC4B6'], ['#FF8A5C', '#FF5C8A'], ['#5CC8FF', '#7B5CFF'],
  ];
  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function wrap(text, per) {
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > per) { lines.push(cur.trim()); cur = w; }
      else cur += ' ' + w;
    }
    if (cur.trim()) lines.push(cur.trim());
    return lines.slice(0, 4);
  }
  function placeholder(f) {
    const [a, b] = PALETTE[hash(f.title) % PALETTE.length];
    const lines = wrap(f.title, 13);
    const startY = 300 - (lines.length - 1) * 25;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs>` +
      `<rect width="300" height="450" fill="url(#g)"/>` +
      `<circle cx="240" cy="90" r="62" fill="#fff" opacity=".13"/>` +
      `<circle cx="55" cy="380" r="88" fill="#fff" opacity=".10"/>` +
      `<text x="150" y="180" text-anchor="middle" font-size="54" opacity=".9">🎬</text>` +
      lines.map((l, i) =>
        `<text x="150" y="${startY + i * 44}" text-anchor="middle" fill="#fff" ` +
        `font-family="Verdana,sans-serif" font-size="30" font-weight="bold">` +
        l.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) +
        `</text>`).join('') +
      (f.year ? `<text x="150" y="${startY + lines.length * 44 + 8}" text-anchor="middle" ` +
                `fill="#fff" opacity=".7" font-family="Verdana,sans-serif" font-size="22">${f.year}</text>` : '') +
      `</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---- resolve one title to an image URL ---- */
  let cache = store.get(CACHE, {});
  function url(f) {
    if (f.poster) return f.poster;                 // your own file always wins
    const hit = cache[key(f)];
    if (hit) return IMG + hit;
    return placeholder(f);
  }
  const key = f => (f.title + '|' + (f.year || '')).toLowerCase();
  const isPlaceholder = f => !f.poster && !cache[key(f)];

  /* ---- ask TMDB for the ones we don't have yet ---- */
  let fetching = false;
  const year = x => String(x.release_date || x.first_air_date || '').slice(0, 4);

  async function lookup(k, f) {
    const q = new URLSearchParams({ api_key: k, query: f.title, include_adult: 'false' });
    const r = await fetch(`https://api.themoviedb.org/3/search/multi?${q}`);
    if (!r.ok) throw new Error('tmdb ' + r.status);
    const j = await r.json();
    const cands = (j.results || [])
      .filter(x => x.poster_path && (x.media_type === 'movie' || x.media_type === 'tv'));
    if (!cands.length) return null;
    // a year in content.js is what separates remakes from originals
    if (f.year) {
      const exact = cands.find(x => year(x) === String(f.year));
      if (exact) return exact.poster_path;
      const near = cands.find(x => Math.abs(+year(x) - f.year) <= 1);
      if (near) return near.poster_path;
    }
    return cands[0].poster_path;
  }

  async function hydrate(onEach) {
    const k = CONTENT.movies && CONTENT.movies.tmdbKey;
    if (!k || fetching) return;
    fetching = true;
    for (const f of all().filter(x => !x.poster && !cache[key(x)])) {
      try {
        const path = await lookup(k, f);
        if (path) {
          cache[key(f)] = path;
          store.set(CACHE, cache);
          if (onEach) onEach(f);
        }
      } catch (_) { /* offline, bad key, rate limit — the placeholder stays */ }
    }
    fetching = false;
  }

  function forget() { cache = {}; store.set(CACHE, {}); }

  /* Point an <img>/<image> at a title, and fall back to the placeholder if
     the remote image ever fails to load. */
  function bind(el, f) {
    const attr = el.tagName.toLowerCase() === 'image' ? 'href' : 'src';
    const fallback = () => {
      el.removeEventListener('error', fallback);
      el.setAttribute(attr, placeholder(f));
    };
    el.addEventListener('error', fallback);
    el.setAttribute(attr, url(f));
  }

  return { all, film, url, bind, placeholder, isPlaceholder, hydrate, forget, key };
})();
