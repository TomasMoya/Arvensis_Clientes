const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocalhost ? 'http://127.0.0.1:8080' : '/api';
const API = `${API_BASE}/profesionales`;

// ── VERIFICAR AUTH ──
if (!localStorage.getItem('tokenJWT')) {
  window.location.href = '../login/login.html';
}

// ── AUTH FETCH ──
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
      localStorage.removeItem('rol');
      window.location.href = '../login/login.html';
    }
    return res;
  });
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

let todasLasTareas = [];
let editandoTarea = null;

// ── CALCULAR FECHA CALENDARIO ──
function fechaCalendario(tarea) {
  if (tarea.fechaLimite) {
    return new Date(tarea.fechaLimite);
  }

  const hoy = new Date();

  if (tarea.tipo === 'OBJETIVO_MENSUAL') {
    // Último día del mes actual
    return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
  }

  if (tarea.tipo === 'OBJETIVO_TRIMESTRAL') {
    // Último día del trimestre actual
    const mes = hoy.getMonth();
    let finTrimestre;
    if (mes <= 2)      finTrimestre = new Date(hoy.getFullYear(), 3, 0, 23, 59, 59);  // fin marzo
    else if (mes <= 5) finTrimestre = new Date(hoy.getFullYear(), 6, 0, 23, 59, 59);  // fin junio
    else if (mes <= 8) finTrimestre = new Date(hoy.getFullYear(), 9, 0, 23, 59, 59);  // fin septiembre
    else               finTrimestre = new Date(hoy.getFullYear(), 12, 0, 23, 59, 59); // fin diciembre
    return finTrimestre;
  }

  return null;
}

