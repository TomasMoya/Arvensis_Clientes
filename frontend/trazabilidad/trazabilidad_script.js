if (!localStorage.getItem('tokenJWT')) {
  window.location.href = '../login/login.html';
}

// ── AUTH HELPER ──
function authFetch(url, options = {}) {
  const token = localStorage.getItem('tokenJWT');
  if (!token) {
    window.location.href = '../login/login.html';
    return;
  }
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      ...(options.headers || {})
    }
  }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('tokenJWT');
      window.location.href = '../login/login.html';
    }
    return res;
  });
}

// Mostrar sección usuarios solo si es admin
if (localStorage.getItem('rol') === 'ADMIN') {
  const navUsuarios = document.getElementById('nav-usuarios');
  if (navUsuarios) navUsuarios.style.display = 'flex';
}

const API = '/api/profesionales';

const PASOS = [
  { key: 'trafico',         label: 'De dónde se conoció', fechaKey: null,              notaKey: null, isSelect: true},
  { key: 'seLeHablo',       label: 'Se le habló',       fechaKey: 'fechaQueSeLeHablo', notaKey: 'comentSeLeHablo' },
  { key: 'seMandoCatalogo', label: 'Se mandó catálogo', fechaKey: null,                notaKey: 'comentSeMandoCatalogo' },
  { key: 'seLeVisito',      label: 'Se le visitó',      fechaKey: null,                notaKey: 'comentSeLeVisito' },
  { key: 'compro',          label: 'Compró',            fechaKey: null,                notaKey: 'comentCompro' },
];

