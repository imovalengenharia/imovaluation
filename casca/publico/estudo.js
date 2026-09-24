/* A ponte do lado da casca. O módulo, dentro do iframe, avisa que está pronto;
   a casca busca o estudo e o entrega; a cada mudança o módulo devolve as
   premissas e a casca salva — agrupando as mudanças em rajada numa só gravação. */
(function () {
  'use strict';
  var CANAL = 'imovaluation', ESPERA = 800;
  var quadro = document.getElementById('modulo');
  var estado = document.getElementById('estado');
  var id = quadro.getAttribute('data-estudo');
  var url = '/api/estudos/' + encodeURIComponent(id);
  var pendente = null, timer = null, gravando = false, parado = false;
  var vista = null, timerVista = null, abaGravada = null;

  function mostrar(texto, erro) {
    estado.textContent = texto;
    estado.classList.toggle('erro', !!erro);
  }

  function enviar(msg) { quadro.contentWindow.postMessage(msg, location.origin); }

  function gravar(finalizando) {
    clearTimeout(timer); timer = null;
    if (!pendente || gravando || parado) return;
    var corpo = JSON.stringify(pendente);
    pendente = null; gravando = true;
    mostrar('Salvando…');
    fetch(url + '/premissas', {
      method: 'PUT', body: corpo, keepalive: !!finalizando, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    }).then(function (r) {
      gravando = false;
      if (r.status === 401) {
        parado = true;
        mostrar('Sessão expirada — entre de novo; as últimas mudanças não foram salvas', true);
        return;
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      if (pendente) gravar(); else mostrar('Salvo');
    }).catch(function () {
      gravando = false;
      /* devolve à fila o que não foi, sem passar por cima de mudança mais nova */
      if (!pendente) pendente = JSON.parse(corpo);
      mostrar('Não salvo — tentando de novo', true);
      timer = setTimeout(gravar, 5000);
    });
  }

  window.addEventListener('message', function (ev) {
    if (ev.source !== quadro.contentWindow || ev.origin !== location.origin) return;
    var m = ev.data;
    if (!m || m.canal !== CANAL) return;
    if (m.tipo === 'pronto') {
      fetch(url, { credentials: 'same-origin' }).then(function (r) {
        if (r.status === 401) { location.href = '/entrar?voltar=' + encodeURIComponent(location.pathname); return null; }
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (d) {
        if (d) enviar({ canal: CANAL, tipo: 'abrir', usuario: d.usuario, estudo: d.estudo });
      }).catch(function () { mostrar('Não foi possível abrir o estudo', true); });
    } else if (m.tipo === 'mudou' && m.premissas) {
      pendente = { premissas: m.premissas, resumo: m.resumo || null };
      mostrar('Alterado');
      clearTimeout(timer);
      timer = setTimeout(gravar, ESPERA);
    } else if (m.tipo === 'resumo' && m.resumo) {
      fetch(url + '/resumo', { method: 'PUT', body: JSON.stringify({ resumo: m.resumo }), credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' } }).catch(function () {});
    } else if (m.tipo === 'vista' && m.vista) {
      /* onde a leitura parou: guarda à parte, sem contar como edição */
      /* troca de aba grava na hora; a rolagem espera a pessoa parar */
      var trocouAba = !vista || vista.aba !== m.vista.aba;
      vista = m.vista;
      clearTimeout(timerVista);
      if (trocouAba && abaGravada !== m.vista.aba) gravarVista();
      else timerVista = setTimeout(gravarVista, 1500);
    }
  });

  function gravarVista(finalizando) {
    clearTimeout(timerVista); timerVista = null;
    if (!vista || parado) return;
    var corpo = JSON.stringify({ vista: vista });
    abaGravada = vista.aba;
    vista = null;
    fetch(url + '/vista', { method: 'PUT', body: corpo, keepalive: !!finalizando, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' } }).catch(function () {});
  }

  /* O módulo só carrega depois que a casca já escuta: se ele carregasse
     primeiro, o aviso de "pronto" podia chegar antes do ouvinte e se perder,
     deixando o estudo em branco. */
  quadro.src = quadro.getAttribute('data-src');

  /* Saindo com mudança na fila: grava já, e o navegador pergunta antes de fechar. */
  window.addEventListener('pagehide', function () {
    if (pendente) gravar(true);
    if (vista) gravarVista(true);
  });
  window.addEventListener('beforeunload', function (ev) {
    if (pendente || gravando) { gravar(true); ev.preventDefault(); ev.returnValue = ''; }
  });
})();
