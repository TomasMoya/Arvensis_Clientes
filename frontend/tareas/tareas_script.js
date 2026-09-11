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
  const headers = { 'Authorization': 'Bearer ' + token, ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, {
    ...options,
    headers
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
    usuarioActualId = yo.id;
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

function formatFechaHora(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function isVencida(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

let tareas = [];
let draggedId = null;
let pendingEliminarId = null;
let usuarioActualId = null;
let adjuntosActuales = [];

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
function toggleObjetivosGroup(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const collapsed = group.classList.toggle('collapsed');
  try {
    localStorage.setItem(`objetivos-collapsed-${groupId}`, collapsed ? '1' : '0');
  } catch (e) {}
}

function restoreObjetivosCollapsed() {
  ['group-trimestral', 'group-mensual', 'group-anual'].forEach(groupId => {
    const group = document.getElementById(groupId);
    if (!group) return;
    let collapsed = '0';
    try {
      collapsed = localStorage.getItem(`objetivos-collapsed-${groupId}`) || '0';
    } catch (e) {}
    group.classList.toggle('collapsed', collapsed === '1');
  });
}

function renderObjetivos() {
  ['OBJETIVO_TRIMESTRAL', 'OBJETIVO_MENSUAL', 'OBJETIVO_ANUAL', 'TEMA_REUNION'].forEach(tipo => {
    // CORRECCIÓN: Filtramos asegurando compatibilidad por si desde el backend viene como 'ANUAL' u 'OBJETIVO_ANUAL'
    const lista = tareas.filter(t => {
      if (tipo === 'OBJETIVO_ANUAL') return t.tipo === 'OBJETIVO_ANUAL' || t.tipo === 'ANUAL';
      if (tipo === 'OBJETIVO_TRIMESTRAL') return t.tipo === 'OBJETIVO_TRIMESTRAL' || t.tipo === 'TRIMESTRAL';
      if (tipo === 'OBJETIVO_MENSUAL') return t.tipo === 'OBJETIVO_MENSUAL' || t.tipo === 'MENSUAL';
      if (tipo === 'TEMA_REUNION') return t.tipo === 'TEMA_REUNION' || t.tipo === 'TEMA' || t.tipo === 'REUNION';
      return t.tipo === tipo;
    });

    const container = document.getElementById(`list-${tipo}`);
    
    const contadores = {
        'OBJETIVO_ANUAL': 'count-anual',
        'OBJETIVO_TRIMESTRAL': 'count-trimestral',
        'OBJETIVO_MENSUAL': 'count-mensual',
        'TEMA_REUNION': 'count-tema-reunion',
    };
    
    const countId = contadores[tipo];
    // Seguridad para evitar que tire error si el elemento no existe en el HTML de grupos
    if (countId && document.getElementById(countId)) {
      document.getElementById(countId).textContent = lista.length;
    }

    if (!container) return; // Validación por si estás en la pestaña de grupos y cambia el HTML

    if (!lista.length) {
      const periodos = {
        OBJETIVO_TRIMESTRAL: 'este trimestre',
        OBJETIVO_MENSUAL: 'este mes',
        OBJETIVO_ANUAL: 'este año',
        TEMA_REUNION: 'Aún no hay temas para reunión.'
      };
      if (tipo === 'TEMA_REUNION') {
        container.innerHTML = `<div class="empty-objetivos">${periodos[tipo] || ''} <button class="empty-add-link" onclick="openModalConTipo('${tipo}')">+ Agregar tema</button></div>`;
        return;
      }
      container.innerHTML = `<div class="empty-objetivos">Sin objetivos ${periodos[tipo] || ''} <button class="empty-add-link" onclick="openModalConTipo('${tipo}')">+ Agregar objetivo</button></div>`;
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

  restoreObjetivosCollapsed();
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

  const estados = ['PENDIENTE', 'PROCESANDO', 'FINALIZADA'];
  const idxEstado = estados.indexOf(t.estado);

  const btnAnterior = idxEstado > 0
    ? `<button class="btn btn-sm" onclick="moverTarea(${t.id}, '${estados[idxEstado - 1]}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>`
    : '';

  const btnSiguiente = idxEstado < estados.length - 1
    ? `<button class="btn btn-sm" onclick="moverTarea(${t.id}, '${estados[idxEstado + 1]}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>`
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
        ${btnAnterior}
        ${btnSiguiente}
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

// ── MOVER TAREA ──
async function moverTarea(id, nuevoEstado) {
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return;

  tarea.estado = nuevoEstado;
  renderBoard();

  try {
    const res = await authFetch(`${API_BASE}/usuarios/${getUsuarioId()}/tareas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const actualizada = await res.json();
    const idx = tareas.findIndex(t => t.id === id);
    if (idx !== -1) tareas[idx] = actualizada;
    renderBoard();
  } catch (e) {
    showToast('Error al mover: ' + e.message, 'error');
    cargarTareas();
  }
}

// ── MODAL CREAR ──
function openModal() {
  editandoId = null;
  document.getElementById('f-titulo').value = '';
  document.getElementById('f-descripcion').value = '';
  document.getElementById('f-fechalimite').value = '';
  document.getElementById('f-prioridad').value = '';
  document.getElementById('f-tipo').value = 'TAREA';
  document.getElementById('form-error').style.display = 'none';

  document.getElementById('ficha-titulo-modal').textContent = 'Nueva tarea';
  document.getElementById('ficha-sub-modal').textContent = 'Completá los campos requeridos.';
  document.getElementById('ficha-btn-submit').textContent = 'Crear tarea';
  document.getElementById('ficha-fecha-creacion-row').style.display = 'none';
  document.getElementById('ficha-adjuntos-section').style.display = 'none';
  document.getElementById('ficha-side').style.display = 'none';

  document.getElementById('modal-add').classList.add('open');
  setTimeout(() => document.getElementById('f-titulo').focus(), 80);
}

function openModalConTipo(tipo) {
  openModal();
  document.getElementById('f-tipo').value = tipo;
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

  document.getElementById('ficha-titulo-modal').textContent = 'Editar tarea';
  document.getElementById('ficha-sub-modal').textContent = 'Modificá los datos de la tarea.';
  document.getElementById('ficha-btn-submit').textContent = 'Guardar cambios';

  const filaCreacion = document.getElementById('ficha-fecha-creacion-row');
  if (tarea.fechaCreacion) {
    document.getElementById('f-fecha-creacion').textContent = formatFechaHora(tarea.fechaCreacion);
    filaCreacion.style.display = 'flex';
  } else {
    filaCreacion.style.display = 'none';
  }

  document.getElementById('ficha-adjuntos-section').style.display = 'block';
  document.getElementById('ficha-side').style.display = 'flex';
  document.getElementById('f-nuevo-comentario').value = '';

  document.getElementById('modal-add').classList.add('open');

  cargarComentarios(id);
  cargarAdjuntos(id);
}

// ── COMENTARIOS ──
function getComentarioAPI(tareaId) {
  return `${API_BASE}/tareas/${tareaId}/comentarios`;
}

function iniciales(nombre) {
  if (!nombre) return '?';
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

async function cargarComentarios(tareaId) {
  const cont = document.getElementById('ficha-comentarios-list');
  cont.innerHTML = `<div class="ficha-empty-hint">Cargando comentarios...</div>`;
  try {
    const res = await authFetch(getComentarioAPI(tareaId));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    renderComentarios(await res.json());
  } catch (e) {
    cont.innerHTML = `<div class="ficha-empty-hint">No se pudieron cargar los comentarios.</div>`;
  }
}

function renderComentarios(comentarios) {
  const cont = document.getElementById('ficha-comentarios-list');
  if (!comentarios.length) {
    cont.innerHTML = `<div class="ficha-empty-hint">Sin comentarios todavía.</div>`;
    return;
  }
  const rol = localStorage.getItem('rol');
  cont.innerHTML = comentarios.map(c => {
    const puedeEliminar = c.usuarioId === usuarioActualId || rol === 'ADMIN';
    return `
    <div class="ficha-comentario">
      <div class="ficha-comentario-avatar">${esc(iniciales(c.usuarioNombre))}</div>
      <div class="ficha-comentario-body">
        <div class="ficha-comentario-header">
          <span class="ficha-comentario-autor">${esc(c.usuarioNombre ?? 'Usuario')}</span>
          <span class="ficha-comentario-fecha">${formatFechaHora(c.fechaCreacion) ?? ''}</span>
        </div>
        <div class="ficha-comentario-texto">${esc(c.contenido)}</div>
        ${puedeEliminar ? `<button class="ficha-comentario-delete" onclick="eliminarComentario(${c.id})">Eliminar</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function enviarComentario() {
  if (!editandoId) return;
  const textarea = document.getElementById('f-nuevo-comentario');
  const contenido = textarea.value.trim();
  if (!contenido) return;
  try {
    const res = await authFetch(getComentarioAPI(editandoId), {
      method: 'POST',
      body: JSON.stringify({ contenido })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    textarea.value = '';
    cargarComentarios(editandoId);
  } catch (e) {
    showToast('Error al comentar: ' + e.message, 'error');
  }
}

document.querySelector('#f-nuevo-comentario').addEventListener("keydown", (e) => {
  if (e.code === 'Enter') {
    enviarComentario();
  }
});

async function eliminarComentario(comentarioId) {
  if (!editandoId) return;
  try {
    const res = await authFetch(`${getComentarioAPI(editandoId)}/${comentarioId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    cargarComentarios(editandoId);
  } catch (e) {
    showToast('Error al eliminar comentario: ' + e.message, 'error');
  }
}

// ── ADJUNTOS ──
const EXTENSIONES_ADJUNTOS_PERMITIDAS = ['jpg', 'jpeg', 'png', 'docx', 'xlsx', 'pdf', 'txt'];

function getAdjuntoAPI(tareaId) {
  return `${API_BASE}/tareas/${tareaId}/adjuntos`;
}

function extensionDe(nombre) {
  const idx = nombre.lastIndexOf('.');
  return idx >= 0 ? nombre.substring(idx + 1) : '';
}

function formatTamanio(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function cargarAdjuntos(tareaId) {
  const cont = document.getElementById('ficha-adjuntos-list');
  cont.innerHTML = `<div class="ficha-empty-hint">Cargando adjuntos...</div>`;
  try {
    const res = await authFetch(getAdjuntoAPI(tareaId));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    adjuntosActuales = await res.json();
    renderAdjuntos(adjuntosActuales);
  } catch (e) {
    cont.innerHTML = `<div class="ficha-empty-hint">No se pudieron cargar los adjuntos.</div>`;
  }
}

function renderAdjuntos(adjuntos) {
  const cont = document.getElementById('ficha-adjuntos-list');
  if (!adjuntos.length) {
    cont.innerHTML = `<div class="ficha-empty-hint">Sin adjuntos todavía.</div>`;
    return;
  }
  const rol = localStorage.getItem('rol');
  cont.innerHTML = adjuntos.map(a => {
    const puedeEliminar = a.usuarioId === usuarioActualId || rol === 'ADMIN';
    return `
    <div class="ficha-adjunto-item">
      <div class="ficha-adjunto-icon">${esc(extensionDe(a.nombreOriginal).toUpperCase())}</div>
      <div class="ficha-adjunto-info">
        <div class="ficha-adjunto-name">${esc(a.nombreOriginal)}</div>
        <div class="ficha-adjunto-meta">${formatTamanio(a.tamanioBytes)}${a.usuarioNombre ? ' · ' + esc(a.usuarioNombre) : ''}</div>
      </div>
      <div class="ficha-adjunto-actions">
        <button class="btn btn-sm" onclick="descargarAdjunto(${a.id})" title="Descargar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        ${puedeEliminar ? `<button class="btn btn-sm btn-danger" onclick="eliminarAdjunto(${a.id})" title="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function subirAdjunto(event) {
  const input = event.target;
  const archivo = input.files[0];
  input.value = '';
  if (!archivo || !editandoId) return;

  const extension = extensionDe(archivo.name).toLowerCase();
  if (!EXTENSIONES_ADJUNTOS_PERMITIDAS.includes(extension)) {
    showToast('Extensión no admitida. Usá jpg, png, docx, xlsx, pdf o txt.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', archivo);

  try {
    const res = await authFetch(getAdjuntoAPI(editandoId), { method: 'POST', body: formData });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Adjunto subido', 'success');
    cargarAdjuntos(editandoId);
  } catch (e) {
    showToast('Error al subir adjunto: ' + e.message, 'error');
  }
}

async function descargarAdjunto(adjuntoId) {
  const adjunto = adjuntosActuales.find(a => a.id === adjuntoId);
  if (!adjunto || !editandoId) return;
  try {
    const res = await authFetch(`${getAdjuntoAPI(editandoId)}/${adjuntoId}/descargar`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = adjunto.nombreOriginal;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    showToast('Error al descargar: ' + e.message, 'error');
  }
}

async function eliminarAdjunto(adjuntoId) {
  if (!editandoId) return;
  try {
    const res = await authFetch(`${getAdjuntoAPI(editandoId)}/${adjuntoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    cargarAdjuntos(editandoId);
  } catch (e) {
    showToast('Error al eliminar adjunto: ' + e.message, 'error');
  }
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

// ── SIDEBAR ──
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

function toggleTareasMenu() {
  const btn = document.querySelector('.nav-item-toggle');
  const submenu = document.getElementById('submenu-tareas');
  btn.classList.toggle('open');
  submenu.classList.toggle('open');
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

// ── INIT ──
cargarTareas();