const AVATAR_COLORS = ['av-blue', 'av-teal', 'av-amber', 'av-rose', 'av-purple'];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFF;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(n, a) {
  return ((n || '?')[0] + (a || '?')[0]).toUpperCase();
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
         ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

// ── OBTENER ID DE LA URL ──
function getProfId() {
  return new URLSearchParams(window.location.search).get('id');
}

// ── CARGAR DATOS ──
let profesional = null;
let trazabilidad = {};

async function cargarDatos() {
  const id = getProfId();
  if (!id) {
    mostrarError('No se especificó un profesional.');
    return;
  }

  try {
    const [resPro, resTraz] = await Promise.all([
      authFetch(`${API}/${id}`),
      authFetch(`${API}/${id}/trazabilidad`)
    ]);

    if (!resPro.ok) throw new Error('Profesional no encontrado');
    profesional = await resPro.json();
    trazabilidad = resTraz.ok ? (await resTraz.json() ?? {}) : {};

    renderProfCard();
    renderSteps();

    document.getElementById('topbar-title').textContent = `${profesional.nombre} ${profesional.apellido}`;
    document.getElementById('topbar-sub').textContent = profesional.profesion ?? '';

  } catch (e) {
    mostrarError(e.message);
  }
}

// ── RENDER CARD ──
function renderProfCard() {
  const avc = avatarColor(profesional.nombre + profesional.apellido);
  document.getElementById('prof-card').innerHTML = `
    <div class="avatar-lg ${avc}">${initials(profesional.nombre, profesional.apellido)}</div>
    <div class="prof-info">
      <div class="prof-name">${esc(profesional.nombre)} ${esc(profesional.apellido)}</div>
      <div class="prof-meta">
        <span class="tag-prof">${esc(profesional.profesion ?? '—')}</span>
        <span class="prof-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          ${esc(profesional.email ?? '—')}
        </span>
        <span class="prof-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          ${esc(profesional.telefono ?? '—')}
        </span>
      </div>
    </div>
  `;
}

// ── RENDER STEPS ──
function renderSteps() {
  const container = document.getElementById('steps');
  container.innerHTML = PASOS.map((paso, i) => {
    const done = paso.isSelect ? !!trazabilidad.trafico : !!(trazabilidad[paso.key]);
    const fecha = paso.fechaKey ? trazabilidad[paso.fechaKey] : null;
    const nota = paso.notaKey ? (trazabilidad[paso.notaKey] ?? '') : null;

    const controles = paso.isSelect
      ? `<select class="trafico-select" onchange="guardarTrafico(this.value)" id="sel-trafico">
           <option value="">Seleccionar...</option>
           <option value="ORGANICO" ${trazabilidad.trafico === 'ORGANICO' ? 'selected' : ''}>Tráfico Orgánico</option>
           <option value="PAGO" ${trazabilidad.trafico === 'PAGO' ? 'selected' : ''}>Tráfico Pago</option>
         </select>`
      : `<button class="toggle-btn ${done ? 'on' : 'off'}" onclick="togglePaso('${paso.key}')" id="btn-${paso.key}">
           <div class="toggle-knob">
             ${done
               ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
               : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
             }
           </div>
         </button>`;

    return `
      <div class="step ${done ? 'done' : ''}" id="step-${paso.key}">
        <div class="step-top">
          <div class="step-number">${i + 1}</div>
          <div class="step-info">
            <div class="step-label">${paso.label}</div>
            <div class="step-date" id="date-${paso.key}">
              ${done && fecha ? '📅 ' + formatFecha(fecha) : done ? 'Completado' : 'Pendiente'}
            </div>
          </div>
          ${controles}
        </div>
        ${nota !== null ? `
        <div class="step-nota">
          <input
            type="text"
            class="nota-input"
            id="nota-${paso.notaKey}"
            placeholder="Agregar nota..."
            value="${esc(nota)}"
            onblur="guardarNota('${paso.notaKey}', this.value)"
            onkeydown="if(event.key==='Enter') this.blur()"
          />
        </div>` : ''}
      </div>`;
  }).join('');
}

// ── TOGGLE PASO ──
async function togglePaso(key) {
  const id = getProfId();
  const nuevoValor = !trazabilidad[key];

  trazabilidad[key] = nuevoValor;
  renderSteps();

  try {
    const res = await authFetch(`${API}/${id}/trazabilidad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: nuevoValor })
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    trazabilidad = data;
    renderSteps();

    const paso = PASOS.find(p => p.key === key);
    showToast(nuevoValor ? `✓ ${paso.label} marcado` : `${paso.label} desmarcado`, 'success');
  } catch (e) {
    trazabilidad[key] = !nuevoValor;
    renderSteps();
    showToast('Error al guardar: ' + e.message, 'error');
  }
}

// ── GUARDAR NOTA ──
async function guardarNota(notaKey, valor) {
  const id = getProfId();

  // No guardar si no cambió
  if ((trazabilidad[notaKey] ?? '') === valor) return;

  trazabilidad[notaKey] = valor;

  try {
    const res = await authFetch(`${API}/${id}/trazabilidad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [notaKey]: valor })
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    trazabilidad = data;
    showToast('Nota guardada', 'success');
  } catch (e) {
    showToast('Error al guardar nota: ' + e.message, 'error');
  }
}

// ── GUARDAR TRAFICO ──
async function guardarTrafico(valor) {
  const id = getProfId();
  trazabilidad.trafico = valor || null;
  try {
    const res = await authFetch(`${API}/${id}/trazabilidad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trafico: valor || null })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    trazabilidad = data;
    renderSteps();
    showToast('Tráfico guardado', 'success');
  } catch (e) {
    showToast('Error al guardar: ' + e.message, 'error');
  }
}

// ── ERROR STATE ──
function mostrarError(msg) {
  document.getElementById('prof-card').innerHTML = '';
  document.getElementById('steps').innerHTML = `
    <div class="state-msg">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div class="state-title">Error al cargar</div>
      <div class="state-sub">${esc(msg)}</div>
    </div>`;
}

// ── TOAST ──
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.className = 'toast ' + type;
  document.getElementById('toast-icon').innerHTML = type === 'success'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── INIT ──
cargarDatos();