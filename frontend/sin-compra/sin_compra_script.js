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

const API = 'https://arvensis-cli.onrender.com/profesionales';

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

function diasDesde(fechaISO) {
  if (!fechaISO) return 0;
  const diff = Date.now() - new Date(fechaISO).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatFecha(fechaISO) {
  if (!fechaISO) return '—';
  return new Date(fechaISO).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ── CARGAR DATOS ──
async function cargarSinCompra() {
  try {
    const res = await authFetch(`${API}/sin-compra`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];

    document.getElementById('page-sub').textContent =
      `${lista.length} profesional${lista.length !== 1 ? 'es' : ''} sin compra · ${new Date().toLocaleTimeString('es-AR')}`;

    // Puntito rojo en el nav
    const dot = document.getElementById('nav-dot');
    if (lista.length > 0) {
      dot.style.display = 'inline-block';
    } else {
      dot.style.display = 'none';
    }

    // Banner de alerta
    const banner = document.getElementById('alert-banner');
    if (lista.length > 0) {
      document.getElementById('alert-text').textContent =
        `Hay ${lista.length} profesional${lista.length !== 1 ? 'es' : ''} que no compraron en los últimos 30 días.`;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }

    renderTabla(lista);
  } catch (e) {
    document.getElementById('page-sub').textContent = 'Error al conectar';
    document.getElementById('tbody').innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div class="empty-title">No se pudo conectar</div>
          <div class="empty-sub">Asegurate de que el servidor esté corriendo en localhost:8080</div>
        </div>
      </td></tr>`;
  }
}

// ── RENDER ──
function renderTabla(lista) {
  const tbody = document.getElementById('tbody');

  if (!lista.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>
          <div class="empty-title">Todo en orden</div>
          <div class="empty-sub">No hay profesionales sin compra en los últimos 30 días</div>
        </div>
      </td></tr>`;
    return;
  }

  // Ordenar por más días sin compra primero
  const ordenados = [...lista].sort((a, b) => {
    return diasDesde(b.fechaQueSeLeHablo) - diasDesde(a.fechaQueSeLeHablo);
  });

  tbody.innerHTML = ordenados.map(p => {
    const avc = avatarColor(p.nombre + p.apellido);
    const dias = diasDesde(p.fechaQueSeLeHablo);
    const badgeClass = dias >= 60 ? 'critico' : 'advertencia';
    const badgeLabel = dias === 1 ? '1 día' : `${dias} días`;

    return `<tr>
      <td>
        <div class="cell-name">
          <div class="avatar ${avc}">${initials(p.nombre, p.apellido)}</div>
          <a class="name-text" href="../trazabilidad/trazabilidad.html?id=${p.id}">${esc(p.nombre)} ${esc(p.apellido)}</a>
        </div>
      </td>
      <td><span class="tag-prof">${esc(p.profesion ?? '—')}</span></td>
      <td>
        <a class="email-link" href="mailto:${esc(p.email)}">${esc(p.email ?? '—')}</a>
        <div class="phone">${esc(p.telefono ?? '—')}</div>
      </td>
      <td><span class="fecha-hablo">${formatFecha(p.fechaQueSeLeHablo)}</span></td>
      <td><span class="badge-dias ${badgeClass}">${badgeLabel}</span></td>
      <td>
        <a class="btn" href="../trazabilidad/trazabilidad.html?id=${p.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Ver trazabilidad
        </a>
      </td>
    </tr>`;
  }).join('');
}

// ── INIT ──
cargarSinCompra();
