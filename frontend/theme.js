(function () {
  var KEY = 'gestion_theme';

  function guardado() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function aplicar(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      var esClaro = theme === 'light';
      btn.setAttribute('aria-pressed', esClaro ? 'true' : 'false');
      btn.setAttribute('aria-label', esClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
      btn.title = esClaro ? 'Modo oscuro' : 'Modo claro';
    });
  }

  // Se aplica ya mismo (antes de pintar el body) para que no haya parpadeo del tema por defecto.
  aplicar(guardado() === 'light' ? 'light' : 'dark');

  document.addEventListener('DOMContentLoaded', function () {
    // Vuelve a aplicar para setear aria-label/title de los botones ya presentes en el DOM.
    aplicar(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var actual = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        var nuevo = actual === 'light' ? 'dark' : 'light';
        try { localStorage.setItem(KEY, nuevo); } catch (e) {}
        aplicar(nuevo);
      });
    });
  });
})();
