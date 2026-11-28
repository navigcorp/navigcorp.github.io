/* NAVIG Services: 쌓인 카드는 제목만 남기고 나머지를 흐리게 */
(function () {
  var cards = [].slice.call(document.querySelectorAll(".sv-card"));
  if (!cards.length) return;
  var mq = window.matchMedia("(max-width: 860px)");
  var ticking = false;
  function update() {
    ticking = false;
    cards.forEach(function (card, i) {
      var next = cards[i + 1];
      if (!next || mq.matches) { card.classList.remove("is-stacked"); return; }
      var top = card.getBoundingClientRect().top;
      var nextTop = next.getBoundingClientRect().top;
      card.classList.toggle("is-stacked", nextTop - top < card.offsetHeight * 0.55);
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
