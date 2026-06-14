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
let miembros = [];
let todosUsuarios = [];
let draggedId = null;
let pendingEliminarId = null;
let editandoId = null;

// ── CARGAR DATOS ──
async function cargarDatos() {
  const id = getGrupoId();
  if (!id) return;

  try {
    // Cargar grupo
    const resGrupo = await authFetch(`${API_BASE}/grupos/mis-grupos`);
    if (resGrupo.ok) {
      const grupos = await resGrupo.json();
      const grupo = grupos.find(g => g.id == id);
      if (grupo) {
        document.getElementById('page-title').textContent = grupo.nombre;
        document.getElementById('page-sub').textContent = grupo.descripcion ?? '';
        miembros = grupo.miembros ?? [];
      }
    }

    // Cargar tareas del grupo
    const res = await authFetch(`${API_BASE}/grupos/${id}/tareas`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    tareas = await res.json();
    renderBoard();

    // Cargar todos los usuarios para el selector de miembros (solo admin)
    if (localStorage.getItem('rol') === 'ADMIN') {
      const resUsuarios = await authFetch(`${API_BASE}/usuarios`);
      if (resUsuarios.ok) todosUsuarios = await resUsuarios.json();
    }

    // Mostrar nav usuarios solo para admins
    if (localStorage.getItem('rol') === 'ADMIN') {
      const navUsuarios = document.getElementById('nav-usuarios');
      if (navUsuarios) navUsuarios.style.display = 'flex';
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

  } catch (e) {
    document.getElementById('page-sub').textContent = 'Error al cargar';
    showToast('Error: ' + e.message, 'error');
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

  const asignadoLabel = t.usuarioAsignadoNombre
    ? `<span class="card-asignado">
        ${esc(t.usuarioAsignadoNombre)}
       </span>`
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
        ${asignadoLabel}
        ${fechaLabel}
      </div>
      <div class="card-actions">
        <button class="btn btn-sm" onclick="abrirModalEditar(${t.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button class="btn btn-sm btn-danger" onclick="pedirEliminar(${t.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Eliminar
        </button>
      </div>
    </div>`;
}

// ── OBJETIVOS ──
function renderObjetivos() {
  ['OBJETIVO_TRIMESTRAL', 'OBJETIVO_MENSUAL', 'OBJETIVO_ANUAL'].forEach(tipo => {
    // CORRECCIÓN: Filtramos asegurando compatibilidad por si desde el backend viene como 'ANUAL' u 'OBJETIVO_ANUAL'
    const lista = tareas.filter(t => {
      if (tipo === 'OBJETIVO_ANUAL') return t.tipo === 'OBJETIVO_ANUAL' || t.tipo === 'ANUAL';
      if (tipo === 'OBJETIVO_TRIMESTRAL') return t.tipo === 'OBJETIVO_TRIMESTRAL' || t.tipo === 'TRIMESTRAL';
      if (tipo === 'OBJETIVO_MENSUAL') return t.tipo === 'OBJETIVO_MENSUAL' || t.tipo === 'MENSUAL';
      return t.tipo === tipo;
    });

    const container = document.getElementById(`list-${tipo}`);
    
    const contadores = {
        'OBJETIVO_ANUAL': 'count-anual',
        'OBJETIVO_TRIMESTRAL': 'count-trimestral',
        'OBJETIVO_MENSUAL': 'count-mensual',
    };
    
    const countId = contadores[tipo];
    // Seguridad para evitar que tire error si el elemento no existe en el HTML de grupos
    if (countId && document.getElementById(countId)) {
      document.getElementById(countId).textContent = lista.length;
    }

    if (!container) return; // Validación por si estás en la pestaña de grupos y cambia el HTML

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

  tarea.estado = nuevoEstado;
  renderBoard();

  try {
    const res = await authFetch(`${API_BASE}/grupos/${getGrupoId()}/tareas/${draggedId}`, {
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
    cargarDatos();
  }
  draggedId = null;
}

// ── TOGGLE OBJETIVO ──
async function toggleObjetivo(id) {
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return;
  const nuevoEstado = tarea.estado === 'FINALIZADA' ? 'PENDIENTE' : 'FINALIZADA';
  tarea.estado = nuevoEstado;
  renderObjetivos();

  try {
    const res = await authFetch(`${API_BASE}/grupos/${getGrupoId()}/tareas/${id}`, {
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
    showToast('Error: ' + e.message, 'error');
  }
}

// ── MODAL CREAR/EDITAR ──
function openModal() {
  editandoId = null;
  document.getElementById('f-titulo').value = '';
  document.getElementById('f-descripcion').value = '';
  document.getElementById('f-fechalimite').value = '';
  document.getElementById('f-prioridad').value = '';
  document.getElementById('f-tipo').value = 'TAREA';
  document.getElementById('form-error').style.display = 'none';
  cargarSelectAsignado(null);
  document.getElementById('modal-add').classList.add('open');
  setTimeout(() => document.getElementById('f-titulo').focus(), 80);
}

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
  cargarSelectAsignado(tarea.usuarioAsignadoId);
  document.getElementById('modal-add').classList.add('open');
}

function cargarSelectAsignado(seleccionadoId) {
  const sel = document.getElementById('f-asignado');
  sel.innerHTML = '<option value="">Sin asignar</option>' +
    miembros.map(m => `<option value="${m.id}" ${m.id == seleccionadoId ? 'selected' : ''}>${esc(m.nombre)}</option>`).join('');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  editandoId = null;
}

async function submitForm() {
  const titulo = document.getElementById('f-titulo').value.trim();
  if (!titulo) {
    document.getElementById('form-error').style.display = 'block';
    return;
  }
  document.getElementById('form-error').style.display = 'none';

  const fechaVal = document.getElementById('f-fechalimite').value;
  const asignadoVal = document.getElementById('f-asignado').value;

  const data = {
    titulo,
    descripcion: document.getElementById('f-descripcion').value.trim() || null,
    fechaLimite: fechaVal ? new Date(fechaVal).toISOString().slice(0, 19) : null,
    prioridad: document.getElementById('f-prioridad').value || null,
    tipo: document.getElementById('f-tipo').value || 'TAREA',
    usuarioAsignadoId: asignadoVal ? Number(asignadoVal) : null
  };

  const grupoId = getGrupoId();

  try {
    if (editandoId) {
      const res = await authFetch(`${API_BASE}/grupos/${grupoId}/tareas/${editandoId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showToast('Tarea actualizada', 'success');
    } else {
      const res = await authFetch(`${API_BASE}/grupos/${grupoId}/tareas`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showToast('Tarea creada', 'success');
    }
    closeModal('modal-add');
    cargarDatos();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

// ── ELIMINAR TAREA ──
function pedirEliminar(id) {
  pendingEliminarId = id;
  document.getElementById('modal-confirm').classList.add('open');
}

async function confirmarEliminar() {
  if (!pendingEliminarId) return;
  closeModal('modal-confirm');
  try {
    const res = await authFetch(`${API_BASE}/grupos/${getGrupoId()}/tareas/${pendingEliminarId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Tarea eliminada', 'success');
    cargarDatos();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  } finally {
    pendingEliminarId = null;
  }
}

// ── ELIMINAR GRUPO ──
function pedirEliminarGrupo() {
  document.getElementById('modal-confirm-grupo').classList.add('open');
}

async function confirmarEliminarGrupo() {
  closeModal('modal-confirm-grupo');
  try {
    const res = await authFetch(`${API_BASE}/grupos/${getGrupoId()}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Grupo eliminado', 'success');
    window.location.href = '../index.html';
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

// ── MODAL MIEMBROS ──
function openModalMiembros() {
  renderListaMiembros();
  cargarSelectNuevoMiembro();
  document.getElementById('modal-miembros').classList.add('open');
}

function renderListaMiembros() {
  const container = document.getElementById('lista-miembros');
  if (!miembros.length) {
    container.innerHTML = `<div style="font-size:12px;color:var(--text-3);font-family:var(--mono)">Sin miembros</div>`;
    return;
  }
  container.innerHTML = miembros.map(m => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="flex:1;font-size:13px">${esc(m.nombre)}</span>
      <span style="font-size:11px;color:var(--text-3);font-family:var(--mono)">${esc(m.login)}</span>
      <button class="btn btn-sm btn-danger" onclick="quitarMiembro(${m.id})">Quitar</button>
    </div>`).join('');
}

function cargarSelectNuevoMiembro() {
  const sel = document.getElementById('select-nuevo-miembro');
  const miembroIds = miembros.map(m => m.id);
  const disponibles = todosUsuarios.filter(u => !miembroIds.includes(u.id));
  sel.innerHTML = '<option value="">Seleccioná un usuario</option>' +
    disponibles.map(u => `<option value="${u.id}">${esc(u.nombre)} (${esc(u.login)})</option>`).join('');
}

async function agregarMiembro() {
  const usuarioId = document.getElementById('select-nuevo-miembro').value;
  if (!usuarioId) return;

  try {
    const res = await authFetch(`${API_BASE}/grupos/${getGrupoId()}/miembros`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId: Number(usuarioId) })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Miembro agregado', 'success');
    await cargarDatos();
    openModalMiembros();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

async function quitarMiembro(usuarioId) {
  try {
    const res = await authFetch(`${API_BASE}/grupos/${getGrupoId()}/miembros/${usuarioId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Miembro quitado', 'success');
    await cargarDatos();
    openModalMiembros();
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

function toggleTareasMenu() {
  const btn = document.querySelector('.nav-item-toggle');
  const submenu = document.getElementById('submenu-tareas');
  btn.classList.toggle('open');
  submenu.classList.toggle('open');
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modal-add', 'modal-confirm', 'modal-miembros', 'modal-confirm-grupo'].forEach(closeModal);
  }
});

// ── INIT ──
cargarDatos();