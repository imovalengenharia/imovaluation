/* O pouco de comportamento das páginas da casca: abrir e fechar diálogos e
   menus. Tudo o mais é formulário comum, que funciona sem este arquivo. */
(function () {
  'use strict';
  document.addEventListener('click', function (ev) {
    var abrir = ev.target.closest('[data-abrir]');
    if (abrir) {
      var d = document.getElementById(abrir.getAttribute('data-abrir'));
      var menu = abrir.closest('details.menu');
      if (menu) menu.open = false;
      if (d && d.showModal) {
        d.showModal();
        var campo = d.querySelector('input:not([type=hidden]), select');
        if (campo) { campo.focus(); if (campo.select) campo.select(); }
      }
      return;
    }
    if (ev.target.closest('[data-fechar]')) { ev.target.closest('dialog').close(); return; }
    /* clique no fundo escurecido fecha o diálogo */
    if (ev.target.tagName === 'DIALOG') { ev.target.close(); return; }
    /* clique fora fecha o menu aberto */
    document.querySelectorAll('details.menu[open]').forEach(function (m) {
      if (!m.contains(ev.target)) m.open = false;
    });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') document.querySelectorAll('details.menu[open]').forEach(function (m) { m.open = false; });
  });
})();
