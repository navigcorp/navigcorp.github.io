(function () {
  var S = window.NAVIG_SITE || {};

  // 1) 기본 정보 바인딩: data-site="키" 요소에 값 채우기
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

  // 2) 구조화 데이터(Organization, LocalBusiness)
  if (S.url) {
    var addr = {
      "@type": "PostalAddress",
      "streetAddress": S.address.street,
      "addressLocality": S.address.locality,
      "addressRegion": S.address.region,
      "addressCountry": S.address.country
    };
    var ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": S.url + "/#organization",
          "name": S.nameKo + " (" + S.nameEn + ")",
          "alternateName": [S.nameEn, "NAVIG Corp.", S.nameKo],
          "url": S.url + "/",
          "logo": S.url + "/assets/img/logo-navig-black.png",
          "email": S.email,
          "telephone": S.telIntl,
          "founder": { "@type": "Person", "name": S.ceo },
          "address": addr,
          "sameAs": [S.service]
        },
        {
          "@type": "LocalBusiness",
          "@id": S.url + "/#localbusiness",
          "name": S.nameKo + " (" + S.nameEn + ")",
          "url": S.url + "/",
          "image": S.url + "/assets/img/og.jpg",
          "email": S.email,
          "telephone": S.telIntl,
          "address": addr,
          "parentOrganization": { "@id": S.url + "/#organization" }
        }
      ]
    };
    var tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);
  }

  // 3) 헤더: 스크롤 시 배경 표시
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 4) 모바일 메뉴
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

  // 5) 스크롤 시 은은한 등장
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // 6) 연도
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