// ── CARGAR TAREAS ──
async function cargarCalendario() {
  try {
    const res = await authFetch(`${API_BASE}/calendario`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    todasLasTareas = await res.json();
    renderCalendario();
  } catch (e) {
    document.getElementById('page-sub').textContent = 'Error al cargar';
    showToast('Error: ' + e.message, 'error');
  }
}

// ── RENDER CALENDARIO ──
function renderCalendario() {
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Generar 30 días
  const dias = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    dias.push(d);
  }

  // Agrupar tareas por día
  const tareasPorDia = new Map();
  dias.forEach(d => {
    const key = d.toDateString();
    tareasPorDia.set(key, []);
  });

  todasLasTareas.forEach(t => {
    const fecha = fechaCalendario(t);
    if (!fecha) return;

    const fechaNorm = new Date(fecha);
    fechaNorm.setHours(0, 0, 0, 0);

    const key = fechaNorm.toDateString();
    if (tareasPorDia.has(key)) {
      tareasPorDia.get(key).push(t);
    }
  });

  // Renderizar columnas
  dias.forEach(d => {
    const key = d.toDateString();
    const tareasDelDia = tareasPorDia.get(key) || [];
    const esHoy = d.toDateString() === hoy.toDateString();

    const col = document.createElement('div');
    col.className = 'day-col';

    const header = document.createElement('div');
    header.className = `day-header${esHoy ? ' today' : ''}`;
    header.innerHTML = `
      <div class="day-num">${d.getDate()}</div>
      <div class="day-name">${DIAS[d.getDay()]}</div>
      <div class="day-month">${MESES[d.getMonth()]}</div>
    `;

    const cards = document.createElement('div');
    cards.className = 'day-cards';

    if (!tareasDelDia.length) {
      cards.innerHTML = `<div class="day-empty">—</div>`;
    } else {
      tareasDelDia.forEach(t => {
        const card = document.createElement('div');
        card.className = `cal-card tipo-${t.tipo} estado-${t.estado}`;
        card.onclick = () => abrirModalEditar(t);

        const badge = t.prioridad
          ? `<span class="cal-card-badge badge-${t.prioridad}">${t.prioridad}</span>`
          : '';

        const grupo = t.grupoNombre
          ? `<div class="cal-card-grupo">📁 ${esc(t.grupoNombre)}</div>`
          : '';

        card.innerHTML = `
          <div class="cal-card-titulo">${esc(t.titulo)}</div>
          <div class="cal-card-meta">
            ${badge}
            ${grupo}
          </div>
        `;

        cards.appendChild(card);
      });
    }

    col.appendChild(header);
    col.appendChild(cards);
    grid.appendChild(col);
  });

  // Actualizar subtítulo
  const fin = new Date(hoy);
  fin.setDate(hoy.getDate() + 29);
  document.getElementById('page-sub').textContent =
    `${hoy.getDate()} ${MESES[hoy.getMonth()]} → ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
}

// ── MODAL EDITAR ──
function abrirModalEditar(tarea) {
  editandoTarea = tarea;

  document.getElementById('e-titulo').value = tarea.titulo ?? '';
  document.getElementById('e-descripcion').value = tarea.descripcion ?? '';
  document.getElementById('e-prioridad').value = tarea.prioridad ?? '';
  document.getElementById('e-estado').value = tarea.estado ?? 'PENDIENTE';
  document.getElementById('e-tipo').value = tarea.tipo ?? 'TAREA';

  if (tarea.fechaLimite) {
    const fecha = new Date(tarea.fechaLimite);
    const localISO = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    document.getElementById('e-fechalimite').value = localISO;
  } else {
    document.getElementById('e-fechalimite').value = '';
  }

  // Mostrar origen de la tarea
  const origen = tarea.grupoNombre
    ? `Grupo: ${tarea.grupoNombre}`
    : 'Tarea personal';
  document.getElementById('modal-origen').textContent = origen;

  document.getElementById('form-error-editar').style.display = 'none';
  document.getElementById('modal-editar').classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  editandoTarea = null;
}

async function submitEditar() {
  const titulo = document.getElementById('e-titulo').value.trim();
  if (!titulo) {
    document.getElementById('form-error-editar').style.display = 'block';
    return;
  }
  document.getElementById('form-error-editar').style.display = 'none';

  const fechaVal = document.getElementById('e-fechalimite').value;
  const data = {
    titulo,
    descripcion: document.getElementById('e-descripcion').value.trim() || null,
    fechaLimite: fechaVal ? new Date(fechaVal).toISOString().slice(0, 19) : null,
    prioridad: document.getElementById('e-prioridad').value || null,
    estado: document.getElementById('e-estado').value,
    tipo: document.getElementById('e-tipo').value
  };

  try {
    let url;
    if (editandoTarea.grupoId) {
      url = `${API_BASE}/grupos/${editandoTarea.grupoId}/tareas/${editandoTarea.id}`;
    } else {
      url = `${API_BASE}/usuarios/${editandoTarea.usuarioId}/tareas/${editandoTarea.id}`;
    }

    const res = await authFetch(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    closeModal('modal-editar');
    showToast('Tarea actualizada', 'success');
    cargarCalendario();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

// ── SIDEBAR ──
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
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
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── NAVBAR ──
if (localStorage.getItem('rol') === 'ADMIN') {
  const navUsuarios = document.getElementById('nav-usuarios');
  if (navUsuarios) navUsuarios.style.display = 'flex';
}

function toggleTareasMenu() {
  const btn = document.querySelector('.nav-item-toggle');
  const submenu = document.getElementById('submenu-tareas');
  btn.classList.toggle('open');
  submenu.classList.toggle('open');
}

authFetch(`${API_BASE}/usuarios/me`)
  .then(res => res.json())
  .then(yo => {
    const navMisTareas = document.getElementById('nav-mis-tareas');
    if (navMisTareas && yo.id) {
      navMisTareas.href = `../tareas/tareas.html?id=${yo.id}`;
    }
    // Cargar grupos
    return authFetch(`${API_BASE}/grupos/mis-grupos`)
      .then(res => res.json())
      .then(grupos => {
        const container = document.getElementById('nav-grupos');
        if (grupos.length > 0) {
          container.innerHTML = grupos.map(g => `
            <a class="nav-subitem" href="../tareas/grupo.html?id=${g.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              ${esc(g.nombre)}
            </a>`).join('');
        }
      });
  })
  .catch(() => {});

function getGrupoId() {
  return new URLSearchParams(window.location.search).get('id');
}

// ── CREAR GRUPO ──
function openModalCrearGrupo() {
  document.getElementById('g-nombre').value = '';
  document.getElementById('g-descripcion').value = '';
  document.getElementById('form-error-grupo').style.display = 'none';
  document.getElementById('modal-crear-grupo').classList.add('open');
  setTimeout(() => document.getElementById('g-nombre').focus(), 80);
}

async function submitCrearGrupo() {
  const nombre = document.getElementById('g-nombre').value.trim();
  if (!nombre) {
    document.getElementById('form-error-grupo').style.display = 'block';
    return;
  }
  document.getElementById('form-error-grupo').style.display = 'none';

  try {
    const res = await authFetch(`${API_BASE}/grupos`, {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        descripcion: document.getElementById('g-descripcion').value.trim() || null
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const grupo = await res.json();
    closeModal('modal-crear-grupo');
    showToast(`Grupo "${nombre}" creado`, 'success');
    // Redirigir al grupo recién creado
    window.location.href = `../tareas/grupo.html?id=${grupo.id}`;
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

// Puntito sin compra
authFetch(`${API}/sin-compra`)
  .then(r => r.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      const dot = document.getElementById('nav-dot-sincompra');
      if (dot) dot.style.display = 'inline-block';
    }
  }).catch(() => {});

// Link mis tareas
authFetch(`${API_BASE}/usuarios/me`)
  .then(r => r.json())
  .then(yo => {
    const link = document.getElementById('nav-tareas-link');
    if (link && yo.id) link.href = `../tareas/tareas.html?id=${yo.id}`;
  }).catch(() => {});

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal('modal-editar');
});

// ── INIT ──
cargarCalendario();