// ===================== APP CORE =====================
const TRUCK_LIMIT_KG = 26000;
let EXPEDITIONS = [];
let ERREURS = [];
let CHARTS = {}; // chart.js instances by canvas id
let currentOcrTarget = null; // 'new' | 'reception'
let newPieces = []; // working list for new shipment form
let receptionState = null; // {expedition, received: {repere: qty}, extra: [{repere, qty}]}

const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  new: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  reception: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  errors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
};

const NAV = [
  {key:'dashboard', icon:ICONS.dashboard, labelKey:'nav.dashboard'},
  {key:'new', icon:ICONS.new, labelKey:'nav.newshipment'},
  {key:'reception', icon:ICONS.reception, labelKey:'nav.reception'},
  {key:'history', icon:ICONS.history, labelKey:'nav.history'},
  {key:'errors', icon:ICONS.errors, labelKey:'nav.errors'},
  {key:'search', icon:ICONS.search, labelKey:'nav.search'},
  {key:'stats', icon:ICONS.stats, labelKey:'nav.stats'},
  {key:'reports', icon:ICONS.reports, labelKey:'nav.reports'},
];
const BOTTOM_NAV_KEYS = ['dashboard','new','reception','history','errors'];

// ===================== UTIL =====================
function fmt(n){ return (Math.round((n||0)*100)/100).toLocaleString(CURRENT_LANG==='ar'?'ar':'fr-FR'); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function monthKey(dateStr){ return (dateStr||'').slice(0,7); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function uid(){ return 'x'+Math.random().toString(36).slice(2,9); }

function toast(msg, type){
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' '+type : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }, 3200);
}

function openModal(html){
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modalBox').innerHTML = '';
}
document.getElementById('modalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'modalOverlay') closeModal();
});

// ===================== ROUTING =====================
function currentRoute(){
  const h = window.location.hash.replace('#/', '') || 'dashboard';
  return h.split('?')[0];
}

async function render(){
  const route = currentRoute();
  renderNav(route);
  document.getElementById('pageTitle').textContent = t(navLabelKeyFor(route));
  document.getElementById('crumb').textContent = 'GALVA CONTROL / ' + t(navLabelKeyFor(route)).toUpperCase();
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div class="empty"><div class="t1">…</div></div>';

  EXPEDITIONS = await DB.getAllExpeditions();
  ERREURS = await DB.getAllErreurs();

  const renderers = {
    dashboard: renderDashboard,
    new: renderNewShipment,
    reception: renderReception,
    history: renderHistory,
    errors: renderErrors,
    search: renderSearch,
    stats: renderStats,
    reports: renderReports,
  };
  (renderers[route] || renderDashboard)(content);
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
}

function navLabelKeyFor(route){
  const item = NAV.find(n => n.key === route);
  return item ? item.labelKey : 'nav.dashboard';
}

function renderNav(route){
  const build = (mobile) => NAV.map(n => `
    <button class="nav-item ${n.key===route?'active':''}" data-route="${n.key}">
      ${n.icon} <span>${t(n.labelKey)}</span>
    </button>`).join('');
  document.getElementById('navList').innerHTML = build(false);
  document.getElementById('navListMobile').innerHTML = build(true);
  document.querySelectorAll('#navList .nav-item, #navListMobile .nav-item').forEach(btn => {
    btn.addEventListener('click', () => { window.location.hash = '#/' + btn.dataset.route; closeDrawer(); });
  });
  document.getElementById('bottomNav').innerHTML = BOTTOM_NAV_KEYS.map(k => {
    const n = NAV.find(x=>x.key===k);
    return `<button class="${k===route?'active':''}" data-route="${k}">${n.icon}<span>${t(n.labelKey)}</span></button>`;
  }).join('');
  document.querySelectorAll('#bottomNav button').forEach(btn => {
    btn.addEventListener('click', () => { window.location.hash = '#/' + btn.dataset.route; });
  });
}

