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

const API = 'https://arvensis-clientes.onrender.com/profesionales';
let allData = [], filtered = [], sortField = '', sortDir = 1;
let desData = [], desFiltered = [], desSortField = '', desSortDir = 1;
let currentPage = 0, pageSize = 10, totalPages = 1, totalElements = 0;
let pendingDeshabilitarId = null;

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
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Mostrar sección usuarios solo si es admin
if (localStorage.getItem('rol') === 'ADMIN') {
  const navUsuarios = document.getElementById('nav-usuarios');
  if (navUsuarios) navUsuarios.style.display = 'flex';
}

// ── LOAD ──
async function loadProfesionales(page = 0) {
  currentPage = page;
  document.getElementById('last-update').textContent = 'Cargando…';
  try {
    const res = await authFetch(`${API}?page=${page}&size=${pageSize}`);
    const resDes = await authFetch(`${API}/deshabilitados`);
    if (!res.ok || !resDes.ok) throw new Error('HTTP ' + res.status + resDes.status);
    const data = await res.json();
    const dataDes = await resDes.json();
    allData = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
    desData = Array.isArray(dataDes.content) ? dataDes.content : (Array.isArray(dataDes) ? dataDes : []);
    totalPages = data.totalPages ?? 1;
    totalElements = data.totalElements ?? allData.length;

    document.getElementById('dot').className = 'status-dot';
    document.getElementById('conn-label').textContent = 'Conectado';
    document.getElementById('last-update').textContent = 'Actualizado ' + new Date().toLocaleTimeString('es-AR');

    const hab = allData.filter(p => (p.estado ?? 'HABILITADO') === 'HABILITADO').length;
    const des = desData.length;
    document.getElementById('stat-total').textContent = totalElements;
    document.getElementById('stat-hab').textContent = hab;
    document.getElementById('stat-des').textContent = des;
    document.getElementById('stat-page').textContent = (data.number ?? page) + 1;
    document.getElementById('stat-pages').textContent = `de ${totalPages} página${totalPages !== 1 ? 's' : ''}`;

    const sel = document.getElementById('filter-prof');
    if (sel) {
      const cur = sel.value;
      sel.innerHTML = '<option value="">Todas las profesiones</option>' +
        profs.map(p => `<option value="${p}" ${p === cur ? 'selected' : ''}>${p.replace("_", " ")}</option>`).join('');
    }

    filtered = [...allData];
    renderTable();
  } catch (e) {
    document.getElementById('dot').className = 'status-dot offline';
    document.getElementById('conn-label').textContent = 'Sin conexión';
    document.getElementById('last-update').textContent = 'Error: ' + e.message;
    document.getElementById('stat-total').textContent = '—';
    document.getElementById('stat-hab').textContent = '—';
    document.getElementById('stat-des').textContent = '—';
    document.getElementById('stat-page').textContent = '—';
    document.getElementById('stat-pages').textContent = 'de — páginas';
    document.getElementById('tbody').innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div class="empty-title">No se pudo conectar</div>
          <div class="empty-sub">Asegurate de que el servidor esté corriendo en localhost:8080</div>
        </div>
      </td></tr>`;
    document.getElementById('pag-info').textContent = '';
  }
}

// ── FILTER & SORT ──
function filterTable() {
  const q = document.getElementById('search').value.toLowerCase().trim();
  const personal = document.getElementById('filter-estado')?.value ?? '';
  const prof = document.getElementById('filter-prof')?.value ?? '';

  filtered = allData.filter(p => {
    const text = `${p.nombre} ${p.apellido} ${p.profesion} ${p.email} ${p.telefono}`.toLowerCase();
    return (!q || text.includes(q))
        && (!personal || p.personalAsignado === personal)
        && (!prof || p.profesion === prof);
  });
  renderTable();
}

function sortBy(field) {
  sortDir = sortField === field ? -sortDir : 1;
  sortField = field;
  document.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));
  const th = document.getElementById('th-' + field);
  if (th) {
    th.classList.add('sorted');
    th.querySelector('.sort-arrow').textContent = sortDir === 1 ? '↑' : '↓';
  }
  filterTable();
}

// ── RENDER ──
function renderTable() {
  const tbody = document.getElementById('tbody');
  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <div class="empty-title">Sin resultados</div>
          <div class="empty-sub">Probá ajustando los filtros de búsqueda</div>
        </div>
      </td></tr>`;
    document.getElementById('pag-info').textContent = '';
    renderPagination();
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const avc = avatarColor(p.nombre + p.apellido);
    const btnEditar = `<button class="btn btn-sm" onclick="abrirModalEditar(${p.id})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Editar
    </button>`;
    const btnMapa = p.direccion
      ? `<a class="btn btn-ver-mapa" href="https://www.google.com/maps/search/${encodeURIComponent(p.direccion)}" target="_blank" rel="noopener noreferrer">Ver Mapa</a>`
      : '';

    return `<tr>
      <td>
        <div class="cell-name">
          <div class="avatar ${avc}">${initials(p.nombre, p.apellido)}</div>
          <a class="name-text" href="../trazabilidad/trazabilidad.html?id=${p.id}" style="text-decoration:none;color:inherit;cursor:pointer;">
            ${esc(p.nombre)} ${esc(p.apellido)}
          </a>
        </div>
      </td>
      <td><span class="tag-prof">${esc((p.profesion ?? '—').replace("_", " "))}</span></td>
      <td>
        <a class="email-link" href="mailto:${esc(p.email)}">${esc(p.email ?? '—')}</a>
        <div class="phone">${esc(p.telefono ?? '—')}</div>
      </td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--text-2)">
        ${esc(p.direccion ?? '—')}
      </td>
      <td>
        <select class="personal-select" onchange="asignarPersonal(${p.id}, this.value)">
          <option value="">Sin asignar</option>
          <option value="LUCI"  ${(p.personalAsignado ?? '') === 'LUCI'  ? 'selected' : ''}>Luci</option>
          <option value="LILI"  ${(p.personalAsignado ?? '') === 'LILI'  ? 'selected' : ''}>Lili</option>
          <option value="MARCE" ${(p.personalAsignado ?? '') === 'MARCE' ? 'selected' : ''}>Marce</option>
          <option value="FACU"  ${(p.personalAsignado ?? '') === 'FACU'  ? 'selected' : ''}>Facu</option>
          <option value="PAO"   ${(p.personalAsignado ?? '') === 'PAO'   ? 'selected' : ''}>Pao</option>
        </select>
      </td>
      <td><div class="actions">${btnMapa}${btnEditar}</div></td>
    </tr>`;
  }).join('');

  document.getElementById('pag-info').textContent =
    `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`;
  renderPagination();
}

