const tokenJWT = localStorage.getItem('tokenJWT');
if (!tokenJWT) {
  window.location.href = '../login/login.html';
}

// Solo para decidir si se muestra la tarjeta. El control real de acceso
// pasa por el backend de Sueldos (app.acceso.permitidos) — esto es nada
// mas para no mostrar una tarjeta que despues rebota.
const SUELDOS_PERMITIDOS = ['facumoya'];

function payloadToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
}

const payload = tokenJWT ? payloadToken(tokenJWT) : null;
if (!payload || !SUELDOS_PERMITIDOS.includes(payload.sub)) {
  const card = document.querySelector('.card-sueldos');
  if (card) card.closest('.card-wrap').remove();
}

// Destinos reales de cada aplicación.
const DESTINOS = {
  gestion: '../index.html',
  sueldos: '../sueldos/index.html',
};

document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('click', (e) => {
    const key = card.dataset.app;
    const url = DESTINOS[key];
    if (!url) return;
    e.preventDefault();
    window.location.href = url;
  });
});