function openDrawer(){ document.getElementById('drawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('open'); }
function closeDrawer(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('open'); }
document.getElementById('hamburgerBtn').addEventListener('click', openDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

window.addEventListener('hashchange', render);

// ===================== THEME / LANG =====================
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('galva_theme', theme);
  const icon = theme==='dark' ? ICONS.sun : ICONS.moon;
  document.getElementById('themeBtn').innerHTML = icon;
  document.getElementById('themeBtnM').innerHTML = icon;
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
document.getElementById('themeBtn').addEventListener('click', toggleTheme);
document.getElementById('themeBtnM').addEventListener('click', toggleTheme);

function applyLangUI(){
  document.getElementById('langFr').classList.toggle('active', CURRENT_LANG==='fr');
  document.getElementById('langAr').classList.toggle('active', CURRENT_LANG==='ar');
  document.getElementById('langFrM').classList.toggle('active', CURRENT_LANG==='fr');
  document.getElementById('langArM').classList.toggle('active', CURRENT_LANG==='ar');
}
function switchLang(l){ setLang(l); applyLangUI(); render(); }
['langFr','langAr','langFrM','langArM'].forEach(id=>{
  document.getElementById(id).addEventListener('click', (e)=> switchLang(e.currentTarget.dataset.lang));
});

// ===================== DASHBOARD =====================
function renderDashboard(root){
  const totalShipments = EXPEDITIONS.length;
  const withReturn = EXPEDITIONS.filter(e => e.retour);
  const returns = withReturn.length;
  const weightSent = EXPEDITIONS.reduce((s,e)=> s + (e.poidsTotal||0), 0);
  let weightReturned = 0, piecesReceived = 0, piecesSent = 0, missing = 0, excess = 0, conformeCount=0, compareCount=0;
  EXPEDITIONS.forEach(e => {
    piecesSent += e.nbPieces || 0;
    if(e.retour && e.retour.comparaison){
      e.retour.comparaison.forEach(c => {
        weightReturned += (c.quantiteRecue||0) * (c.poidsUnitaire||0);
        piecesReceived += c.quantiteRecue || 0;
        if(c.statut === 'manquant') missing += Math.abs(c.difference);
        if(c.statut === 'excedent') excess += Math.abs(c.difference);
        if(c.statut !== 'inconnu'){ compareCount++; if(c.statut==='conforme') conformeCount++; }
      });
    }
  });
  const conformity = compareCount ? Math.round((conformeCount/compareCount)*1000)/10 : 0;

  // monthly counts
  const monthMap = {};
  EXPEDITIONS.forEach(e => { const m = monthKey(e.date); if(m) monthMap[m] = (monthMap[m]||0)+1; });
  const months = Object.keys(monthMap).sort();
  // weight flow monthly
  const wMap = {};
  EXPEDITIONS.forEach(e => { const m = monthKey(e.date); if(!m) return; wMap[m] = wMap[m] || {sent:0, ret:0}; wMap[m].sent += e.poidsTotal||0;
    if(e.retour && e.retour.comparaison) e.retour.comparaison.forEach(c => wMap[m].ret += (c.quantiteRecue||0)*(c.poidsUnitaire||0)); });
  const wMonths = Object.keys(wMap).sort();

  root.innerHTML = `
    <div class="grid stat-grid mb">
      <div class="card stat-card accent-blue"><div class="label">${t('dash.shipments')}</div><div class="value">${totalShipments}</div></div>
      <div class="card stat-card accent-green"><div class="label">${t('dash.returns')}</div><div class="value">${returns}</div></div>
      <div class="card stat-card accent-blue"><div class="label">${t('dash.weightsent')}</div><div class="value">${fmt(weightSent)}<small> ${t('common.kg')}</small></div></div>
      <div class="card stat-card accent-green"><div class="label">${t('dash.weightreturned')}</div><div class="value">${fmt(weightReturned)}<small> ${t('common.kg')}</small></div></div>
      <div class="card stat-card accent-blue"><div class="label">${t('dash.piecessent')}</div><div class="value">${piecesSent}</div></div>
      <div class="card stat-card accent-green"><div class="label">${t('dash.piecesreceived')}</div><div class="value">${piecesReceived}</div></div>
      <div class="card stat-card accent-red"><div class="label">${t('dash.missing')}</div><div class="value">${missing}</div></div>
      <div class="card stat-card accent-amber"><div class="label">${t('dash.excess')}</div><div class="value">${excess}</div></div>
      <div class="card stat-card ${conformity>=95?'accent-green':conformity>=80?'accent-amber':'accent-red'}"><div class="label">${t('dash.conformity')}</div><div class="value">${conformity}<small>%</small></div></div>
    </div>
    <div class="two-col">
      <div class="chart-card"><h3>${t('dash.monthly')}</h3><canvas id="chartMonthly" height="180"></canvas></div>
      <div class="chart-card"><h3>${t('dash.weightflow')}</h3><canvas id="chartWeight" height="180"></canvas></div>
    </div>
    <div class="section-title"><h2>${t('dash.recent')}</h2></div>
    <div id="recentList"></div>
  `;

  if(!EXPEDITIONS.length){
    root.querySelector('#recentList').innerHTML = emptyState('dash.empty', 'dash.empty.sub');
  } else {
    root.querySelector('#recentList').innerHTML = `<div class="table-wrap">${EXPEDITIONS.slice(0,6).map(histRowHtml).join('')}</div>`;
    bindHistRows(root);
  }

  drawBarChart('chartMonthly', months.map(m=>m), months.map(m=>monthMap[m]), t('dash.shipments'), '#33678f');
  drawLineChart('chartWeight', wMonths, [
    {label: t('dash.weightsent'), data: wMonths.map(m=>Math.round(wMap[m].sent)), color:'#33678f'},
    {label: t('dash.weightreturned'), data: wMonths.map(m=>Math.round(wMap[m].ret)), color:'#2f8f6f'},
  ]);
}

function emptyState(titleKey, subKey){
  return `<div class="card empty">${ICONS.reports}<div class="t1">${t(titleKey)}</div><div>${t(subKey)}</div></div>`;
}

function histRowHtml(e){
  const status = e.retour ? (e.status==='partiel' ? t('status.partial') : t('status.complete')) : t('status.pending');
  const pillClass = e.retour ? (e.status==='partiel' ? 'pill-excess' : 'pill-ok') : 'pill-unknown';
  return `<div class="hist-item" data-id="${e.id}">
    <div>
      <div class="hist-num">${esc(e.numero)}</div>
      <div class="hist-meta">${esc(e.client||'')} · ${esc(e.date||'')} · ${fmt(e.poidsTotal)} ${t('common.kg')}</div>
    </div>
    <span class="pill ${pillClass}">${status}</span>
  </div>`;
}
function bindHistRows(root){
  root.querySelectorAll('.hist-item').forEach(el => {
    el.addEventListener('click', () => showExpeditionDetail(parseInt(el.dataset.id)));
  });
}

function drawBarChart(canvasId, labels, data, label, color){
  const ctx = document.getElementById(canvasId);
  if(!ctx) return;
  if(CHARTS[canvasId]) CHARTS[canvasId].destroy();
  CHARTS[canvasId] = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ label, data, backgroundColor: color, borderRadius:4, maxBarThickness:36 }] },
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true, ticks:{precision:0}} } }
  });
}
function drawLineChart(canvasId, labels, series){
  const ctx = document.getElementById(canvasId);
  if(!ctx) return;
  if(CHARTS[canvasId]) CHARTS[canvasId].destroy();
  CHARTS[canvasId] = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets: series.map(s => ({ label:s.label, data:s.data, borderColor:s.color, backgroundColor:s.color+'33', tension:.3, fill:true })) },
    options:{ responsive:true, plugins:{legend:{position:'bottom'}}, scales:{ y:{beginAtZero:true} } }
  });
}

