const CACHE_NAME = "exchange-v3"; // 버전 올릴 때마다 숫자 증가 → 구 캐시 자동 삭제
const STATIC = [
  "./manifest.json",
  "./icon.svg"
  // index.html은 항상 네트워크 우선으로 처리 (아래 fetch 핸들러 참고)
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // ── index.html: 네트워크 우선 → 오프라인 시 캐시 fallback ──
  if (url.pathname === "/" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/CAL/")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ── 환율 API: 네트워크 우선 ──
  if (url.hostname === "open.er-api.com" || url.hostname === "api.frankfurter.app") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // ── CDN 라이브러리 (Chart.js, Tesseract.js, Supabase): 캐시 우선 ──
  if (url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const res = await fetch(e.request);
        cache.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }

  // ── 나머지: 캐시 우선, 없으면 네트워크 ──
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
