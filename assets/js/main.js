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

  // 2) 구조화 데이터는 각 페이지 head에 정적으로 들어 있음(JS 미실행 크롤러 대응)

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
      a.addEventListener("click", function (e) {
        // 모바일에서 Services 글자를 누르면 이동 대신 하위 메뉴를 펼친다
        if (a.classList.contains("sub-link") && window.matchMedia("(max-width: 860px)").matches) {
          e.preventDefault();
          var box = a.closest(".has-sub"), on = !box.classList.contains("is-open");
          box.classList.toggle("is-open", on);
          box.querySelector(".sub-toggle").setAttribute("aria-expanded", on ? "true" : "false");
          return;
        }
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 5-1) Services 하위 메뉴: 화살표 버튼(클릭·Enter·Space), 바깥 클릭·Esc로 닫기
  document.querySelectorAll(".has-sub").forEach(function (box) {
    var btn = box.querySelector(".sub-toggle");
    function setOpen(on) { box.classList.toggle("is-open", on); btn.setAttribute("aria-expanded", on ? "true" : "false"); }
    btn.addEventListener("click", function () { setOpen(!box.classList.contains("is-open")); });
    document.addEventListener("click", function (e) { if (!box.contains(e.target) && !window.matchMedia("(max-width: 860px)").matches) setOpen(false); });
    box.addEventListener("keydown", function (e) { if (e.key === "Escape") { setOpen(false); btn.focus(); } });
    box.addEventListener("mouseleave", function () { if (!window.matchMedia("(max-width: 860px)").matches) setOpen(false); });
  });

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
  var CAT = { "인사이트": "Insight", "비하인드 더 씬": "Behind the Scene", "트렌드 톡": "Trend Talk", "나빅소식": "News" };
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

  // 10-1) 언어 메뉴: 현재 언어 버튼을 누르면 다른 언어가 펼쳐짐 (261128g)
  document.querySelectorAll(".lang-menu").forEach(function (m) {
    var cur = m.querySelector(".lang-cur");
    if (!cur) return;
    function close() { m.classList.remove("is-open"); cur.setAttribute("aria-expanded", "false"); }
    cur.addEventListener("click", function (e) { e.stopPropagation(); var on = !m.classList.contains("is-open"); m.classList.toggle("is-open", on); cur.setAttribute("aria-expanded", on ? "true" : "false"); });
    m.querySelectorAll("[data-set-lang]").forEach(function (b) { b.addEventListener("click", close); });
    document.addEventListener("click", function (e) { if (!m.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  });

  // 10-2) 홈 첫 화면 심볼 모션: 화면에 보일 때만 재생
  var hmStages = document.querySelectorAll(".hm-stage[data-motion]");
  if (hmStages.length) {
    if ("IntersectionObserver" in window) {
      var hmIo = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("is-on", e.isIntersecting); }); }, { threshold: .1 });
      hmStages.forEach(function (s) { hmIo.observe(s); });
    } else hmStages.forEach(function (s) { s.classList.add("is-on"); });
  }

  // 10-2b) 홈 첫 화면 심볼: 스크롤하면 상단 로고의 N 자리로 들어가고, 이어서 AVIG가 펼쳐짐
  var dock = document.querySelector(".hm-stage[data-dock]");
  var dockLogo = document.querySelector(".site-header .logo img");
  if (dock && dockLogo && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var root = document.documentElement, d0 = null, dTick = false;
    root.classList.add("hm-docking");
    var measure = function () {
      dock.style.transform = "none";
      var r = dock.getBoundingClientRect();
      d0 = { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
    };
    var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var render = function () {
      dTick = false; if (!d0) measure();
      var s = window.scrollY, L = dockLogo.getBoundingClientRect();
      var end = Math.max(180, d0.y - L.top) * 1.15;
      var p = Math.min(1, Math.max(0, s / end)), e = ease(Math.min(1, p / .78));
      var th = L.height, k = 1 + (th / d0.h - 1) * e;
      var tx = (L.left - d0.x) * e, ty = (L.top - d0.y + s) * e;
      dock.style.transform = "translate(" + tx + "px," + (ty) + "px) scale(" + k + ")";
      var landed = p >= .78; dock.style.opacity = landed ? 0 : 1;
      var rev = Math.min(1, Math.max(0, (p - .78) / .22)); rev = 1 - Math.pow(1 - rev, 3);
      root.style.setProperty("--lo", landed ? 1 : 0);
      root.style.setProperty("--lr", (66.67 * (1 - rev)).toFixed(2) + "%");
    };
    var req = function () { if (!dTick) { dTick = true; requestAnimationFrame(render); } };
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", function () { d0 = null; req(); });
    window.addEventListener("load", function () { d0 = null; req(); });
    render();
  }

  // 10-3) 전체 펼침 메뉴(데스크톱): 상단 메뉴에 올리면 모든 하위 메뉴가 펼쳐지고, 헤더를 벗어나면 접힘
  var hdr = document.querySelector(".site-header");
  if (hdr) {
    var desk = window.matchMedia("(min-width: 861px)"), megaT;
    var openMega = function () { if (!desk.matches) return; clearTimeout(megaT); hdr.classList.add("mega-open"); };
    var closeMega = function () { clearTimeout(megaT); megaT = setTimeout(function () { hdr.classList.remove("mega-open"); }, 120); };
    hdr.querySelectorAll(".has-sub").forEach(function (b) { b.addEventListener("mouseenter", openMega); b.addEventListener("focusin", openMega); });
    hdr.addEventListener("mouseleave", closeMega);
    hdr.addEventListener("focusout", function (e) { if (!hdr.contains(e.relatedTarget)) closeMega(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hdr.classList.remove("mega-open"); });
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

/* ===== 261128s: 토스식 첫 화면 · 섹션 눈금 · 사이트 검색 · 큰 글자 ===== */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cl = function (v) { return Math.min(1, Math.max(0, v)); }, seg = function (p, a, b) { return cl((p - a) / (b - a)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var lang = function () { return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "ko"; };
  var scr = document.querySelector('script[src*="assets/js/main.js"]');
  var ROOT = scr ? new URL("../../", scr.src).href : location.origin + "/";

  // 1) 첫 화면 영상 카드: 스크롤하면 카드가 살짝 작아지고 다음 문장이 떠오름
  var hero = document.querySelector(".tz-hero");
  if (hero) {
    var card = hero.querySelector(".tz-card"), tk = false;
    var render = function () {
      tk = false;
      var r = hero.getBoundingClientRect(), total = Math.max(1, hero.offsetHeight - innerHeight);
      var p = reduce ? 0 : cl(-r.top / total);
      card.style.transform = "scale(" + (1 - .08 * ease(seg(p, 0, .5))) + ")";
      card.style.borderRadius = (28 + 10 * seg(p, 0, .5)) + "px";
      var s = seg(p, .1, .3);
      card.style.setProperty("--so", 1 - s); card.style.setProperty("--sy", (-30 * s) + "px"); card.style.setProperty("--ss", 1 - .06 * s);
      card.style.setProperty("--dark", (.42 * seg(p, .18, .42)).toFixed(3));
      var a1 = ease(seg(p, .32, .48)), a2 = ease(seg(p, .44, .6)), a3 = ease(seg(p, .58, .72)), out = 1 - seg(p, .9, 1);
      card.style.setProperty("--o1", a1 * out); card.style.setProperty("--y1", (24 * (1 - a1)) + "px");
      card.style.setProperty("--o2", a2 * out); card.style.setProperty("--y2", (24 * (1 - a2)) + "px");
      card.style.setProperty("--o3", a3 * out);
    };
    addEventListener("scroll", function () { if (!tk) { tk = true; requestAnimationFrame(render); } }, { passive: true });
    addEventListener("resize", render); render();
    var vid = hero.querySelector("video");
    if (vid && "IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } else vid.pause(); }); }).observe(hero);

    // 왼쪽 섹션 눈금 (홈)
    var secs = [["top", "처음", "Top"], ["about", "회사소개", "About"], ["services", "서비스", "Services"], ["projects", "프로젝트", "Projects"], ["global", "글로벌", "Global"], ["history", "연혁", "History"], ["newsroom", "미디어", "Media"], ["contact", "문의", "Contact"]];
    var nav = document.createElement("nav"); nav.className = "tz-ticks"; nav.setAttribute("aria-label", "섹션 이동");
    var els = [];
    secs.forEach(function (s) { var el = s[0] === "top" ? hero : document.getElementById(s[0]); if (!el) return; var a = document.createElement("a"); a.href = s[0] === "top" ? "#top" : "#" + s[0]; a.setAttribute("aria-label", s[1]); a.innerHTML = '<span class="ko">' + s[1] + '</span><span class="en">' + s[2] + "</span>"; nav.appendChild(a); els.push([el, a]); });
    document.body.appendChild(nav);
    var mark = function () {
      var mid = innerHeight * .45, cur = els[0];
      els.forEach(function (e) { if (e[0].getBoundingClientRect().top <= mid) cur = e; });
      els.forEach(function (e) { e[1].classList.toggle("on", e === cur); });
      var hb = hero.getBoundingClientRect().bottom, dk = hb > innerHeight * .5;
      document.querySelectorAll(".pj-band").forEach(function (b) { var r = b.getBoundingClientRect(); if (r.top < innerHeight * .5 && r.bottom > innerHeight * .5) dk = true; });
      nav.classList.toggle("on-dark", dk);
    };
    addEventListener("scroll", mark, { passive: true }); mark();
  }

  // 2) 카카오식 큰 글자: 섹션을 지나가는 동안 좌우로 흐름
  var giants = document.querySelectorAll("[data-giant]");
  if (giants.length && !reduce) {
    var gt = false;
    var gRender = function () { gt = false; giants.forEach(function (g) { var s = g.parentElement.getBoundingClientRect(); var p = (innerHeight - s.top) / (innerHeight + s.height); g.style.setProperty("--gx", (-(cl(p)) * Math.max(0, g.scrollWidth - innerWidth * .6)) + "px"); }); };
    addEventListener("scroll", function () { if (!gt) { gt = true; requestAnimationFrame(gRender); } }, { passive: true }); gRender();
  }

  // 2-1) 펼침 메뉴 열 너비: 위 메뉴는 촘촘하게, 펼쳤을 때 하위 메뉴끼리 겹치지 않게 각 열 너비를 맞춤
  var fitMega = function () {
    var desk = window.matchMedia("(min-width: 861px)").matches;
    document.querySelectorAll(".site-header .has-sub").forEach(function (h) {
      var sm = h.querySelector(".sub-menu"); if (!sm) return;
      if (desk) h.style.setProperty("min-width", Math.ceil(sm.scrollWidth + 4) + "px", "important"); else h.style.removeProperty("min-width");
    });
  };
  fitMega(); addEventListener("resize", fitMega); addEventListener("load", fitMega);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMega);

  // 3) 사이트 검색
  var openers = document.querySelectorAll(".search-open");
  if (!openers.length) return;
  var P = function (path) { return ROOT + path; };
  var IDX = [
    ["회사 소개", "About NAVIG", "index.html#about", "회사", "나빅 NAVIG 크리에이티브 그룹 회사소개 소개 설립 사업부 about"],
    ["연혁", "History", "index.html#history", "회사", "연혁 히스토리 history 2024 2025 2026"],
    ["글로벌 · 싱가포르", "Global · Singapore", "index.html#global", "회사", "싱가포르 글로벌 해외 파트너 singapore global"],
    ["프로젝트 움직임 · 파이프라인", "Project Umjigim · Pipeline", "projects/", "프로젝트", "프로젝트 움직임 파이프라인 umjigim pipeline 챌린지 캠페인 project"],
    ["브랜드 리소스", "Brand resources", "brand/", "회사", "브랜드 로고 워드마크 심볼 다운로드 brand logo"],
    ["전체 서비스", "All services", "services/", "서비스", "서비스 service 사업부"],
    ["영상·디자인", "Film & Design", "services/studio/", "서비스", "영상 제작 홍보영상 브랜드 필름 행사 라이브 중계 디자인 로고 포스터 모션그래픽 AI 콘텐츠 스튜디오 studio 포트폴리오"],
    ["광고·마케팅", "Ads & Marketing", "services/ad/", "서비스", "광고 마케팅 채널 운영 웹사이트 제작 플레이스 나빅애드 navig ad 대행"],
    ["AI 교육·자격과정", "AI Education", "services/edutech/", "서비스", "AI 교육 강의 자격 민간자격 AI영상콘텐츠제작전문가 에듀테크 edutech 대학 평생교육원"],
    ["엔터테인먼트·IP", "Entertainment & IP", "services/entertainment/", "서비스", "엔터테인먼트 인플루언서 커넥트 크리캐릭터 캐릭터 IP 나빅이 말랑멜로 부업이 음원 사운드 낭만뮤직 entertainment"],
    ["영상 협업 플랫폼 NAVIG SI", "NAVIG SI", "services/labs/", "서비스", "navig si 협업 플랫폼 피드백 수정 요청 타임라인 랩스 labs"],
    ["음원 라이선스 신청", "Music license", "music/", "서비스", "음원 라이선스 낭만뮤직 bgm 사운드팀 music"],
    ["AI영상콘텐츠제작전문가 자격", "AI video certificate", "certificate/", "교육", "민간자격 자격증 AI영상콘텐츠제작전문가 시험 등록번호 certificate"],
    ["최근 소식", "Latest news", "index.html#newsroom", "미디어", "뉴스 소식 보도자료 블로그 미디어 news"],
    ["프로젝트 문의", "Contact", "index.html#contact", "함께하기", "문의 견적 연락처 이메일 전화 카카오톡 contact"],
    ["제휴제안", "Partnership", "partnership/", "함께하기", "제휴 제안 협업 파트너 partnership"],
    ["파트너 지원", "Join as partner", "partnership/#partner", "함께하기", "파트너 지원 프리랜서 크리에이터 partner"],
    ["기업윤리", "Ethics", "ethics/", "책임경영", "윤리 기업윤리 제보 ethics"],
    ["AI 윤리 원칙", "AI ethics", "ethics/#ai", "책임경영", "AI 윤리 원칙 ai ethics"],
    ["개인정보 처리방침", "Privacy policy", "privacy/", "책임경영", "개인정보 처리방침 privacy"]
  ].map(function (r) { return { t: r[0], te: r[1], u: P(r[2]), c: r[3], k: (r[0] + " " + r[1] + " " + r[4]).toLowerCase() }; });
  var TAGS = [["영상 제작", "영상"], ["AI 교육", "AI 교육"], ["나빅애드", "광고"], ["크리캐릭터", "크리캐릭터"], ["프로젝트 움직임", "움직임"], ["싱가포르", "싱가포르"]];
  var newsLoaded = false;
  var loadNews = function () {
    if (newsLoaded) return; newsLoaded = true;
    fetch(P("data/newsroom.json"), { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      (d.news || []).concat(d.insights || []).forEach(function (n) { IDX.push({ t: n.title, te: n.title, u: n.url, c: n.category || "소식", k: (n.title + " " + (n.excerpt || "") + " " + (n.category || "")).toLowerCase(), ext: true, d: n.date }); });
      if (box.classList.contains("open")) run();
    }).catch(function () {});
  };
  var box = document.createElement("div"); box.className = "sx"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "사이트 검색");
  box.innerHTML = '<div class="sx-box"><div class="sx-field"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg><input type="search" autocomplete="off" spellcheck="false" aria-label="검색어"><button class="sx-close" type="button" aria-label="닫기">&#10005;</button></div><div class="sx-tags"></div><p class="sx-cap"></p><ul class="sx-list" role="listbox"></ul></div>';
  document.body.appendChild(box);
  var inp = box.querySelector("input"), list = box.querySelector(".sx-list"), cap = box.querySelector(".sx-cap"), tagBox = box.querySelector(".sx-tags");
  TAGS.forEach(function (t) { var b = document.createElement("button"); b.type = "button"; b.textContent = "#" + t[0]; b.addEventListener("click", function () { inp.value = t[1]; run(); inp.focus(); }); tagBox.appendChild(b); });
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var sel = -1;
  function run() {
    var en = lang() === "en", q = inp.value.trim().toLowerCase();
    inp.placeholder = en ? "Search NAVIG" : "무엇을 찾고 계신가요?";
    var words = q.split(/\s+/).filter(Boolean), res;
    if (!words.length) { res = IDX.filter(function (r) { return !r.ext; }).slice(0, 7); cap.textContent = en ? "Popular" : "바로 가기"; }
    else {
      res = IDX.map(function (r) { var sc = 0; words.forEach(function (w) { var i = r.k.indexOf(w); if (i >= 0) sc += (r.t.toLowerCase().indexOf(w) >= 0 ? 3 : 1); else sc -= 100; }); return [sc, r]; }).filter(function (x) { return x[0] > 0; }).sort(function (a, b) { return b[0] - a[0]; }).map(function (x) { return x[1]; }).slice(0, 12);
      cap.textContent = res.length ? (en ? res.length + " results" : "검색 결과 " + res.length + "건") : "";
    }
    sel = -1;
    list.innerHTML = res.length ? res.map(function (r) { return '<li><a href="' + esc(r.u) + '"' + (r.ext ? ' target="_blank" rel="noopener"' : "") + "><b>" + esc(en ? r.te : r.t) + (r.ext ? " &#8599;" : "") + "</b><small>" + esc(r.d ? r.d : (r.u.replace(ROOT, "/").replace("index.html", ""))) + "</small><em>" + esc(r.c) + "</em></a></li>"; }).join("") : '<li class="sx-empty">' + (en ? "No results. Try another word or contact us." : "찾는 내용이 없어요. 다른 단어로 찾아보거나 문의해 주세요.") + "</li>";
  }
  var lastFocus = null;
  function open(q) { lastFocus = document.activeElement; loadNews(); box.classList.add("open"); document.body.classList.add("sx-lock"); inp.value = q || ""; run(); setTimeout(function () { inp.focus(); }, 30); }
  function close() { box.classList.remove("open"); document.body.classList.remove("sx-lock"); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  openers.forEach(function (b) { b.addEventListener("click", function () { open(); }); });
  inp.addEventListener("input", run);
  box.addEventListener("click", function (e) { if (e.target === box || e.target.closest(".sx-close")) close(); if (e.target.closest(".sx-list a")) { var a = e.target.closest("a"); if (a.getAttribute("href").indexOf("#") >= 0 && a.target !== "_blank") close(); } });
  document.addEventListener("keydown", function (e) {
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (!box.classList.contains("open")) { if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); open(); } return; }
    var items = list.querySelectorAll("a");
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!items.length) return; sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach(function (a, i) { a.classList.toggle("on", i === sel); }); items[sel].scrollIntoView({ block: "nearest" }); }
    else if (e.key === "Enter" && t === inp) { var a = items[sel >= 0 ? sel : 0]; if (a) { e.preventDefault(); a.click(); } }
  });

  // 4) 홈 하단 떠 있는 검색 말풍선 (카카오 참고): 첫 화면을 지나면 나타나고, 닫으면 이번 방문 동안 숨김
  if (hero) {
    var pill = document.createElement("div"); pill.className = "sx-pill";
    pill.innerHTML = '<div class="sx-pill-tags"></div><div class="sx-pill-bar" role="button" tabindex="0" aria-label="사이트 검색 열기"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg><span><span class="ko">방향을 찾고 계신가요? 무엇이든 검색해 보세요</span><span class="en">Looking for something? Search NAVIG</span></span><button class="sx-pill-x" type="button" aria-label="닫기">&#10005;</button></div>';
    document.body.appendChild(pill);
    var pt = pill.querySelector(".sx-pill-tags");
    TAGS.slice(0, 4).forEach(function (t) { var b = document.createElement("button"); b.type = "button"; b.textContent = "#" + t[0]; b.addEventListener("click", function () { open(t[1]); }); pt.appendChild(b); });
    var bar = pill.querySelector(".sx-pill-bar");
    bar.addEventListener("click", function (e) { if (e.target.closest(".sx-pill-x")) { e.stopPropagation(); pill.classList.remove("show"); pill.dataset.off = "1"; try { sessionStorage.setItem("sx-pill-off", "1"); } catch (x) {} return; } open(); });
    bar.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    try { if (sessionStorage.getItem("sx-pill-off")) pill.dataset.off = "1"; } catch (x) {}
    var contact = document.getElementById("contact");
    var pillCheck = function () {
      if (pill.dataset.off) return;
      var past = hero.getBoundingClientRect().bottom < innerHeight * .6;
      var nearEnd = contact && contact.getBoundingClientRect().top < innerHeight * .8;
      pill.classList.toggle("show", past && !nearEnd);
    };
    addEventListener("scroll", pillCheck, { passive: true }); pillCheck();
  }
})();
