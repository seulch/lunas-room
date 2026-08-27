/* =============================================================
   CONTENT.JS  —  ✏️  THIS IS THE ONLY FILE YOU NEED TO EDIT.
   Everything personal lives here: names, dates, photos, the
   letter, Luna's facts, and the reasons. Change text between
   the quotes. Don't touch anything else in the project.
   ============================================================= */

const CONTENT = {

  /* ---------- 1. THE BASICS ---------------------------------- */
  her:  "Chelsea",
  you:  "Matt",               // your name: the letter signature and the clocks
  tabTitle: "For Chelsea 💛",

  /* ---------- 2. THE DATES (YYYY-MM-DD) ---------------------- */
  dates: {
    together:    "2022-10-08", // the day you started dating
  },

  /* ---------- 3. THE TWO CITIES ------------------------------ */
  cities: {
    you: { label: "Bay Area", tz: "America/Los_Angeles", emoji: "🌉" },
    her: { label: "New York", tz: "America/New_York",   emoji: "🗽" },
  },

  /* ---------- 4. THE FRONT DOOR ------------------------------ */
  reveal: {
    tease:    "Somebody's waiting for you.",
    button:   "Come in",
    // Four digits to get in. Leave "" for no lock.
    passcode: "0826",
    hint:     "four digits, MMDD",
  },

  /* ---------- 5. POLAROID WALL ------------------------------- */
  /* Photos live in images/gallery/. To add or replace them, run:
       bash tools/import-photos.sh gallery ~/path/to/your/photos
     Captions are optional — leave them "" and the polaroid is just
     the photo. Anything you do write is kept when you re-import.  */
  gallery: [
    { img: "images/gallery/01.jpg", caption: "" },
    { img: "images/gallery/02.jpg", caption: "" },
    { img: "images/gallery/03.jpg", caption: "" },
    { img: "images/gallery/04.jpg", caption: "" },
    { img: "images/gallery/05.jpg", caption: "" },
    { img: "images/gallery/06.jpg", caption: "" },
    { img: "images/gallery/07.jpg", caption: "" },
    { img: "images/gallery/08.jpg", caption: "" },
    { img: "images/gallery/09.jpg", caption: "" },
    { img: "images/gallery/10.jpg", caption: "" },
    { img: "images/gallery/11.jpg", caption: "" },
    { img: "images/gallery/12.jpg", caption: "" },
    { img: "images/gallery/13.jpg", caption: "" },
    { img: "images/gallery/14.jpg", caption: "" },
    { img: "images/gallery/15.jpg", caption: "" },
    { img: "images/gallery/16.jpg", caption: "" },
    { img: "images/gallery/17.jpg", caption: "" },
    { img: "images/gallery/18.jpg", caption: "" },
    { img: "images/gallery/19.jpg", caption: "" },
    { img: "images/gallery/20.jpg", caption: "" },
  ],

  /* ---------- 6. THE LETTER ---------------------------------- */
  /* One string per paragraph. It types itself out, so keep the
     paragraphs reasonably short — long walls of text drag.      */
  letter: {
    heading:    "Happy Birthday Chelsea <3",
    salutation: "Happy Birthday Chelsea!!!",
    paragraphs: [
      "Tried something different this year, Hope you like this lil website :)\nIf you wanted a physical card.. too bad babe this is it hehe",
      "It’s almost our four year mark and every bit of it was amazing with you in it. Thank you for being so supportive throughout this whole thing and I really can’t imagine my life without you anymore. I CANNOT wait to come back to you and luna.",
      "Crazy to think that I met you when you were a teenager and now you have a full time job, driving to work and catching bugs by yourself and all.. lil princess grew up so quick",
      "I miss you so much and I can’t wait to move back in with you and Luna :) I’m gonna try my absolute best to come back to you soon",
      "I gotchu what I thought you would want most for your gift but of course you had to guess right and ruin the surprise.. Click the giftbox to check out what it is",
      "Thanks for being the best cutest sexiest girlfriend ever babe Happy Birthday <3",
    ],
    // Leave signoff "" and only your name is signed, as "-Matt".
    signoff: "",
  },

  /* ---------- 7. LUNA ---------------------------------------- */
  luna: {
    name: "Luna",
    // The little portrait in the status bar. Her mood emoji sits on it as a badge.
    avatar: "images/luna/avatar.jpg",
    // Click her and she says one of these.
    facts: [
      "⚠️ PLACEHOLDER — a very specific Luna fact.",
      "She has opinions about the vacuum.",
      "3 a.m. is her hour and she will not negotiate.",
      "Sits exactly on whatever you're reading.",
      "Nebelung means 'creature of the mist'. She's grey and dramatic. Checks out.",
      "Loves you more. I've made peace with it.",
    ],
    // Shown once she trusts you enough (15 pets).
    secret: "⚠️ PLACEHOLDER — hide something here. A promise, an inside joke, a plan.",
    // What she says when you feed / play with / wake her.
    says: {
      fed:    ["finally.", "acceptable.", "more.", "you may stay."],
      played: ["AGAIN", "got it. got it. got it.", "this is my job now"],
      pet:    ["*purr*", "keep going", "you may continue", "mrrrp"],
      asleep: ["...", "zzz", "do not perceive me"],
      hungry: ["I am WASTING AWAY", "the bowl. look at it.", "it's been HOURS"],
      sad:    ["where were you", "I waited by the door", "hmph"],
    },
  },

  /* ---------- 8. THE WATCHLIST ------------------------------ */
  /* What the projector screen plays. Add to it as you watch more.
     Posters: see POSTERS below — you get real ones either by pasting a
     free TMDB key, or by dropping files into images/posters/.          */
  movies: {
    heading: "Everything we've watched",

    /* --- POSTERS -------------------------------------------------
       Option A (easiest, real posters for everything):
         1. Make a free account at https://www.themoviedb.org
         2. Settings → API → request an API key (v3 auth, instant)
         3. Paste it here. The site looks each title up once and
            remembers the poster, so it only ever fetches once.
       Option B (no account, full control):
         Drop an image in images/posters/ and add a "poster" field to
         that title below. This always wins over TMDB.
       With neither, every title gets a designed placeholder card.     */
    tmdbKey: "",

    /* A title can be a plain string, or an object when you want to pin
       the year (helps TMDB find remakes) or supply your own image:
         "Umma",
         { title: "Terrifier", year: 2016 },
         { title: "Umma", poster: "images/posters/umma.jpg" },        */
    list: [
      { title: "Umma",                       year: 2022, poster: "images/posters/umma.jpg" },
      { title: "Terrifier",                  year: 2018, poster: "images/posters/terrifier.jpg" },
      { title: "Game of Thrones",            year: 2011, poster: "images/posters/game-of-thrones.jpg" },
      { title: "Moon Lovers: Scarlet Heart", year: 2016, poster: "images/posters/moon-lovers.jpg" },
      { title: "Culinary Class Wars",        year: 2024, poster: "images/posters/culinary-class-wars.jpg" },
      { title: "Alice in Borderland",        year: 2020, poster: "images/posters/alice-in-borderland.jpg" },
      { title: "Singles Inferno",            year: 2021, poster: "images/posters/singles-inferno.jpg" },
      { title: "The Devil's Plan",           year: 2023, poster: "images/posters/devils-plan.jpg" },
      { title: "Demon Slayer",               year: 2019, poster: "images/posters/demon-slayer.jpg" },
      { title: "Beef",                       year: 2023, poster: "images/posters/beef.jpg" },
      { title: "The East Palace",            year: 2026, poster: "images/posters/east-palace.jpg" },
      { title: "Bloodhounds",                year: 2023, poster: "images/posters/bloodhounds.jpg" },
      { title: "Texas Chainsaw Massacre",    year: 2003, poster: "images/posters/texas-chainsaw-massacre.jpg" },
      { title: "Badly in Love",              year: 2025, poster: "images/posters/badly-in-love.jpg" },
      { title: "Day Shift",                  year: 2022, poster: "images/posters/day-shift.jpg" },
      { title: "M3GAN 2.0",                  year: 2025, poster: "images/posters/m3gan-2.jpg" },
    ],

    // The unnumbered last line, in its own box at the bottom.
    andTheRest: "...and all the horror movies I can't remember the names of",
  },

  /* ---------- 9. THE PRESENT --------------------------------- */
  /* What the box in the corner opens. Leave heading/note as "" and
     it's just the photo, like the album.                          */
  gift: {
    heading: "",
    photo:   "images/gift/01.jpg",
    note:    "",
  },

  /* ---------- 10. THE CLOSING -------------------------------- */
  close: {
    replyPrompt: "Say something back 💌",
    replyPlaceholder: "Type here...",
    // Optional: make the reply box actually send to you.
    // Sign up free at https://formspree.io, paste your form URL here.
    // Leave "" and the message just shows a sweet confirmation instead.
    formspreeURL: "",
  },

  /* ---------- 11. MUSIC (optional) --------------------------- */
  // Drop an mp3 in /audio and put its filename here, e.g. "audio/our-song.mp3"
  music: "",
};
