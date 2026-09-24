import { html } from './html.js';
import { MODULOS } from '../modulos.js';

const FONTES = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500' +
  '&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@500;600&display=swap';

function documento({ titulo, config, corpo, classe = '', cabeca = '' }) {
  return html`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo ? `${titulo} · ${config.nome}` : config.nome}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTES}">
<link rel="stylesheet" href="/publico/casca.css">
<script src="/publico/casca.js" defer></script>
${cabeca}
</head>
<body class="${classe}">
${corpo}
</body>
</html>`.texto;
}

/* A barra de cima: a marca leva sempre às modelagens; no meio, a trilha de
   onde se está; à direita, quem entrou. */
function barra(config, usuario, meio = '') {
  return html`<header class="barra">
  <a class="marca" href="/modelagens">${config.nome}</a>
  ${meio}
  <span class="vazio"></span>
  <span class="quem"><span class="avatar" aria-hidden="true">${iniciais(usuario.nome)}</span>${usuario.nome}</span>
  <form method="post" action="/sair"><button class="acao" type="submit">Sair</button></form>
</header>`;
}

function trilha(passos) {
  return html`<nav class="trilha" aria-label="Onde você está">${passos.map((p, i) => html`${i ? html`<span class="sep">/</span>` : ''}${
    p.href ? html`<a href="${p.href}">${p.rotulo}</a>` : html`<span class="atual">${p.rotulo}</span>`}`)}</nav>`;
}

const iniciais = nome => String(nome).trim().split(/\s+/).filter(Boolean)
  .map(p => p[0]).slice(0, 2).join('').toUpperCase();

const aviso = (texto, tipo = '') => texto ? html`<div class="aviso ${tipo}" role="alert">${texto}</div>` : '';

/* ------------------------------------------------------------------ conta */
function cartao(config, titulo, conteudo) {
  return documento({ titulo, config, corpo: html`<main class="conta"><div class="cartao">
  <div class="marca">${config.nome}</div>
  <h1>${titulo}</h1>
  ${conteudo}
</div></main>` });
}

export function paginaEntrar(config, { email = '', erro = '', ok = '', voltar = '' } = {}) {
  return cartao(config, 'Entrar', html`
  ${aviso(ok)}${aviso(erro, 'erro')}
  <form method="post" action="/entrar">
    <input type="hidden" name="voltar" value="${voltar}">
    <div class="campo"><label for="email">E-mail</label>
      <input id="email" name="email" type="email" autocomplete="email" required autofocus value="${email}"></div>
    <div class="campo"><label for="senha">Senha</label>
      <input id="senha" name="senha" type="password" autocomplete="current-password" required></div>
    <button class="botao largo" type="submit">Entrar</button>
  </form>
  <div class="rodape"><a href="/cadastro">Criar conta</a><a href="/recuperar">Esqueci a senha</a></div>`);
}

export function paginaCadastro(config, { nome = '', email = '', erro = '' } = {}, minimo) {
  return cartao(config, 'Criar conta', html`
  ${aviso(erro, 'erro')}
  <p>Um login é uma pessoa: a conta e as pastas são só suas.</p>
  <form method="post" action="/cadastro">
    <div class="campo"><label for="nome">Nome</label>
      <input id="nome" name="nome" type="text" autocomplete="name" required autofocus maxlength="120" value="${nome}"></div>
    <div class="campo"><label for="email">E-mail</label>
      <input id="email" name="email" type="email" autocomplete="email" required value="${email}"></div>
    <div class="campo"><label for="senha">Senha</label>
      <input id="senha" name="senha" type="password" autocomplete="new-password" required minlength="${minimo}">
      <span class="nota">Pelo menos ${minimo} caracteres.</span></div>
    <button class="botao largo" type="submit">Criar conta</button>
  </form>
  <div class="rodape"><span>Já tem conta? <a href="/entrar">Entrar</a></span></div>`);
}

