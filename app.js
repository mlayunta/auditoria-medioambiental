/* ==========================================================================
   ESG 360 · Núcleo de la aplicación
   Autor: Miguel Ángel Layunta López · v1.0.0
   ========================================================================== */
'use strict';

const APP = { name:'ESG 360', version:'1.0.0', author:'Miguel Ángel Layunta López', year:2026 };
const LS_KEY = 'esg360.db.v1';
const ROLE_KEY = 'esg360.role.v1';

const ROLES = {
  auditor:  { label:'Auditor externo',       can:['view','inspect','find','close','export'] },
  plant:    { label:'Responsable de planta', can:['view','find','close','export'] },
  director: { label:'Dirección',             can:['view','export'] },
  admin:    { label:'Administrador',         can:['view','inspect','find','close','export','config'] }
};

let DB = null;
const storedRole = localStorage.getItem(ROLE_KEY);
let ROLE = ROLES[storedRole] ? storedRole : 'auditor';
let CHARTS = {};
let VIEW = 'dashboard';
let CTX = {};

/* ============================ Utilidades ============================ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = (p = 'id') => p + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
const nowISO = () => new Date().toISOString();
const fmtDate = d => d ? new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
const fmtDT = d => d ? new Date(d).toLocaleString('es-ES', { dateStyle:'short', timeStyle:'short' }) : '—';
const num = v => (v === '' || v === null || v === undefined || isNaN(Number(v))) ? 0 : Number(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const can = a => (ROLES[ROLE]?.can || []).includes(a);
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, ms);
}

/* ============================ Persistencia ============================ */
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }
  catch (e) { toast('⚠️ Almacenamiento lleno. Exporta una copia de seguridad.'); }
}
function load() {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return seed();
}

/* ============================ IndexedDB (evidencias) ============================ */
const IDB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      if (this.db) return res(this.db);
      const r = indexedDB.open('esg360', 1);
      r.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('evidence')) d.createObjectStore('evidence');
      };
      r.onsuccess = e => { this.db = e.target.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async put(k, v) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction('evidence','readwrite'); t.objectStore('evidence').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
  async get(k) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction('evidence','readonly'); const q = t.objectStore('evidence').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  async del(k) { const d = await this.open(); return new Promise(res => { const t = d.transaction('evidence','readwrite'); t.objectStore('evidence').delete(k); t.oncomplete = res; }); }
};

/* ============================ Trazabilidad (hash encadenado) ============================ */
async function sha256(txt) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 'fnv' + (h >>> 0).toString(16);
}
async function commit(action, entity, detail) {
  const prev = DB.log.length ? DB.log[DB.log.length - 1].hash : 'GENESIS';
  const ts = nowISO();
  const actor = ROLES[ROLE].label;
  const hash = await sha256(JSON.stringify({ ts, action, entity, detail, actor, prev }));
  DB.log.push({ ts, action, entity, detail, actor, prev, hash });
  if (DB.log.length > 3000) DB.log = DB.log.slice(-3000);
  save();
}
async function verifyChain() {
  let prev = 'GENESIS', broken = 0;
  for (const e of DB.log) {
    const h = await sha256(JSON.stringify({ ts:e.ts, action:e.action, entity:e.entity, detail:e.detail, actor:e.actor, prev:e.prev }));
    if (h !== e.hash || e.prev !== prev) broken++;
    prev = e.hash;
  }
  return { total: DB.log.length, broken };
}

/* ============================ Datos de demostración ============================ */
function seed() {
  const db = {
    meta: { created: nowISO(), version: APP.version, author: APP.author },
    settings: { org:'Grupo Industrial Demo S.A.', theme:'dark', apiBase:'', apiKey:'', factors: { ...FACTORS } },
    inspections: [], findings: [], esg: [], log: [], demo: true
  };
  const sites = [
    ['Grupo Industrial Demo S.A.','Planta Norte','Zaragoza',41.6488,-0.8891],
    ['Grupo Industrial Demo S.A.','Planta Sur','Sevilla',37.3891,-5.9845],
    ['Construcciones Demo S.L.','Obra Logística','Valencia',39.4699,-0.3763],
    ['Servicios Demo S.A.','Sede Central','Madrid',40.4168,-3.7038],
    ['Química Demo S.A.','Planta Química','Tarragona',41.1189,1.2445],
    ['Grupo Industrial Demo S.A.','Centro Logístico','Bilbao',43.2630,-2.9350]
  ];
  const states = ['cerrada','cerrada','en_curso','cerrada','en_curso','cerrada'];
  sites.forEach((s, i) => {
    const answers = {};
    CHECKLIST.forEach(it => {
      if (it.when && !it.when(answers)) return;
      if (it.t === 'bool') answers[it.id] = Math.random() > (i === 4 ? 0.35 : 0.18);
      else if (it.t === 'num') answers[it.id] = Math.round(Math.random() * 900) + 40;
      else if (it.t === 'date') answers[it.id] = new Date(Date.now() + (Math.random() * 400 - 200) * 864e5).toISOString().slice(0, 10);
      else answers[it.id] = 'REG-' + (1000 + i * 7 + it.id.charCodeAt(1));
    });
    db.inspections.push({
      id: uid('insp'), org: s[0], site: s[1], loc: s[2],
      auditor: 'Miguel Ángel Layunta López',
      date: new Date(Date.now() - (i * 21 + 5) * 864e5).toISOString(),
      geo: { lat: s[3], lng: s[4], acc: 6 + i },
      status: states[i], answers, evidence: [], findings: [],
      sync: { dirty: i % 3 === 0, syncedAt: null }
    });
  });
  const demoFindings = [
    ['Archivo cronológico de residuos incompleto','Ley 7/2022 art. 65','Ley 7/2022',4,4,'abierto',0],
    ['Etiquetado de envases de residuos peligrosos deficiente','Decisión 2014/955/UE','Directiva 2008/98/CE',3,3,'abierto',1],
    ['Autorización de vertido caducada','RDL 1/2001','RDL 1/2001',3,5,'abierto',2],
    ['Ausencia de registro de formación ambiental','ISO 14001:2015 §7.2','ISO 14001',4,2,'cerrado',3],
    ['Medición de emisiones fuera de plazo','RD 100/2011','RD 100/2011',2,4,'abierto',4],
    ['Falta de informe preliminar de situación del suelo','RD 9/2005','RD 9/2005',2,5,'abierto',4],
    ['Plan de emergencia ambiental sin simulacro anual','ISO 14001:2015 §8.2','ISO 14001',3,3,'cerrado',5],
    ['Consumo eléctrico sin plan de eficiencia','ISO 50001:2018','ISO 50001',4,3,'abierto',0],
    ['No se aplican los ESRS en el informe de sostenibilidad','Reglamento Delegado (UE) 2023/2772','ESRS',3,4,'abierto',1],
    ['Garantía financiera de responsabilidad ambiental no constituida','Ley 26/2007 art. 24','Ley 26/2007',2,5,'abierto',2]
  ];
  demoFindings.forEach((f, i) => {
    const risk = f[3] * f[4];
    db.findings.push({
      id: uid('find'), inspectionId: db.inspections[f[6]].id, site: db.inspections[f[6]].site,
      title: f[0], clause: f[1], standard: f[2], probability: f[3], consequence: f[4], risk,
      level: riskLevel(risk).label, owner: ['Jefe de Planta','Responsable MA','Dirección Técnica'][i % 3],
      dueDate: new Date(Date.now() + (30 - i * 2) * 864e5).toISOString().slice(0, 10),
      status: f[5], evidence: [], createdAt: new Date(Date.now() - (i * 9 + 3) * 864e5).toISOString(),
      closedAt: f[5] === 'cerrado' ? new Date(Date.now() - i * 864e5).toISOString() : null,
      sync: { dirty: i % 2 === 0, syncedAt: null }
    });
  });
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  months.forEach((m, i) => {
    db.esg.push({
      id: uid('esg'), site: sites[i % sites.length][1], period: m,
      elec: 180000 + Math.round(Math.sin(i) * 40000) + i * 2200,
      gas: 95000 + Math.round(Math.cos(i) * 22000),
      diesel: 12000 + i * 320,
      water: 4200 + i * 90,
      wasteNP: 62 + i * 1.4,
      wasteP: 7.5 + (i % 4),
      recycled: 48 + i * 1.1
    });
  });
  return db;
}

/* ============================ Motor de cálculo ============================ */
function riskLevel(r) { return RISK_LEVELS.find(l => r <= l.max) || RISK_LEVELS[RISK_LEVELS.length - 1]; }

function footprint(rec) {
  const F = DB.settings.factors;
  const s1 = num(rec.diesel) * F.diesel_l + num(rec.gas) * F.gas_kwh;
  const s2 = num(rec.elec) * F.elec_kwh;
  const s3 = num(rec.water) * F.water_m3
           + num(rec.wasteNP) * F.waste_np_t
           + num(rec.wasteP) * F.waste_p_t;
  const total = s1 + s2 + s3;
  return { s1, s2, s3, total, t: total / 1000 };
}

function compliance(insp) {
  const items = CHECKLIST.filter(it => !it.when || it.when(insp.answers));
  const answered = items.filter(it => insp.answers[it.id] !== undefined && insp.answers[it.id] !== '');
  const ok = items.filter(it => insp.answers[it.id] === true).length;
  const ko = items.filter(it => insp.answers[it.id] === false).length;
  const pct = (ok + ko) ? Math.round(ok / (ok + ko) * 100) : 0;
  return { total: items.length, answered: answered.length, ok, ko, pct };
}

