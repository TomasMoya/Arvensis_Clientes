//const API_BASE = '/api';
//const API = `${API_BASE}/profesionales`;
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si es local, apunta al puerto real de tu backend (ej. 8080). Si es producción, usa '/api'
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

function getUsuarioId() {
  return new URLSearchParams(window.location.search).get('id');
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatFecha(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function isVencida(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

let tareas = [];
let draggedId = null;
let pendingEliminarId = null;

// ── CARGAR TAREAS ──
async function cargarTareas() {
  const id = getUsuarioId();
  if (!id) return;

  try {
    // Obtener nombre del usuario logueado
    const resMe = await authFetch(`${API_BASE}/usuarios/me`);
    if (resMe.ok) {
      const yo = await resMe.json();
      document.getElementById('page-title').textContent = `Tareas de ${yo.nombre}`;
      document.getElementById('page-sub').textContent = yo.login;
    }

    const res = await authFetch(`${API_BASE}/usuarios/${id}/tareas`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    tareas = await res.json();
    renderBoard();

  } catch (e) {
    document.getElementById('page-sub').textContent = 'Error al cargar';
    showToast('Error: ' + e.message, 'error');
  }
}

// ── OBJETIVOS ──
function renderObjetivos() {
  ['OBJETIVO_TRIMESTRAL', 'OBJETIVO_MENSUAL', 'OBJETIVO_ANUAL'].forEach(tipo => {
    const lista = tareas.filter(t => t.tipo === tipo);
    const container = document.getElementById(`list-${tipo}`);
    const contadores = {
        'OBJETIVO_ANUAL': 'count-anual',
        'OBJETIVO_TRIMESTRAL': 'count-trimestral',
        'OBJETIVO_MENSUAL': 'count-mensual',
    };
    const countId = contadores[tipo];
    document.getElementById(countId).textContent = lista.length;

    if (!lista.length) {
      container.innerHTML = `<div class="empty-objetivos">Sin objetivos</div>`;
      return;
    }

    container.innerHTML = lista.map(t => {
      const finalizada = t.estado === 'FINALIZADA';
      const badgePrioridad = t.prioridad
        ? `<span class="badge-prioridad badge-${t.prioridad}">${t.prioridad}</span>`
        : '';
      const fechaLabel = t.fechaLimite
        ? `<span class="card-fecha ${isVencida(t.fechaLimite) ? 'vencida' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${formatFecha(t.fechaLimite)}
           </span>`
        : '';

      return `
        <div class="objetivo-card ${finalizada ? 'finalizada' : ''}" id="obj-${t.id}">
          <div class="objetivo-check ${finalizada ? 'checked' : ''}" onclick="toggleObjetivo(${t.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="objetivo-info">
            <div class="objetivo-titulo">${esc(t.titulo)}</div>
            ${t.descripcion ? `<div class="objetivo-desc">${esc(t.descripcion)}</div>` : ''}
          </div>
          <div class="objetivo-meta">
            ${badgePrioridad}
            ${fechaLabel}
            <div class="objetivo-actions">
              <button class="btn btn-sm" onclick="abrirModalEditar(${t.id})">Editar</button>
              <button class="btn btn-sm btn-danger" onclick="pedirEliminar(${t.id})">Eliminar</button>
            </div>
          </div>
        </div>`;
    }).join('');
  });
}

async function toggleObjetivo(id) {
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return;

  const nuevoEstado = tarea.estado === 'FINALIZADA' ? 'PENDIENTE' : 'FINALIZADA';
  tarea.estado = nuevoEstado;
  renderObjetivos();

  try {
    const res = await authFetch(`${API_BASE}/usuarios/${getUsuarioId()}/tareas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const actualizada = await res.json();
    const idx = tareas.findIndex(t => t.id === id);
    if (idx !== -1) tareas[idx] = actualizada;
    renderObjetivos();
  } catch (e) {
    tarea.estado = tarea.estado === 'FINALIZADA' ? 'PENDIENTE' : 'FINALIZADA';
    renderObjetivos();
    showToast('Error al actualizar: ' + e.message, 'error');
  }
}

// ── RENDER BOARD ──
function renderBoard() {
  const estados = ['PENDIENTE', 'PROCESANDO', 'FINALIZADA'];

  estados.forEach(estado => {
    const container = document.getElementById(`cards-${estado}`);
    const count = document.getElementById(`count-${estado}`);
    const lista = tareas.filter(t => t.estado === estado && t.tipo === 'TAREA');

    count.textContent = lista.length;

    if (!lista.length) {
      container.innerHTML = `<div class="empty-column">Sin tareas</div>`;
      return;
    }

    container.innerHTML = lista.map(t => renderCard(t)).join('');
  });

  renderObjetivos();

  // Mostrar botón nueva tarea para todos
  document.getElementById('btn-nueva-tarea').style.display = 'inline-flex';

  // Mostrar nav usuarios solo para admins
  if (localStorage.getItem('rol') === 'ADMIN') {
    const navUsuarios = document.getElementById('nav-usuarios');
    if (navUsuarios) navUsuarios.style.display = 'flex';
  }
}

function renderCard(t) {
  const fechaVencida = isVencida(t.fechaLimite);
  const fechaLabel = t.fechaLimite
    ? `<span class="card-fecha ${fechaVencida ? 'vencida' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${formatFecha(t.fechaLimite)}
       </span>`
    : '';

  const badgePrioridad = t.prioridad
    ? `<span class="badge-prioridad badge-${t.prioridad}">${t.prioridad}</span>`
    : '';

  return `
    <div class="card"
      id="card-${t.id}"
      draggable="true"
      ondragstart="onDragStart(event, ${t.id})"
      ondragend="onDragEnd(event)">
      <div class="card-title">${esc(t.titulo)}</div>
      ${t.descripcion ? `<div class="card-desc">${esc(t.descripcion)}</div>` : ''}
      <div class="card-meta">
        ${badgePrioridad}
        ${fechaLabel}
      </div>
      <div class="card-actions">
        <button class="btn btn-sm" onclick="abrirModalEditar(${t.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button class="btn btn-sm btn-danger" onclick="pedirEliminar(${t.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          Eliminar
        </button>
      </div>
    </div>`;
}

// ── DRAG & DROP ──
function onDragStart(event, id) {
  draggedId = id;
  event.dataTransfer.effectAllowed = 'move';
  setTimeout(() => {
    const card = document.getElementById(`card-${id}`);
    if (card) card.classList.add('dragging');
  }, 0);
}

function onDragEnd(event) {
  document.querySelectorAll('.card').forEach(c => c.classList.remove('dragging'));
  document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
}

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const column = event.currentTarget;
  document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
  column.classList.add('drag-over');
}

async function onDrop(event, nuevoEstado) {
  event.preventDefault();
  document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));

  if (!draggedId) return;

  const tarea = tareas.find(t => t.id === draggedId);
  if (!tarea || tarea.estado === nuevoEstado) return;

  // Optimistic update
  tarea.estado = nuevoEstado;
  renderBoard();

  try {
    const res = await authFetch(`${API_BASE}/usuarios/${getUsuarioId()}/tareas/${draggedId}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const actualizada = await res.json();
    const idx = tareas.findIndex(t => t.id === draggedId);
    if (idx !== -1) tareas[idx] = actualizada;
    renderBoard();
  } catch (e) {
    showToast('Error al actualizar: ' + e.message, 'error');
    cargarTareas();
  }

  draggedId = null;
}

// ── MODAL CREAR ──
function openModal() {
  document.getElementById('f-titulo').value = '';
  document.getElementById('f-descripcion').value = '';
  document.getElementById('f-fechalimite').value = '';
  document.getElementById('f-prioridad').value = '';
  document.getElementById('form-error').style.display = 'none';
  document.getElementById('modal-add').classList.add('open');
  setTimeout(() => document.getElementById('f-titulo').focus(), 80);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  editandoId = null;
}

let editandoId = null;

function abrirModalEditar(id) {
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return;
  editandoId = id;

  document.getElementById('f-titulo').value = tarea.titulo ?? '';
  document.getElementById('f-descripcion').value = tarea.descripcion ?? '';
  document.getElementById('f-prioridad').value = tarea.prioridad ?? '';
  document.getElementById('f-tipo').value = tarea.tipo ?? 'TAREA';

  if (tarea.fechaLimite) {
    const fecha = new Date(tarea.fechaLimite);
    const localISO = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    document.getElementById('f-fechalimite').value = localISO;
  } else {
    document.getElementById('f-fechalimite').value = '';
  }

  document.getElementById('form-error').style.display = 'none';
  document.getElementById('modal-add').classList.add('open');
}

async function submitForm() {
  const titulo = document.getElementById('f-titulo').value.trim();
  if (!titulo) {
    document.getElementById('form-error').style.display = 'block';
    return;
  }
  document.getElementById('form-error').style.display = 'none';

  const fechaVal = document.getElementById('f-fechalimite').value;
  const data = {
    titulo,
    descripcion: document.getElementById('f-descripcion').value.trim() || null,
    fechaLimite: fechaVal ? new Date(fechaVal).toISOString().slice(0, 19) : null,
    prioridad: document.getElementById('f-prioridad').value || null,
    tipo: document.getElementById('f-tipo').value || 'TAREA'
  };

  const id = getUsuarioId();

  try {
    if (editandoId) {
      const res = await authFetch(`${API_BASE}/usuarios/${id}/tareas/${editandoId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showToast('Tarea actualizada', 'success');
    } else {
      const res = await authFetch(`${API_BASE}/usuarios/${id}/tareas`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showToast('Tarea creada', 'success');
    }
    closeModal('modal-add');
    cargarTareas();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

// ── ELIMINAR ──
function pedirEliminar(id) {
  pendingEliminarId = id;
  document.getElementById('modal-confirm').classList.add('open');
}

async function confirmarEliminar() {
  if (!pendingEliminarId) return;
  closeModal('modal-confirm');
  const id = getUsuarioId();
  try {
    const res = await authFetch(`${API_BASE}/usuarios/${id}/tareas/${pendingEliminarId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Tarea eliminada', 'success');
    cargarTareas();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  } finally {
    pendingEliminarId = null;
  }
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

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') ['modal-add', 'modal-confirm'].forEach(closeModal);
});

// ── PUNTITO SIN COMPRA ──
authFetch(`${API}/sin-compra`)
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      const dot = document.getElementById('nav-dot-sincompra');
      if (dot) dot.style.display = 'inline-block';
    }
  })
  .catch(() => {});

// ── INIT ──
cargarTareas();