export function paginaRecuperar(config, { enviado = false, email = '' } = {}) {
  return cartao(config, 'Recuperar a senha', enviado ? html`
  <p>Se houver uma conta para <strong>${email}</strong>, enviamos um link para criar uma senha nova.
     Ele vale por uma hora.</p>
  <div class="rodape"><a href="/entrar">Voltar para entrar</a></div>` : html`
  <p>Informe o e-mail da conta e enviaremos um link para criar uma senha nova.</p>
  <form method="post" action="/recuperar">
    <div class="campo"><label for="email">E-mail</label>
      <input id="email" name="email" type="email" autocomplete="email" required autofocus></div>
    <button class="botao largo" type="submit">Enviar link</button>
  </form>
  <div class="rodape"><a href="/entrar">Voltar para entrar</a></div>`);
}

export function paginaRedefinir(config, { token = '', erro = '', invalido = false } = {}, minimo) {
  if (invalido) return cartao(config, 'Link expirado', html`
  <p>Este link de recuperação não vale mais: já foi usado ou passou de uma hora.</p>
  <div class="rodape"><a href="/recuperar">Pedir outro link</a></div>`);
  return cartao(config, 'Senha nova', html`
  ${aviso(erro, 'erro')}
  <form method="post" action="/redefinir">
    <input type="hidden" name="token" value="${token}">
    <div class="campo"><label for="senha">Senha nova</label>
      <input id="senha" name="senha" type="password" autocomplete="new-password" required autofocus minlength="${minimo}">
      <span class="nota">Pelo menos ${minimo} caracteres. As outras sessões abertas serão encerradas.</span></div>
    <button class="botao largo" type="submit">Salvar senha</button>
  </form>`);
}

/* ------------------------------------------------------------ utilidades */
const FUSO = 'America/Sao_Paulo';