/* ============================ Sincronización ============================ */
function pendingCount() {
  const dirty = DB.inspections.filter(i => i.sync?.dirty).length
              + DB.findings.filter(f => f.sync?.dirty).length;
  return dirty;
}
function updateNetBadge() {
  const on = navigator.onLine;
  const b = $('#netBadge');
  b.textContent = on ? 'En línea' : 'Sin conexión';
  b.className = 'badge ' + (on ? 'badge-ok' : 'badge-off');
  const p = pendingCount();
  const sb = $('#syncBadge');
  sb.textContent = p + ' pendiente' + (p === 1 ? '' : 's');
  sb.className = 'badge ' + (p ? 'badge-warn' : '');
}
async function syncNow(silent) {
  const p = pendingCount();
  if (!p) { if (!silent) toast('✅ Todo sincronizado'); return; }
  const base = DB.settings.apiBase;
  if (!base) {
    DB.inspections.forEach(i => { if (i.sync?.dirty) i.sync = { dirty:false, syncedAt: nowISO() }; });
    DB.findings.forEach(f => { if (f.sync?.dirty) f.sync = { dirty:false, syncedAt: nowISO() }; });
    await commit('SYNC','local', p + ' registros marcados como sincronizados (sin endpoint configurado)');
    updateNetBadge(); render();
    if (!silent) toast('✅ ' + p + ' registros sincronizados localmente');
    return;
  }
  let ok = 0, fail = 0;
  const push = async (kind, rec) => {
    try {
      const r = await fetch(base.replace(/\/$/, '') + '/' + kind, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(DB.settings.apiKey ? { 'X-API-Key': DB.settings.apiKey } : {}) },
        body: JSON.stringify(rec)
      });
      if (r.ok) { rec.sync = { dirty:false, syncedAt: nowISO() }; ok++; } else fail++;
    } catch (e) { fail++; }
  };
  for (const i of DB.inspections.filter(x => x.sync?.dirty)) await push('inspections', i);
  for (const f of DB.findings.filter(x => x.sync?.dirty)) await push('findings', f);
  save();
  await commit('SYNC','api', ok + ' enviados, ' + fail + ' fallidos');
  updateNetBadge(); render();
  if (!silent) toast(fail ? ('⚠️ ' + ok + ' enviados · ' + fail + ' fallidos') : ('✅ ' + ok + ' registros sincronizados'));
}

/* ============================ Navegación ============================ */
const TABS = [
  ['dashboard','📊 Panel'], ['inspections','🔍 Inspecciones'], ['regulations','⚖️ Normativa'],
  ['findings','🧯 Hallazgos CAPA'], ['esg','🌍 ESG y huella'], ['integration','🔌 Integración'],
  ['settings','⚙️ Ajustes']
];
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([k, l]) =>
    '<button class="tab' + (VIEW === k ? ' active' : '') + '" data-act="nav" data-view="' + k + '">' + l + '</button>'
  ).join('');
}
function render() {
  renderTabs();
  const m = $('#main');
  if (VIEW === 'dashboard')   m.innerHTML = viewDashboard();
  if (VIEW === 'inspections') m.innerHTML = CTX.inspectionId ? viewInspection(CTX.inspectionId) : viewInspections();
  if (VIEW === 'regulations') m.innerHTML = viewRegulations();
  if (VIEW === 'findings')    m.innerHTML = viewFindings();
  if (VIEW === 'esg')         m.innerHTML = viewESG();
  if (VIEW === 'integration') m.innerHTML = viewIntegration();
  if (VIEW === 'settings')    m.innerHTML = viewSettings();
  updateNetBadge();
  requestAnimationFrame(drawCharts);
  hydrateEvidence();
}

