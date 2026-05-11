const API = 'https://arvensis-cli.onrender.com';

// ── VERIFICAR AUTH Y ROL ──
if (!localStorage.getItem('tokenJWT')) {
  window.location.href = '../login/login.html';
}

if (localStorage.getItem('rol') !== 'ADMIN') {
  window.location.href = '../index.html';
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

const AVATAR_COLORS = ['av-blue', 'av-teal', 'av-amber', 'av-rose', 'av-purple'];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFF;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(nombre) {
  const parts = (nombre || '?').split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let pendingEliminarId = null;

// ── CARGAR USUARIOS ──
async function cargarUsuarios() {
  try {
    const res = await authFetch(`${API}/usuarios`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    document.getElementById('page-sub').textContent =
      `${data.length} usuario${data.length !== 1 ? 's' : ''} registrados`;

    renderTabla(data);
  } catch (e) {
    document.getElementById('page-sub').textContent = 'Error al conectar';
    document.getElementById('tbody').innerHTML = `
      <tr><td colspan="4" class="empty-state">No se pudo cargar la lista de usuarios.</td></tr>`;
  }
}

// ── RENDER ──
function renderTabla(lista) {
  const tbody = document.getElementById('tbody');

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay usuarios registrados.</td></tr>`;
    return;
  }

  const loginActual = obtenerLoginDelToken();

  tbody.innerHTML = lista.map(u => {
    const avc = avatarColor(u.nombre);
    const esMismo = u.login === loginActual;
    const badgeRol = u.rol === 'ADMIN'
      ? '<span class="badge-rol badge-admin">Admin</span>'
      : '<span class="badge-rol badge-user">User</span>';

    return `<tr>
      <td>
        <div class="cell-name">
          <div class="avatar ${avc}">${initials(u.nombre)}</div>
          <div class="name-text">${esc(u.nombre)} ${esMismo ? '<span style="font-size:11px;color:var(--text-3);font-family:var(--mono)">(vos)</span>' : ''}</div>
        </div>
      </td>
      <td><span class="login-text">${esc(u.login)}</span></td>
      <td>
        ${esMismo
          ? badgeRol
          : `<select class="rol-select" onchange="cambiarRol(${u.id}, this.value)">
               <option value="USER"  ${u.rol === 'USER'  ? 'selected' : ''}>User</option>
               <option value="ADMIN" ${u.rol === 'ADMIN' ? 'selected' : ''}>Admin</option>
             </select>`
        }
      </td>
      <td>
        <div class="actions">
          ${esMismo
            ? ''
            : `<button class="btn btn-sm btn-danger" onclick="pedirEliminar(${u.id}, '${esc(u.nombre)}')">Eliminar</button>`
          }
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── OBTENER LOGIN DEL TOKEN ──
function obtenerLoginDelToken() {
  try {
    const token = localStorage.getItem('tokenJWT');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch {
    return null;
  }
}

// ── MODAL CREAR ──
function openModal() {
  ['nombre', 'login', 'clave'].forEach(f => document.getElementById('f-' + f).value = '');
  document.getElementById('f-rol').value = 'USER';
  document.getElementById('form-error').style.display = 'none';
  document.getElementById('modal-add').classList.add('open');
  setTimeout(() => document.getElementById('f-nombre').focus(), 80);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

async function submitForm() {
  const nombre = document.getElementById('f-nombre').value.trim();
  const login  = document.getElementById('f-login').value.trim();
  const clave  = document.getElementById('f-clave').value.trim();
  const rol    = document.getElementById('f-rol').value;

  if (!nombre || !login || !clave) {
    document.getElementById('form-error').style.display = 'block';
    return;
  }

  document.getElementById('form-error').style.display = 'none';

  try {
    const res = await authFetch(`${API}/usuarios`, {
      method: 'POST',
      body: JSON.stringify({ nombre, login, clave, rol })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || 'HTTP ' + res.status);
    }
    closeModal('modal-add');
    showToast(`${nombre} creado con éxito`, 'success');
    cargarUsuarios();
  } catch (e) {
    showToast('Error al crear: ' + e.message, 'error');
  }
}

// ── CAMBIAR ROL ──
async function cambiarRol(id, rol) {
  try {
    const res = await authFetch(`${API}/usuarios/${id}/rol`, {
      method: 'PATCH',
      body: JSON.stringify({ rol })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Rol actualizado', 'success');
    cargarUsuarios();
  } catch (e) {
    showToast('Error al cambiar rol: ' + e.message, 'error');
  }
}

// ── ELIMINAR ──
function pedirEliminar(id, nombre) {
  pendingEliminarId = id;
  document.getElementById('confirm-sub').textContent =
    `¿Estás seguro que querés eliminar a ${nombre}? Esta acción no se puede deshacer.`;
  document.getElementById('modal-confirm').classList.add('open');
}

async function confirmarEliminar() {
  if (!pendingEliminarId) return;
  closeModal('modal-confirm');
  try {
    const res = await authFetch(`${API}/usuarios/${pendingEliminarId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Usuario eliminado', 'success');
    cargarUsuarios();
  } catch (e) {
    showToast('Error al eliminar: ' + e.message, 'error');
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
authFetch(`${API}/profesionales/sin-compra`)
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      const dot = document.getElementById('nav-dot-sincompra');
      if (dot) dot.style.display = 'inline-block';
    }
  })
  .catch(() => {});

// ── INIT ──
cargarUsuarios();
