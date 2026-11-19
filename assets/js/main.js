(function () {
  var S = window.NAVIG_SITE || {};
  var root = document.documentElement;

  // 1) 기본 정보 바인딩
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, S);
  }
  document.querySelectorAll("[data-site]").forEach(function (el) {
    var v = get(el.getAttribute("data-site"));
    if (v) el.textContent = v;
  });
  document.querySelectorAll("[data-site-href]").forEach(function (el) {
    var key = el.getAttribute("data-site-href");
    var v = get(key);
    if (!v) return;
    if (key === "email") v = "mailto:" + v;
    else if (key === "tel") v = "tel:" + v.replace(/-/g, "");
    el.setAttribute("href", v);
  });

  // 2) 구조화 데이터
  if (S.url) {
    var ld = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": S.url + "/#organization",
      "name": S.nameKo + " (" + S.nameEn + ")",
      "alternateName": [S.nameEn, "NAVIG Corp.", S.nameKo],
      "slogan": "Content, Engineered.",
      "url": S.url + "/",
      "logo": S.url + "/assets/img/logo-navig-black.png",
      "email": S.email,
      "telephone": S.telIntl,
      "address": { "@type": "PostalAddress", "streetAddress": S.address.street, "addressLocality": S.address.locality, "addressRegion": S.address.region, "addressCountry": S.address.country },
      "sameAs": [S.service, "https://blog.naver.com/navigcorp"]
    };
    var tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);
  }

  // 3) 언어 전환 (KOR / ENG)
  function setLang(lang) {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang === "en" ? "en" : "ko");
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === lang ? "true" : "false");
    });
    try { localStorage.setItem("navig-lang", lang); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem("navig-lang"); } catch (e) {}
  var q = new URLSearchParams(location.search).get("lang");
  setLang(q === "en" || q === "ko" ? q : (saved || "ko"));
  document.querySelectorAll("[data-set-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); });
  });

  // 4) 헤더: 스크롤하면 흰 배경과 구분선
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 5) 모바일 메뉴
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 6) 스크롤 등장
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduce) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  }

  // 7) 히어로 영상: 화면 밖이면 멈춰서 배터리·데이터 절약
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { heroVideo.play().catch(function () {}); } else { heroVideo.pause(); } });
    }, { threshold: 0.05 }).observe(heroVideo);
  }

  // 8) Work: 카테고리 필터 + 숫자 + 미리보기(데스크톱 마우스 오버, 터치 기기는 화면 중앙에 오면 재생)
  var cards = Array.prototype.slice.call(document.querySelectorAll(".wk"));
  var clientSet = {};
  cards.forEach(function (c) { clientSet[c.getAttribute("data-client-key")] = 1; });
  document.querySelectorAll('[data-count="projects"]').forEach(function (el) { el.textContent = cards.length; });
  document.querySelectorAll('[data-count="clients"]').forEach(function (el) { el.textContent = Object.keys(clientSet).length; });
  var chips = document.querySelectorAll("[data-filter]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      cards.forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-cat") === f); });
    });
  });
  function play(card) {
    var v = card.querySelector("video"); if (!v) return;
    if (!v.src) v.src = v.dataset.preview;
    v.play().then(function () { card.classList.add("is-playing"); }).catch(function () {});
  }
  function stop(card) {
    var v = card.querySelector("video"); if (!v) return;
    card.classList.remove("is-playing"); v.pause();
    try { v.currentTime = 0; } catch (e) {}
  }
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var withVideo = cards.filter(function (c) { return c.querySelector("video"); });
  if (canHover) {
    withVideo.forEach(function (c) {
      c.addEventListener("mouseenter", function () { play(c); });
      c.addEventListener("mouseleave", function () { stop(c); });
    });
  } else if ("IntersectionObserver" in window && !reduce) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.intersectionRatio >= 0.9) play(e.target); else stop(e.target); });
    }, { threshold: [0, 0.9] });
    withVideo.forEach(function (c) { vio.observe(c); });
  }

  // 9) 재생 모달 (본편 YouTube 링크가 정해지면 data-youtube 속성으로 교체 예정)
  var player = document.querySelector(".player");
  var pv = player && player.querySelector("video");
  var lastFocus = null;
  function openPlayer(el) {
    if (!player) return;
    lastFocus = document.activeElement;
    player.querySelector("[data-player-title]").textContent = el.getAttribute("data-title") || "";
    player.querySelector("[data-player-client]").textContent = el.getAttribute("data-client") || "";
    player.classList.toggle("is-vertical", el.hasAttribute("data-vertical"));
    var src = el.getAttribute("data-src");
    pv.poster = el.getAttribute("data-poster") || "";
    if (src) { pv.src = src; pv.controls = true; } else { pv.removeAttribute("src"); pv.controls = false; }
    player.querySelector(".player-note").textContent = src
      ? "[유튜브 링크 필요] 본편 링크가 정해지면 이 자리에 YouTube 플레이어로 연결합니다. 지금은 미리보기 클립을 재생합니다."
      : "[유튜브 링크 필요] 본편 링크가 정해지면 이 자리에서 바로 재생됩니다.";
    player.hidden = false;
    document.body.style.overflow = "hidden";
    if (heroVideo) heroVideo.pause();
    pv.play().catch(function () {});
    player.querySelector(".player-close").focus();
  }
  function closePlayer() {
    if (!player || player.hidden) return;
    pv.pause(); pv.removeAttribute("src"); pv.load();
    player.hidden = true;
    document.body.style.overflow = "";
    if (heroVideo) heroVideo.play().catch(function () {});
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll("[data-open-player]").forEach(function (el) {
    el.addEventListener("click", function () { openPlayer(el); });
    if (el.tagName !== "BUTTON") {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPlayer(el); } });
    }
  });
  if (player) {
    player.querySelector(".player-close").addEventListener("click", closePlayer);
    player.addEventListener("click", function (e) { if (e.target === player) closePlayer(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePlayer(); });
  }

  // 10) Newsroom: data/newsroom.json(GitHub Actions가 블로그 RSS로 갱신)을 읽어 최신 글로 교체.
  //     실패하면 HTML에 들어 있는 글을 그대로 보여줍니다.
  var newsroom = document.querySelector("[data-newsroom]");
  var CAT = { "인사이트": "Insight", "비하인드 더 씬": "Behind the Scene", "나빅소식": "News" };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function render(list, posts) {
    if (!list || !posts || !posts.length) return;
    list.innerHTML = posts.slice(0, 4).map(function (p) {
      return '<li><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
        '<time datetime="' + esc(p.date) + '">' + esc(p.date.replace(/-/g, ".")) + "</time>" +
        '<span class="n-cat">' + esc(CAT[p.category] || p.category || "") + "</span>" +
        '<span class="n-title">' + esc(p.title) + "</span>" +
        '<span class="n-arrow" aria-hidden="true">&#8599;</span></a></li>';
    }).join("");
  }
  if (newsroom && window.fetch) {
    fetch("data/newsroom.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        render(newsroom.querySelector('[data-news-list="insights"]'), d.insights);
        render(newsroom.querySelector('[data-news-list="news"]'), d.news);
      })
      .catch(function () {});
  }

  // 11) 연도
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* 다크/라이트 모드 토글 */
(function () {
  var root = document.documentElement;
  var btn = document.querySelector(".theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');
  function apply(t, save) {
    root.setAttribute("data-theme", t);
    if (btn) { btn.setAttribute("aria-checked", t === "dark" ? "true" : "false"); btn.setAttribute("aria-label", t === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"); }
    if (meta) meta.setAttribute("content", t === "dark" ? "#0b0b0b" : "#ffffff");
    if (save) { try { localStorage.setItem("navig-theme", t); } catch (e) {} }
  }
  apply(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);
  if (btn) btn.addEventListener("click", function () { apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true); });
  if (window.matchMedia) {
    var mq = matchMedia("(prefers-color-scheme: dark)");
    var on = function (e) { var s = null; try { s = localStorage.getItem("navig-theme"); } catch (x) {} if (!s) apply(e.matches ? "dark" : "light", false); };
    if (mq.addEventListener) mq.addEventListener("change", on); else if (mq.addListener) mq.addListener(on);
  }
})();
