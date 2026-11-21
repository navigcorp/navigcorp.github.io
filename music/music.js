/* 음원 사용 신청서 전송. ENDPOINT가 비어 있으면 미리보기 모드(전송하지 않음).
   연결: Google Apps Script 웹앱 URL(…/exec)을 ENDPOINT에 넣는다. 결재 후 본부가 연결. */
(function () {
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbyilqzJyhegpQgEZawXqFEr4UgbSMZrzTazkLQ5-18HAu-vkDYVEaH9mJGZaK0DMl7rcg/exec";
  var form = document.getElementById("music-form");
  if (!form) return;
  var status = document.getElementById("m-status");
  var started = document.getElementById("f-started");
  started.value = String(Date.now());
  if (!ENDPOINT) document.getElementById("m-draft").hidden = false;

  function say(msg, cls) { status.textContent = msg; status.className = "m-status " + (cls || ""); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); say("필수 항목(*)을 확인해 주세요.", "err"); return; }
    if (form.website.value) return;                                  // 스팸 방지: 숨김 칸
    if (Date.now() - Number(started.value) < 4000) { say("잠시 후 다시 보내 주세요.", "err"); return; } // 너무 빠른 제출
    var data = new URLSearchParams(new FormData(form));
    data.append("page", location.href);
    if (!ENDPOINT) { say("미리보기 모드입니다. 접수 연결 전이라 신청서가 전송되지 않았습니다.", "err"); return; }
    var btn = form.querySelector("button[type=submit]"); btn.disabled = true; say("보내는 중입니다…");
    fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: data })
      .then(function () { form.reset(); started.value = String(Date.now()); say("신청이 접수되었습니다. 확인 후 입력하신 메일로 안내드리겠습니다.", "ok"); })
      .catch(function () { say("전송에 실패했습니다. contact@navigcorp.com 으로 메일 주셔도 됩니다.", "err"); })
      .finally(function () { btn.disabled = false; });
  });
})();