// ── PAGINATION ──
function renderPagination() {
  document.getElementById('btn-prev').disabled = currentPage <= 0;
  document.getElementById('btn-next').disabled = currentPage >= totalPages - 1;
  const container = document.getElementById('page-btns');
  container.innerHTML = '';
  if (totalPages <= 1) return;
  const range = Math.min(totalPages, 5);
  const start = Math.max(0, Math.min(currentPage - 2, totalPages - range));
  for (let i = start; i < start + range; i++) {
    const b = document.createElement('button');
    b.className = 'pag-btn' + (i === currentPage ? ' active' : '');
    b.textContent = i + 1;
    b.onclick = () => loadProfesionales(i);
    container.appendChild(b);
  }
}

function changePage(dir) {
  const np = currentPage + dir;
  if (np >= 0 && np < totalPages) loadProfesionales(np);
}

// ── MODAL AGREGAR ──
function openModal() {
  ['nombre', 'apellido', 'email', 'telefono', 'profesion', 'direccion']
    .forEach(f => document.getElementById('f-' + f).value = '');
  document.getElementById('form-error').style.display = 'none';
  document.getElementById('modal-add').classList.add('open');
  setTimeout(() => document.getElementById('f-nombre').focus(), 80);
  authFetch(`${API}/profesiones`)
  .then(res => res.json())
  .then(profesiones => {
    const sel = document.getElementById('f-profesion');
    sel.innerHTML = '<option value="">Seleccioná una profesión</option>' +
      profesiones.map(p => `<option value="${p}">${esc((p ?? '—').replace("_", " "))}</option>`).join('');
  });
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

async function submitForm() {
  const fields = ['nombre', 'apellido', 'email', 'telefono', 'profesion', 'direccion'];
  const data = {};
  let valid = true;

  fields.forEach(f => {
    data[f] = document.getElementById('f-' + f).value.trim();
  });

  if (!data.nombre || !data.apellido) {
    valid = false;
  }

  if (!valid) {
    const err = document.getElementById('form-error');
    err.textContent = 'Nombre y apellido son obligatorios.';
    err.style.display = 'block';
    return;
  }

  document.getElementById('form-error').style.display = 'none';

  try {
    const res = await authFetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || 'HTTP ' + res.status);
    }
    closeModal('modal-add');
    showToast(`${data.nombre} ${data.apellido} guardado con éxito`, 'success');
    loadProfesionales(0);
  } catch (e) {
    showToast('Error al guardar: ' + e.message, 'error');
  }
}

// ── DESHABILITAR ──
function pedirDeshabilitar(id, nombre) {
  pendingDeshabilitarId = id;
  document.getElementById('confirm-sub').textContent =
    `¿Estás seguro que querés deshabilitar a ${nombre}?`;
  document.getElementById('modal-confirm').classList.add('open');
}