/* ============================ VISTA: Panel ============================ */
function viewDashboard() {
  const insp = DB.inspections, fnd = DB.findings;
  const open = fnd.filter(f => f.status !== 'cerrado');
  const fp = DB.esg.reduce((a, r) => { const f = footprint(r); a.s1 += f.s1; a.s2 += f.s2; a.s3 += f.s3; a.total += f.total; return a; }, { s1:0, s2:0, s3:0, total:0 });
  const pct = insp.length ? Math.round(insp.reduce((a, i) => a + compliance(i).pct, 0) / insp.length) : 0;
  const critical = fnd.filter(f => f.level === 'Crítico' && f.status !== 'cerrado').length;
  const overdue = open.filter(f => f.dueDate && new Date(f.dueDate) < new Date()).length;

  return `
  <div class="grid g4">
    ${kpi('Inspecciones', insp.length, insp.filter(i => i.status === 'en_curso').length + ' en curso')}
    ${kpi('Cumplimiento medio', pct + '%', 'sobre checklist aplicable')}
    ${kpi('Hallazgos abiertos', open.length, overdue + ' vencidos · ' + critical + ' críticos')}
    ${kpi('Huella acumulada', round(fp.total / 1000, 1) + ' t', 'CO₂e en el periodo auditado')}
  </div>

  <h2 class="sec-title">📈 Analítica de cumplimiento</h2>
  <div class="grid g2">
    <div class="card"><h3>Evolución de la huella de carbono</h3><p class="card-sub">t CO₂e por periodo · Alcances 1, 2 y 3</p><canvas id="chFoot" height="180"></canvas>
      <div class="legend"><span><i class="dot" style="background:#f59e0b"></i>Alcance 1</span><span><i class="dot" style="background:#38bdf8"></i>Alcance 2</span><span><i class="dot" style="background:#22c55e"></i>Alcance 3</span></div>
    </div>
    <div class="card"><h3>Hallazgos por nivel de riesgo</h3><p class="card-sub">Matriz UNE 150008 · probabilidad × consecuencia</p><canvas id="chRisk" height="180"></canvas></div>
    <div class="card"><h3>Estado de los hallazgos</h3><p class="card-sub">Distribución del ciclo CAPA</p><canvas id="chStatus" height="180"></canvas></div>
    <div class="card"><h3>Cumplimiento por bloque normativo</h3><p class="card-sub">% de conformidad por sección del checklist</p><canvas id="chSec" height="180"></canvas></div>
  </div>

  <h2 class="sec-title">🚨 Alertas y vencimientos próximos</h2>
  <div class="card">${alertsTable()}</div>

  <h2 class="sec-title">🕓 Actividad reciente</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>Detalle</th><th>Hash</th></tr></thead>
    <tbody>${DB.log.slice(-8).reverse().map(l => `<tr>
      <td>${fmtDT(l.ts)}</td><td>${esc(l.actor)}</td><td><span class="chip c-info">${esc(l.action)}</span></td>
      <td>${esc(l.entity)}</td><td class="small">${esc(l.detail)}</td>
      <td class="small muted"><code>${esc(l.hash.slice(0, 10))}…</code></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Sin actividad registrada</td></tr>'}
    </tbody></table></div>`;
}
function kpi(label, value, detail) {
  return `<div class="card kpi"><span class="l">${label}</span><span class="v">${value}</span><span class="d">${detail}</span></div>`;
}
function alertsTable() {
  const rows = [];
  DB.inspections.forEach(i => {
    const a = i.answers || {};
    [['A8','Certificado ISO 14001'],['D3','Autorización Ambiental Integrada'],['E2','Autorización de vertido']].forEach(([k, name]) => {
      if (a[k]) {
        const days = Math.ceil((new Date(a[k]) - new Date()) / 864e5);
        if (days < 180) rows.push([name, i.site, a[k], days]);
      }
    });
  });
  DB.findings.filter(f => f.status !== 'cerrado' && f.dueDate).forEach(f => {
    const days = Math.ceil((new Date(f.dueDate) - new Date()) / 864e5);
    if (days < 30) rows.push(['Hallazgo: ' + f.title, f.site, f.dueDate, days]);
  });
  rows.sort((a, b) => a[3] - b[3]);
  if (!rows.length) return '<p class="muted small">No hay vencimientos en los próximos 180 días. Todo bajo control.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>Requisito</th><th>Instalación</th><th>Fecha límite</th><th>Situación</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${fmtDate(r[2])}</td>
      <td>${r[3] < 0 ? '<span class="chip c-danger">Vencido (' + Math.abs(r[3]) + ' d)</span>'
            : r[3] < 30 ? '<span class="chip c-warn">' + r[3] + ' días</span>'
            : '<span class="chip c-info">' + r[3] + ' días</span>'}</td></tr>`).join('')}
  </tbody></table></div>`;
}

/* ============================ VISTA: Inspecciones ============================ */
function viewInspections() {
  return `
  <div class="row" style="justify-content:space-between">
    <div><h2 class="sec-title" style="margin-top:0">🔍 Inspecciones de campo</h2>
      <p class="muted small">Checklists condicionales, evidencias multimodales y geolocalización con marca de tiempo.</p></div>
    <button class="btn btn-primary" data-act="new-inspection" ${can('inspect') ? '' : 'disabled'}>＋ Nueva inspección</button>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Instalación</th><th>Organización</th><th>Auditor</th><th>Fecha</th><th>GPS</th><th>Cumplimiento</th><th>Estado</th><th>Sync</th><th></th></tr></thead>
    <tbody>${DB.inspections.map(i => {
      const c = compliance(i);
      return `<tr>
        <td><strong>${esc(i.site)}</strong><div class="small muted">${esc(i.loc || '')}</div></td>
        <td class="small">${esc(i.org)}</td>
        <td class="small">${esc(i.auditor)}</td>
        <td class="small">${fmtDate(i.date)}</td>
        <td class="small muted">${i.geo ? i.geo.lat.toFixed(4) + ', ' + i.geo.lng.toFixed(4) : '—'}</td>
        <td style="min-width:120px"><div class="progress"><i style="width:${c.pct}%"></i></div><span class="small muted">${c.pct}% · ${c.answered}/${c.total}</span></td>
        <td>${i.status === 'cerrada' ? '<span class="chip c-ok">Cerrada</span>' : '<span class="chip c-warn">En curso</span>'}</td>
        <td>${i.sync?.dirty ? '<span class="chip c-warn">Pendiente</span>' : '<span class="chip c-ok">OK</span>'}</td>
        <td><button class="btn btn-sm" data-act="open-inspection" data-id="${i.id}">Abrir</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="9" class="muted">Sin inspecciones. Crea la primera.</td></tr>'}
    </tbody></table></div>`;
}

function viewInspection(id) {
  const insp = DB.inspections.find(i => i.id === id);
  if (!insp) return '<p>Inspección no encontrada.</p>';
  const c = compliance(insp);
  const items = CHECKLIST.filter(it => !it.when || it.when(insp.answers));
  const sections = [...new Set(items.map(i => i.sec))];
  const fnds = DB.findings.filter(f => f.inspectionId === id);

  return `
  <div class="row" style="justify-content:space-between">
    <div>
      <button class="btn btn-sm" data-act="nav" data-view="inspections">← Volver</button>
      <h2 class="sec-title" style="margin:.6rem 0 .2rem">${esc(insp.site)}</h2>
      <p class="muted small">${esc(insp.org)} · ${esc(insp.loc || '')} · Auditor: ${esc(insp.auditor)} · ${fmtDate(insp.date)}</p>
    </div>
    <div class="row">
      <button class="btn btn-sm" data-act="geo" data-id="${id}">📍 Geolocalizar</button>
      <button class="btn btn-sm" data-act="qr" data-id="${id}">🔳 Escanear QR</button>
      <button class="btn btn-sm" data-act="voice" data-id="${id}">🎙️ Nota de voz</button>
      <button class="btn btn-sm" data-act="evidence" data-id="${id}">📷 Evidencia</button>
      <button class="btn btn-sm" data-act="ocr" data-id="${id}">🧾 OCR albarán</button>
      <button class="btn btn-sm" data-act="export-pdf" data-id="${id}">📄 Informe</button>
      <button class="btn btn-sm btn-primary" data-act="close-inspection" data-id="${id}" ${insp.status === 'cerrada' ? 'disabled' : ''}>✔ Cerrar inspección</button>
    </div>
  </div>

  <div class="card mt">
    <div class="row" style="justify-content:space-between">
      <span class="small"><strong>Progreso:</strong> ${c.answered}/${c.total} puntos · ${c.ok} conformes · ${c.ko} no conformes</span>
      <span class="small muted">${insp.geo ? '📍 ' + insp.geo.lat.toFixed(5) + ', ' + insp.geo.lng.toFixed(5) + ' (±' + insp.geo.acc + ' m)' : 'Sin geolocalización'}</span>
    </div>
    <div class="progress mt"><i style="width:${c.pct}%"></i></div>
  </div>

  <h2 class="sec-title">📋 Checklist condicional</h2>
  ${sections.map(sec => `
    <h3 class="small muted" style="margin:.9rem 0 .4rem; text-transform:uppercase; letter-spacing:.06em">${esc(sec)}</h3>
    ${items.filter(i => i.sec === sec).map(it => checklistItem(insp, it)).join('')}
  `).join('')}

  <h2 class="sec-title">🧯 Hallazgos de esta inspección</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Hallazgo</th><th>Referencia</th><th>Riesgo</th><th>Responsable</th><th>Plazo</th><th>Estado</th><th></th></tr></thead>
    <tbody>${fnds.map(f => `<tr>
      <td>${esc(f.title)}</td><td class="small">${esc(f.clause)}</td>
      <td><span class="chip ${riskLevel(f.risk).cls}">${f.risk} · ${f.level}</span></td>
      <td class="small">${esc(f.owner)}</td><td class="small">${fmtDate(f.dueDate)}</td>
      <td>${f.status === 'cerrado' ? '<span class="chip c-ok">Cerrado</span>' : '<span class="chip c-warn">Abierto</span>'}</td>
      <td><button class="btn btn-sm" data-act="open-finding" data-id="${f.id}">Ver</button></td>
    </tr>`).join('') || '<tr><td colspan="7" class="muted">Sin hallazgos registrados en esta inspección.</td></tr>'}
    </tbody></table></div>

  <h2 class="sec-title">📎 Evidencias</h2>
  <div class="card"><div class="gallery" id="gallery-${id}">${insp.evidence.map(evCard).join('') || '<p class="muted small">Sin evidencias. Usa la cámara, el QR o una nota de voz.</p>'}</div></div>`;
}

function checklistItem(insp, it) {
  const v = insp.answers[it.id];
  const reg = REGULATIONS.find(r => r.code === it.std || r.id === it.std);
  const refHtml = it.ref ? (reg ? `<a href="${reg.url}" target="_blank" rel="noopener">${esc(it.ref)}</a>` : esc(it.ref)) : '';
  let control = '';
  if (it.t === 'bool') {
    control = `<div class="seg">
      <button class="${v === true ? 'on-ok' : ''}" data-act="ans" data-id="${insp.id}" data-k="${it.id}" data-v="true">Conforme</button>
      <button class="${v === false ? 'on-no' : ''}" data-act="ans" data-id="${insp.id}" data-k="${it.id}" data-v="false">No conformidad</button>
      <button class="${v === 'na' ? 'on-na' : ''}" data-act="ans" data-id="${insp.id}" data-k="${it.id}" data-v="na">N/A</button>
    </div>`;
  } else if (it.t === 'num') {
    control = `<input class="input" type="number" step="any" value="${v ?? ''}" data-act="ans-input" data-id="${insp.id}" data-k="${it.id}" placeholder="Valor numérico">`;
  } else if (it.t === 'date') {
    control = `<input class="input" type="date" value="${v ?? ''}" data-act="ans-input" data-id="${insp.id}" data-k="${it.id}">`;
  } else {
    control = `<input class="input" style="min-width:240px" value="${esc(v ?? '')}" data-act="ans-input" data-id="${insp.id}" data-k="${it.id}" placeholder="Respuesta">`;
  }
  return `<div class="item ${it.when ? 'cond' : ''}">
    <div class="item-head">
      <div><div class="item-q">${esc(it.q)}</div>${refHtml ? `<div class="item-ref">↳ ${refHtml}</div>` : ''}</div>
      <button class="btn btn-sm" title="Registrar hallazgo" data-act="new-finding" data-id="${insp.id}" data-k="${it.id}">⚑</button>
    </div>
    <div class="item-body">${control}</div>
  </div>`;
}

function evCard(ev) {
  const isImg = (ev.type || '').startsWith('image');
  return `<div class="ev" data-ev="${ev.id}">
    ${isImg ? `<img alt="${esc(ev.name)}" data-act="view-ev" data-id="${ev.id}" style="background:var(--panel2)">` : `<div style="padding:1rem;text-align:center;font-size:1.6rem">${ev.type === 'voice' ? '🎙️' : ev.type === 'qr' ? '🔳' : '📄'}</div>`}
    <div class="meta">${esc(ev.name)}<br>${fmtDT(ev.ts)}${ev.geo ? '<br>📍 ' + ev.geo.lat.toFixed(4) + ', ' + ev.geo.lng.toFixed(4) : ''}</div>
    <button class="del" data-act="del-ev" data-id="${ev.id}">✕</button>
  </div>`;
}

async function hydrateEvidence() {
  for (const img of $$('img[data-act="view-ev"]')) {
    if (img.dataset.hydrated) continue;
    const blob = await IDB.get(img.dataset.id);
    if (blob) { img.src = URL.createObjectURL(blob); img.dataset.hydrated = '1'; }
  }
}

/* ============================ VISTA: Normativa ============================ */
function viewRegulations() {
  const q = (CTX.regQ || '').toLowerCase();
  const scope = CTX.regScope || 'TODAS';
  const list = REGULATIONS.filter(r => {
    const okScope = scope === 'TODAS' || r.scope === scope;
    const okQ = !q || (r.code + ' ' + r.title + ' ' + r.tags.join(' ')).toLowerCase().includes(q);
    return okScope && okQ;
  });
  const scopes = ['TODAS', 'UE', 'ES', 'ISO', 'UNE', 'OTRO'];
  return `
  <h2 class="sec-title" style="margin-top:0">⚖️ Repositorio normativo</h2>
  <p class="muted small">Legislación europea, española, normas ISO/UNE y marcos voluntarios vinculados a cada punto del checklist. Los enlaces son editables y se guardan en tu dispositivo.</p>
  <div class="card">
    <div class="row">
      <input class="input" style="flex:1;min-width:220px" placeholder="Buscar por código, título o etiqueta…" value="${esc(CTX.regQ || '')}" data-act="reg-search">
      <select class="select" data-act="reg-scope">${scopes.map(s => `<option ${s === scope ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <span class="chip c-info">${list.length} referencias</span>
    </div>
  </div>
  <div class="table-wrap mt"><table>
    <thead><tr><th>Código</th><th>Denominación</th><th>Ámbito</th><th>Categoría</th><th>Etiquetas</th><th>Enlace</th></tr></thead>
    <tbody>${list.map(r => `<tr>
      <td><strong>${esc(r.code)}</strong></td>
      <td>${esc(r.title)}</td>
      <td><span class="chip ${r.scope === 'UE' ? 'c-info' : r.scope === 'ES' ? 'c-warn' : 'c-ok'}">${r.scope}</span></td>
      <td class="small">${esc(r.cat)}</td>
      <td class="small muted">${r.tags.map(t => '#' + esc(t)).join(' ')}</td>
      <td class="row">
        <a class="btn btn-sm" href="${r.url}" target="_blank" rel="noopener">Abrir ↗</a>
        <button class="btn btn-sm" data-act="edit-reg" data-id="${r.id}" title="Corregir enlace">✎</button>
      </td>
    </tr>`).join('')}
    </tbody></table></div>`;
}

/* ============================ VISTA: Hallazgos CAPA ============================ */
function viewFindings() {
  const f = DB.findings;
  const open = f.filter(x => x.status !== 'cerrado');
  const byLevel = l => f.filter(x => x.level === l).length;
  return `
  <div class="row" style="justify-content:space-between">
    <div><h2 class="sec-title" style="margin-top:0">🧯 Hallazgos y planes de acción (CAPA)</h2>
      <p class="muted small">Cierre con evidencia obligatoria y priorización automática según UNE 150008.</p></div>
    <div class="row">
      <button class="btn" data-act="export-csv">⬇ Excel (CSV)</button>
      <button class="btn btn-primary" data-act="new-finding-free" ${can('find') ? '' : 'disabled'}>＋ Nuevo hallazgo</button>
    </div>
  </div>

  <div class="grid g4">
    ${kpi('Abiertos', open.length, 'requieren acción')}
    ${kpi('Críticos', byLevel('Crítico'), 'SLA 7 días')}
    ${kpi('Altos', byLevel('Alto'), 'SLA 30 días')}
    ${kpi('Cerrados', f.filter(x => x.status === 'cerrado').length, 'con evidencia de cierre')}
  </div>

  <h2 class="sec-title">Matriz de riesgo UNE 150008</h2>
  <div class="card">${riskMatrix()}</div>

  <h2 class="sec-title">Registro de hallazgos</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Hallazgo</th><th>Instalación</th><th>Referencia</th><th>P</th><th>C</th><th>Riesgo</th><th>Responsable</th><th>Plazo</th><th>Estado</th><th></th></tr></thead>
    <tbody>${f.map(x => `<tr>
      <td><strong>${esc(x.title)}</strong></td>
      <td class="small">${esc(x.site || '—')}</td>
      <td class="small muted">${esc(x.clause || '')}</td>
      <td>${x.probability}</td><td>${x.consequence}</td>
      <td><span class="chip ${riskLevel(x.risk).cls}">${x.risk} · ${x.level}</span></td>
      <td class="small">${esc(x.owner || '—')}</td>
      <td class="small">${fmtDate(x.dueDate)}</td>
      <td>${x.status === 'cerrado' ? '<span class="chip c-ok">Cerrado</span>' : '<span class="chip c-warn">Abierto</span>'}</td>
      <td><button class="btn btn-sm" data-act="open-finding" data-id="${x.id}">Gestionar</button></td>
    </tr>`).join('') || '<tr><td colspan="10" class="muted">Sin hallazgos registrados.</td></tr>'}
    </tbody></table></div>`;
}

function riskMatrix() {
  let html = '<div class="table-wrap"><table><thead><tr><th>P \\ C</th>';
  for (let c = 1; c <= 5; c++) html += `<th title="${CONSEQUENCE[c-1]}">${c} · ${CONSEQUENCE[c-1]}</th>`;
  html += '</tr></thead><tbody>';
  for (let p = 5; p >= 1; p--) {
    html += `<tr><th title="${PROBABILITY[p-1]}">${p} · ${PROBABILITY[p-1]}</th>`;
    for (let c = 1; c <= 5; c++) {
      const r = p * c, lv = riskLevel(r);
      const n = DB.findings.filter(f => f.probability === p && f.consequence === c).length;
      html += `<td style="text-align:center"><span class="chip ${lv.cls}">${r}${n ? ' · ' + n : ''}</span></td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  html += '<div class="legend">' + RISK_LEVELS.map(l => `<span><i class="dot" style="background:${l.cls === 'c-ok' ? '#22c55e' : l.cls === 'c-info' ? '#38bdf8' : l.cls === 'c-warn' ? '#f59e0b' : '#ef4444'}"></i>${l.label} (≤${l.max}) · SLA ${l.sla} d</span>`).join('') + '</div>';
  return html;
}

/* ============================ VISTA: ESG ============================ */
function viewESG() {
  const agg = DB.esg.reduce((a, r) => { const f = footprint(r); a.s1 += f.s1; a.s2 += f.s2; a.s3 += f.s3; a.total += f.total; return a; }, { s1:0, s2:0, s3:0, total:0 });
  const elec = DB.esg.reduce((a, r) => a + num(r.elec), 0);
  const water = DB.esg.reduce((a, r) => a + num(r.water), 0);
  const wNP = DB.esg.reduce((a, r) => a + num(r.wasteNP), 0);
  const wP = DB.esg.reduce((a, r) => a + num(r.wasteP), 0);
  const rec = DB.esg.reduce((a, r) => a + num(r.recycled), 0);
  const intensity = elec ? round(agg.total / elec * 1000, 3) : 0;

  return `
  <div class="row" style="justify-content:space-between">
    <div><h2 class="sec-title" style="margin-top:0">🌍 Métricas ESG y huella ambiental</h2>
      <p class="muted small">Conexión directa entre los datos auditados y el cálculo de huella de carbono (GHG Protocol · ISO 14064-1 · ISO 14067).</p></div>
    <button class="btn" data-act="export-csv">⬇ Excel (CSV)</button>
  </div>

  <div class="grid g4">
    ${kpi('Huella total', round(agg.total / 1000, 1) + ' t', 'CO₂e acumulado')}
    ${kpi('Alcance 1', round(agg.s1 / 1000, 1) + ' t', 'emisiones directas')}
    ${kpi('Alcance 2', round(agg.s2 / 1000, 1) + ' t', 'energía adquirida')}
    ${kpi('Intensidad', intensity, 'kg CO₂e / MWh')}
  </div>

  <div class="grid g2 mt">
    <div class="card"><h3>Reparto por alcance</h3><p class="card-sub">GHG Protocol · Alcances 1, 2 y 3</p><canvas id="chScope" height="200"></canvas></div>
    <div class="card"><h3>Consumos y residuos</h3><p class="card-sub">Totales del periodo auditado</p><canvas id="chRes" height="200"></canvas></div>
  </div>

  <h2 class="sec-title">Indicadores ESG consolidados</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Indicador</th><th>Valor</th><th>Unidad</th><th>Referencia ESRS</th><th>Norma de cálculo</th></tr></thead>
    <tbody>
      <tr><td>Consumo eléctrico total</td><td>${elec.toLocaleString('es-ES')}</td><td>kWh</td><td>E1-5</td><td>ISO 50001</td></tr>
      <tr><td>Consumo de agua</td><td>${water.toLocaleString('es-ES')}</td><td>m³</td><td>E3-4</td><td>ISO 14046</td></tr>
      <tr><td>Residuos no peligrosos</td><td>${round(wNP, 1)}</td><td>t</td><td>E5-5</td><td>Ley 7/2022</td></tr>
      <tr><td>Residuos peligrosos</td><td>${round(wP, 1)}</td><td>t</td><td>E5-5</td><td>Ley 7/2022</td></tr>
      <tr><td>Tasa de valorización</td><td>${round(rec, 1)}</td><td>%</td><td>E5-5</td><td>Directiva (UE) 2018/851</td></tr>
      <tr><td>Huella de carbono</td><td>${round(agg.total / 1000, 2)}</td><td>t CO₂e</td><td>E1-6</td><td>ISO 14064-1</td></tr>
    </tbody></table></div>

  <h2 class="sec-title">Registros de actividad</h2>
  <div class="card">
    <div class="row">
      <input class="input" id="esgSite" placeholder="Instalación" style="min-width:160px">
      <input class="input" id="esgPeriod" placeholder="Periodo (ej. Dic)" style="width:120px">
      <input class="input" id="esgElec" type="number" placeholder="kWh" style="width:110px">
      <input class="input" id="esgGas" type="number" placeholder="kWh gas" style="width:110px">
      <input class="input" id="esgDiesel" type="number" placeholder="L gasóleo" style="width:110px">
      <input class="input" id="esgWater" type="number" placeholder="m³ agua" style="width:110px">
      <input class="input" id="esgWnp" type="number" placeholder="t RNP" style="width:100px">
      <input class="input" id="esgWp" type="number" placeholder="t RP" style="width:100px">
      <button class="btn btn-primary" data-act="add-esg" ${can('inspect') ? '' : 'disabled'}>＋ Añadir</button>
    </div>
  </div>
  <div class="table-wrap mt"><table>
    <thead><tr><th>Instalación</th><th>Periodo</th><th>kWh</th><th>Gas</th><th>Gasóleo</th><th>Agua</th><th>RNP</th><th>RP</th><th>t CO₂e</th><th></th></tr></thead>
    <tbody>${DB.esg.map(r => `<tr>
      <td>${esc(r.site)}</td><td>${esc(r.period)}</td>
      <td>${num(r.elec).toLocaleString('es-ES')}</td><td>${num(r.gas).toLocaleString('es-ES')}</td>
      <td>${num(r.diesel).toLocaleString('es-ES')}</td><td>${num(r.water).toLocaleString('es-ES')}</td>
      <td>${num(r.wasteNP)}</td><td>${num(r.wasteP)}</td>
      <td><strong>${round(footprint(r).t, 2)}</strong></td>
      <td><button class="btn btn-sm btn-danger" data-act="del-esg" data-id="${r.id}">✕</button></td>
    </tr>`).join('') || '<tr><td colspan="10" class="muted">Sin registros.</td></tr>'}
    </tbody></table></div>

  <h2 class="sec-title">🤖 Asistente del auditor</h2>
  <div class="card">
    <p class="card-sub">Sugerencias de redacción y detección de patrones recurrentes entre sedes (motor local, sin envío de datos).</p>
    <div class="row"><button class="btn" data-act="ai-patterns">Detectar patrones recurrentes</button><button class="btn" data-act="ai-draft">Redactar hallazgo tipo</button></div>
    <div id="aiOut" class="mt small"></div>
  </div>`;
}

/* ============================ VISTA: Integración ============================ */
function viewIntegration() {
  return `
  <h2 class="sec-title" style="margin-top:0">🔌 Arquitectura abierta e integraciones</h2>
  <p class="muted small">Conecta ESG 360 con tu ERP, sensores IoT y plataformas EHS para eliminar la duplicidad de datos.</p>

  <div class="grid g2">
    <div class="card">
      <h3>Configuración de la API</h3>
      <p class="card-sub">Endpoint REST que recibirá las inspecciones y hallazgos pendientes.</p>
      <label class="small muted">URL base</label>
      <input class="input" style="width:100%" id="apiBase" value="${esc(DB.settings.apiBase)}" placeholder="https://api.tuempresa.com/esg/v1">
      <label class="small muted mt" style="display:block">Clave de API</label>
      <input class="input" style="width:100%" id="apiKey" type="password" value="${esc(DB.settings.apiKey)}" placeholder="••••••••">
      <div class="row mt"><button class="btn btn-primary" data-act="save-api" ${can('config') ? '' : 'disabled'}>Guardar</button>
        <button class="btn" data-act="sync">Probar sincronización</button></div>
      <p class="small muted mt">Contrato esperado: <code>POST /inspections</code> y <code>POST /findings</code> con el objeto completo en JSON.</p>
    </div>

    <div class="card">
      <h3>Control de acceso por roles</h3>
      <p class="card-sub">Permisos aplicados en la interfaz según el rol activo.</p>
      <div class="table-wrap"><table style="min-width:0">
        <thead><tr><th>Rol</th><th>Permisos</th></tr></thead>
        <tbody>${Object.entries(ROLES).map(([k, r]) => `<tr>
          <td>${r.label}${k === ROLE ? ' <span class="chip c-ok">activo</span>' : ''}</td>
          <td class="small muted">${r.can.join(' · ')}</td></tr>`).join('')}
        </tbody></table></div>
    </div>
  </div>

  <h2 class="sec-title">Catálogo de conectores</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Sistema</th><th>Tipo</th><th>Protocolo</th><th>Descripción</th><th>Estado</th></tr></thead>
    <tbody>${INTEGRATIONS.map(i => `<tr>
      <td><strong>${esc(i.name)}</strong></td><td><span class="chip c-info">${esc(i.type)}</span></td>
      <td class="small">${esc(i.proto)}</td><td class="small muted">${esc(i.desc)}</td>
      <td><span class="chip">Disponible</span></td></tr>`).join('')}
    </tbody></table></div>

  <h2 class="sec-title">🛡️ Trazabilidad y registro inalterable</h2>
  <div class="card">
    <div class="row" style="justify-content:space-between">
      <div><strong>Cadena de auditoría</strong><p class="card-sub" style="margin:0">Cada evento se encadena con SHA-256 al anterior. Cualquier manipulación rompe la cadena.</p></div>
      <button class="btn btn-primary" data-act="verify-log">Verificar integridad</button>
    </div>
    <div id="logOut" class="mt small"></div>
  </div>
  <div class="table-wrap mt"><table>
    <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>Detalle</th><th>Hash previo</th><th>Hash</th></tr></thead>
    <tbody>${DB.log.slice(-40).reverse().map(l => `<tr>
      <td class="small">${fmtDT(l.ts)}</td><td class="small">${esc(l.actor)}</td>
      <td><span class="chip c-info">${esc(l.action)}</span></td><td class="small">${esc(l.entity)}</td>
      <td class="small muted">${esc(l.detail)}</td>
      <td class="small muted"><code>${esc(String(l.prev).slice(0, 8))}…</code></td>
      <td class="small muted"><code>${esc(l.hash.slice(0, 8))}…</code></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Sin eventos.</td></tr>'}
    </tbody></table></div>`;
}

/* ============================ VISTA: Ajustes ============================ */
function viewSettings() {
  const F = DB.settings.factors;
  return `
  <h2 class="sec-title" style="margin-top:0">⚙️ Ajustes</h2>
  <div class="grid g2">
    <div class="card">
      <h3>Organización</h3>
      <label class="small muted">Nombre de la organización auditada</label>
      <input class="input" style="width:100%" id="orgName" value="${esc(DB.settings.org)}">
      <div class="row mt"><button class="btn btn-primary" data-act="save-org">Guardar</button></div>
    </div>
    <div class="card">
      <h3>Datos y copias de seguridad</h3>
      <p class="card-sub">Exporta o restaura toda la base de datos local en JSON.</p>
      <div class="row">
        <button class="btn" data-act="backup">⬇ Exportar JSON</button>
        <label class="btn" style="cursor:pointer">⬆ Importar JSON<input type="file" accept=".json" hidden data-act="restore"></label>
        <button class="btn btn-danger" data-act="reset-demo">Reiniciar datos demo</button>
      </div>
    </div>
  </div>

  <h2 class="sec-title">Factores de emisión</h2>
  <div class="card">
    <p class="card-sub">Ajusta los factores a la realidad de tu organización o a la fuente oficial que utilices.</p>
    <div class="grid g4">
      ${Object.entries(F).map(([k, v]) => `<div><label class="small muted">${k}</label>
        <input class="input" style="width:100%" type="number" step="any" data-factor="${k}" value="${v}"></div>`).join('')}
    </div>
    <div class="row mt"><button class="btn btn-primary" data-act="save-factors">Guardar factores</button></div>
  </div>

  <h2 class="sec-title">Acerca de</h2>
  <div class="card">
    <p><strong>${APP.name} v${APP.version}</strong> — Plataforma de auditoría ambiental y ESG.</p>
    <p class="small muted">Autoría y desarrollo: <strong>Miguel Ángel Layunta López</strong> · © ${APP.year}. Licencia MIT.</p>
    <p class="small muted">Los datos se almacenan exclusivamente en el dispositivo del usuario (localStorage + IndexedDB). No se envía información a terceros salvo que configures un endpoint de API.</p>
  </div>`;
}

/* ============================ Gráficas ============================ */
function mkChart(id, cfg) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!el.parentElement.classList.contains('chart-box')) {
    const box = document.createElement('div');
    box.className = 'chart-box';
    el.parentNode.insertBefore(box, el);
    box.appendChild(el);
  }
  if (CHARTS[id]) { CHARTS[id].destroy(); delete CHARTS[id]; }
  if (!window.Chart) { fallbackBars(el, cfg); return; }
  const grid = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#1d4a3b';
  const txt = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#9cc6b4';
  Chart.defaults.color = txt;
  Chart.defaults.borderColor = grid;
  Chart.defaults.font.family = 'Segoe UI, system-ui, sans-serif';
  CHARTS[id] = new Chart(el, cfg);
}

function fallbackBars(el, cfg) {
  const data = cfg.data.datasets[0]?.data || [];
  const max = Math.max(...data, 1);
  el.outerHTML = '<div>' + data.map((v, i) =>
    `<div style="display:flex;align-items:center;gap:.5rem;margin:.2rem 0"><span class="small muted" style="width:70px">${esc(cfg.data.labels[i] || '')}</span>
     <div style="flex:1;background:var(--panel2);border-radius:6px;overflow:hidden"><div style="width:${v / max * 100}%;height:14px;background:linear-gradient(90deg,#22c55e,#14b8a6)"></div></div>
     <span class="small">${round(v, 1)}</span></div>`).join('') + '</div>';
}

function drawCharts() {
  if (VIEW === 'dashboard') {
    const labels = DB.esg.map(r => r.period);
    mkChart('chFoot', {
      type:'line',
      data:{ labels, datasets:[
        { label:'Alcance 1', data: DB.esg.map(r => round(footprint(r).s1 / 1000, 2)), borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,.15)', fill:true, tension:.35, pointRadius:2 },
        { label:'Alcance 2', data: DB.esg.map(r => round(footprint(r).s2 / 1000, 2)), borderColor:'#38bdf8', backgroundColor:'rgba(56,189,248,.15)', fill:true, tension:.35, pointRadius:2 },
        { label:'Alcance 3', data: DB.esg.map(r => round(footprint(r).s3 / 1000, 2)), borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.15)', fill:true, tension:.35, pointRadius:2 }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, title:{ display:true, text:'t CO₂e' } } } }
    });
    const levels = ['Bajo','Moderado','Alto','Crítico'];
    mkChart('chRisk', {
      type:'bar',
      data:{ labels: levels, datasets:[{ label:'Hallazgos', data: levels.map(l => DB.findings.filter(f => f.level === l).length),
        backgroundColor:['#22c55e','#38bdf8','#f59e0b','#ef4444'], borderRadius:8 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } }
    });
    mkChart('chStatus', {
      type:'doughnut',
      data:{ labels:['Abiertos','Cerrados'], datasets:[{ data:[DB.findings.filter(f => f.status !== 'cerrado').length, DB.findings.filter(f => f.status === 'cerrado').length],
        backgroundColor:['#f59e0b','#22c55e'], borderWidth:0 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ position:'bottom' } } }
    });
    const secs = [...new Set(CHECKLIST.map(i => i.sec))];
    mkChart('chSec', {
      type:'bar',
      data:{ labels: secs.map(s => s.split('.')[0]), datasets:[{ label:'% conformidad',
        data: secs.map(s => {
          const items = CHECKLIST.filter(i => i.sec === s);
          let ok = 0, tot = 0;
          DB.inspections.forEach(insp => items.forEach(it => { if (!it.when || it.when(insp.answers)) { const v = insp.answers[it.id]; if (v === true) { ok++; tot++; } else if (v === false) tot++; } }));
          return tot ? Math.round(ok / tot * 100) : 0;
        }), backgroundColor:'#14b8a6', borderRadius:8 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 } } }
    });
  }
  if (VIEW === 'esg') {
    const agg = DB.esg.reduce((a, r) => { const f = footprint(r); a.s1 += f.s1; a.s2 += f.s2; a.s3 += f.s3; return a; }, { s1:0, s2:0, s3:0 });
    mkChart('chScope', {
      type:'doughnut',
      data:{ labels:['Alcance 1','Alcance 2','Alcance 3'], datasets:[{ data:[round(agg.s1 / 1000, 2), round(agg.s2 / 1000, 2), round(agg.s3 / 1000, 2)],
        backgroundColor:['#f59e0b','#38bdf8','#22c55e'], borderWidth:0 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'58%', plugins:{ legend:{ position:'bottom' } } }
    });
    mkChart('chRes', {
      type:'bar',
      data:{ labels:['RNP (t)','RP (t)','Agua (m³/100)','Valorización (%)'],
        datasets:[{ label:'Totales', data:[
          round(DB.esg.reduce((a, r) => a + num(r.wasteNP), 0), 1),
          round(DB.esg.reduce((a, r) => a + num(r.wasteP), 0), 1),
          round(DB.esg.reduce((a, r) => a + num(r.water), 0) / 100, 1),
          round(DB.esg.reduce((a, r) => a + num(r.recycled), 0) / DB.esg.length, 1)
        ], backgroundColor:['#22c55e','#ef4444','#38bdf8','#14b8a6'], borderRadius:8 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
    });
  }
}

/* ============================ Modales ============================ */
function openModal(html) { $('#modalBox').innerHTML = html; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modalBox').innerHTML = ''; }

function modalNewInspection() {
  openModal(`
    <h3>Nueva inspección</h3>
    <div class="grid" style="gap:.6rem">
      <div><label class="small muted">Organización</label><input class="input" style="width:100%" id="niOrg" value="${esc(DB.settings.org)}"></div>
      <div><label class="small muted">Instalación / obra</label><input class="input" style="width:100%" id="niSite" placeholder="Planta Norte"></div>
      <div><label class="small muted">Localidad</label><input class="input" style="width:100%" id="niLoc" placeholder="Zaragoza"></div>
      <div><label class="small muted">Auditor</label><input class="input" style="width:100%" id="niAud" value="Miguel Ángel Layunta López"></div>
    </div>
    <div class="row mt" style="justify-content:flex-end">
      <button class="btn" data-act="close-modal">Cancelar</button>
      <button class="btn btn-primary" data-act="create-inspection">Crear y geolocalizar</button>
    </div>`);
}

function modalFinding(inspId, itemId) {
  const item = itemId ? CHECKLIST.find(i => i.id === itemId) : null;
  openModal(`
    <h3>Registrar hallazgo</h3>
    <div class="grid" style="gap:.6rem">
      <div><label class="small muted">Descripción del hallazgo</label>
        <textarea class="textarea" id="fTitle">${item ? esc('Incumplimiento detectado en: ' + item.q) : ''}</textarea></div>
      <div class="grid g2" style="gap:.6rem">
        <div><label class="small muted">Referencia normativa</label><input class="input" style="width:100%" id="fClause" value="${item ? esc(item.ref || '') : ''}"></div>
        <div><label class="small muted">Norma / estándar</label><input class="input" style="width:100%" id="fStd" value="${item ? esc(item.std || '') : ''}"></div>
      </div>
      <div class="grid g2" style="gap:.6rem">
        <div><label class="small muted">Probabilidad (1–5)</label><select class="select" style="width:100%" id="fP">${PROBABILITY.map((p, i) => `<option value="${i+1}" ${i === 2 ? 'selected' : ''}>${i+1} · ${p}</option>`).join('')}</select></div>
        <div><label class="small muted">Consecuencia (1–5)</label><select class="select" style="width:100%" id="fC">${CONSEQUENCE.map((c, i) => `<option value="${i+1}" ${i === 2 ? 'selected' : ''}>${i+1} · ${c}</option>`).join('')}</select></div>
      </div>
      <div class="grid g2" style="gap:.6rem">
        <div><label class="small muted">Responsable del cierre</label><input class="input" style="width:100%" id="fOwner" placeholder="Jefe de planta"></div>
        <div><label class="small muted">Plazo de cierre</label><input class="input" style="width:100%" type="date" id="fDue" value="${new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)}"></div>
      </div>
      <div id="fRiskPreview" class="small muted"></div>
    </div>
    <div class="row mt" style="justify-content:flex-end">
      <button class="btn" data-act="close-modal">Cancelar</button>
      <button class="btn btn-primary" data-act="save-finding" data-insp="${inspId || ''}">Guardar hallazgo</button>
    </div>`);
  const upd = () => {
    const r = num($('#fP').value) * num($('#fC').value);
    const lv = riskLevel(r);
    $('#fRiskPreview').innerHTML = `Riesgo calculado: <span class="chip ${lv.cls}">${r} · ${lv.label}</span> · SLA ${lv.sla} días · ${lv.action}`;
  };
  $('#fP').onchange = upd; $('#fC').onchange = upd; upd();
}

function modalFindingDetail(id) {
  const f = DB.findings.find(x => x.id === id);
  if (!f) return;
  const lv = riskLevel(f.risk);
  openModal(`
    <h3>${esc(f.title)}</h3>
    <p class="small muted">${esc(f.site || '')} · Referencia: ${esc(f.clause || '—')} · Norma: ${esc(f.standard || '—')}</p>
    <div class="row"><span class="chip ${lv.cls}">Riesgo ${f.risk} · ${f.level}</span>
      <span class="chip">SLA ${lv.sla} días</span>
      <span class="chip ${f.status === 'cerrado' ? 'c-ok' : 'c-warn'}">${f.status === 'cerrado' ? 'Cerrado' : 'Abierto'}</span></div>
    <p class="small mt">${esc(lv.action)}</p>
    <div class="grid g2 mt" style="gap:.6rem">
      <div><label class="small muted">Responsable</label><input class="input" style="width:100%" id="dOwner" value="${esc(f.owner || '')}"></div>
      <div><label class="small muted">Plazo</label><input class="input" style="width:100%" type="date" id="dDue" value="${f.dueDate || ''}"></div>
    </div>
    <div class="mt"><label class="small muted">Evidencia de cierre (obligatoria para cerrar)</label>
      <input type="file" accept="image/*" capture="environment" multiple data-act="close-evidence" data-id="${f.id}" class="input" style="width:100%"></div>
    <div class="gallery mt">${f.evidence.map(evCard).join('') || '<p class="small muted">Sin evidencias de cierre.</p>'}</div>
    <div class="row mt" style="justify-content:flex-end">
      <button class="btn" data-act="close-modal">Cerrar</button>
      <button class="btn" data-act="save-finding-detail" data-id="${f.id}">Guardar cambios</button>
      <button class="btn btn-primary" data-act="close-finding" data-id="${f.id}" ${f.status === 'cerrado' ? 'disabled' : ''}>✔ Cerrar hallazgo</button>
    </div>`);
}

/* ============================ Acciones ============================ */
const ACTIONS = {
  nav(el) { VIEW = el.dataset.view; if (VIEW !== 'inspections') CTX.inspectionId = null; render(); window.scrollTo({ top:0, behavior:'smooth' }); },
  'close-modal'() { closeModal(); },
  sync() { syncNow(); },

  'new-inspection'() { modalNewInspection(); },
  async 'create-inspection'() {
    const site = $('#niSite').value.trim();
    if (!site) return toast('Indica la instalación');
    const insp = {
      id: uid('insp'), org: $('#niOrg').value.trim(), site, loc: $('#niLoc').value.trim(),
      auditor: $('#niAud').value.trim() || APP.author, date: nowISO(), geo: null,
      status:'en_curso', answers:{}, evidence:[], findings:[], sync:{ dirty:true, syncedAt:null }
    };
    DB.inspections.unshift(insp);
    await commit('CREATE','inspección', site);
    closeModal();
    CTX.inspectionId = insp.id; VIEW = 'inspections';
    render();
    geolocate(insp.id);
  },
  'open-inspection'(el) { CTX.inspectionId = el.dataset.id; VIEW = 'inspections'; render(); window.scrollTo({ top:0 }); },

  async ans(el) {
    const insp = DB.inspections.find(i => i.id === el.dataset.id);
    if (!insp) return;
    const k = el.dataset.k, v = el.dataset.v;
    insp.answers[k] = v === 'true' ? true : v === 'false' ? false : 'na';
    insp.sync = { dirty:true, syncedAt:null };
    await commit('ANSWER', insp.site, k + ' = ' + v);
    render();
  },
  async 'ans-input'(el) {
    const insp = DB.inspections.find(i => i.id === el.dataset.id);
    if (!insp) return;
    insp.answers[el.dataset.k] = el.value;
    insp.sync = { dirty:true, syncedAt:null };
    save();
  },

  async geo(el) { geolocate(el.dataset.id); },

  qr(el) { scanQR(el.dataset.id); },
  voice(el) { voiceNote(el.dataset.id); },
  evidence(el) { pickEvidence(el.dataset.id); },
  ocr(el) { runOCR(el.dataset.id); },

  'new-finding'(el) { modalFinding(el.dataset.id, el.dataset.k); },
  'new-finding-free'() { modalFinding(DB.inspections[0]?.id || '', null); },
  'open-finding'(el) { modalFindingDetail(el.dataset.id); },

  async 'save-finding'(el) {
    const p = num($('#fP').value), c = num($('#fC').value), risk = p * c;
    const f = {
      id: uid('find'), inspectionId: el.dataset.insp || null,
      site: DB.inspections.find(i => i.id === el.dataset.insp)?.site || '',
      title: $('#fTitle').value.trim(), clause: $('#fClause').value.trim(), standard: $('#fStd').value.trim(),
      probability: p, consequence: c, risk, level: riskLevel(risk).label,
      owner: $('#fOwner').value.trim(), dueDate: $('#fDue').value,
      status:'abierto', evidence:[], createdAt: nowISO(), closedAt: null,
      sync:{ dirty:true, syncedAt:null }
    };
    if (!f.title) return toast('Describe el hallazgo');
    DB.findings.unshift(f);
    await commit('FINDING','hallazgo', f.title + ' (riesgo ' + risk + ')');
    closeModal(); render();
    toast('Hallazgo registrado · riesgo ' + risk + ' (' + f.level + ')');
  },
  async 'save-finding-detail'(el) {
    const f = DB.findings.find(x => x.id === el.dataset.id);
    f.owner = $('#dOwner').value.trim(); f.dueDate = $('#dDue').value;
    f.sync = { dirty:true, syncedAt:null };
    await commit('UPDATE','hallazgo', f.title);
    closeModal(); render(); toast('Hallazgo actualizado');
  },
  async 'close-finding'(el) {
    const f = DB.findings.find(x => x.id === el.dataset.id);
    if (!f.evidence.length) return toast('⚠️ Adjunta evidencia fotográfica antes de cerrar');
    f.status = 'cerrado'; f.closedAt = nowISO(); f.sync = { dirty:true, syncedAt:null };
    await commit('CLOSE','hallazgo', f.title);
    closeModal(); render(); toast('✅ Hallazgo cerrado con evidencia');
  },
  async 'close-evidence'(el) {
    const f = DB.findings.find(x => x.id === el.dataset.id);
    for (const file of el.files) {
      const ev = await storeEvidence(file, null, 'cierre');
      f.evidence.push(ev);
    }
    f.sync = { dirty:true, syncedAt:null };
    await commit('EVIDENCE','hallazgo', f.evidence.length + ' evidencias');
    modalFindingDetail(f.id);
  },

  async 'close-inspection'(el) {
    const insp = DB.inspections.find(i => i.id === el.dataset.id);
    insp.status = 'cerrada'; insp.sync = { dirty:true, syncedAt:null };
    await commit('CLOSE','inspección', insp.site);
    render(); toast('Inspección cerrada');
  },

  async 'add-esg'() {
    const rec = {
      id: uid('esg'), site: $('#esgSite').value.trim() || 'Instalación',
      period: $('#esgPeriod').value.trim() || '—',
      elec: num($('#esgElec').value), gas: num($('#esgGas').value), diesel: num($('#esgDiesel').value),
      water: num($('#esgWater').value), wasteNP: num($('#esgWnp').value), wasteP: num($('#esgWp').value), recycled: 0
    };
    DB.esg.push(rec);
    await commit('CREATE','ESG', rec.site + ' · ' + rec.period);
    render(); toast('Registro ESG añadido');
  },
  async 'del-esg'(el) {
    DB.esg = DB.esg.filter(r => r.id !== el.dataset.id);
    await commit('DELETE','ESG', el.dataset.id);
    render();
  },

  'save-api'() {
    DB.settings.apiBase = $('#apiBase').value.trim();
    DB.settings.apiKey = $('#apiKey').value.trim();
    save(); toast('Configuración de API guardada');
  },
  'save-org'() { DB.settings.org = $('#orgName').value.trim(); save(); toast('Organización guardada'); },
  'save-factors'() {
    $$('[data-factor]').forEach(i => { DB.settings.factors[i.dataset.factor] = num(i.value); });
    save(); render(); toast('Factores de emisión actualizados');
  },

  async 'verify-log'() {
    const r = await verifyChain();
    $('#logOut').innerHTML = r.broken === 0
      ? `<span class="chip c-ok">✔ Cadena íntegra</span> ${r.total} eventos verificados con SHA-256.`
      : `<span class="chip c-danger">✖ ${r.broken} inconsistencias</span> de ${r.total} eventos.`;
  },

  'export-csv'() { exportCSV(); },
  'export-pdf'(el) { exportPDF(el.dataset.id); },

  'ai-patterns'() {
    const counts = {};
    DB.findings.forEach(f => { const k = f.clause || f.standard || 'Sin referencia'; counts[k] = (counts[k] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).filter(x => x[1] > 1).slice(0, 6);
    $('#aiOut').innerHTML = top.length
      ? '<strong>Patrones recurrentes detectados:</strong><ul>' + top.map(([k, n]) =>
          `<li><code>${esc(k)}</code> aparece en <strong>${n}</strong> hallazgos de distintas sedes → recomienda acción corporativa transversal.</li>`).join('') + '</ul>'
      : '<span class="muted">No se detectan patrones repetidos con los datos actuales.</span>';
  },
  'ai-draft'() {
    const f = DB.findings.find(x => x.status !== 'cerrado');
    if (!f) return toast('No hay hallazgos abiertos');
    const lv = riskLevel(f.risk);
    $('#aiOut').innerHTML = `<strong>Borrador sugerido:</strong><div class="card mt" style="background:var(--panel2)">
      <p class="small">Se detecta un incumplimiento en <strong>${esc(f.site)}</strong> relativo a <em>${esc(f.title)}</em>, en relación con el requisito
      <strong>${esc(f.clause)}</strong> (${esc(f.standard)}). La evaluación conforme a UNE 150008 arroja un riesgo
      <strong>${f.risk} (${f.level})</strong>, con probabilidad ${f.probability}/5 y consecuencia ${f.consequence}/5.
      Se asigna a <strong>${esc(f.owner || 'responsable pendiente')}</strong> con plazo ${fmtDate(f.dueDate)}.
      ${esc(lv.action)}</p></div>`;
  },

  'backup'() {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'esg360-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click(); toast('Copia de seguridad descargada');
  },
  'restore'(el) {
    const file = el.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      try { DB = JSON.parse(r.result); save(); await commit('RESTORE','base de datos','Importación desde JSON'); render(); toast('Datos restaurados'); }
      catch (e) { toast('⚠️ Archivo no válido'); }
    };
    r.readAsText(file);
  },
  async 'reset-demo'() {
    if (!confirm('¿Reiniciar todos los datos con el conjunto de demostración?')) return;
    DB = seed(); save(); await commit('RESET','base de datos','Reinicio de datos demo'); render(); toast('Datos reiniciados');
  },

  'edit-reg'(el) {
    const r = REGULATIONS.find(x => x.id === el.dataset.id);
    const url = prompt('URL oficial para ' + r.code + ':', r.url);
    if (url) { r.url = url; save(); render(); toast('Enlace actualizado'); }
  },
  'view-ev'(el) { viewEvidence(el.dataset.id); },
  async 'del-ev'(el) { await IDB.del(el.dataset.id); toast('Evidencia eliminada'); }
};

/* ============================ Captura multimodal ============================ */
function geolocate(inspId) {
  if (!navigator.geolocation) return toast('Geolocalización no disponible');
  toast('📍 Obteniendo posición…');
  navigator.geolocation.getCurrentPosition(async pos => {
    const insp = DB.inspections.find(i => i.id === inspId);
    if (!insp) return;
    insp.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy), ts: nowISO() };
    insp.sync = { dirty:true, syncedAt:null };
    await commit('GEO', insp.site, insp.geo.lat.toFixed(5) + ', ' + insp.geo.lng.toFixed(5));
    render(); toast('📍 Posición registrada con marca de tiempo');
  }, err => toast('⚠️ No se pudo obtener la posición: ' + err.message), { enableHighAccuracy:true, timeout:12000 });
}

function pickEvidence(inspId) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'; inp.multiple = true;
  inp.onchange = async () => {
    const insp = DB.inspections.find(i => i.id === inspId);
    for (const file of inp.files) {
      const ev = await storeEvidence(file, insp.geo, 'campo');
      insp.evidence.push(ev);
    }
    insp.sync = { dirty:true, syncedAt:null };
    await commit('EVIDENCE','inspección', inp.files.length + ' archivos en ' + insp.site);
    render(); toast('📷 Evidencia añadida con geolocalización');
  };
  inp.click();
}

async function storeEvidence(file, geo, kind) {
  const id = uid('ev');
  let blob = file, type = file.type, name = file.name;
  if (type.startsWith('image/')) {
    const c = await compressImage(file);
    blob = c.blob; type = 'image/jpeg'; name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  }
  await IDB.put(id, blob);
  return { id, name, type, size: blob.size, ts: nowISO(), geo: geo || null, kind };
}

function compressImage(file, max = 1280, q = 0.72) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = img.width * s; cv.height = img.height * s;
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob(b => res({ blob: b || file }), 'image/jpeg', q);
    };
    img.onerror = () => res({ blob: file });
    img.src = URL.createObjectURL(file);
  });
}

async function viewEvidence(id) {
  const blob = await IDB.get(id);
  if (!blob) return toast('Evidencia no disponible');
  const url = URL.createObjectURL(blob);
  openModal(`<h3>Evidencia</h3><img src="${url}" style="width:100%;border-radius:12px">
    <div class="row mt" style="justify-content:flex-end"><a class="btn" href="${url}" download>⬇ Descargar</a>
    <button class="btn" data-act="close-modal">Cerrar</button></div>`);
}

function scanQR(inspId) {
  if (!('BarcodeDetector' in window)) {
    const code = prompt('Tu navegador no soporta lectura nativa de códigos. Introduce el código manualmente:');
    if (code) saveQR(inspId, code);
    return;
  }
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.onchange = async () => {
    const det = new BarcodeDetector({ formats:['qr_code','code_128','ean_13','data_matrix'] });
    const bmp = await createImageBitmap(inp.files[0]);
    const codes = await det.detect(bmp);
    if (codes.length) saveQR(inspId, codes[0].rawValue);
    else toast('⚠️ No se detectó ningún código');
  };
  inp.click();
}
async function saveQR(inspId, value) {
  const insp = DB.inspections.find(i => i.id === inspId);
  insp.evidence.push({ id: uid('ev'), name:'QR: ' + value.slice(0, 40), type:'qr', ts: nowISO(), geo: insp.geo, value });
  insp.answers['QR_' + Date.now().toString(36)] = value;
  insp.sync = { dirty:true, syncedAt:null };
  await commit('QR','inspección', value.slice(0, 60));
  render(); toast('🔳 Código registrado: ' + value.slice(0, 30));
}

function voiceNote(inspId) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('Reconocimiento de voz no disponible en este navegador');
  const rec = new SR();
  rec.lang = 'es-ES'; rec.interimResults = false; rec.maxAlternatives = 1;
  toast('🎙️ Escuchando… habla ahora');
  rec.onresult = async e => {
    const text = e.results[0][0].transcript;
    const insp = DB.inspections.find(i => i.id === inspId);
    insp.evidence.push({ id: uid('ev'), name:'Nota de voz', type:'voice', ts: nowISO(), geo: insp.geo, text });
    insp.sync = { dirty:true, syncedAt:null };
    await commit('VOICE','inspección', text.slice(0, 80));
    render(); toast('🎙️ Nota transcrita y guardada');
  };
  rec.onerror = () => toast('⚠️ Error en el reconocimiento de voz');
  rec.start();
}

function runOCR(inspId) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.onchange = async () => {
    toast('🧾 Procesando OCR…');
    try {
      if (!window.Tesseract) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
      }
      const { data } = await Tesseract.recognize(inp.files[0], 'spa');
      const insp = DB.inspections.find(i => i.id === inspId);
      insp.evidence.push({ id: uid('ev'), name:'OCR albarán', type:'ocr', ts: nowISO(), geo: insp.geo, text: data.text });
      insp.sync = { dirty:true, syncedAt:null };
      await commit('OCR','inspección', data.text.slice(0, 80).replace(/\n/g, ' '));
      render();
      openModal(`<h3>🧾 Texto extraído del documento</h3><textarea class="textarea" style="min-height:240px">${esc(data.text)}</textarea>
        <div class="row mt" style="justify-content:flex-end"><button class="btn btn-primary" data-act="close-modal">Aceptar</button></div>`);
    } catch (e) { toast('⚠️ OCR no disponible sin conexión'); }
  };
  inp.click();
}

/* ============================ Exportaciones ============================ */
function exportCSV() {
  const rows = [['Tipo','Instalación','Organización','Referencia','Norma','Probabilidad','Consecuencia','Riesgo','Nivel','Responsable','Plazo','Estado','Fecha creación']];
  DB.findings.forEach(f => rows.push(['Hallazgo', f.site, DB.inspections.find(i => i.id === f.inspectionId)?.org || '', f.clause, f.standard, f.probability, f.consequence, f.risk, f.level, f.owner, f.dueDate, f.status, f.createdAt]));
  DB.esg.forEach(r => { const fp = footprint(r); rows.push(['ESG', r.site, '', r.period, 'ISO 14064-1', '', '', round(fp.t, 3), 't CO2e', '', '', '', '']); });
  const csv = '\uFEFF' + rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'esg360-auditoria-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  commit('EXPORT','CSV', rows.length - 1 + ' filas');
  toast('⬇ Exportación CSV generada');
}

function exportPDF(inspId) {
  const insp = DB.inspections.find(i => i.id === inspId);
  const fnds = DB.findings.filter(f => f.inspectionId === inspId);
  const c = compliance(insp);
  const fp = DB.esg.reduce((a, r) => { const f = footprint(r); a.total += f.total; return a; }, { total:0 });
  const items = CHECKLIST.filter(it => !it.when || it.when(insp.answers));
  const html = `
    <h1>Informe de auditoría ambiental y ESG</h1>
    <p><strong>Instalación:</strong> ${esc(insp.site)} · <strong>Organización:</strong> ${esc(insp.org)}</p>
    <p><strong>Auditor:</strong> ${esc(insp.auditor)} · <strong>Fecha:</strong> ${fmtDate(insp.date)} · <strong>Estado:</strong> ${insp.status}</p>
    <p><strong>Geolocalización:</strong> ${insp.geo ? insp.geo.lat.toFixed(5) + ', ' + insp.geo.lng.toFixed(5) + ' (±' + insp.geo.acc + ' m)' : 'No registrada'}</p>
    <p><strong>Cumplimiento:</strong> ${c.pct}% · ${c.ok} conformes · ${c.ko} no conformes · ${c.answered}/${c.total} puntos evaluados</p>
    <h2>Hallazgos</h2>
    <table><thead><tr><th>Hallazgo</th><th>Referencia</th><th>Riesgo</th><th>Responsable</th><th>Plazo</th><th>Estado</th></tr></thead><tbody>
      ${fnds.map(f => `<tr><td>${esc(f.title)}</td><td>${esc(f.clause)}</td><td>${f.risk} ${f.level}</td><td>${esc(f.owner)}</td><td>${fmtDate(f.dueDate)}</td><td>${f.status}</td></tr>`).join('') || '<tr><td colspan="6">Sin hallazgos</td></tr>'}
    </tbody></table>
    <h2>Detalle del checklist</h2>
    <table><thead><tr><th>Punto</th><th>Referencia</th><th>Respuesta</th></tr></thead><tbody>
      ${items.map(it => `<tr><td>${esc(it.q)}</td><td>${esc(it.ref || '')}</td><td>${insp.answers[it.id] === true ? 'Conforme' : insp.answers[it.id] === false ? 'No conformidad' : esc(String(insp.answers[it.id] ?? '—'))}</td></tr>`).join('')}
    </tbody></table>
    <h2>Huella de carbono del periodo</h2>
    <p>Total auditado: <strong>${round(fp.total / 1000, 2)} t CO₂e</strong> (GHG Protocol · ISO 14064-1)</p>
    <p style="margin-top:24px;font-size:9pt;color:#555">Documento generado por ESG 360 v${APP.version} · Autoría: ${APP.author} · ${fmtDT(nowISO())}</p>`;
  $('#printArea').innerHTML = html;
  commit('EXPORT','PDF', insp.site);
  setTimeout(() => window.print(), 250);
}

/* ============================ Arranque ============================ */
function initRoles() {
  const sel = $('#roleSelect');
  sel.innerHTML = Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${k === ROLE ? 'selected' : ''}>${r.label}</option>`).join('');
  sel.onchange = async () => { ROLE = sel.value; localStorage.setItem(ROLE_KEY, ROLE); await commit('ROLE','sesión', ROLES[ROLE].label); render(); };
}
function initTheme() {
  const t = DB.settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  $('#btnTheme').onclick = () => {
    const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    DB.settings.theme = n; save(); drawCharts();
  };
}
function initSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
function initEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'ans-input' || act === 'reg-search' || act === 'reg-scope' || act === 'close-evidence' || act === 'restore') return;
    if (ACTIONS[act]) { e.preventDefault(); ACTIONS[act](el); }
  });

  document.addEventListener('input', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'ans-input') ACTIONS['ans-input'](el);
    if (el.dataset.act === 'reg-search') {
      CTX.regQ = el.value;
      clearTimeout(window._rq);
      window._rq = setTimeout(() => {
        render();
        const inp = $('[data-act="reg-search"]');
        if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
      }, 220);
    }
  });

  document.addEventListener('change', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'reg-scope') { CTX.regScope = el.value; render(); }
    if (el.dataset.act === 'close-evidence') ACTIONS['close-evidence'](el);
    if (el.dataset.act === 'restore') ACTIONS['restore'](el);
  });

  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  window.addEventListener('online', () => { updateNetBadge(); syncNow(true); toast('🌐 Conexión restablecida · sincronizando'); });
  window.addEventListener('offline', () => { updateNetBadge(); toast('📴 Modo offline activo · los datos se guardan localmente'); });
}

async function init() {
  DB = load();
  if (!DB.settings.factors) DB.settings.factors = { ...FACTORS };
  $('#year').textContent = APP.year;
  initRoles(); initTheme(); initEvents(); initSW();
  await commit('SESSION','app','Inicio de sesión · ' + ROLES[ROLE].label);
  render();
  updateNetBadge();
  if (navigator.onLine && pendingCount()) setTimeout(() => syncNow(true), 1500);
}
document.addEventListener('DOMContentLoaded', init);
