/* =========================================================
   PANELS — what each object in the room opens.
   Each entry: { title, html, mount? }   mount may return a
   cleanup function (used to clear intervals on close).
   ========================================================= */
window.PANELS = (function () {
  'use strict';
  const { esc, store, confetti } = App;
  const DAY = 864e5;
  const nf = n => n.toLocaleString('en-US');
  const d0 = iso => new Date(iso + 'T00:00:00');

  /* ============ THE LETTER ============ */
  const letter = () => {
    const L = CONTENT.letter;
    return {
      title: L.heading,
      html: `<div class="paper">
               <div id="letterText"></div>
               <p class="paper__sign" id="letterSign" hidden>${
                 L.signoff ? `${esc(L.signoff)}<br><b>${esc(CONTENT.you)}</b>`
                           : `<b>-${esc(CONTENT.you)}</b>`}</p>
               <button class="paper__skip" id="paperSkip">skip →</button>
             </div>`,
      mount(root) {
        const lines = [{ cls: 'sal', str: L.salutation },
                       ...L.paragraphs.map(p => ({ cls: 'line', str: p }))];
        const text = root.querySelector('#letterText');
        const sign = root.querySelector('#letterSign');
        const skip = root.querySelector('#paperSkip');
        let stopped = false, timer = null;

        const finish = () => {
          stopped = true;
          clearTimeout(timer);
          text.innerHTML = lines.map(l => `<p class="${l.cls}">${esc(l.str)}</p>`).join('');
          sign.hidden = false;
          skip.hidden = true;
        };
        skip.addEventListener('click', finish);

        if (App.reduced) { finish(); return () => {}; }

        let li = 0, ci = 0, el = null;
        (function step() {
          if (stopped) return;
          if (li >= lines.length) { sign.hidden = false; skip.hidden = true; return; }
          if (!el) {
            el = document.createElement('p');
            el.className = lines[li].cls;
            el.innerHTML = '<span></span><span class="caret">|</span>';
            text.appendChild(el);
          }
          const str = lines[li].str;
          if (ci < str.length) {
            ci++;
            el.firstChild.textContent = str.slice(0, ci);
            const c = str[ci - 1];
            timer = setTimeout(step, '.!?'.includes(c) ? 140 : ',;'.includes(c) ? 70 : 12);
          } else {
            el.lastChild.remove(); el = null; ci = 0; li++;
            timer = setTimeout(step, 320);
          }
        })();
        return () => { stopped = true; clearTimeout(timer); };
      },
    };
  };

  /* ============ PHOTO ALBUM ============ */
  const album = () => ({
    title: '',
    aria: 'The album',
    html: `<div class="wall">${CONTENT.gallery.map((g, i) => `
             <figure class="polaroid" data-i="${i}" tabindex="0" role="button"
                     style="--rot:${(((i * 37) % 9) - 4)}deg">
               <img src="${esc(g.img)}" alt="${esc(g.caption)}" loading="lazy">
               <figcaption>${esc(g.caption)}</figcaption>
             </figure>`).join('')}</div>
           <div class="zoom" id="zoom" hidden></div>`,
    mount(root) {
      const zoom = root.querySelector('#zoom');
      root.querySelectorAll('.polaroid img').forEach((img, i) => {
        const g = CONTENT.gallery[i];
        App.imageOrCard(img, g.img, g.caption, g.img, 300, 400);
      });
      const open = i => {
        const g = CONTENT.gallery[i];
        zoom.innerHTML = `<img alt="${esc(g.caption || 'photo')}">
                          ${g.caption ? `<p class="lb__cap">${esc(g.caption)}</p>` : ''}
                          <button class="btn" id="zoomBack">← back to the wall</button>`;
        App.imageOrCard(zoom.querySelector('img'), g.img, g.caption, g.img, 600, 800);
        zoom.hidden = false;
        root.querySelector('.wall').hidden = true;
        zoom.querySelector('#zoomBack').addEventListener('click', () => {
          zoom.hidden = true; root.querySelector('.wall').hidden = false;
        });
      };
      root.addEventListener('click', e => {
        const f = e.target.closest('.polaroid'); if (f) open(+f.dataset.i);
      });
      root.addEventListener('keydown', e => {
        const f = e.target.closest('.polaroid');
        if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(+f.dataset.i); }
      });
    },
  });

  /* ============ US IN NUMBERS ============ */
  const clocks = () => {
    const start = d0(CONTENT.dates.together);
    const UNITS = [['years', 'years'], ['days', 'days'], ['h', 'hours'],
                   ['m', 'minutes'], ['s', 'seconds']];

    /* calendar-accurate years, then whatever days are left over */
    function yearsAndDays(from, to) {
      let y = to.getFullYear() - from.getFullYear();
      const a = new Date(from);
      a.setFullYear(from.getFullYear() + y);
      if (a > to) { y--; a.setFullYear(a.getFullYear() - 1); }
      return { years: y, days: Math.floor((to - a) / DAY) };
    }

    return {
      title: 'Us, in numbers',
      html: `<div class="ticker ticker--only"><div class="ticker__row">
               ${UNITS.map(([k, l]) => `<div class="unit"><b data-k="${k}">0</b><i>${l}</i></div>`).join('')}
             </div><p class="ticker__cap">together</p></div>`,
      mount(root) {
        const tick = () => {
          const now = new Date();
          const { years, days } = yearsAndDays(start, now);
          const ms = now - start;
          const v = { years, days,
                      h: Math.floor(ms / 36e5) % 24,
                      m: Math.floor(ms / 6e4) % 60,
                      s: Math.floor(ms / 1e3) % 60 };
          UNITS.forEach(([k]) => {
            const el = root.querySelector(`[data-k="${k}"]`);
            const str = String(v[k]).padStart(k === 'years' || k === 'days' ? 1 : 2, '0');
            if (el.textContent !== str) el.textContent = str;
          });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
      },
    };
  };

  /* ============ THE PRESENT ============ */
  const gift = () => {
    const G = CONTENT.gift || {};
    return {
      title: G.heading || '',
      aria: 'Your present',
      html: `<div class="giftbox">
               <img alt="Your present">
               ${G.note ? `<p class="lb__cap">${esc(G.note)}</p>` : ''}
             </div>`,
      mount(root) {
        App.imageOrCard(root.querySelector('img'), G.photo, G.heading || 'your present',
                        G.photo || 'gift', 600, 800);
      },
    };
  };

  /* ============ WINDOW ============ */
  const windowPanel = () => {
    const rows = [
      [CONTENT.you, CONTENT.cities.you],
      [CONTENT.her, CONTENT.cities.her],
    ];
    return {
      title: 'Our Timezones 🥺',
      html: `<div class="whereis">${rows.map(([name, city]) => `
               <div class="whereis__row">
                 <span class="whereis__who">${esc(name)}</span>
                 <span class="whereis__t" data-tz="${esc(city.tz)}">—</span>
                 <span class="whereis__where">${esc(city.emoji)} ${esc(city.label)}</span>
               </div>`).join('')}</div>`,
      mount(root) {
        const tick = () => {
          const now = new Date();
          root.querySelectorAll('.whereis__t').forEach(el => {
            el.textContent = now.toLocaleTimeString('en-US',
              { timeZone: el.dataset.tz, hour: 'numeric', minute: '2-digit' });
          });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
      },
    };
  };

  /* ============ MAILBOX ============ */
  const mail = () => ({
    title: CONTENT.close.replyPrompt,
    html: `<form class="reply" id="replyForm">
             <textarea class="reply__box" id="replyText" rows="5"
                       placeholder="${esc(CONTENT.close.replyPlaceholder)}"></textarea>
             <button class="btn btn--big" type="submit">Send it</button>
             <p class="reply__ok" id="replyOk" hidden>Got it. 💛</p>
           </form>`,
    mount(root) {
      root.querySelector('#replyForm').addEventListener('submit', async e => {
        e.preventDefault();
        const msg = root.querySelector('#replyText').value.trim();
        if (!msg) return;
        if (CONTENT.close.formspreeURL) {
          try {
            await fetch(CONTENT.close.formspreeURL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ from: CONTENT.her, message: msg }),
            });
          } catch (_) {}
        }
        root.querySelector('#replyOk').hidden = false;
        root.querySelector('#replyText').value = '';
        confetti(60);
      });
    },
  });

  /* ============ THE PROJECTOR SCREEN ============ */
  const movies = () => {
    const KEY = 'movies.starred.v1';
    const M = CONTENT.movies;
    const films = Posters.all();
    return {
      title: M.heading,
      html: `<div class="posters">${films.map((f, i) => `
               <button class="poster" data-i="${i}" aria-pressed="false">
                 <span class="poster__art">
                   <img src="${esc(Posters.url(f))}" alt="${esc(f.title)}" loading="lazy">
                   <span class="poster__star">★</span>
                 </span>
                 <span class="poster__t">${esc(f.title)}</span>
               </button>`).join('')}</div>
             <p class="films__rest">${esc(M.andTheRest)}</p>`,
      mount(root) {
        let starred = new Set(store.get(KEY, []));
        const mark = i => {
          const b = root.querySelector(`.poster[data-i="${i}"]`);
          if (!b) return;
          const on = starred.has(i);
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        };
        starred.forEach(mark);

        root.addEventListener('click', e => {
          const b = e.target.closest('.poster');
          if (!b) return;
          const i = +b.dataset.i;
          if (starred.has(i)) starred.delete(i); else starred.add(i);
          store.set(KEY, [...starred]);
          mark(i);
        });

        // a dead image URL should never show a broken-image icon
        root.querySelectorAll('.poster img').forEach((img, i) => {
          img.addEventListener('error', function onerr() {
            img.removeEventListener('error', onerr);
            img.src = Posters.placeholder(films[i]);
          });
        });

        // if a TMDB key is set, real posters replace the placeholders in place
        Posters.hydrate(f => {
          const i = films.findIndex(x => Posters.key(x) === Posters.key(f));
          const img = root.querySelector(`.poster[data-i="${i}"] img`);
          if (img) { Posters.bind(img, films[i]); img.classList.add('swapped'); }
        });
      },
    };
  };

  /* ============ THE SECRET ============ */
  const secret = () => ({
    title: 'You found it',
    html: `<p class="secret__note">${esc(CONTENT.luna.secret)}</p>`,
    mount() { confetti(110); },
  });

  return { letter, album, clocks, gift, window: windowPanel, mail, movies, secret };
})();
