/* =========================================================
   ROOM — builds the isometric scene as SVG.

   Room space: x runs toward the RIGHT wall corner,
               y runs toward the LEFT wall corner,
               z is up. Screen position comes from px().

   Layout:
     right wall (y=0) — projector screen, clocks, mail slot
     left wall  (x=0) — window
     floor            — bed (facing the screen), projector
                        behind it, desk, shelf, Luna's corner
   ========================================================= */
window.Room = (function () {
  'use strict';
  const { $, esc } = App;

  const OX = 600, OY = 300;          // where room-space (0,0,0) lands on screen
  const W = 460, D = 460, H = 270;   // room width, depth, wall height

  const px  = (x, y, z = 0) => [OX + (x - y), OY + (x + y) / 2 - z];
  const pt  = (x, y, z = 0) => px(x, y, z).join(',');
  const poly = (list, attrs) =>
    `<polygon points="${list.map(p => pt(p[0], p[1], p[2] || 0)).join(' ')}" ${attrs}/>`;

  const INK = '#2B2B3A';
  const line = (a, b, attrs) => {
    const A = px(...a), B = px(...b);
    return `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" ${attrs}/>`;
  };

  /* An isometric box: top face + the two faces pointing at the viewer. */
  function box(x, y, z, w, d, h, top, right, left, sw) {
    const s = `stroke="${INK}" stroke-width="${sw || 3}" stroke-linejoin="round"`;
    return poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], `fill="${top}" ${s}`)
         + poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], `fill="${right}" ${s}`)
         + poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], `fill="${left}" ${s}`);
  }

  /* Wrap something clickable. `anchor` is where the ✨ hint sits. */
  function hot(id, label, anchor, inner) {
    const a = px(anchor[0], anchor[1], anchor[2] || 0);
    return `<g class="hot" data-open="${id}" tabindex="0" role="button" aria-label="${esc(label)}">
              ${inner}
              <text class="hint" data-hint="${id}" x="${a[0]}" y="${a[1]}"
                    text-anchor="middle" font-size="26">✨</text>
            </g>`;
  }

  /* ---------------------------------------------------------
     SHELL — walls, floor, rug
     --------------------------------------------------------- */
  function shell() {
    let s = '';
    s += poly([[0, 0, 0], [W, 0, 0], [W, 0, H], [0, 0, H]], 'fill="#FFE9C9" stroke="' + INK + '" stroke-width="4"');
    s += poly([[0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H]], 'fill="#FFDCB4" stroke="' + INK + '" stroke-width="4"');
    for (let x = 40; x < W; x += 40) s += line([x, 0, 0], [x, 0, H], 'stroke="#F7D6A8" stroke-width="10"');
    for (let y = 40; y < D; y += 40) s += line([0, y, 0], [0, y, H], 'stroke="#F5CE9C" stroke-width="10"');
    s += poly([[0, 0], [W, 0], [W, D], [0, D]], 'fill="#E8B98A" stroke="' + INK + '" stroke-width="4"');
    for (let y = 40; y < D; y += 40) s += line([0, y], [W, y], 'stroke="#D9A876" stroke-width="3"');
    s += poly([[0, 0, 0], [W, 0, 0], [W, 0, 14], [0, 0, 14]], 'fill="#FFF6E9" stroke="' + INK + '" stroke-width="3"');
    s += poly([[0, 0, 0], [0, D, 0], [0, D, 14], [0, 0, 14]], 'fill="#FFF6E9" stroke="' + INK + '" stroke-width="3"');
    // rug at the foot of the bed, between it and the screen
    s += poly([[105, 30], [300, 30], [300, 135], [105, 135]], 'fill="#7B5CFF" stroke="' + INK + '" stroke-width="4" opacity=".85"');
    s += poly([[128, 48], [277, 48], [277, 117], [128, 117]], 'fill="#9C86FF" stroke="' + INK + '" stroke-width="3"');
    return s;
  }

  /* ---------------------------------------------------------
     RIGHT WALL (y = 0)
     --------------------------------------------------------- */
  const SCR = { x0: 55, x1: 285, z0: 95, z1: 240 };   // the projector screen

  function screenEl() {
    const s = 'stroke="' + INK + '" stroke-width="4"';
    const { x0, x1, z0, z1 } = SCR;
    // roller bar above it
    let g = poly([[x0 - 8, 0, z1 + 4], [x1 + 8, 0, z1 + 4], [x1 + 8, 0, z1 + 16], [x0 - 8, 0, z1 + 16]],
                 `fill="#8E5F32" ${s}`);
    g += poly([[x0, 0, z0], [x1, 0, z0], [x1, 0, z1 + 4], [x0, 0, z1 + 4]], `fill="#F4F1E8" ${s}`);
    g += poly([[x0 + 8, 0, z0 + 8], [x1 - 8, 0, z0 + 8], [x1 - 8, 0, z1 - 4], [x0 + 8, 0, z1 - 4]],
              `fill="#FBFAF5" stroke="${INK}" stroke-width="2" class="screen__face"`);
    // weighted bottom edge
    g += poly([[x0, 0, z0 - 10], [x1, 0, z0 - 10], [x1, 0, z0], [x0, 0, z0]], `fill="#8E5F32" ${s}`);

    /* The poster, sheared onto the wall plane. Points on the wall map as
       sx = 600 + x, sy = 300 + x/2 - z, so the image matrix is (1, .5, 0, 1).
       The box is the whole screen face and the image is centred inside it. */
    const PX0 = x0 + 8, PZ1 = z1 - 4;
    const PW = (x1 - 8) - PX0, PH = PZ1 - (z0 + 8);
    g += `<image id="screenPoster" x="0" y="0" width="${PW}" height="${PH}"
                 preserveAspectRatio="xMidYMid meet"
                 transform="matrix(1 0.5 0 1 ${600 + PX0} ${300 + PX0 / 2 - PZ1})"/>`;
    return hot('movies', 'The screen — everything we have watched', [(x0 + x1) / 2, 0, z1 + 34], g);
  }

  function clocks() {
    const s = 'stroke="' + INK + '" stroke-width="4"';
    let g = '';
    [[CONTENT.you, 340, 'clkYou'], [CONTENT.her, 428, 'clkHer']].forEach(([label, x, id]) => {
      const c = px(x, 0, 185);
      g += `<g>
        <circle cx="${c[0]}" cy="${c[1]}" r="29" fill="#FFF6E9" ${s}/>
        <circle cx="${c[0]}" cy="${c[1]}" r="2.6" fill="${INK}"/>
        <line id="${id}H" x1="${c[0]}" y1="${c[1]}" x2="${c[0]}" y2="${c[1] - 14}" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" transform-origin="${c[0]} ${c[1]}"/>
        <line id="${id}M" x1="${c[0]}" y1="${c[1]}" x2="${c[0]}" y2="${c[1] - 21}" stroke="${INK}" stroke-width="3" stroke-linecap="round" transform-origin="${c[0]} ${c[1]}"/>
        <text x="${c[0]}" y="${c[1] + 45}" text-anchor="middle" font-size="14"
              font-family="Baloo 2,sans-serif" font-weight="700" fill="${INK}">${esc(label)}</text>
      </g>`;
    });
    return hot('clocks', 'Two clocks — us, in numbers', [384, 0, 236], g);
  }

  function mailbox() {
    const s = 'stroke="' + INK + '" stroke-width="4"';
    let g = poly([[296, 0, 38], [372, 0, 38], [372, 0, 96], [296, 0, 96]], `fill="#2EC4B6" ${s}`);
    g += poly([[310, 0, 72], [358, 0, 72], [358, 0, 80], [310, 0, 80]], `fill="#146C64" stroke="${INK}" stroke-width="2.5"`);
    return hot('mail', 'Mail slot — write back to me', [334, 0, 110], g);
  }

  /* ---------------------------------------------------------
     LEFT WALL (x = 0)
     --------------------------------------------------------- */
  function windowEl() {
    const s = 'stroke="' + INK + '" stroke-width="4"';
    let g = poly([[0, 90, 108], [0, 230, 108], [0, 230, 245], [0, 90, 245]], `fill="#F6E4C6" ${s}`);
    g += poly([[0, 99, 116], [0, 221, 116], [0, 221, 237], [0, 99, 237]], `fill="url(#sky)" stroke="${INK}" stroke-width="3"`);
    g += `<g id="skyline">`
       + poly([[0, 106, 116], [0, 124, 116], [0, 124, 180], [0, 106, 180]], 'fill="#4A5878" opacity=".55"')
       + poly([[0, 129, 116], [0, 150, 116], [0, 150, 199], [0, 129, 199]], 'fill="#3E4B68" opacity=".55"')
       + poly([[0, 155, 116], [0, 170, 116], [0, 170, 166], [0, 155, 166]], 'fill="#4A5878" opacity=".55"')
       + poly([[0, 176, 116], [0, 202, 116], [0, 202, 190], [0, 176, 190]], 'fill="#3E4B68" opacity=".55"')
       + poly([[0, 207, 116], [0, 219, 116], [0, 219, 156], [0, 207, 156]], 'fill="#4A5878" opacity=".55"')
       + `</g>`;
    g += line([0, 160, 116], [0, 160, 237], `stroke="${INK}" stroke-width="4"`);
    g += line([0, 99, 177], [0, 221, 177], `stroke="${INK}" stroke-width="4"`);
    return hot('window', 'The window — where we both are', [0, 160, 260], g);
  }

  /* ---------------------------------------------------------
     THE BED — the two of you in it
     --------------------------------------------------------- */
  function bed() {
    const X0 = 132, X1 = 296, Y0 = 150, Y1 = 352;
    let g = '';
    // frame
    g += box(X0, Y0, 0, X1 - X0, Y1 - Y0 - 8, 34, '#B07A4E', '#95643C', '#7D5330');
    // mattress
    g += box(X0 + 6, Y0 + 4, 34, X1 - X0 - 12, Y1 - Y0 - 16, 20, '#FFF6E9', '#EFE1CB', '#E4D3B8');
    // duvet over the two of you
    g += box(X0 + 6, Y0 + 4, 54, X1 - X0 - 12, 142, 13, '#FF7FA4', '#E85C86', '#CE4771');
    // a fold in the duvet
    g += line([X0 + 6, Y0 + 60, 67], [X1 - 6, Y0 + 60, 67], `stroke="#CE4771" stroke-width="3"`);
    // pillow
    g += box(X0 + 16, Y1 - 54, 54, X1 - X0 - 32, 40, 15, '#FFFDF7', '#EFE3D1', '#E4D6BE');

    // the two of you, heads on the pillow, close together
    const heads = [[190, 322, '#3A3550', '#F2C6A0'], [238, 322, '#7A4A2E', '#F7D3B0']];
    heads.forEach(([hx, hy, hair, skin], i) => {
      const c = px(hx, hy, 78);
      g += `<g class="sleeper" style="--i:${i}">
              <ellipse cx="${c[0]}" cy="${c[1]}" rx="17" ry="16" fill="${skin}" stroke="${INK}" stroke-width="3"/>
              <path d="M${c[0] - 17} ${c[1] - 3} a17 16 0 0 1 34 0 q-8 -8 -17 -6 q-9 -2 -17 6 Z"
                    fill="${hair}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
              <path d="M${c[0] - 7} ${c[1] + 3} q2 2 4 0 M${c[0] + 3} ${c[1] + 3} q2 2 4 0"
                    stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
              <path d="M${c[0] - 3} ${c[1] + 9} q3 3 6 0" stroke="${INK}" stroke-width="2"
                    fill="none" stroke-linecap="round"/>
            </g>`;
    });
    // the duvet edge tucked under their chins
    g += poly([[X0 + 6, 296, 67], [X1 - 6, 296, 67], [X1 - 6, 288, 67], [X0 + 6, 288, 67]],
              `fill="#FF9CBB" stroke="${INK}" stroke-width="3"`);

    // headboard last, so it reads as the near edge instead of hiding behind the duvet
    g += box(X0, Y1 - 8, 0, X1 - X0, 8, 56, '#C98F53', '#A9743F', '#8E5F32');

    return `<g id="bed">${g}</g>`;
  }

  /* ---------------------------------------------------------
     THE PROJECTOR — behind the bed, aimed at the screen
     --------------------------------------------------------- */
  const LENS = [172, 378, 84];

  function projector() {
    let g = box(145, 378, 0, 56, 38, 72, '#8E5F32', '#77492A', '#653D22');   // stand
    g += box(149, 380, 72, 46, 30, 24, '#5A5F72', '#454A5C', '#373B4B');      // body
    const l = px(172, 378, 84);
    g += `<circle cx="${l[0]}" cy="${l[1]}" r="9" fill="#FFEFC2" stroke="${INK}" stroke-width="3"/>`;
    g += `<circle id="lensGlow" cx="${l[0]}" cy="${l[1]}" r="5" fill="#FFF6E9"/>`;
    const t = px(172, 392, 96);
    g += `<circle cx="${t[0]}" cy="${t[1]}" r="3" fill="#FF5C8A"/>`;
    return `<g id="projector">${g}</g>`;
  }

  /* The cone of light. Convex hull of the lens plus the screen's far corners. */
  function beam() {
    const { x0, x1, z0, z1 } = SCR;
    const p = [
      px(...LENS),
      px(x0, 0, z1), px(x1, 0, z1), px(x1, 0, z0),
    ];
    return `<polygon id="beam" points="${p.map(q => q.join(',')).join(' ')}"
              fill="url(#beamGrad)" opacity=".34" mask="url(#beamMask)" pointer-events="none"/>`;
  }

  /* ---------------------------------------------------------
     THE REST
     --------------------------------------------------------- */
  /* The desk against the left wall: the letter and the photo album. */
  function desk() {
    const INKW = 'stroke="' + INK + '" stroke-width="3"';
    let g = box(5, 100, 0, 85, 150, 66, '#C98F53', '#A9743F', '#8E5F32');

    // the sealed letter
    const c = px(24, 152, 66);
    g += `<g class="sub" data-open="letter" tabindex="0" role="button" aria-label="A sealed letter">
            <g transform="rotate(-8 ${c[0]} ${c[1]})">
              <rect x="${c[0] - 30}" y="${c[1] - 20}" width="60" height="40" rx="4" fill="#FFF6E9" ${INKW}/>
              <path d="M${c[0] - 30} ${c[1] - 20} L${c[0]} ${c[1] + 1} L${c[0] + 30} ${c[1] - 20}" fill="none" ${INKW}/>
              <circle cx="${c[0]}" cy="${c[1] - 2}" r="9" fill="#FF5C8A" ${INKW}/>
            </g>
          </g>`;

    // a mug, because of course
    const m = px(16, 112, 66);
    g += `<ellipse cx="${m[0]}" cy="${m[1]}" rx="11" ry="6" fill="#2EC4B6" ${INKW}/>
          <path d="M${m[0] - 11} ${m[1]} v-14 a11 6 0 0 0 22 0 v14" fill="#2EC4B6" ${INKW}/>
          <ellipse cx="${m[0]}" cy="${m[1] - 14}" rx="11" ry="6" fill="#7ADED4" ${INKW}/>`;

    // the photo album, propped up
    const a = px(40, 232, 66);
    g += `<g class="sub" data-open="album" tabindex="0" role="button" aria-label="Photo album">
            <rect x="${a[0] - 24}" y="${a[1] - 34}" width="48" height="36" rx="4" fill="#FF5C8A" ${INKW}/>
            <rect x="${a[0] - 18}" y="${a[1] - 28}" width="36" height="24" rx="2" fill="#FFD3E0" stroke="${INK}" stroke-width="2"/>
          </g>`;

    return `<g class="hot hot--split">${g}
              <text class="hint" data-hint="letter" x="${c[0]}" y="${c[1] - 34}" text-anchor="middle" font-size="24">✨</text>
              <text class="hint" data-hint="album"  x="${a[0]}" y="${a[1] - 46}" text-anchor="middle" font-size="24">✨</text>
            </g>`;
  }

  /* A wrapped present, ribbon and bow. */
  function gift() {
    const X = 352, Y = 382, W_ = 86, D_ = 64, H_ = 62;
    const cx = X + W_ / 2, cy = Y + D_ / 2, band = 6;
    const sw = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;

    let g = box(X, Y, 0, W_, D_, H_, '#FF7FA4', '#E85C86', '#CE4771');

    // ribbon over the top and down the two faces the viewer can see
    g += poly([[cx - band, Y, H_], [cx + band, Y, H_], [cx + band, Y + D_, H_], [cx - band, Y + D_, H_]],
              `fill="#FFC93C" ${sw}`);
    g += poly([[X, cy - band, H_], [X + W_, cy - band, H_], [X + W_, cy + band, H_], [X, cy + band, H_]],
              `fill="#FFC93C" ${sw}`);
    g += poly([[cx - band, Y + D_, 0], [cx + band, Y + D_, 0], [cx + band, Y + D_, H_], [cx - band, Y + D_, H_]],
              `fill="#E8A400" ${sw}`);
    g += poly([[X + W_, cy - band, 0], [X + W_, cy + band, 0], [X + W_, cy + band, H_], [X + W_, cy - band, H_]],
              `fill="#F0B520" ${sw}`);

    // the bow, sitting where the ribbons cross
    const b = px(cx, cy, H_);
    g += `<g class="gift__bow">
            <ellipse cx="${b[0] - 15}" cy="${b[1] - 12}" rx="13" ry="9"
                     fill="#FFC93C" ${sw} transform="rotate(-24 ${b[0] - 15} ${b[1] - 12})"/>
            <ellipse cx="${b[0] + 15}" cy="${b[1] - 12}" rx="13" ry="9"
                     fill="#FFC93C" ${sw} transform="rotate(24 ${b[0] + 15} ${b[1] - 12})"/>
            <path d="M${b[0] - 4} ${b[1] - 4} l-11 14 M${b[0] + 4} ${b[1] - 4} l11 14"
                  stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <circle cx="${b[0]}" cy="${b[1] - 8}" r="7" fill="#FFE07A" ${sw}/>
          </g>`;

    return hot('gift', 'A present, for you', [cx, cy, H_ + 46], g);
  }

  function catBed() {
    const c = px(390, 180, 0);
    return `<g id="catbed">
              <ellipse cx="${c[0]}" cy="${c[1]}" rx="62" ry="34" fill="#2EC4B6" stroke="${INK}" stroke-width="4"/>
              <ellipse cx="${c[0]}" cy="${c[1] - 4}" rx="45" ry="24" fill="#7ADED4" stroke="${INK}" stroke-width="3"/>
            </g>`;
  }

  function bowl() {
    const c = px(428, 300, 0);
    return `<g class="hot" data-open="__feed" tabindex="0" role="button" aria-label="Luna's food bowl">
              <ellipse cx="${c[0]}" cy="${c[1]}" rx="32" ry="17" fill="#FF5C8A" stroke="${INK}" stroke-width="4"/>
              <ellipse id="kibble" cx="${c[0]}" cy="${c[1] - 3}" rx="21" ry="10" fill="#8E5F32" stroke="${INK}" stroke-width="3"/>
            </g>`;
  }

  function mouse() {
    const c = px(350, 345, 0);
    return `<g class="hot" id="toy" data-open="__play" tabindex="0" role="button" aria-label="Toy mouse">
              <ellipse cx="${c[0]}" cy="${c[1]}" rx="17" ry="11" fill="#C9C2E8" stroke="${INK}" stroke-width="3"/>
              <circle cx="${c[0] - 13}" cy="${c[1] - 4}" r="7" fill="#C9C2E8" stroke="${INK}" stroke-width="3"/>
              <path d="M${c[0] + 15} ${c[1] - 2} q18 -4 12 -18" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
              <circle cx="${c[0] - 16}" cy="${c[1] - 5}" r="1.8" fill="${INK}"/>
            </g>`;
  }

  function plant() {
    let g = box(380, 12, 0, 44, 40, 40, '#FFC93C', '#E0A81F', '#C29018');
    const c = px(402, 32, 40);
    g += `<path d="M${c[0]} ${c[1]} q-34 -18 -26 -52 q22 8 26 52" fill="#2EC4B6" stroke="${INK}" stroke-width="3"/>
          <path d="M${c[0]} ${c[1]} q34 -18 26 -52 q-22 8 -26 52" fill="#37D8C9" stroke="${INK}" stroke-width="3"/>
          <path d="M${c[0]} ${c[1]} q4 -40 -2 -60 q10 20 8 60" fill="#2EC4B6" stroke="${INK}" stroke-width="3"/>`;
    return g;
  }

  function secret() {
    const c = px(150, 100, 0);
    return `<g class="hot secret" id="secret" data-open="secret" tabindex="0" role="button"
               aria-label="Something under the rug" hidden>
              <g transform="rotate(-14 ${c[0]} ${c[1]})">
                <rect x="${c[0] - 24}" y="${c[1] - 16}" width="48" height="32" rx="3" fill="#FFF6E9" stroke="${INK}" stroke-width="3"/>
                <line x1="${c[0] - 15}" y1="${c[1] - 6}" x2="${c[0] + 15}" y2="${c[1] - 6}" stroke="${INK}" stroke-width="2"/>
                <line x1="${c[0] - 15}" y1="${c[1] + 2}" x2="${c[0] + 8}"  y2="${c[1] + 2}" stroke="${INK}" stroke-width="2"/>
              </g>
              <text class="hint" data-hint="secret" x="${c[0]}" y="${c[1] - 30}" text-anchor="middle" font-size="24">✨</text>
            </g>`;
  }

  /* ---------------------------------------------------------
     BUILD
     --------------------------------------------------------- */
  function build() {
    $('#scene').innerHTML = `
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop id="skyTop" offset="0%" stop-color="#8FD3FF"/>
          <stop id="skyBot" offset="100%" stop-color="#FFE3A3"/>
        </linearGradient>
        <linearGradient id="beamGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stop-color="#FFF3C4" stop-opacity=".95"/>
          <stop offset="100%" stop-color="#FFF9E6" stop-opacity=".35"/>
        </linearGradient>
        <mask id="beamMask">
          <rect x="0" y="0" width="1200" height="820" fill="#fff"/>
          ${poly([[SCR.x0, 0, SCR.z0], [SCR.x1, 0, SCR.z0],
                  [SCR.x1, 0, SCR.z1 + 4], [SCR.x0, 0, SCR.z1 + 4]], 'fill="#000"')}
        </mask>
        <clipPath id="roomClip">
          ${poly([[0, 0, 0], [W, 0, 0], [W, 0, H], [0, 0, H]], '')}
          ${poly([[0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H]], '')}
          ${poly([[0, 0], [W, 0], [W, D], [0, D]], '')}
        </clipPath>
      </defs>
      <g id="shell">${shell()}</g>
      <g id="walls">${screenEl()}${clocks()}${mailbox()}${windowEl()}</g>
      <g id="stuff">
        ${desk()}${secret()}${bed()}${plant()}${catBed()}
        ${projector()}${bowl()}${mouse()}${gift()}
      </g>
      <g id="lunaLayer"></g>
      <rect id="tint" x="0" y="0" width="1200" height="820" fill="#2B2B6A" opacity="0"
            clip-path="url(#roomClip)" pointer-events="none"/>
      ${beam()}
    `;
    cycleTitle();
    setInterval(cycleTitle, 7000);
    // real posters arrive later if a TMDB key is set; repaint as they land
    Posters.hydrate(() => paintScreen());
  }

  /* what the screen is "playing" right now */
  let titleIdx = -1;
  function paintScreen() {
    const films = Posters.all();
    const art = $('#screenPoster');
    if (!art || !films.length) return;
    Posters.bind(art, films[titleIdx]);
  }
  function cycleTitle() {
    const films = Posters.all();
    if (!films.length) return;
    titleIdx = (titleIdx + 1) % films.length;
    paintScreen();
  }

  /* ---------------------------------------------------------
     LIVE: wall clocks + daylight, driven by her real local time
     --------------------------------------------------------- */
  function hourIn(tz, d) {
    return +d.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }) % 24;
  }

  function setClock(id, tz, d) {
    const h = +d.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }) % 12;
    const m = +d.toLocaleString('en-US', { timeZone: tz, minute: 'numeric' });
    const H = $('#' + id + 'H'), M = $('#' + id + 'M');
    if (H) H.setAttribute('transform', `rotate(${h * 30 + m * 0.5})`);
    if (M) M.setAttribute('transform', `rotate(${m * 6})`);
  }

  const SKY = [
    [0,  '#1B2A5B', '#33306B', .42],
    [5,  '#4E5C9E', '#F0A07A', .22],
    [8,  '#8FD3FF', '#FFE3A3', 0],
    [17, '#F79A6B', '#FFD59E', .10],
    [20, '#3D4A85', '#7A5C9E', .30],
    [22, '#1B2A5B', '#33306B', .42],
  ];

  function paintLight() {
    const d = new Date();
    setClock('clkYou', CONTENT.cities.you.tz, d);
    setClock('clkHer', CONTENT.cities.her.tz, d);

    const h = hourIn(CONTENT.cities.her.tz, d);
    let band = SKY[0];
    for (const b of SKY) if (h >= b[0]) band = b;
    $('#skyTop').setAttribute('stop-color', band[1]);
    $('#skyBot').setAttribute('stop-color', band[2]);
    $('#tint').setAttribute('opacity', band[3]);
    // the beam reads brighter once the room goes dark
    const beamEl = $('#beam');
    if (beamEl) beamEl.setAttribute('opacity', (0.3 + band[3] * 0.85).toFixed(2));
  }

  return { build, paintLight, px, hourIn, W, D, H };
})();
