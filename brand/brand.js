// 브랜드 리소스: 로고 등장 모션, HEX·문구 복사
(function () {
  var toast = document.querySelector(".b-toast"), tm;
  function say(t) { if (!toast) return; toast.textContent = t; toast.classList.add("on"); clearTimeout(tm); tm = setTimeout(function () { toast.classList.remove("on"); }, 1600); }
  function copy(t, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, done);
    else { var a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (e) {} a.remove(); done(); }
  }
  var en = function () { return document.documentElement.getAttribute("data-lang") === "en"; };
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () { var v = b.getAttribute("data-copy"); copy(v, function () { say((en() ? "Copied " : "복사됨 ") + v); }); });
  });
  document.querySelectorAll("[data-copy-el]").forEach(function (b) {
    b.addEventListener("click", function () {
      var el = document.getElementById(b.getAttribute("data-copy-el")); if (!el) return;
      var s = el.querySelector(en() ? ".en" : ".ko"); copy((s || el).textContent.trim(), function () { say(en() ? "Copied" : "문구를 복사했습니다"); });
    });
  });
  var stages = document.querySelectorAll("[data-motion]");
  function play(st) { st.classList.remove("is-play"); void st.offsetWidth; st.classList.add("is-play"); }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { play(e.target); io.unobserve(e.target); } }); }, { threshold: .35 });
    stages.forEach(function (s) { io.observe(s); });
  } else stages.forEach(play);
  stages.forEach(function (s) { var r = s.querySelector(".replay"); if (r) r.addEventListener("click", function () { play(s); }); });
})();