// ===================== NEW SHIPMENT =====================
function renderNewShipment(root){
  newPieces = newPieces.length ? newPieces : [];
  root.innerHTML = `
    <div class="card mb">
      <div class="form-grid">
        <div class="field"><label>${t('new.numero')}</label><input id="f_numero" value="EXP-${Date.now().toString().slice(-6)}"></div>
        <div class="field"><label>${t('new.date')}</label><input id="f_date" type="date" value="${todayISO()}"></div>
        <div class="field"><label>${t('new.client')}</label><input id="f_client"></div>
        <div class="field"><label>${t('new.societe')}</label><input id="f_societe"></div>
        <div class="field"><label>${t('new.camion')}</label><input id="f_camion"></div>
        <div class="field"><label>${t('new.chauffeur')}</label><input id="f_chauffeur"></div>
        <div class="field"><label>${t('new.bon')}</label><input id="f_bon"></div>
      </div>
      <div class="field mt"><label>${t('new.obs')}</label><textarea id="f_obs"></textarea></div>
    </div>

    <div class="card mb">
      <div class="section-title" style="margin-top:0;"><h2 style="font-size:16px;">${t('new.ocr')}</h2></div>
      ${ocrZoneHtml('new')}
    </div>

    <div class="card mb">
      <div class="section-title" style="margin-top:0;"><h2 style="font-size:16px;">${t('new.pieces')}</h2>
        <button class="btn btn-outline btn-sm" id="addRowBtn">${ICONS.plus} ${t('new.addrow')}</button>
      </div>
      <div id="pieceRows"></div>
    </div>

    <div class="gauge-wrap mb">
      <div class="gauge-head"><span class="g-title">${t('new.totalweight')}</span><span class="g-val" id="gaugeVal">0 / ${TRUCK_LIMIT_KG.toLocaleString()} kg</span></div>
      <div class="gauge-track"><div class="gauge-fill" id="gaugeFill" style="width:0%"></div></div>
      <div class="gauge-marks"><span>0</span><span>${TRUCK_LIMIT_KG/2}</span><span>${TRUCK_LIMIT_KG.toLocaleString()} kg (${t('new.limit')})</span></div>
      <div class="gauge-alert" id="gaugeAlert">${t('new.overlimit')}</div>
      <div class="subtle mt" id="pieceSummary"></div>
    </div>

    <button class="btn btn-primary" id="saveShipmentBtn">${t('new.save')}</button>
  `;
  document.getElementById('addRowBtn').addEventListener('click', () => { newPieces.push({repere:'', quantite:0, poidsUnitaire:0}); renderPieceRows(); });
  document.getElementById('saveShipmentBtn').addEventListener('click', saveNewShipment);
  setupOcrZone('new');
  if(!newPieces.length){ newPieces.push({repere:'', quantite:0, poidsUnitaire:0}); }
  renderPieceRows();
}

function renderPieceRows(){
  const wrap = document.getElementById('pieceRows');
  if(!wrap) return;
  wrap.innerHTML = newPieces.map((p, i) => `
    <div class="repere-row">
      <input placeholder="${t('new.repere')}" value="${esc(p.repere)}" data-i="${i}" data-f="repere" class="prow">
      <input placeholder="${t('new.qty')}" type="number" min="0" value="${p.quantite||''}" data-i="${i}" data-f="quantite" class="prow">
      <input placeholder="${t('new.punit')}" type="number" min="0" step="0.01" value="${p.poidsUnitaire||''}" data-i="${i}" data-f="poidsUnitaire" class="prow">
      <input readonly value="${fmt((p.quantite||0)*(p.poidsUnitaire||0))}" tabindex="-1">
      <button class="rm-btn" data-i="${i}">${ICONS.trash}</button>
    </div>
  `).join('');
  wrap.querySelectorAll('.prow').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const i = parseInt(e.target.dataset.i), f = e.target.dataset.f;
      newPieces[i][f] = (f==='repere') ? e.target.value : parseFloat(e.target.value)||0;
      updateGauge();
      // refresh only the total column without full rerender to keep focus
      const row = e.target.closest('.repere-row');
      row.children[3].value = fmt((newPieces[i].quantite||0)*(newPieces[i].poidsUnitaire||0));
    });
  });
  wrap.querySelectorAll('.rm-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { newPieces.splice(parseInt(e.currentTarget.dataset.i),1); if(!newPieces.length) newPieces.push({repere:'',quantite:0,poidsUnitaire:0}); renderPieceRows(); });
  });
  updateGauge();
}

function updateGauge(){
  const total = newPieces.reduce((s,p)=> s + (p.quantite||0)*(p.poidsUnitaire||0), 0);
  const nbRepere = newPieces.filter(p=>p.repere && p.repere.trim()).length;
  const nbPieces = newPieces.reduce((s,p)=> s + (p.quantite||0), 0);
  const pct = Math.min(100, (total/TRUCK_LIMIT_KG)*100);
  const fill = document.getElementById('gaugeFill');
  const alert = document.getElementById('gaugeAlert');
  if(!fill) return;
  fill.style.width = pct + '%';
  fill.className = 'gauge-fill' + (total > TRUCK_LIMIT_KG ? ' over' : total > TRUCK_LIMIT_KG*0.9 ? ' warn' : '');
  alert.classList.toggle('show', total > TRUCK_LIMIT_KG);
  document.getElementById('gaugeVal').textContent = `${fmt(total)} / ${TRUCK_LIMIT_KG.toLocaleString()} kg`;
  document.getElementById('pieceSummary').textContent = `${t('new.nbrepere')}: ${nbRepere}  ·  ${t('new.nbpieces')}: ${nbPieces}`;
}

