// 나빅 셀프 공방 (가칭) 고객 화면
const SMARTSTORE_URL = 'https://smartstore.naver.com/'; // 상품 등록 후 실제 상품 링크로 교체
const $ = (id) => document.getElementById(id);
const state = { templates: [], consent: '', template: null, files: [], jobId: null, poll: null };

function show(step) {
  for (const s of document.querySelectorAll('.step')) s.classList.add('hidden');
  $(step).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function api(path, opts = {}) {
  return demoApi(path, opts); // 시범 화면: 서버 대신 브라우저 안에서 모의 응답
}

// 사진을 최대 1600px JPEG로 줄여서 올림(용량 절약, 위치정보 등 메타데이터 제거)
async function shrink(file) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob((b) => r(new File([b], 'photo.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.9));
}

function renderTemplates() {
  const box = $('templates');
  box.innerHTML = '';
  for (const t of state.templates) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tpl'; b.dataset.id = t.id;
    b.innerHTML = `<div class="ph"><img src="${t.sample}" alt="" onerror="this.remove()"><i>${t.style}</i></div><div class="t"><b>${t.name}</b><span>${t.desc}</span></div>`;
    b.onclick = () => { state.template = t.id; document.querySelectorAll('.tpl').forEach((x) => x.classList.toggle('on', x === b)); validate(); };
    box.appendChild(b);
  }
}
function validate() {
  $('previewBtn').disabled = !(state.template && state.files.length && $('cAdult').checked && $('cPeople').checked && $('cTerms').checked);
}

$('photos').onchange = async (e) => {
  const picked = [...e.target.files].slice(0, 3);
  $('thumbs').innerHTML = '';
  state.files = [];
  for (const f of picked) {
    const s = await shrink(f);
    state.files.push(s);
    const im = document.createElement('img'); im.src = URL.createObjectURL(s); $('thumbs').appendChild(im);
  }
  $('dropText').textContent = state.files.length ? `사진 ${state.files.length}장 선택됨 (다시 고르려면 누르기)` : '사진 선택하기';
  validate();
};
['cAdult', 'cPeople', 'cTerms'].forEach((id) => ($(id).onchange = validate));

$('previewBtn').onclick = async () => {
  $('startMsg').textContent = '';
  $('previewBtn').disabled = true;
  try {
    const fd = new FormData();
    fd.append('template_id', state.template);
    fd.append('adult', '1');
    fd.append('consent', state.consent);
    state.files.forEach((f) => fd.append('photos', f));
    const { id } = await api('/api/jobs', { method: 'POST', body: fd });
    setJob(id);
    waitView('미리보기를 만드는 중이에요', '보통 20~40초 걸려요. 화면을 닫지 말아 주세요.');
    const job = await api(`/api/jobs/${id}/preview`, { method: 'POST' });
    render(job);
  } catch (e) {
    show('step-start');
    $('startMsg').textContent = e.message;
    validate();
  }
};

$('redeemBtn').onclick = async () => {
  $('pvMsg').textContent = '';
  try {
    const job = await api(`/api/jobs/${state.jobId}/redeem`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_no: $('orderNo').value }) });
    render(job);
  } catch (e) { $('pvMsg').textContent = e.message; }
};

$('regenBtn').onclick = async () => {
  $('doneMsg').textContent = '';
  try { render(await api(`/api/jobs/${state.jobId}/regenerate`, { method: 'POST' })); } catch (e) { $('doneMsg').textContent = e.message; }
};

function setJob(id) {
  state.jobId = id;
  history.replaceState(null, '', `#job=${id}`);
  try { localStorage.setItem('navig_job', id); } catch (_) {}
}
function waitView(title, text) { $('waitTitle').textContent = title; $('waitText').textContent = text; show('step-wait'); }
function startPoll() {
  clearTimeout(state.poll);
  state.poll = setTimeout(async () => { try { render(await api(`/api/jobs/${state.jobId}`)); } catch (_) { startPoll(); } }, 2500);
}

function render(job) {
  clearTimeout(state.poll);
  switch (job.status) {
    case 'uploaded':
      waitView('미리보기를 준비하고 있어요', '');
      api(`/api/jobs/${job.id}/preview`, { method: 'POST' }).then(render).catch((e) => { $('helpText').textContent = e.message; show('step-help'); });
      break;
    case 'preview_failed':
      show('step-start');
      $('startMsg').textContent = job.error || '미리보기를 만들지 못했어요. 다른 사진으로 시도해 주세요.';
      break;
    case 'preview_ready':
      $('pvTitle').textContent = `미리보기 · ${job.template?.name || ''}`;
      $('pvImg').src = job.preview;
      show('step-preview');
      break;
    case 'awaiting_payment':
      waitView('결제를 확인하고 있어요', `주문번호 ${job.order_no}. 확인되면 자동으로 제작을 시작해요. 보통 몇 분 안에 확인되고, 늦어지면 이 페이지에 다시 들어와 주세요.`);
      startPoll();
      break;
    case 'paid':
    case 'generating':
      waitView('고화질 카드를 만드는 중이에요', '자동 품질 검사까지 마치느라 2~5분 정도 걸려요. 이 페이지를 닫아도 제작은 계속되고, 저장한 주소로 돌아오면 볼 수 있어요.');
      startPoll();
      break;
    case 'done': {
      const box = $('finals');
      box.innerHTML = '';
      job.finals.forEach((u, i) => {
        const f = document.createElement('figure');
        f.innerHTML = `<img src="${u}" alt="결과 ${i + 1}" loading="lazy"><a href="${u}" download="navig-card-${i + 1}.jpg">고화질 저장</a>`;
        box.appendChild(f);
      });
      $('regenBtn').textContent = `한 장 더 만들기 (남은 횟수 ${job.regen_left})`;
      $('regenBtn').disabled = job.regen_left <= 0;
      $('doneMsg').textContent = job.error || '';
      show('step-done');
      break;
    }
    default:
      $('helpText').textContent = job.error || '확인 후 처리해 드릴게요. 스마트스토어 톡톡으로 주문번호를 남겨 주시면 더 빨라요.';
      show('step-help');
  }
}

$('findBtn').onclick = () => { $('findMsg').textContent = ''; $('findDlg').showModal(); };
$('findGo').onclick = async (e) => {
  e.preventDefault();
  try {
    const { id } = await api('/api/lookup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_no: $('findNo').value }) });
    $('findDlg').close(); setJob(id); render(await api(`/api/jobs/${id}`));
  } catch (err) { $('findMsg').textContent = err.message; }
};

(async function init() {
  $('storeLink').href = SMARTSTORE_URL;
  const t = await api('/api/templates');
  state.templates = t.templates; state.consent = t.consent_version;
  renderTemplates();
  const m = location.hash.match(/job=([0-9a-f]{32})/);
  const id = m ? m[1] : null;
  if (id) {
    try { setJob(id); render(await api(`/api/jobs/${id}`)); } catch (e) { history.replaceState(null, '', '/'); show('step-start'); }
  }
})();
