// 너의 교수님은? 서비스워커 — 설치 가능 조건(fetch 핸들러) 충족 + 앱 셸 오프라인 폴백
const CACHE = "nyp-shell-v5";
// 침묵 구조대는 면담 중 인터넷 없이 열려야 하므로 셸에 미리 담아 둡니다(AC-006).
const SHELL = ["/", "/research", "/quest", "/quest/silence-rescue"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 외부 요청은 통과
  if (url.pathname.startsWith("/api/")) return; // API는 항상 네트워크

  // 페이지 이동: 네트워크 우선, 실패 시 캐시/홈으로 폴백
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/"))),
    );
    return;
  }

  // 그 외 정적 리소스: 캐시 우선, 없으면 네트워크에서 받아 오면서 저장
  //
  // 셸 HTML만 캐시하면 오프라인에서 앱 번들을 못 받아 화면이 비어 버린다.
  // 침묵 구조대가 면담 중에 열리려면 _next/static의 청크도 함께 있어야 한다.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const cacheable =
          response.ok &&
          (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/"));
        if (cacheable) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      });
    }),
  );
});