async function saveNewShipment(){
  const numero = document.getElementById('f_numero').value.trim();
  const date = document.getElementById('f_date').value;
  if(!numero || !date){ toast(t('toast.error'), 'err'); return; }
  const validPieces = newPieces.filter(p => p.repere && p.repere.trim());
  if(!validPieces.length){ toast(t('toast.error'), 'err'); return; }
  const poidsTotal = validPieces.reduce((s,p)=> s + (p.quantite||0)*(p.poidsUnitaire||0), 0);
  const nbPieces = validPieces.reduce((s,p)=> s + (p.quantite||0), 0);
  const exp = {
    numero, date,
    client: document.getElementById('f_client').value.trim(),
    societe: document.getElementById('f_societe').value.trim(),
    camion: document.getElementById('f_camion').value.trim(),
    chauffeur: document.getElementById('f_chauffeur').value.trim(),
    bon: document.getElementById('f_bon').value.trim(),
    observations: document.getElementById('f_obs').value.trim(),
    pieces: validPieces.map(p => ({repere:p.repere.trim().toUpperCase(), quantite:p.quantite||0, poidsUnitaire:p.poidsUnitaire||0})),
    poidsTotal, nbPieces, nbRepere: validPieces.length,
    status: 'pending', retour: null, createdAt: new Date().toISOString(),
  };
  if(poidsTotal > TRUCK_LIMIT_KG) toast(t('toast.overweight'), 'warn');
  try{
    await DB.addExpedition(exp);
    toast(t('toast.saved'));
    newPieces = [];
    window.location.hash = '#/history';
  }catch(err){ console.error(err); toast(t('toast.error'), 'err'); }
}

// ===================== OCR ZONE (shared) =====================
function ocrZoneHtml(target){
  return `
  <div class="ocr-zone" id="ocrZone_${target}">
    <div class="btn-row" style="justify-content:center;">
      <label class="btn btn-steel btn-sm">${ICONS.camera} ${t('ocr.take')}
        <input type="file" accept="image/*" capture="environment" style="display:none" id="ocrCam_${target}">
      </label>
      <label class="btn btn-outline btn-sm">${ICONS.gallery} ${t('ocr.gallery')}
        <input type="file" accept="image/*" style="display:none" id="ocrGal_${target}">
      </label>
    </div>
    <img id="ocrPreview_${target}" class="ocr-preview" style="display:none;">
    <div class="ocr-status" id="ocrStatus_${target}"></div>
    <div class="ocr-result-list" id="ocrResults_${target}"></div>
  </div>`;
}

function setupOcrZone(target){
  const camInput = document.getElementById(`ocrCam_${target}`);
  const galInput = document.getElementById(`ocrGal_${target}`);
  [camInput, galInput].forEach(inp => inp && inp.addEventListener('change', (e) => handleOcrFile(e.target.files[0], target)));
}

async function handleOcrFile(file, target){
  if(!file) return;
  const preview = document.getElementById(`ocrPreview_${target}`);
  const status = document.getElementById(`ocrStatus_${target}`);
  const results = document.getElementById(`ocrResults_${target}`);
  const url = URL.createObjectURL(file);
  preview.src = url; preview.style.display = 'block';
  results.innerHTML = '';
  status.textContent = t('ocr.scanning');
  try{
    const { data } = await Tesseract.recognize(file, 'eng', { logger: () => {} });
    const codes = extractReperesFromText(data.text);
    if(!codes.length){
      status.textContent = t('ocr.none');
    } else {
      status.textContent = `${codes.length} ${t('ocr.found')}`;
      results.innerHTML = codes.map(c => `<span class="ocr-chip" data-code="${esc(c)}">${esc(c)} +</span>`).join('');
      results.querySelectorAll('.ocr-chip').forEach(chip => {
        chip.addEventListener('click', () => addOcrCode(chip.dataset.code, target));
      });
    }
  }catch(err){
    console.error(err);
    status.textContent = t('toast.error');
  }
}

function extractReperesFromText(text){
  const lines = text.split(/\n/);
  const found = new Set();
  lines.forEach(line => {
    const tokens = line.match(/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)?/g) || [];
    tokens.forEach(tok => {
      const clean = tok.trim().toUpperCase();
      if(clean.length >= 2 && clean.length <= 14 && /[0-9]/.test(clean)){
        found.add(clean);
      }
    });
  });
  return Array.from(found);
}

function addOcrCode(code, target){
  if(target === 'new'){
    const existing = newPieces.find(p => p.repere && p.repere.toUpperCase() === code);
    if(existing){ existing.quantite = (existing.quantite||0) + 1; }
    else {
      const empty = newPieces.find(p => !p.repere);
      if(empty){ empty.repere = code; empty.quantite = 1; }
      else newPieces.push({repere: code, quantite: 1, poidsUnitaire: 0});
    }
    renderPieceRows();
    toast(`${code} ${t('ocr.added')}`);
  } else if(target === 'reception' && receptionState){
    incrementReceived(code);
  }
}

// ===================== RECEPTION =====================
function renderReception(root){
  const pending = EXPEDITIONS.filter(e => !e.retour || e.status === 'partiel');
  root.innerHTML = `
    <div class="card mb">
      <label>${t('reception.select')}</label>
      <select id="expSelect">
        <option value="">${t('reception.choose')}</option>
        ${pending.map(e => `<option value="${e.id}">${esc(e.numero)} — ${esc(e.client||'')} (${esc(e.date)})</option>`).join('')}
      </select>
    </div>
    <div id="receptionBody"></div>
  `;
  document.getElementById('expSelect').addEventListener('change', (e) => {
    const id = parseInt(e.target.value);
    if(!id){ document.getElementById('receptionBody').innerHTML=''; receptionState=null; return; }
    loadReceptionForm(id);
  });
}

