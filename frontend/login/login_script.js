const API_BASE = 'https://arvensis-clientes.onrender.com';

// ── REDIRECT SI YA ESTÁ LOGUEADO ──
if (localStorage.getItem('tokenJWT')) {
  window.location.href = '../index.html';
}

// ── TOGGLE PASSWORD ──
function togglePassword() {
  const input = document.getElementById('clave');
  const icon = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    input.type = 'password';
    icon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>`;
  }
}

// ── MOSTRAR ERROR ──
function mostrarError(msg) {
  const err = document.getElementById('error-msg');
  document.getElementById('error-text').textContent = msg;
  err.classList.add('show');
}

function ocultarError() {
  document.getElementById('error-msg').classList.remove('show');
}

// ── LOGIN ──
async function iniciarSesion() {
  const login = document.getElementById('login').value.trim();
  const clave = document.getElementById('clave').value.trim();

  if (!login || !clave) {
    mostrarError('Completá usuario y contraseña.');
    return;
  }

  ocultarError();

  const btn = document.getElementById('btn-login');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('spinner');

  btn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'block';

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, clave })
    });

    if (!res.ok) {
      mostrarError('Usuario o contraseña incorrectos.');
      return;
    }

    const data = await res.json();
    localStorage.setItem('tokenJWT', data.tokenJWT);

    // Decodificar el payload del JWT para obtener el rol
    const payload = JSON.parse(atob(data.tokenJWT.split('.')[1]));
    localStorage.setItem('rol', payload.rol);

    window.location.href = '../index.html';

  } catch (e) {
    mostrarError('No se pudo conectar al servidor.');
  } finally {
    btn.disabled = false;
    btnText.style.display = 'block';
    spinner.style.display = 'none';
  }
}

// ── ENTER PARA LOGUEAR ──
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') iniciarSesion();
});