function saudacao() {
  const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: FUSO }));
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/* datas por extenso curto, no fuso de quem usa: 24/09/2026 e 24/09/2026, 14:32 */
const data = d => new Date(d).toLocaleDateString('pt-BR', { timeZone: FUSO });
const dataHora = d => new Date(d).toLocaleString('pt-BR',
  { timeZone: FUSO, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const datas = (criado, alterado, genero) => html`<span class="datas">
  <span>${genero === 'a' ? 'Criada' : 'Criado'} em ${data(criado)}</span>
  <span>${genero === 'a' ? 'Alterada' : 'Alterado'} em ${dataHora(alterado || criado)}</span></span>`;

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/* Desenhos em traço, na cor dos tokens: nada de imagem externa. */
const ILUSTRACOES = {
  /* uma gleba de contorno irregular, cortada por uma via curva em quadras e lotes */
  gleba: html`<svg viewBox="0 0 240 150" class="ilustracao" aria-hidden="true">
    <path class="terreno" d="M18 30 L92 12 L178 20 L224 58 L214 122 L140 140 L46 132 L12 88 Z"/>
    <path class="via" d="M12 88 C70 70 120 96 214 70"/>
    <path class="via" d="M92 12 C100 60 108 100 140 140"/>
    <g class="lotes">
      <path d="M30 40 L86 26 L90 58 L34 72 Z"/><path d="M48 36 L52 68"/><path d="M68 31 L72 63"/>
      <path d="M104 20 L170 28 L200 56 L112 70 Z"/><path d="M126 23 L130 67"/><path d="M148 26 L154 63"/>
      <path d="M24 98 C60 88 90 96 104 102 L112 126 L50 122 Z"/><path d="M60 94 L66 123"/><path d="M84 96 L88 124"/>
      <path d="M122 100 C150 92 180 86 206 82 L200 114 L142 128 Z"/><path d="M150 94 L158 124"/><path d="M178 88 L182 118"/>
    </g>
    <circle class="marco" cx="178" cy="44" r="4"/>
  </svg>`,
  pasta: html`<svg viewBox="0 0 120 90" class="ilustracao" aria-hidden="true">
    <path class="terreno" d="M10 22 L10 78 L110 78 L110 30 L56 30 L46 18 L14 18 Z"/>
    <path class="via" d="M10 38 L110 38"/>
    <g class="lotes"><path d="M26 52 L70 52"/><path d="M26 62 L90 62"/></g>
  </svg>`,
};

/* ------------------------------------------- a tela inicial: as metodologias */
/* Depois do login, só a escolha da metodologia. Pastas e estudos moram dentro
   de cada uma e só aparecem depois dela — nada de uma se mistura com outra. */
export function paginaModelagens(config, usuario) {
  const primeiroNome = String(usuario.nome).trim().split(/\s+/)[0];
  return documento({ titulo: 'Metodologias', config, corpo: html`
${barra(config, usuario)}
<main class="inicio">
  <section class="saudacao">
    <h1>${saudacao()}, ${primeiroNome}.</h1>
    <p class="lead">Escolha o tipo de análise da qualidade do investimento imobiliário:</p>
  </section>
  <section class="modelagens" aria-label="Metodologias">
    ${Object.values(MODULOS).map(m => html`<a class="modelagem" href="/modelagens/${m.id}">
        <div class="quadro-ilustracao">${ILUSTRACOES[m.ilustracao] || ''}</div>
        <div class="corpo">
          <h2>${m.nome}</h2>
          <p>${m.descricao}</p>
          <div class="rodape-cartao"><span></span><span class="seta">Abrir <span aria-hidden="true">→</span></span></div>
        </div>
      </a>`)}
  </section>
</main>` });
}

/* ------------------------------------------- a área de trabalho da modelagem */
function dialogo(id, titulo, conteudo) {
  return html`<dialog id="${id}" class="dialogo" aria-labelledby="${id}-t">
  <h2 id="${id}-t">${titulo}</h2>
  ${conteudo}
</dialog>`;
}

const botoesDialogo = (rotulo, classe = '') => html`<div class="botoes">
  <button type="button" class="botao leve" data-fechar>Cancelar</button>
  <button type="submit" class="botao ${classe}">${rotulo}</button></div>`;

function cartaoEstudo(e, pastas, pastaAtual) {
  const outras = pastas.filter(p => p.id !== pastaAtual.id);
  const resumo = Array.isArray(e.resumo) ? e.resumo : [];
  const [destaque, ...demais] = resumo;
  const d = `e-${e.id}`;
  return html`<article class="estudo">
  <a class="cobre" href="/estudos/${e.id}" aria-label="Abrir ${e.nome}"></a>
  <header>
    <h3>${e.nome}</h3>
    <details class="menu">
      <summary aria-label="Ações do estudo">⋯</summary>
      <div class="menu-lista">
        <button type="button" data-abrir="${d}-renomear">Renomear</button>
        <button type="button" data-abrir="${d}-duplicar">Duplicar</button>
        ${outras.length ? html`<button type="button" data-abrir="${d}-mover">Mover para…</button>` : ''}
        <button type="button" class="perigo" data-abrir="${d}-apagar">Apagar</button>
      </div>
    </details>
  </header>
  ${destaque ? html`<div class="destaque"><span class="rotulo">${destaque[0]}</span><span class="valor">${destaque[1]}</span></div>
  <dl class="numeros">${demais.map(([r, v]) => html`<div><dt>${r}</dt><dd>${v}</dd></div>`)}</dl>`
  : html`<p class="sem-calculo">Ainda sem premissas. Abra para começar.</p>`}
  ${e.vista?.rotulo ? html`<p class="parou">Parou em <em>${e.vista.rotulo}</em></p>` : ''}
  <footer>
    ${datas(e.criado_em, e.atualizado_em, 'o')}
    <span class="seta">${destaque || e.vista ? 'Continuar' : 'Começar'} <span aria-hidden="true">→</span></span>
  </footer>
</article>
${dialogo(`${d}-renomear`, 'Renomear estudo', html`<form method="post" action="/estudos/${e.id}/renomear">
  <input type="text" name="nome" value="${e.nome}" required maxlength="160" aria-label="Nome do estudo">
  ${botoesDialogo('Salvar')}</form>`)}
${dialogo(`${d}-duplicar`, 'Duplicar estudo', html`<form method="post" action="/estudos/${e.id}/duplicar">
  <p>Cria uma cópia com as mesmas premissas, nesta pasta — o jeito de montar outro cenário.</p>
  <input type="text" name="nome" value="${e.nome} (cópia)" required maxlength="160" aria-label="Nome da cópia">
  ${botoesDialogo('Duplicar')}</form>`)}
${outras.length ? dialogo(`${d}-mover`, 'Mover estudo', html`<form method="post" action="/estudos/${e.id}/mover">
  <select name="destino" aria-label="Pasta de destino">${outras.map(p => html`<option value="${p.id}">${p.nome}</option>`)}</select>
  ${botoesDialogo('Mover')}</form>`) : ''}
${dialogo(`${d}-apagar`, 'Apagar estudo', html`<form method="post" action="/estudos/${e.id}/apagar">
  <p>Apagar <strong>${e.nome}</strong>? As premissas e os resultados dele se perdem, e não há como desfazer.</p>
  ${botoesDialogo('Apagar', 'perigo')}</form>`)}`;
}

export function paginaAreaDeTrabalho(config, usuario, { modulo, pastas, pasta, estudos, erro, ok }) {
  const passos = [{ rotulo: 'Metodologias', href: '/modelagens' },
    pasta ? { rotulo: modulo.nome, href: `/modelagens/${modulo.id}` } : { rotulo: modulo.nome },
    ...(pasta ? [{ rotulo: pasta.nome }] : [])];
  const novaPasta = (classe = '') => html`<form class="nova-pasta ${classe}" method="post" action="/modelagens/${modulo.id}/pastas">
    <input type="text" name="nome" placeholder="Nome da nova pasta" required maxlength="120" aria-label="Nome da nova pasta">
    <button class="botao ${classe ? '' : 'leve'}" type="submit">${classe ? 'Criar pasta' : '+'}</button>
  </form>`;

  let conteudo;
  if (!pasta && pastas.length) {
    /* a metodologia aberta: as pastas dela, e o caminho para criar outra */
    conteudo = html`
    <header class="cab-pasta">
      <div>
        <p class="sobretitulo">Metodologia</p>
        <h1>${modulo.nome}</h1>
        <p class="meta">${plural(pastas.length, 'pasta de trabalho', 'pastas de trabalho')}</p>
      </div>
      <div class="acoes"><button type="button" class="botao" data-abrir="m-nova-pasta">+ Nova pasta</button></div>
    </header>
    <div class="estudos">
      <button type="button" class="estudo novo" data-abrir="m-nova-pasta">
        <span class="mais" aria-hidden="true">+</span><span>Nova pasta de trabalho</span>
      </button>
      ${pastas.map(p => html`<a class="estudo pasta-cartao" href="/modelagens/${modulo.id}/${p.id}">
        <span class="icone-pasta" aria-hidden="true"></span>
        <h3>${p.nome}</h3>
        <p class="sem-calculo">${p.estudos ? plural(p.estudos, 'estudo', 'estudos') : 'Pasta vazia'}</p>
        <footer>${datas(p.criada_em, p.alterada_em, 'a')}
          <span class="seta">Abrir <span aria-hidden="true">→</span></span></footer>
      </a>`)}
    </div>
    ${dialogo('m-nova-pasta', 'Nova pasta de trabalho', html`<form method="post" action="/modelagens/${modulo.id}/pastas">
      <input type="text" name="nome" placeholder="Ex.: Clientes 2026" required maxlength="120" aria-label="Nome da pasta">
      ${botoesDialogo('Criar pasta')}</form>`)}`;
  } else if (!pasta) {
    conteudo = html`<div class="vazio-grande">
      ${ILUSTRACOES.pasta}
      <h1>Comece por uma pasta de trabalho</h1>
      ${novaPasta('grande')}
    </div>`;
  } else {
    const vazia = !estudos.length;
    conteudo = html`
    <header class="cab-pasta">
      <div>
        <p class="sobretitulo">Pasta de trabalho</p>
        <h1>${pasta.nome}</h1>
        <p class="meta">${plural(estudos.length, 'estudo', 'estudos')} · criada em ${data(pasta.criada_em)} ·
          alterada em ${dataHora(pasta.alterada_em || pasta.criada_em)}</p>
      </div>
      <div class="acoes">
        <a class="botao leve" href="/modelagens/${modulo.id}">← Todas as pastas</a>
        <button type="button" class="botao leve" data-abrir="p-renomear">Renomear</button>
        <button type="button" class="botao leve" data-abrir="p-apagar">Apagar</button>
        <button type="button" class="botao" data-abrir="p-novo">+ Novo estudo</button>
      </div>
    </header>
    <div class="estudos">
      <button type="button" class="estudo novo" data-abrir="p-novo">
        <span class="mais" aria-hidden="true">+</span>
        <span>${vazia ? 'Criar o primeiro estudo desta pasta' : 'Novo estudo'}</span>
      </button>
      ${estudos.map(e => cartaoEstudo(e, pastas, pasta))}
    </div>
    ${dialogo('p-novo', 'Novo estudo', html`<form method="post" action="/pastas/${pasta.id}/estudos">
      <input type="text" name="nome" placeholder="Ex.: Gleba Itu — cenário base" required maxlength="160" aria-label="Nome do estudo">
      ${botoesDialogo('Criar e abrir')}</form>`)}
    ${dialogo('p-renomear', 'Renomear pasta', html`<form method="post" action="/pastas/${pasta.id}/renomear">
      <input type="text" name="nome" value="${pasta.nome}" required maxlength="120" aria-label="Nome da pasta">
      ${botoesDialogo('Salvar')}</form>`)}
    ${dialogo('p-apagar', 'Apagar pasta', vazia
      ? html`<form method="post" action="/pastas/${pasta.id}/apagar">
          <p>Apagar a pasta <strong>${pasta.nome}</strong>? Ela está vazia.</p>
          ${botoesDialogo('Apagar', 'perigo')}</form>`
      : html`<p>A pasta <strong>${pasta.nome}</strong> tem ${plural(estudos.length, 'estudo', 'estudos')}.
          Mova ou apague os estudos antes — nenhum estudo some junto com a pasta.</p>
          <div class="botoes"><button type="button" class="botao" data-fechar>Entendi</button></div>`)}`;
  }

  return documento({ titulo: pasta ? `${pasta.nome} · ${modulo.nome}` : modulo.nome, config, corpo: html`
${barra(config, usuario, trilha(passos))}
<div class="area">
  <aside class="lateral" aria-label="Pastas de trabalho">
    <div class="lateral-titulo">
      <span class="sobretitulo">${modulo.nome}</span>
      <h2>Pastas de trabalho</h2>
    </div>
    ${pastas.length ? html`<nav class="lista-pastas">
      ${pastas.map(p => html`<a href="/modelagens/${modulo.id}/${p.id}" class="${pasta && p.id === pasta.id ? 'ativa' : ''}"
        ${pasta && p.id === pasta.id ? html`aria-current="page"` : ''}>
        <span class="nome">${p.nome}</span><span class="qtd">${p.estudos}</span></a>`)}
    </nav>` : html`<p class="sem-pastas">Nenhuma pasta ainda.</p>`}
    ${pastas.length ? novaPasta() : ''}
  </aside>
  <main class="conteudo">
    ${aviso(ok)}${aviso(erro, 'erro')}
    ${conteudo}
  </main>
</div>` });
}

/* ----------------------------------------------------------------- estudo */
export function paginaEstudo(config, usuario, { estudo, modulo }) {
  const passos = [
    { rotulo: 'Metodologias', href: '/modelagens' },
    { rotulo: modulo.nome, href: `/modelagens/${modulo.id}` },
    { rotulo: estudo.pasta_nome, href: `/modelagens/${modulo.id}/${estudo.pasta_id}` },
    { rotulo: estudo.nome },
  ];
  return documento({
    titulo: estudo.nome, config, classe: 'pagina-estudo',
    cabeca: html`<script src="/publico/estudo.js" defer></script>`,
    corpo: html`
${barra(config, usuario, html`${trilha(passos)}<span class="estado" id="estado" aria-live="polite"></span>`)}
<iframe id="modulo" title="${modulo.nome}" data-estudo="${estudo.id}"
  data-src="/m/${modulo.pasta}/index.html?casca"></iframe>`,
  });
}

export function paginaErro(config, usuario, titulo, texto) {
  return documento({ titulo, config, corpo: html`
${usuario ? barra(config, usuario) : ''}
<main class="inicio"><section class="saudacao"><h1>${titulo}</h1><p class="lead">${texto}</p>
<p><a href="/modelagens">Voltar às metodologias</a></p></section></main>` });
}