function loadReceptionForm(id){
  const exp = EXPEDITIONS.find(e => e.id === id);
  if(!exp) return;
  const receivedMap = {};
  (exp.retour && exp.retour.pieces ? exp.retour.pieces : []).forEach(p => receivedMap[p.repere] = p.quantiteRecue);
  receptionState = { expedition: exp, received: receivedMap, extra: [] };
  const body = document.getElementById('receptionBody');
  body.innerHTML = `
    <div class="card mb">
      <div class="notice-box notice-info">${ICONS.info}<span>${t('reception.ocr.hint')}</span></div>
      ${ocrZoneHtml('reception')}
    </div>
    <div class="card mb">
      <div class="field"><label>${t('reception.date')}</label><input id="retourDate" type="date" value="${todayISO()}"></div>
      <div class="table-wrap mt">
        <table>
          <thead><tr><th>${t('new.repere')}</th><th>${t('reception.sent')}</th><th>${t('reception.received')}</th></tr></thead>
          <tbody id="recepRows"></tbody>
        </table>
      </div>
      <div class="btn-row mt">
        <button class="btn btn-outline btn-sm" id="addUnknownBtn">${ICONS.plus} ${t('reception.addunknown')}</button>
      </div>
    </div>
    <button class="btn btn-primary" id="compareBtn">${t('reception.compare')}</button>
    <div id="comparisonResult" class="mt"></div>
  `;
  setupOcrZone('reception');
  renderRecepRows();
  document.getElementById('addUnknownBtn').addEventListener('click', () => {
    receptionState.extra.push('');
    renderRecepRows();
  });
  document.getElementById('compareBtn').addEventListener('click', validateReception);
}

function renderRecepRows(){
  const tbody = document.getElementById('recepRows');
  if(!tbody || !receptionState) return;
  const exp = receptionState.expedition;
  let rows = exp.pieces.map(p => `
    <tr>
      <td>${esc(p.repere)}</td>
      <td class="num">${p.quantite}</td>
      <td><input type="number" min="0" class="recQty" data-repere="${esc(p.repere)}" value="${receptionState.received[p.repere] ?? ''}"></td>
    </tr>`).join('');
  rows += receptionState.extra.map((val, i) => `
    <tr>
      <td><input placeholder="${t('new.repere')}" class="extraRepere" data-i="${i}" value="${esc(val)}"></td>
      <td class="num">0</td>
      <td><input type="number" min="0" class="extraQty" data-i="${i}" value=""></td>
    </tr>`).join('');
  tbody.innerHTML = rows;
  tbody.querySelectorAll('.recQty').forEach(inp => inp.addEventListener('input', (e)=>{
    receptionState.received[e.target.dataset.repere] = parseFloat(e.target.value)||0;
  }));
  tbody.querySelectorAll('.extraRepere').forEach(inp => inp.addEventListener('input', (e)=>{
    receptionState.extra[parseInt(e.target.dataset.i)] = e.target.value.toUpperCase();
  }));
}

function incrementReceived(code){
  const exp = receptionState.expedition;
  const known = exp.pieces.find(p => p.repere === code);
  if(known){
    receptionState.received[code] = (receptionState.received[code]||0) + 1;
    toast(`${code} ${t('ocr.added')}`);
  } else {
    const idx = receptionState.extra.findIndex(v => v === code);
    if(idx === -1){ receptionState.extra.push(code); }
    toast(t('toast.unknownrepere'), 'warn');
  }
  renderRecepRows();
  // bump the extra qty by 1 too if it's an unknown
  if(!known){
    const idx = receptionState.extra.findIndex(v => v === code);
    const inp = document.querySelector(`.extraQty[data-i="${idx}"]`);
    if(inp) inp.value = (parseFloat(inp.value)||0) + 1;
  }
}

async function validateReception(){
  const exp = receptionState.expedition;
  const comparaison = exp.pieces.map(p => {
    const recu = receptionState.received[p.repere] || 0;
    const diff = recu - p.quantite;
    let statut = 'conforme';
    if(diff < 0) statut = 'manquant'; else if(diff > 0) statut = 'excedent';
    return { repere:p.repere, envoye:p.quantite, quantiteRecue:recu, poidsUnitaire:p.poidsUnitaire, difference:diff, statut };
  });
  // extras (unknown reperes)
  document.querySelectorAll('.extraRepere').forEach(inp => {
    const i = parseInt(inp.dataset.i);
    const code = inp.value.trim().toUpperCase();
    const qtyInp = document.querySelector(`.extraQty[data-i="${i}"]`);
    const qty = parseFloat(qtyInp ? qtyInp.value : 0) || 0;
    if(code && qty > 0){
      comparaison.push({ repere:code, envoye:0, quantiteRecue:qty, poidsUnitaire:0, difference:qty, statut:'inconnu' });
    }
  });

  const anyMissing = comparaison.some(c => c.statut !== 'conforme' && c.statut !== 'inconnu' ? c.statut==='manquant' : false);
  const allEntered = comparaison.every(c => receptionState.received[c.repere] !== undefined || c.statut==='inconnu');
  exp.retour = { date: document.getElementById('retourDate').value || todayISO(), pieces: comparaison.map(c=>({repere:c.repere, quantiteRecue:c.quantiteRecue})), comparaison };
  exp.status = allEntered ? 'complete' : 'partiel';

  try{
    await DB.updateExpedition(exp);
    await DB.clearErreursForExpedition(exp.id);
    for(const c of comparaison){
      if(c.statut !== 'conforme'){
        await DB.addErreur({
          expeditionId: exp.id, expeditionNumero: exp.numero, repere: c.repere,
          type: c.statut, difference: c.difference, date: exp.retour.date, notes:'', photo:null
        });
        if(c.statut === 'manquant') toast(`${c.repere}: ${t('toast.missingdetected')}`, 'warn');
        if(c.statut === 'excedent') toast(`${c.repere}: ${t('toast.excessdetected')}`, 'warn');
        if(c.statut === 'inconnu') toast(`${c.repere}: ${t('toast.unknownrepere')}`, 'warn');
      }
    }
    toast(t('toast.saved'));
    renderComparisonResult(comparaison);
  }catch(err){ console.error(err); toast(t('toast.error'), 'err'); }
}

