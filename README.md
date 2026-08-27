# Luna's Room 🐈‍⬛

An interactive room built for Chelsea. She opens the door, walks into an
isometric room, and clicks things: the projector screen, the letter on the
desk, the photo album, the clocks, the suitcase, the mail slot, the window.
There's a bed with the two of you in it and a projector behind it throwing a
beam across the room. Luna lives here and gets hungry in real time.

Matt is in the Bay Area, Chelsea is in New York — the room runs on Chelsea's
clock, so it's daylight in here when it's daylight for her, and Luna sleeps
when she does.

## Run it locally

```bash
python3 -m http.server 5555 --directory .
```

Then open <http://localhost:5555>.

## Editing it

**Everything personal lives in one file: [`content/content.js`](content/content.js).**
Names, dates, photos, the letter, Luna's lines, the reasons. Change the text
between the quotes — nothing else in the project needs touching.

Search that file for `⚠️ PLACEHOLDER` to find every spot still waiting on you.

### Photos

Bring them in with the import script — it resizes, compresses, converts HEIC,
and updates `content.js` for you:

```bash
bash tools/import-photos.sh gallery ~/Desktop/our-photos
bash tools/import-photos.sh luna    ~/Desktop/luna-photos
bash tools/import-photos.sh avatar  ~/Desktop/luna-yelling.jpg
```

| Mode | Goes to | Used by |
|---|---|---|
| `gallery` | `images/gallery/01.jpg`, `02.jpg`, … | the photo album |
| `luna` | `images/luna/01.jpg`, … | Luna's own page |
| `avatar` | `images/luna/avatar.jpg` | her portrait in the status bar |

Files are numbered in **sorted filename order**, so name them `01`, `02`, `03`
if you want a specific order. Re-running `gallery` keeps whatever captions you
have already written, matching them up by position — so import first, then
write the captions, then you can re-import freely.

Captions live in `movies`-style entries in `content.js`:

```js
{ img: "images/gallery/01.jpg", caption: "N Seoul Tower" },
```

**Nothing breaks while a photo is missing.** Any image the site can't load is
replaced with a designed card carrying its caption, so the album and Luna's
page always look finished.

The status-bar portrait keeps her mood: the photo becomes a circle and the
mood emoji sits on it as a small badge. Without `luna.avatar`, it falls back to
the plain emoji.

### Posters

All 16 titles already have real artwork in `images/posters/`, pulled from
TMDB. They're committed to the repo, so the site works offline and doesn't
depend on anyone else's server staying up. Keep the site private/unlisted.

**Adding a title.** Put it in `movies.list`. If you give it a `poster`, that
file is used:

```js
{ title: "Something New", year: 2026, poster: "images/posters/something-new.jpg" },
```

Portrait 2:3 crops look best — the ones in there are 500x750.

**Without a `poster` field**, the site falls back in this order: a poster
remembered from TMDB (only if you've set `movies.tmdbKey` — free key from
<https://www.themoviedb.org>, Settings → API), then a generated placeholder
card with the title and year. So a new title is never broken, just plainer
until you drop an image in.

If a poster ever fails to load, the page swaps it for the placeholder rather
than showing a broken-image icon.

### Optional extras

- **Music** — put an `.mp3` in `audio/` and set `music:` in `content.js`.
- **Luna's meow** — save a clip as `audio/meow.mp3`; without one the site
  synthesizes a meow in the browser.
- **The watchlist** — `movies.list` is what the projector screen cycles
  through, poster and all. Add to it as you watch more; `movies.andTheRest`
  is the unnumbered line at the bottom.
- **A passcode on the door** — set `reveal.passcode` to four digits.
  It gates the door, but it lives in the page source and the files under
  `images/` are reachable directly, so treat it as a doorbell, not a lock.
- **Her reply reaching you** — make a free form at <https://formspree.io> and
  paste the URL into `close.formspreeURL`. Left blank, the reply box still
  works, it just doesn't send anywhere.

## How Luna works

Her hunger and happiness decay in **real time** and are saved in the browser's
`localStorage`, so if Chelsea comes back in three days Luna is genuinely needy.
She sleeps when it's actually night **in Chelsea's timezone**, and the room's
light follows the same clock. Pet her 15 times and she'll show you what's under
the rug.

She'll also climb onto your bed and curl up next to the two of you, and get
down again before wandering off.

Saved state lives under `luna.state.v1`, `movies.starred.v1` and
`room.seen.v1`. Clearing site data resets all of it.

## Deploying

It's a static site — no build step, no server.

- **Netlify**: drag this folder onto <https://app.netlify.com/drop>.
- **GitHub Pages**: push it and enable Pages on the branch.
- **Vercel**: `vercel --prod` from this folder.

## Layout

```
index.html            the room + door + modal shell
content/content.js    ← the only file you edit
css/styles.css        room, HUD, modals
css/animations.css    keyframes, Luna's poses
js/app.js             helpers: modal, confetti, hearts, purr/meow
js/room.js            builds the isometric room as SVG; daylight + wall clocks
js/posters.js         resolves a poster per title (yours / TMDB / placeholder)
tools/import-photos.sh  resize + import your photos, updates content.js
js/panels.js          what each object opens
js/luna.js            Luna: wandering, moods, hunger, sleep
js/main.js            the door, then wires the room up
_old_scroll_version/  the earlier scroll-page build, kept for reference
```

## After you edit something

The `?v=1` on the `<script>` and `<link>` tags in `index.html` is a cache
buster. If you change a file and the site still shows the old version, bump
every `?v=1` to `?v=2` and reload.
