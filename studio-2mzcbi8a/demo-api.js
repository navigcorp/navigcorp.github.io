// 시범 화면 전용 모의 서버 (2026-11-21)
// 실제 AI 생성·결제·네트워크 전송 없음. 올린 사진은 브라우저 메모리 안에서만 처리.
(function () {
  const TEMPLATES = [{"id":"xmas-living-room","name":"따뜻한 거실 크리스마스","desc":"벽난로와 트리 앞, 실사 가족사진 느낌","style":"실사","aspect":"4:5","sample":"assets/samples/xmas-living-room.webp"},{"id":"xmas-snow-market","name":"눈 내리는 크리스마스 마켓","desc":"유럽 크리스마스 마켓, 영화 같은 저녁 장면","style":"실사","aspect":"4:5","sample":"assets/samples/xmas-snow-market.webp"},{"id":"xmas-clay","name":"클레이 애니메이션 크리스마스","desc":"말랑한 3D 점토 인형으로 변신","style":"3D 클레이","aspect":"4:5","sample":"assets/samples/xmas-clay.webp"},{"id":"xmas-watercolor","name":"동화책 수채화 카드","desc":"부드러운 수채화 일러스트","style":"일러스트","aspect":"4:5","sample":"assets/samples/xmas-watercolor.webp"},{"id":"xmas-pet-studio","name":"반려동물 산타 화보","desc":"산타 모자 쓴 반려동물 스튜디오 화보","style":"실사","aspect":"4:5","sample":"assets/samples/xmas-pet-studio.webp"},{"id":"newyear-hanbok-2027","name":"2027 새해 한복 가족사진","desc":"정미년 새해 인사, 한복 스튜디오 사진","style":"실사","aspect":"4:5","sample":"assets/samples/newyear-hanbok-2027.webp"}];
  const CONSENT = '2026-11-21';
  const jobs = {};
  const ok = (d) => Promise.resolve({ ok: true, ...d });
  const fail = (m) => Promise.reject(new Error(m));
  const rid = () => [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, '0')).join('');
  let wmImg = null;
  function loadImg(src) { return new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; }); }
  // 4:5 가운데 자르기 + 크기 + (선택) 워터마크 + 색 변화
  async function render(file, w, h, opts = {}) {
    const bmp = await createImageBitmap(file);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    let cw = bmp.width, ch = Math.round(bmp.width * 5 / 4);
    if (ch > bmp.height) { ch = bmp.height; cw = Math.round(bmp.height * 4 / 5); }
    if (opts.filter) g.filter = opts.filter;
    g.drawImage(bmp, (bmp.width - cw) / 2, (bmp.height - ch) / 2, cw, ch, 0, 0, w, h);
    g.filter = 'none';
    if (opts.watermark) { wmImg = wmImg || await loadImg('assets/watermark.png'); g.drawImage(wmImg, 0, 0, w, h); }
    if (opts.label) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(w - 230, h - 52, 230, 52); g.fillStyle = '#fff'; g.font = '600 22px sans-serif'; g.textAlign = 'center'; g.fillText(opts.label, w - 115, h - 18); }
    return new Promise((r) => c.toBlob((b) => r(URL.createObjectURL(b)), 'image/jpeg', 0.9));
  }
  const FILTERS = ['saturate(1.15) contrast(1.05)', 'sepia(.25) saturate(1.1)', 'brightness(1.08) contrast(1.1)', 'hue-rotate(-10deg) saturate(1.2)', 'grayscale(.2) contrast(1.15)', 'saturate(1.3)'];
  function view(j) {
    const t = TEMPLATES.find((x) => x.id === j.template_id);
    const now = Date.now();
    if (j.status === 'awaiting_payment' && now - j.t > 3000) j.status = 'generating';
    if (j.status === 'generating' && now - j.t > 7000) j.status = 'done';
    return { ok: true, id: j.id, status: j.status, template: { id: t.id, name: t.name }, preview: j.preview, finals: j.status === 'done' ? j.finals : [], regen_left: j.regen_left, order_no: j.order_no, error: null };
  }
  window.demoApi = async function (path, opts = {}) {
    await new Promise((r) => setTimeout(r, 300));
    const m = path.match(/^\/api\/jobs\/([0-9a-f]{32})(?:\/(preview|redeem|regenerate))?$/);
    if (path === '/api/templates') return ok({ templates: TEMPLATES, consent_version: CONSENT });
    if (path === '/api/jobs' && opts.method === 'POST') {
      const fd = opts.body; const files = fd.getAll('photos');
      if (!files.length) return fail('사진을 올려 주세요.');
      const id = rid();
      jobs[id] = { id, template_id: fd.get('template_id'), files, status: 'uploaded', regen_left: 3, finals: [], t: Date.now() };
      return ok({ id });
    }
    if (path === '/api/lookup') {
      const no = String(JSON.parse(opts.body || '{}').order_no || '').replace(/\D/g, '');
      const j = Object.values(jobs).find((x) => x.order_no === no);
      return j ? ok({ id: j.id }) : fail('이 주문번호로 진행 중인 작업이 없어요. (시범 화면은 새로고침하면 기록이 사라져요)');
    }
    if (m) {
      const j = jobs[m[1]];
      if (!j) return fail('시범 화면은 새로고침하면 기록이 사라져요. 처음부터 다시 해 주세요.');
      if (!m[2]) return view(j);
      if (m[2] === 'preview') {
        await new Promise((r) => setTimeout(r, 1200));
        j.preview = await render(j.files[0], 640, 800, { watermark: true });
        j.status = 'preview_ready';
        return view(j);
      }
      if (m[2] === 'redeem') {
        const no = String(JSON.parse(opts.body || '{}').order_no || '').replace(/\D/g, '');
        if (no.length < 10) return fail('스마트스토어 주문번호(숫자)를 정확히 입력해 주세요. 시범 화면은 아무 숫자 10자리 이상이면 돼요.');
        if (Object.values(jobs).some((x) => x !== j && x.order_no === no)) return fail('이미 사용된 주문번호예요. 한 주문으로 1회 제작할 수 있어요.');
        j.order_no = no; j.status = 'awaiting_payment'; j.t = Date.now();
        j.finals = await Promise.all([0, 1, 2, 3].map((i) => render(j.files[i % j.files.length], 1280, 1600, { filter: FILTERS[i], label: '시범 예시 ' + (i + 1) })));
        return view(j);
      }
      if (m[2] === 'regenerate') {
        if (j.regen_left <= 0) return fail('다시 만들기 횟수를 모두 사용했어요.');
        j.regen_left -= 1;
        j.finals.push(await render(j.files[0], 1280, 1600, { filter: FILTERS[(j.finals.length) % FILTERS.length], label: '시범 예시 ' + (j.finals.length + 1) }));
        return view(j);
      }
    }
    return fail('시범 화면에서는 지원하지 않는 기능이에요.');
  };
})();