function renderComparisonResult(comparaison){
  const pillFor = (s) => s==='conforme' ? `<span class="pill pill-ok">✅ ${t('status.conforme')}</span>`
    : s==='manquant' ? `<span class="pill pill-miss">❌ ${t('status.manquant')}</span>`
    : s==='excedent' ? `<span class="pill pill-excess">➕ ${t('status.excedent')}</span>`
    : `<span class="pill pill-unknown">⚠ ${t('status.inconnu')}</span>`;
  const html = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>${t('new.repere')}</th><th>${t('reception.sent')}</th><th>${t('reception.received')}</th><th>${t('reception.diff')}</th><th>${t('reception.status')}</th></tr></thead>
        <tbody>
          ${comparaison.map(c => `<tr>
            <td>${esc(c.repere)}</td>
            <td class="num">${c.envoye}</td>
            <td class="num">${c.quantiteRecue}</td>
            <td class="num ${c.difference>0?'diff-pos':c.difference<0?'diff-neg':'diff-zero'}">${c.difference>0?'+':''}${c.difference}</td>
            <td>${pillFor(c.statut)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  document.getElementById('comparisonResult').innerHTML = html;
}

// ===================== HISTORY =====================
function renderHistory(root){
  if(!EXPEDITIONS.length){ root.innerHTML = emptyState('history.empty', 'dash.empty.sub'); return; }
  root.innerHTML = `<div class="table-wrap">${EXPEDITIONS.map(histRowHtml).join('')}</div>`;
  bindHistRows(root);
}

function showExpeditionDetail(id){
  const exp = EXPEDITIONS.find(e => e.id === id);
  if(!exp) return;
  const pillFor = (s) => s==='conforme' ? `<span class="pill pill-ok">${t('status.conforme')}</span>`
    : s==='manquant' ? `<span class="pill pill-miss">${t('status.manquant')}</span>`
    : s==='excedent' ? `<span class="pill pill-excess">${t('status.excedent')}</span>`
    : `<span class="pill pill-unknown">${t('status.inconnu')}</span>`;
  const compTable = exp.retour ? `
    <div class="table-wrap mt">
      <table><thead><tr><th>${t('new.repere')}</th><th>${t('reception.sent')}</th><th>${t('reception.received')}</th><th>${t('reception.diff')}</th><th>${t('reception.status')}</th></tr></thead>
      <tbody>${exp.retour.comparaison.map(c=>`<tr><td>${esc(c.repere)}</td><td class="num">${c.envoye}</td><td class="num">${c.quantiteRecue}</td><td class="num">${c.difference>0?'+':''}${c.difference}</td><td>${pillFor(c.statut)}</td></tr>`).join('')}</tbody></table>
    </div>` : `<p class="subtle mt">${t('status.pending')}</p>`;
  openModal(`
    <div class="modal-head"><h3>${esc(exp.numero)}</h3><button class="modal-close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div><label>${t('new.date')}</label><div>${esc(exp.date)}</div></div>
        <div><label>${t('new.client')}</label><div>${esc(exp.client||'—')}</div></div>
        <div><label>${t('new.societe')}</label><div>${esc(exp.societe||'—')}</div></div>
        <div><label>${t('new.camion')}</label><div>${esc(exp.camion||'—')}</div></div>
        <div><label>${t('new.chauffeur')}</label><div>${esc(exp.chauffeur||'—')}</div></div>
        <div><label>${t('new.bon')}</label><div>${esc(exp.bon||'—')}</div></div>
        <div><label>${t('new.totalweight')}</label><div>${fmt(exp.poidsTotal)} ${t('common.kg')}</div></div>
        <div><label>${t('new.nbpieces')}</label><div>${exp.nbPieces}</div></div>
      </div>
      ${exp.observations ? `<p class="subtle mt">${esc(exp.observations)}</p>` : ''}
      ${compTable}
      <div class="btn-row mt">
        <button class="btn btn-outline btn-sm" onclick="exportExpeditionPdf(${exp.id})">${t('reports.pdf')}</button>
        <button class="btn btn-outline btn-sm" onclick="exportExpeditionExcel(${exp.id})">${t('reports.excel')}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteExpeditionConfirm(${exp.id})">${ICONS.trash} ${t('common.delete')}</button>
      </div>
    </div>
  `);
}

async function deleteExpeditionConfirm(id){
  if(!confirm(t('common.confirm') + '?')) return;
  await DB.deleteExpedition(id);
  await DB.clearErreursForExpedition(id);
  closeModal();
  toast(t('toast.deleted'));
  render();
}

// ===================== SEARCH =====================
function renderSearch(root){
  root.innerHTML = `
    <div class="search-bar"><input id="searchInput" placeholder="${t('search.placeholder')}"></div>
    <div id="searchResults" class="subtle">${t('search.results')}: 0</div>
  `;
  document.getElementById('searchInput').addEventListener('input', (e) => doSearch(e.target.value.trim().toUpperCase()));
}

function doSearch(q){
  const out = document.getElementById('searchResults');
  if(!q){ out.innerHTML = `<div class="subtle">${t('search.results')}: 0</div>`; return; }
  const matches = [];
  EXPEDITIONS.forEach(e => {
    let hit = [e.numero, e.date, e.bon].some(v => (v||'').toUpperCase().includes(q));
    const pieceHits = (e.pieces||[]).filter(p => p.repere.toUpperCase().includes(q));
    if(hit || pieceHits.length) matches.push({exp:e, pieceHits});
  });
  out.innerHTML = `<div class="subtle mb">${t('search.results')}: ${matches.length}</div>` +
    matches.map(m => `
      <div class="hist-item" data-id="${m.exp.id}">
        <div>
          <div class="hist-num">${esc(m.exp.numero)}</div>
          <div class="hist-meta">${esc(m.exp.client||'')} · ${esc(m.exp.date)} ${m.pieceHits.length ? '· ' + m.pieceHits.map(p=>esc(p.repere)).join(', ') : ''}</div>
        </div>
      </div>`).join('');
  out.querySelectorAll('.hist-item').forEach(el => el.addEventListener('click', ()=> showExpeditionDetail(parseInt(el.dataset.id))));
}

// ===================== ERRORS HISTORY =====================
function renderErrors(root){
  if(!ERREURS.length){ root.innerHTML = emptyState('errors.empty', 'dash.empty.sub'); return; }
  const pillFor = (s) => s==='manquant' ? `<span class="pill pill-miss">${t('status.manquant')}</span>`
    : s==='excedent' ? `<span class="pill pill-excess">${t('status.excedent')}</span>`
    : `<span class="pill pill-unknown">${t('status.inconnu')}</span>`;
  root.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>${t('new.date')}</th><th>N° Expédition</th><th>${t('new.repere')}</th><th>${t('reception.status')}</th><th>${t('reception.diff')}</th><th>${t('errors.notes')}</th></tr></thead>
    <tbody>${ERREURS.map(er => `<tr class="errRow" data-id="${er.id}" style="cursor:pointer;">
      <td>${esc(er.date)}</td><td>${esc(er.expeditionNumero)}</td><td>${esc(er.repere)}</td><td>${pillFor(er.type)}</td>
      <td class="num ${er.difference>0?'diff-pos':'diff-neg'}">${er.difference>0?'+':''}${er.difference}</td>
      <td style="font-family:var(--sans); max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(er.notes||'—')}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
  root.querySelectorAll('.errRow').forEach(row => row.addEventListener('click', () => openErrorNoteModal(parseInt(row.dataset.id))));
}

function openErrorNoteModal(id){
  const er = ERREURS.find(x => x.id === id);
  if(!er) return;
  openModal(`
    <div class="modal-head"><h3>${esc(er.repere)} — ${esc(er.expeditionNumero)}</h3><button class="modal-close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="modal-body">
      <p class="subtle">${esc(er.date)} · ${t('reception.diff')}: ${er.difference}</p>
      <div class="field mt"><label>${t('errors.notes')}</label><textarea id="errNoteInput">${esc(er.notes||'')}</textarea></div>
      <div class="field mt"><label>${t('errors.addnote')}</label><input type="file" accept="image/*" id="errPhotoInput"></div>
      ${er.photo ? `<img src="${er.photo}" class="ocr-preview" style="max-height:140px;">` : ''}
      <div class="btn-row mt"><button class="btn btn-primary btn-sm" id="saveErrNoteBtn">${t('common.save')}</button></div>
    </div>
  `);
  document.getElementById('saveErrNoteBtn').addEventListener('click', async () => {
    er.notes = document.getElementById('errNoteInput').value;
    const fileInput = document.getElementById('errPhotoInput');
    if(fileInput.files[0]){
      er.photo = await fileToDataUrl(fileInput.files[0]);
    }
    await DB.updateErreur(er);
    toast(t('toast.saved'));
    closeModal();
    render();
  });
}
function fileToDataUrl(file){
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// ===================== STATS =====================
function renderStats(root){
  const missMap = {}, excMap = {};
  ERREURS.forEach(er => {
    if(er.type === 'manquant') missMap[er.repere] = (missMap[er.repere]||0) + Math.abs(er.difference);
    if(er.type === 'excedent') excMap[er.repere] = (excMap[er.repere]||0) + Math.abs(er.difference);
  });
  const topMissing = Object.entries(missMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const topExcess = Object.entries(excMap).sort((a,b)=>b[1]-a[1]).slice(0,8);

  const errMonthMap = {};
  ERREURS.forEach(er => { const m = monthKey(er.date); if(m) errMonthMap[m] = (errMonthMap[m]||0)+1; });
  const errMonths = Object.keys(errMonthMap).sort();

  const withRetour = EXPEDITIONS.filter(e=>e.retour).sort((a,b)=> (a.date||'').localeCompare(b.date||''));
  const confLabels = withRetour.map(e => e.numero);
  const confData = withRetour.map(e => {
    const comp = e.retour.comparaison.filter(c=>c.statut!=='inconnu');
    const ok = comp.filter(c=>c.statut==='conforme').length;
    return comp.length ? Math.round((ok/comp.length)*1000)/10 : 100;
  });

  root.innerHTML = `
    <div class="two-col mb">
      <div class="chart-card"><h3>${t('stats.topmissing')}</h3>${topMissing.length ? `<ul class="rank-list">${topMissing.map(([k,v])=>`<li><span class="r-code">${esc(k)}</span><span>${v}</span></li>`).join('')}</ul>` : `<p class="subtle">—</p>`}</div>
      <div class="chart-card"><h3>${t('stats.topexcess')}</h3>${topExcess.length ? `<ul class="rank-list">${topExcess.map(([k,v])=>`<li><span class="r-code">${esc(k)}</span><span>${v}</span></li>`).join('')}</ul>` : `<p class="subtle">—</p>`}</div>
    </div>
    <div class="two-col">
      <div class="chart-card"><h3>${t('stats.errorspermonth')}</h3><canvas id="chartErrMonth" height="180"></canvas></div>
      <div class="chart-card"><h3>${t('stats.conformitytrend')}</h3><canvas id="chartConfTrend" height="180"></canvas></div>
    </div>
  `;
  drawBarChart('chartErrMonth', errMonths, errMonths.map(m=>errMonthMap[m]), t('stats.errorspermonth'), '#c0392b');
  drawLineChart('chartConfTrend', confLabels, [{label: t('dash.conformity'), data: confData, color:'#2f8f6f'}]);
}

// ===================== REPORTS =====================
function renderReports(root){
  root.innerHTML = `
    <div class="card mb">
      <label>${t('reports.select')}</label>
      <select id="reportSelect">
        <option value="">—</option>
        ${EXPEDITIONS.map(e => `<option value="${e.id}">${esc(e.numero)} — ${esc(e.date)}</option>`).join('')}
      </select>
      <div class="btn-row mt">
        <button class="btn btn-outline" id="repPdfBtn" disabled>${t('reports.pdf')}</button>
        <button class="btn btn-outline" id="repXlsBtn" disabled>${t('reports.excel')}</button>
      </div>
    </div>
    <div id="reportPreview"></div>
  `;
  const sel = document.getElementById('reportSelect');
  sel.addEventListener('change', () => {
    const id = parseInt(sel.value);
    document.getElementById('repPdfBtn').disabled = !id;
    document.getElementById('repXlsBtn').disabled = !id;
    document.getElementById('reportPreview').innerHTML = id ? '' : '';
    if(id){
      const exp = EXPEDITIONS.find(e=>e.id===id);
      document.getElementById('reportPreview').innerHTML = exp.retour ? `<div class="table-wrap mt"><table><thead><tr><th>${t('new.repere')}</th><th>${t('reception.sent')}</th><th>${t('reception.received')}</th><th>${t('reception.diff')}</th></tr></thead><tbody>${exp.retour.comparaison.map(c=>`<tr><td>${esc(c.repere)}</td><td class="num">${c.envoye}</td><td class="num">${c.quantiteRecue}</td><td class="num">${c.difference}</td></tr>`).join('')}</tbody></table></div>` : `<p class="subtle mt">${t('status.pending')}</p>`;
    }
  });
  document.getElementById('repPdfBtn').addEventListener('click', () => exportExpeditionPdf(parseInt(sel.value)));
  document.getElementById('repXlsBtn').addEventListener('click', () => exportExpeditionExcel(parseInt(sel.value)));
}

function exportExpeditionPdf(id){
  const exp = EXPEDITIONS.find(e => e.id === id);
  if(!exp) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text('Steel Galvanizing Control Pro', 14, 16);
  doc.setFontSize(11); doc.text(`Expédition: ${exp.numero}`, 14, 26);
  doc.text(`Date: ${exp.date}    Client: ${exp.client||'-'}    Société: ${exp.societe||'-'}`, 14, 32);
  doc.text(`Camion: ${exp.camion||'-'}    Chauffeur: ${exp.chauffeur||'-'}    Bon: ${exp.bon||'-'}`, 14, 38);
  doc.text(`Poids total: ${fmt(exp.poidsTotal)} kg`, 14, 44);
  const rows = exp.retour ? exp.retour.comparaison.map(c => [c.repere, c.envoye, c.quantiteRecue, c.difference, c.statut]) : exp.pieces.map(p=>[p.repere, p.quantite, '-', '-', '-']);
  doc.autoTable({
    startY: 50,
    head: [['Repéré','Envoyé','Reçu','Écart','Statut']],
    body: rows,
    styles:{fontSize:9},
    headStyles:{fillColor:[18,40,63]},
  });
  let y = doc.lastAutoTable.finalY + 10;
  if(exp.retour){
    const comp = exp.retour.comparaison.filter(c=>c.statut!=='inconnu');
    const ok = comp.filter(c=>c.statut==='conforme').length;
    const rate = comp.length ? Math.round((ok/comp.length)*1000)/10 : 100;
    doc.text(`Taux de conformité: ${rate}%`, 14, y); y += 10;
  }
  y += 12;
  doc.text('_________________________', 14, y);
  doc.text('_________________________', 120, y);
  y += 6;
  doc.setFontSize(9);
  doc.text('Signature de l\'expéditeur', 14, y);
  doc.text('Signature du destinataire', 120, y);
  doc.save(`${exp.numero}.pdf`);
}

function exportExpeditionExcel(id){
  const exp = EXPEDITIONS.find(e => e.id === id);
  if(!exp) return;
  const rows = (exp.retour ? exp.retour.comparaison : exp.pieces.map(p=>({repere:p.repere, envoye:p.quantite, quantiteRecue:null, difference:null, statut:null}))).map(c => ({
    Repere: c.repere, Envoye: c.envoye, Recu: c.quantiteRecue, Ecart: c.difference, Statut: c.statut
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Comparaison');
  const infoWs = XLSX.utils.json_to_sheet([{
    Numero: exp.numero, Date: exp.date, Client: exp.client, Societe: exp.societe,
    Camion: exp.camion, Chauffeur: exp.chauffeur, Bon: exp.bon, PoidsTotal: exp.poidsTotal
  }]);
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info');
  XLSX.writeFile(wb, `${exp.numero}.xlsx`);
}

// ===================== INIT =====================
(function init(){
  applyTheme(localStorage.getItem('galva_theme') || 'light');
  setLang(CURRENT_LANG);
  applyLangUI();
  render();
  setInterval(() => {
    const el = document.getElementById('clock');
    if(el) el.textContent = new Date().toLocaleString(CURRENT_LANG==='ar'?'ar':'fr-FR', {dateStyle:'medium', timeStyle:'short'});
  }, 1000);
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();
