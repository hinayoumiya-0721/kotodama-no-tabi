/* 《言霊の旅》Service Worker：讓遊戲可以安裝成 App 並離線遊玩。
 * - 同網域的檔案一律「網路優先」：有網路時永遠拿最新版，離線或網路太慢時才用快取。
 * - Google Fonts 用「先給快取、背景更新」。
 * - 首次安裝時預先快取 PRECACHE 裡的全部檔案（約 4 MB），之後完全離線也能玩。
 */

// <precache> 由 tools/gen-sw-precache.js 產生，請勿手動編輯
const CACHE_VERSION = 'dabad739de0a';
const PRECACHE = [
  "./",
  "assets/app/icon-180.png",
  "assets/app/icon-192.png",
  "assets/app/icon-32.png",
  "assets/app/icon-512.png",
  "assets/icons/amulet.svg",
  "assets/icons/armor.svg",
  "assets/icons/book.svg",
  "assets/icons/campfire.svg",
  "assets/icons/charm.svg",
  "assets/icons/check.svg",
  "assets/icons/chest.svg",
  "assets/icons/cloak.svg",
  "assets/icons/coin.svg",
  "assets/icons/elixir.svg",
  "assets/icons/eye.svg",
  "assets/icons/fan.svg",
  "assets/icons/gear.svg",
  "assets/icons/heart.svg",
  "assets/icons/herb.svg",
  "assets/icons/house.svg",
  "assets/icons/lock.svg",
  "assets/icons/lute.svg",
  "assets/icons/mana.svg",
  "assets/icons/map.svg",
  "assets/icons/music.svg",
  "assets/icons/person.svg",
  "assets/icons/ring.svg",
  "assets/icons/robe.svg",
  "assets/icons/save.svg",
  "assets/icons/scroll.svg",
  "assets/icons/skull.svg",
  "assets/icons/sparkle.svg",
  "assets/icons/speaker.svg",
  "assets/icons/staff.svg",
  "assets/icons/star.svg",
  "assets/icons/sword.svg",
  "assets/icons/torii.svg",
  "assets/icons/turtle.svg",
  "assets/monsters/boss_r1_golem.webp",
  "assets/monsters/boss_r2_knight.webp",
  "assets/monsters/boss_r3_kabuki.webp",
  "assets/monsters/boss_r4_serpent.webp",
  "assets/monsters/boss_r5_chancellor.webp",
  "assets/monsters/boss_r6_overlord.webp",
  "assets/monsters/en_r1_crow.webp",
  "assets/monsters/en_r1_slime.webp",
  "assets/monsters/en_r2_wisp.webp",
  "assets/monsters/en_r2_wolf.webp",
  "assets/monsters/en_r3_puppet.webp",
  "assets/monsters/en_r3_tanuki.webp",
  "assets/monsters/en_r4_gargoyle.webp",
  "assets/monsters/en_r4_harpy.webp",
  "assets/monsters/en_r5_automaton.webp",
  "assets/monsters/en_r5_phantom.webp",
  "assets/monsters/en_r6_archon.webp",
  "assets/monsters/en_r6_voidling.webp",
  "assets/portraits/hero_bard.webp",
  "assets/portraits/hero_scholar.webp",
  "assets/portraits/hero_swordsman.webp",
  "assets/portraits/npc_guide.png",
  "assets/portraits/npc_mayor.webp",
  "assets/portraits/npc_merchant.webp",
  "assets/portraits/npc_priest.webp",
  "assets/portraits/npc_scholar.webp",
  "audio.js",
  "data.js",
  "data/questions/jlpt-n1.js",
  "data/questions/jlpt-n2.js",
  "data/questions/jlpt-n3.js",
  "data/questions/listening.js",
  "data/questions/r1.js",
  "data/questions/r2.js",
  "data/questions/r3.js",
  "data/questions/r4.js",
  "data/questions/r5.js",
  "data/questions/r6.js",
  "index.html",
  "js/battle.js",
  "js/core.js",
  "js/drill-faq-pwa.js",
  "js/explore.js",
  "js/jobs.js",
  "js/main.js",
  "js/menus.js",
  "js/reading-shrine.js",
  "js/save-ui.js",
  "js/state.js",
  "js/town.js",
  "js/ui.js",
  "manifest.webmanifest",
  "pixel-theme.css",
  "style.css",
  "svg_art.js"
];
// </precache>

const CACHE_NAME = `kotodama-${CACHE_VERSION}`;
const FONT_CACHE = 'kotodama-fonts';
const NETWORK_TIMEOUT_MS = 5000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('kotodama-') && k !== CACHE_NAME && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req));
  }
});

function fetchWithTimeout(req) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS);
    fetch(req).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetchWithTimeout(req);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(FONT_CACHE);
  const hit = await cache.match(req);
  const update = fetch(req)
    .then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return hit || (await update) || Response.error();
}