async function confirmDeshabilitar() {
  if (!pendingDeshabilitarId) return;
  closeModal('modal-confirm');
  try {
    const res = await authFetch(`${API}/${pendingDeshabilitarId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Profesional deshabilitado', 'success');
    loadProfesionales(currentPage);
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  } finally {
    pendingDeshabilitarId = null;
  }
}

// ── TOAST ──
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  document.getElementById('toast-msg').textContent = msg;
  t.className = 'toast ' + type;
  icon.innerHTML = type === 'success'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modal-add', 'modal-confirm'].forEach(closeModal);
  }
});

// ── SIN COMPRA ──
  authFetch(`${API}/sin-compra`)
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      const dot = document.getElementById('nav-dot-sincompra');
      if (dot) dot.style.display = 'inline-block';
    }
  })
  .catch(() => {});

// ── ASIGNAR PERSONAL ──
  async function asignarPersonal(id, valor) {
  try {
    const res = await authFetch(`${API}/${id}/asignar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personalAsignado: valor || null })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Personal asignado', 'success');
    loadProfesionales(currentPage);
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

// ── IMPORTAR EXCEL ──
let pendingImportData = null;

async function importarExcel(input) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  // Resetear el input para poder subir el mismo archivo de nuevo
  input.value = '';

  try {
    const res = await fetch(`${API}/importar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tokenJWT') },
      body: formData
    });

    const data = await res.json();

    if (res.status === 409) {
      // Hay duplicados — mostrar modal de confirmación
      pendingImportData = data.registros;
      const lista = document.getElementById('lista-duplicados');
      lista.innerHTML = data.duplicados.map(e => `<div style="padding:4px 0;border-bottom:1px solid var(--border)">${e}</div>`).join('');
      document.getElementById('modal-duplicados').classList.add('open');
      return;
    }

    if (!res.ok) throw new Error('HTTP ' + res.status);

    showToast(`${data.importados} profesionales importados`, 'success');
    loadProfesionales(0);

  } catch (e) {
    showToast('Error al importar: ' + e.message, 'error');
  }
}

async function confirmarImportacion() {
  closeModal('modal-duplicados');
  if (!pendingImportData) return;

  try {
    const res = await authFetch(`${API}/importar/confirmar`, {
      method: 'POST',
      body: JSON.stringify(pendingImportData)
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    showToast(`${data.importados} profesionales importados`, 'success');
    loadProfesionales(0);
  } catch (e) {
    showToast('Error al confirmar: ' + e.message, 'error');
  } finally {
    pendingImportData = null;
  }
}

// ── EDITAR PROFESIONAL ──
let editandoId = null;

async function abrirModalEditar(id) {
  editandoId = id;
  const profesional = allData.find(p => p.id === id);
  if (!profesional) return;

  // Precargar profesiones
  const res = await authFetch(`${API}/profesiones`);
  const profesiones = await res.json();
  const selProf = document.getElementById('e-profesion');
  selProf.innerHTML = '<option value="">Sin profesión</option>' +
    profesiones.map(p => `<option value="${p}" ${p === profesional.profesion ? 'selected' : ''}>${esc(p.replace('_', ' '))}</option>`).join('');

  // Precargar campos
  document.getElementById('e-nombre').value    = profesional.nombre ?? '';
  document.getElementById('e-apellido').value  = profesional.apellido ?? '';
  document.getElementById('e-email').value     = profesional.email ?? '';
  document.getElementById('e-telefono').value  = profesional.telefono ?? '';
  document.getElementById('e-direccion').value = profesional.direccion ?? '';

  document.getElementById('form-error-editar').style.display = 'none';
  document.getElementById('modal-editar').classList.add('open');
}

async function submitEditar() {
  const nombre   = document.getElementById('e-nombre').value.trim();
  const apellido = document.getElementById('e-apellido').value.trim();

  if (!nombre || !apellido) {
    document.getElementById('form-error-editar').style.display = 'block';
    return;
  }

  const data = {
    nombre,
    apellido,
    email:     document.getElementById('e-email').value.trim() || null,
    telefono:  document.getElementById('e-telefono').value.trim() || null,
    direccion: document.getElementById('e-direccion').value.trim() || null,
    profesion: document.getElementById('e-profesion').value || null
  };

  try {
    const res = await authFetch(`${API}/${editandoId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    closeModal('modal-editar');
    showToast('Profesional actualizado', 'success');
    loadProfesionales(currentPage);
  } catch (e) {
    showToast('Error al actualizar: ' + e.message, 'error');
  }
}

// ── INIT ──
loadProfesionales();
