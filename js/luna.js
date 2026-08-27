/* =========================================================
   LUNA — she lives here.
   Wanders the floor, sits, loafs, sleeps on California's
   clock, and gets hungry in real time (saved locally).
   ========================================================= */
window.Luna = (function () {
  'use strict';
  const { $, esc, store, purr, meow, burst } = App;
  const NS = 'http://www.w3.org/2000/svg';
  const KEY = 'luna.state.v1';
  const SAY = CONTENT.luna.says;

  /* how long a full meter takes to empty, in hours */
  const FOOD_HOURS = 40, HAPPY_HOURS = 60;
  const PET_GOAL = 15;                    // pets needed to unlock the secret

  /* The corner of the floor she's allowed to wander. Everything to the
     left of it has tall furniture she'd be drawn in front of. */
  const AREA = { x0: 300, x1: 438, y0: 105, y1: 362 };
  const BED  = { x: 390, y: 180 };      // her own bed
  const BOWL = { x: 428, y: 300 };
  const TOY  = { x: 350, y: 345 };
  const BIGBED = { edge: { x: 298, y: 250 }, on: { x: 215, y: 240, z: 56 } };  // yours

  let S = null;                            // state
  let pos = { x: 370, y: 260, z: 0 };
  let target = null, facing = 1, mode = 'sit';
  let modeUntil = 0, raf = null, lastFrame = 0;
  let el = null, bubbleEl = null, bubbleTimer = null;
  let lastPet = 0, lastFeed = 0, lastPlay = 0;

  /* ---------------------------------------------------------
     STATE
     --------------------------------------------------------- */
  function load() {
    const now = Date.now();
    S = store.get(KEY, null) || { food: 85, happy: 85, pets: 0, last: now, unlocked: false };
    const hrs = Math.max(0, (now - S.last)) / 36e5;
    S.food  = clamp(S.food  - hrs * (100 / FOOD_HOURS));
    S.happy = clamp(S.happy - hrs * (100 / HAPPY_HOURS));
    S.last  = now;
    save();
  }
  const clamp = n => Math.max(0, Math.min(100, n));
  function save() { S.last = Date.now(); store.set(KEY, S); }

  function decay() {
    const now = Date.now();
    const hrs = (now - S.last) / 36e5;
    S.food  = clamp(S.food  - hrs * (100 / FOOD_HOURS));
    S.happy = clamp(S.happy - hrs * (100 / HAPPY_HOURS));
    save();
    paintHUD();
  }

  const asleep = () => {
    const h = Room.hourIn(CONTENT.cities.her.tz, new Date());
    return h >= 23 || h < 7;
  };

  function face() {
    if (asleep())      return '😴';
    if (S.food  < 20)  return '🙀';
    if (S.happy < 20)  return '😾';
    if (S.food  < 45)  return '😼';
    if (S.happy < 45)  return '🐈';
    if (S.happy > 85 && S.food > 70) return '😽';
    return '🐈‍⬛';
  }

  /* ---------------------------------------------------------
     SPRITE
     --------------------------------------------------------- */
  const SPRITE = `
    <g class="luna__body">
      <ellipse class="l-torso" cx="58" cy="52" rx="34" ry="20" fill="#8F9BB3"/>
      <path class="l-tail" d="M92 50 q22 -4 16 -26" stroke="#8F9BB3" stroke-width="9" fill="none" stroke-linecap="round"/>
      <g class="l-legs" fill="#8F9BB3">
        <rect x="36" y="64" width="9" height="11" rx="4"/><rect x="52" y="64" width="9" height="11" rx="4"/>
        <rect x="68" y="64" width="9" height="11" rx="4"/><rect x="82" y="64" width="9" height="11" rx="4"/>
      </g>
      <g class="l-head">
        <circle cx="28" cy="36" r="17" fill="#9BA7BE"/>
        <path d="M16 24 l2 -14 12 8 Z" fill="#9BA7BE"/>
        <path d="M40 24 l-2 -14 -12 8 Z" fill="#9BA7BE"/>
        <path class="l-eyeO" d="M20 35 h5 M32 35 h5" stroke="#2B2B3A" stroke-width="2.4" stroke-linecap="round" opacity="0"/>
        <circle class="l-eye" cx="22" cy="35" r="2.8" fill="#2B2B3A"/>
        <circle class="l-eye" cx="34" cy="35" r="2.8" fill="#2B2B3A"/>
        <path d="M25 42 q3 3 6 0" stroke="#2B2B3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <g stroke="#E8ECF4" stroke-width="1.4" stroke-linecap="round">
          <path d="M18 40 l-12 -3"/><path d="M18 43 l-12 2"/>
          <path d="M38 40 l12 -3"/><path d="M38 43 l12 2"/>
        </g>
      </g>
    </g>`;

  function mount() {
    const layer = $('#lunaLayer');
    layer.innerHTML = `<g id="luna" class="luna" tabindex="0" role="button"
                          aria-label="${esc(CONTENT.luna.name)} — click to pet her">
                         <ellipse class="luna__shadow" cx="58" cy="76" rx="34" ry="9"
                                  fill="#2B2B3A" opacity=".2"/>
                         ${SPRITE}
                       </g>
                       <g id="lunaBubble" class="luna-bubble" style="display:none"></g>`;
    el = $('#luna');
    bubbleEl = $('#lunaBubble');
    el.addEventListener('click', () => pet());
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pet(); }
    });
  }

  function draw() {
    const [sx, sy] = Room.px(pos.x, pos.y, pos.z || 0);
    const depth = 0.78 + ((pos.x + pos.y) / (Room.W + Room.D)) * 0.34;
    el.setAttribute('transform',
      `translate(${sx} ${sy}) scale(${(facing * depth).toFixed(3)} ${depth.toFixed(3)}) translate(-58 -70)`);
    el.setAttribute('data-mode', mode);
  }

  /* ---------------------------------------------------------
     SPEECH
     --------------------------------------------------------- */
  function say(text) {
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > 20) { lines.push(cur.trim()); cur = w; }
      else cur += ' ' + w;
    }
    if (cur.trim()) lines.push(cur.trim());

    const [sx, sy] = Room.px(pos.x, pos.y, pos.z || 0);
    const w = Math.max(70, Math.max(...lines.map(l => l.length)) * 8.6 + 24);
    const h = lines.length * 20 + 20;
    const bx = Math.min(1140 - w, Math.max(10, sx - w / 2));
    const by = sy - 100 - h;

    bubbleEl.innerHTML = `
      <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="14"
            fill="#FFF6E9" stroke="#2B2B3A" stroke-width="3"/>
      <path d="M${sx - 9} ${by + h} L${sx} ${by + h + 14} L${sx + 9} ${by + h} Z"
            fill="#FFF6E9" stroke="#2B2B3A" stroke-width="3" stroke-linejoin="round"/>
      ${lines.map((l, i) => `<text x="${bx + w / 2}" y="${by + 26 + i * 20}" text-anchor="middle"
          font-family="Nunito,sans-serif" font-size="15" font-weight="600"
          fill="#2B2B3A">${esc(l)}</text>`).join('')}`;
    bubbleEl.style.display = '';
    bubbleEl.classList.remove('pop'); void bubbleEl.getBBox; bubbleEl.classList.add('pop');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { bubbleEl.style.display = 'none'; }, 2800);
  }
  const pick = a => a[(Math.random() * a.length) | 0];

  /* ---------------------------------------------------------
     ACTIONS
     --------------------------------------------------------- */
  function pet() {
    const now = Date.now();
    if (asleep()) { say(pick(SAY.asleep)); return; }
    if (now - lastPet < 900) return;
    lastPet = now;

    S.pets++; S.happy = clamp(S.happy + 6); save();
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 3);
    purr();
    setMode('sit', 1800);
    say(S.food < 25 ? pick(SAY.hungry) : S.happy < 30 ? pick(SAY.sad) : pick(SAY.pet));
    paintHUD();

    if (!S.unlocked && S.pets >= PET_GOAL) {
      S.unlocked = true; save();
      revealSecret();
    }
  }

  function feed() {
    const now = Date.now();
    if (asleep()) { say(pick(SAY.asleep)); return; }
    if (S.food > 92) { say('not hungry. suspicious.'); return; }
    if (now - lastFeed < 8000) { say('give it a minute'); return; }
    lastFeed = now;

    S.food = clamp(S.food + 45); S.happy = clamp(S.happy + 8); save();
    const toBowl = () => goTo(BOWL.x, BOWL.y - 26, () => { setMode('eat', 2600); say(pick(SAY.fed)); });
    if ((pos.z || 0) > 10) leaveBed(toBowl); else toBowl();
    paintHUD();
  }

  function play() {
    const now = Date.now();
    if (asleep()) { say(pick(SAY.asleep)); return; }
    if (now - lastPlay < 4000) { say('...again?'); return; }
    lastPlay = now;

    S.happy = clamp(S.happy + 20); S.food = clamp(S.food - 6); save();
    meow();
    const toy = $('#toy');
    if (toy) { toy.classList.add('wiggle'); setTimeout(() => toy.classList.remove('wiggle'), 700); }
    const toToy = () => goTo(TOY.x, TOY.y - 22, () => { setMode('play', 2200); say(pick(SAY.played)); });
    if ((pos.z || 0) > 10) leaveBed(toToy); else toToy();
    paintHUD();
  }

  function revealSecret() {
    const s = $('#secret');
    if (!s) return;
    s.hidden = false;
    say('fine. look under the rug.');
    App.confetti(70);
  }

  /* ---------------------------------------------------------
     BRAIN
     --------------------------------------------------------- */
  function setMode(m, ms) { mode = m; modeUntil = Date.now() + (ms || 2000); }

  function goTo(x, y, then, z) {
    target = { x, y, z: z == null ? 0 : z, then };
    mode = 'walk';
    modeUntil = Date.now() + 20000;
  }

  /* Climb onto the big bed and curl up with the two of you. */
  function joinThem() {
    goTo(BIGBED.edge.x, BIGBED.edge.y, () => {
      goTo(BIGBED.on.x, BIGBED.on.y, () => {
        setMode('loaf', 14000 + Math.random() * 12000);
        if (Math.random() < .5) say(pick(SAY.pet));
      }, BIGBED.on.z);
    });
  }

  /* Get down before wandering off again. */
  function leaveBed(then) {
    goTo(BIGBED.edge.x, BIGBED.edge.y, then, 0);
  }

  function roam() {
    goTo(AREA.x0 + Math.random() * (AREA.x1 - AREA.x0),
         AREA.y0 + Math.random() * (AREA.y1 - AREA.y0));
  }

  function wander() {
    const onBed = (pos.z || 0) > 10;
    if (asleep()) {
      if (onBed) setMode('sleep', 60000);          // she's already somewhere soft
      else goTo(BED.x, BED.y, () => setMode('sleep', 60000));
      return;
    }
    if (onBed) { leaveBed(roam); return; }         // always climb down first

    const r = Math.random();
    if (S.food < 25 && r < .5)       goTo(BOWL.x, BOWL.y - 26, () => { setMode('sit', 3000); say(pick(SAY.hungry)); });
    else if (S.happy < 25 && r < .5) goTo(BED.x, BED.y, () => { setMode('loaf', 6000); say(pick(SAY.sad)); });
    else if (r < .16)                joinThem();
    else if (r < .32)                goTo(BED.x, BED.y, () => setMode('loaf', 8000));
    else if (r < .52)                setMode(Math.random() < .5 ? 'sit' : 'loaf', 3000 + Math.random() * 4000);
    else                             roam();
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(64, ts - (lastFrame || ts));
    lastFrame = ts;

    if (target) {
      const dx = target.x - pos.x, dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        const then = target.then; target = null;
        if (then) then(); else setMode('sit', 1200 + Math.random() * 2000);
      } else {
        const sp = 0.055 * dt;                    // room units per ms
        pos.x += (dx / dist) * sp;
        pos.y += (dy / dist) * sp;
        // hop up onto (or down off) the bed over the length of the walk
        const dz = (target.z || 0) - (pos.z || 0);
        if (Math.abs(dz) > 0.4) pos.z = (pos.z || 0) + dz * Math.min(1, sp / dist * 2.2);
        else pos.z = target.z || 0;
        // screen-x direction decides which way she faces
        facing = (dx - dy) >= 0 ? 1 : -1;
      }
    } else if (Date.now() > modeUntil) {
      wander();
    }
    draw();
  }

  /* ---------------------------------------------------------
     HUD
     --------------------------------------------------------- */
  function paintHUD() {
    $('#hudFace').textContent = face();
    $('#mFood').style.width  = S.food.toFixed(1) + '%';
    $('#mHappy').style.width = S.happy.toFixed(1) + '%';
    $('#mFood').classList.toggle('low', S.food < 25);
    $('#mHappy').classList.toggle('low', S.happy < 25);
    const k = $('#kibble');
    if (k) k.setAttribute('opacity', S.food > 55 ? '1' : S.food > 25 ? '.5' : '.12');
  }

  /* ---------------------------------------------------------
     START
     --------------------------------------------------------- */
  function start() {
    load();
    mount();
    $('#hudName').textContent = CONTENT.luna.name;

    // a real photo of her, if there is one; the mood emoji becomes a badge on it
    if (CONTENT.luna.avatar) {
      const img = $('#hudAvImg');
      img.addEventListener('load', () => {
        img.hidden = false;
        $('#hudAv').classList.add('has-photo');
      });
      img.addEventListener('error', () => { img.hidden = true; });
      img.src = CONTENT.luna.avatar;
    }
    $('#bFeed').addEventListener('click', feed);
    $('#bPlay').addEventListener('click', play);
    $('#bPet').addEventListener('click', pet);
    if (S.unlocked) $('#secret').hidden = false;

    paintHUD();
    pos = asleep() ? { x: BED.x, y: BED.y, z: 0 } : { x: 370, y: 260, z: 0 };
    setMode(asleep() ? 'sleep' : 'sit', 2000);
    draw();
    raf = requestAnimationFrame(frame);

    setInterval(decay, 60000);
    // a little unprompted personality
    setInterval(() => {
      if (asleep() || Math.random() > .25) return;
      if (S.food < 25) say(pick(SAY.hungry));
      else if (S.happy < 25) say(pick(SAY.sad));
      else say(pick(CONTENT.luna.facts));
    }, 30000);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) { lastFrame = 0; decay(); raf = requestAnimationFrame(frame); }
    });
  }

  return { start, pet, feed, play, say, get state() { return S; } };
})();
