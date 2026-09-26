/* ============================================================================
   COMPARATIVO DIRETO DE DADOS DE MERCADO — interface
   Uma aba por aba impressa da planilha, na mesma ordem e com os mesmos
   campos nas mesmas posições: a tela É a folha do laudo. Cada página é
   montada por uma função que recebe um contexto: na tela ('tela') os campos
   são digitáveis; na impressão ('papel') viram texto. É a mesma função nos
   dois casos, e por isso o que se vê é o que sai impresso.
   As abas de cálculo ocultas da planilha (Cálculo_apoio, Inf. Auxiliar,
   Listas Suspensas) não aparecem: moram no motor, e as poucas escolhas que
   tinham — tabela, fatores em uso, expoente — ficam num painel de tela sobre
   a página do Cálculo, que não sai no laudo.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.Motor, LS = M.LISTAS, N = M.N_AMOSTRA;

  /* ------------------------------------------------------ textos padrão
     O que é método e vale para qualquer laudo; o que é do caso fica vazio. */
  var TEXTO_CAPA = [
    '# DOCUMENTAÇÕES FORNECIDAS', '',
    '**- Matrícula nº :** ', '',
    '**- Extrato do IPTU de inscrição :** ', '', '',
    '# PRESSUPOSTOS, RESSALVAS E CONDIÇÕES LIMITANTES', '',
    'Este Laudo fundamenta-se no que estabelecem as normas técnicas da ABNT, Avaliação de Bens, registradas no INMETRO como NBR 14653 – Parte 1 (Procedimentos Gerais) e Parte 2 (Imóveis Urbanos), estudos técnicos do IBAPE e baseia-se:', '',
    '- Na documentação fornecida: RGI do imóvel;',
    '- Em informações constatadas por meio de vistoria remota, não sendo possível aferir características sobre a área, padrão da construção e seu estado de conservação. Para fins de cálculo, foram adotadas situações paradigmas, conforme foi possível constatar externamente com auxílio de imagens via satélite;',
    '- Em informações obtidas junto a agentes do mercado imobiliário local (vendedores, compradores, intermediários etc.).', '',
    'Na presente avaliação considerou-se que toda a documentação pertinente se encontrava correta e devidamente regularizada, e que o(s) imóvel(eis) objeto estariam livres e desembaraçados de quaisquer ônus, em condições de serem imediatamente comercializadas ou locados.', '',
    'Não foram efetuadas investigações quanto a correção dos documentos fornecidos; as observações “in loco” foram feitas sem instrumentos de medição; as informações obtidas foram tomadas como de boa fé.', '',
    'O presente trabalho não expressa a opinião do avaliador em relação aos investimentos ou transações, e sim, apenas a determinação do valor do imóvel, de acordo com a finalidade para qual o trabalho foi contratado.', '',
    'O presente trabalho não pode ser utilizado para outros fins, a não ser pelo qual foi contratado, nem pode ser incluído em outros documentos e publicações de qualquer forma sem autorização prévia por escrito.'
  ].join('\n');

  var TEXTO_CALCULO = [
    '# Diagnóstico de mercado:', '', '', '',
    '# Fatores de homogeneização utilizados no tratamento dos fatores:', '',
    'Fator oferta — Corrige a margem de negociação embutida nos preços anunciados, aproximando-os do valor provável de fechamento. Transações efetivas recebem fator unitário.', '',
    'Fator área — Ajusta a relação inversa entre dimensão e preço unitário, conforme critério de Abunahman (Curso Básico de Engenharia Legal e de Avaliações, 2008), um dos fatores área mais utilizados pelos profissionais da Engenharia de Avaliações: Fa = (Área do comparativo ÷ Área do avaliando)^1/4, quando a diferença entre as áreas for inferior a 30%; e expoente 1/8 quando superior a 30%.', '',
    'Fator localização — Obtido pela razão entre os índices fiscais dos logradouros (valores unitários de terreno constantes da Planta Genérica de Valores do município), na forma Fl = índice fiscal do logradouro do avaliando ÷ índice fiscal do logradouro do comparativo, refletindo a hierarquia de valorização territorial reconhecida pelo cadastro municipal.', '',
    'Fator padrão construtivo — Aferido com base nos estudos de valores de edificações do IBAPE (classificação das tipologias por classe e padrão construtivo), pela razão entre os valores unitários correspondentes aos padrões do avaliando e do comparativo.', '',
    'Fator idade/conservação — Reflete a depreciação física e funcional em função da idade aparente e do estado de conservação, comumente aferida pelo critério de Ross-Heidecke.', '',
    'Fator andar — Ajusta a posição vertical da unidade, com valorização crescente nos pavimentos mais altos; ajuste percentual modesto por andar de diferença.', '',
    'Fator vagas — Ajusta a dotação de vagas de garagem pela relação entre área privativa e quantidade de vagas (m²/vaga) do avaliando em comparação à mesma relação do comparativo, de modo que unidades com maior densidade de vagas por área recebam o correspondente ajuste relativo.'
  ].join('\n');

  var TEXTO_LIQUIDACAO = [
    'O valor de liquidação forçada (venda compulsória) representa o montante provável de venda do imóvel em prazo inferior ao normalmente requerido pelo mercado — situação típica de alienações compulsórias (execuções judiciais, leilões ou necessidade de liquidez imediata). Parte-se do valor de mercado apurado e aplicam-se os ajustes decorrentes da venda em prazo abreviado:', '',
    '**1. Prazo de venda**: estima-se o período necessário para a alienação forçada, inferior ao prazo de exposição típico do segmento.', '',
    '**2. Desconto financeiro (custo de oportunidade):** o valor de mercado é trazido a valor presente por uma taxa de atratividade de baixo risco (ativo livre de risco, como o Tesouro Selic), remunerando o capital que o vendedor deixaria de auferir ao antecipar a realização do ativo.', '',
    '**3. Custos de carregamento no período**:  deduzem-se as despesas incorridas com a manutenção do imóvel até a efetivação da venda, notadamente IPTU e taxa condominial, proporcionalmente ao prazo estimado de exposição.', '',
    '**4. Perda inflacionária:** considera-se a corrosão do poder de compra ao longo do período, ajustando-se o valor pela inflação projetada para o intervalo até a venda.', '',
    '**O valor de liquidação forçada resulta, portanto, do valor de mercado deduzido do desconto financeiro (à taxa livre de risco), dos custos de carregamento (IPTU e condomínio) e da perda inflacionária estimada para o prazo de venda compulsória.**'
  ].join('\n');

  var PERGUNTAS = [
    '1. Para avaliação foi fornecido o IPTU do imóvel?',
    '2. As áreas documentadas correspondem às verificadas em vistoria?',
    '3. Em caso de existência de vagas de garagem verificadas, elas estão documentadas?',
    '4. Imóvel concluído, sem sinais de reforma ou obras? (se negativo, justificar)',
    '5. O imóvel encontra-se em bom estado de conservação, sem vícios construtivos? (se negativo, justificar)',
    '6. Imóvel inserido em perímetro urbano?',
    '7. Se de uso residencial, o imóvel apresenta características unifamiliares?',
    '8. O imóvel possui um único uso? (Residencial/Comercial)',
    '9. O imóvel possui identificação numérica? Em caso positivo, está de acordo com a documentação?',
    '10. Imóvel não localizado em área de risco pela defesa civil?',
    '11. Imóvel sem suspeita de contaminação ou risco ambiental?',
    '12. O imóvel apresenta condições de habitabilidade?',
    '13. O imóvel apresenta boa garantia, dentro das condições de mercado atuais?'
  ];
  /* em pares por linha, como na planilha */
  var MELHORAMENTOS = [['agua', 'Abastecimento de água'], ['guias', 'Guias e Sarjetas'],
    ['esgoto', 'Rede de Esgoto'], ['gas', 'Rede de Gás'], ['eletrica', 'Rede Elétrica'],
    ['telefonica', 'Rede Telefônica'], ['pavimentacao', 'Pavimentação'], ['iluminacao', 'Iluminação Pública']];
  var SERVICOS = [['metro', 'Metrô'], ['igreja', 'Igreja'], ['onibus', 'Ônibus'], ['lazer', 'Lazer'],
    ['hospital', 'Hospital'], ['shopping', 'Shopping'], ['escola', 'Escola'], ['seguranca', 'Segurança']];
  var PECULIARIDADES = [['comunidade', 'Comunidade'], ['inundacao', 'Risco a inundação'],
    ['feira', 'Feira Livre'], ['ambiental', 'Risco ambiental'], ['outros', 'Outros']];
  /* cinco colunas de quatro, lidas linha a linha */
  var INFRA = [['piscina', 'Piscina'], ['festas', 'Salão de Festas'], ['tvCabo', 'TV a Cabo'], ['playground', 'Playground'], ['churrasqueira', 'Churrasqueira'],
    ['quadra', 'Quadra'], ['jardins', 'Jardins'], ['gerador', 'Gerador'], ['sauna', 'Sauna'], ['jogos', 'Salão de Jogos'],
    ['academia', 'Academia'], ['antena', 'Antena Coletiva'], ['brinquedoteca', 'Brinquedoteca'], ['deposito', 'Depósito Individual'], ['cooper', 'Pista de Cooper'],
    ['vigilancia', 'Vigilância Eletrônica'], ['lavanderia', 'Lavanderia Coletiva'], ['telefonia', 'Sistema de Telefonia'], ['conveniencia', 'Loja de Conveniência'], ['heliponto', 'Heliponto']];
  /* larguras fixas: a tabela e a sua continuação alinham coluna por coluna */
  /* Divisão interna por ambiente: nome (livre, com sugestões), quantidade
     e acabamentos em listas — revestimentos (piso, parede, teto/forro) e
     esquadrias (portas, janelas). Larguras fixas, em %. */
  var COLS_AMBIENTE = [['ambiente', 'AMBIENTE', 16], ['quantidade', 'QTD.', 6],
    ['piso', 'PISO', 15.6, 'revPiso'], ['parede', 'PAREDE', 15.6, 'revParede'], ['teto', 'TETO / FORRO', 15.6, 'revTeto'],
    ['porta', 'PORTAS', 15.6, 'portas'], ['esquadrias', 'JANELAS', 15.6, 'janelas']];
  /* 5 linhas de ambiente no mínimo (pedido do avaliador); o botão acrescenta até AMB_MAX, o que
     cabe na página da Região (sem página de continuação) */
  var N_AMBIENTES = 5, AMB_MAX = 17, FOTOS_POR_PAGINA = 8;
  function ambienteVazio() {
    return { ambiente: '', quantidade: null, parede: '', piso: '', teto: '', porta: '', esquadrias: '',
             bancadas: '', metais: '' };
  }
  var MERCADO = [['oferta', 'Nível de Oferta:'], ['demanda', 'Nível de Demanda:'],
    ['absorcao', 'Absorção:'], ['desempenho', 'Desempenho do Mercado Atual:']];

  var COR_PADRAO = '#002060';

  /* ------------------------------------------------------- a cor do laudo
     Uma cor escolhida pelo avaliador gera os tokens da folha nos dois temas:
     a cor cheia nas faixas e rótulos, e um tom bem claro dela nos campos
     digitáveis. No papel (impressão e prévia) os campos saem em branco — lá
     não há campo, só texto — e a cor cheia vai junto. */
  function rgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function misturar(a, b, t) {   /* t = quanto de b */
    var x = rgb(a), y = rgb(b);
    return '#' + x.map(function (v, i) {
      return ('0' + Math.round(v + (y[i] - v) * t).toString(16)).slice(-2); }).join('').toUpperCase();
  }
  function tintaSobre(hex) {       /* texto legível sobre a faixa */
    var c = rgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 0.4 ? '#1A1A1A' : '#FFFFFF';
  }
  function aplicarCor() {
    var cor = rgb(P.aparencia && P.aparencia.cor) ? P.aparencia.cor.toUpperCase() : COR_PADRAO;
    var claro = '--pg-marinho:' + cor + ';--pg-rot:' + cor + ';--pg-marinho-ink:' + tintaSobre(cor) +
      ';--pg-edita:' + misturar(cor, '#FFFFFF', 0.92) + ';--pg-edita-borda:' + misturar(cor, '#FFFFFF', 0.68) + ';';
    var marinhoEsc = misturar(cor, '#FFFFFF', 0.14);
    var escuro = '--pg-marinho:' + marinhoEsc + ';--pg-rot:' + misturar(cor, '#FFFFFF', 0.62) +
      ';--pg-marinho-ink:' + tintaSobre(marinhoEsc) + ';--pg-edita:' + misturar(cor, '#1C2024', 0.8) +
      ';--pg-edita-borda:' + misturar(cor, '#1C2024', 0.45) + ';';
    var papel = '--pg-marinho:' + cor + ';--pg-rot:' + cor + ';--pg-marinho-ink:' + tintaSobre(cor) + ';';
    var css = ':root{' + claro + '}\n' +
      '@media (prefers-color-scheme:dark){:root:not([data-tema="claro"]):not([data-theme="light"]),' +
        ':root:not([data-tema="claro"]){' + escuro + '}}\n' +
      ':root[data-tema="escuro"],:root[data-theme="dark"]:not([data-tema="claro"]){' + escuro + '}\n' +
      '.previa{' + papel + '}\n' +
      '@media print{:root,:root:not([data-tema="claro"]),:root:not([data-tema="claro"]):not([data-theme="light"]),' +
        ':root[data-tema],:root[data-theme="dark"]:not([data-tema="claro"]){' + papel + '}}';
    var el = document.getElementById('estilo-cor');
    /* depois de todo o CSS da página, onde quer que ele esteja (no link web a
       página inteira vai para o <body>): só assim a cor vence o azul padrão */
    if (!el) { el = document.createElement('style'); el.id = 'estilo-cor'; document.body.appendChild(el); }
    el.textContent = css;
    var inp = document.getElementById('cor-laudo');
    if (inp && document.activeElement !== inp) inp.value = cor.toLowerCase();
  }

  function repetir(n, f) { var a = []; for (var i = 0; i < n; i++) a.push(f(i)); return a; }
  function amostraVazia() {
    return { foto: null, endereco: '', numero: '', complemento: '', cep: '', bairro: '', empreendimento: '',
      cidade: '', uf: '', tipo: '', valor: null, transacao: '', data: '', areaTerreno: null, areaConstruida: null,
      idade: null, andar: null, testada: null, topografia: '', multFrentes: '', indiceLocal: null,
      dormitorios: null, suites: null, banheiros: null, vagas: null, padrao: '', intervalo: '',
      conservacao: '', fonte: '', contato: '', telefone: '', link: '' };
  }
  /* Estudo novo: tudo por informar. Nenhum dado de caso vem de fábrica —
     um laudo impresso com o endereço de outro seria o pior erro possível. */
  function premissasVazias() {
    var area = function () { return { matricula: null, iptu: null, estimada: null, doc: null }; };
    return {
      versao: 5,
      logos: { cliente: null, empresa: null },
      capa: { proponente: '', tipoLaudo: '', proposta: '', matricula: '', logradouro: '', numero: '',
        complemento: '', empreendimento: '', bairro: '', cidade: '', uf: '', cep: '',
        fotoFachada: null, fotoLogradouro: null, tipologia: '', uso: '', ocupacao: '', vaga: '', vagasTotal: null,
        areas: { terreno: area(), privativa: area(), comum: area() },
        valorVagaAutonoma: null, empresa: '', responsavel: '', dataEntrega: '',
        conselhoEmpresa: '', conselhoEmpresaUF: '', conselhoEmpresaNumero: '',
        assinatura: null, conselho: '', conselhoUF: '', conselhoNumero: '', observacoes: marcasParaHtml(TEXTO_CAPA) },
      regiao: { melhoramentos: {}, servicos: {}, peculiaridades: {}, padrao: '', ocupacao: '', trafego: '',
        implantacao: '', zoneamento: '', observacoes: '' },
      imovel: { topografia: '', formato: '', multFrentes: '', pavimentos: null, unidades: null, vagas: null,
        unidadesAndar: null, elevadores: null, subsolos: null, fachada: '', conservacaoCondominio: '', infra: {},
        padrao: '', idade: null, intervalo: '', conservacao: '',
        ambientes: repetir(N_AMBIENTES, ambienteVazio),
        divTerreno: { resposta: '', justificativa: '' }, divConstruida: { resposta: '', justificativa: '' } },
      restricoes: { garantia: '', dataVistoria: '', justificativa: '',
        itens: repetir(PERGUNTAS.length, function () { return { resposta: '', obs: '' }; }), observacoes: '' },
      paradigma: { testada: null, dormitorios: null, suites: null, banheiros: null, indiceLocal: null, andar: null },
      amostra: repetir(N, amostraVazia),
      croquiSituacao: null,
      calculo: { tabela: 'C', fundamentacao: '', cotaTerreno: null, cotaConstrucao: null,
        oferta: repetir(N, function () { return null; }), fatores: {}, expoenteAuVg: null, fam: null,
        observacoes: marcasParaHtml(TEXTO_CALCULO) },
      grafico: { croqui: null },
      liquidacao: { texto: marcasParaHtml(TEXTO_LIQUIDACAO), prazo: null, rotuloTaxa: 'Tesouro Prefixado 2029', taxa: null,
        ipca: null, iptuAno: null, condominioMes: null, oferta: '', demanda: '', absorcao: '', desempenho: '' },
      fotos: [], anexos: [],
      impressao: {},
      /* a cor do laudo: faixas, títulos e rótulos; os campos digitáveis
         ganham o mesmo tom bem claro */
      aparencia: { cor: COR_PADRAO }
    };
  }

  /* ------------------------------------------------------------- formatos
     O laudo segue o modelo impresso do avaliador: áreas e fatores com duas
     casas, dinheiro com R$, e o traço onde não há valor. */
  var TRACO = '-';
  function semValor(v) { return v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v)); }
  function nz(v, d) { return v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function fn(v, d) { return semValor(v) ? TRACO : nz(+v, d === undefined ? 2 : d); }
  /* sem valor (ou zero) é só o traço, sem o R$ na frente */
  function rs(v, d) { return semValor(v) || +v === 0 ? TRACO : 'R$ ' + nz(+v, d === undefined ? 2 : d); }
  function pc(v, d) { return semValor(v) ? TRACO : nz(v * 100, d === undefined ? 2 : d) + '%'; }
  function dataBR(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : (s || '');
  }
  function andarTxt(v) { return semValor(v) ? TRACO : nz(+v, 0) + ' º'; }

  /* número no padrão brasileiro: ponto de milhar, vírgula decimal */
  function lerNum(txt) {
    var s = String(txt == null ? '' : txt).trim().replace(/\s/g, '').replace(/^R\$/, '').replace(/[%º°]$/, '');
    if (!s || s === TRACO) return null;
    var neg = /^-/.test(s);
    s = s.replace(/[+-]/g, '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.indexOf('.') >= 0) {
      var g = s.split('.');
      if (g.length > 2 || g[1].length === 3) s = g.join('');
    }
    var v = parseFloat(s);
    if (!isFinite(v)) return null;
    return neg ? -v : v;
  }

  function e(tag, attrs, filhos) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) continue;
      if (k === 'txt') el.textContent = attrs[k];
      else if (k === 'cls') el.className = attrs[k];
      else if (k === 'style') el.setAttribute('style', attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    (filhos || []).forEach(function (f) {
      if (f === null || f === undefined || f === false) return;
      el.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
    });
    return el;
  }

  /* ---------------------------------------------------------- premissas */
  var P = premissasVazias(), R = null, abaAtiva = 'capa', atualizadores = [];

  function pegar(c, base) {
    return c.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, base || P);
  }
  function guardar(c, v) {
    var ks = c.split('.'), o = P;
    for (var i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] === null || typeof o[ks[i]] !== 'object') o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
      o = o[ks[i]];
    }
    o[ks[ks.length - 1]] = v;
  }

  /* Texto com duas marcas, para os quadros de observação ficarem como no
     laudo: linha começando por "# " é subtítulo; **trecho** é negrito. */
  function textoRico(s) {
    var d = document.createElement('div');
    d.innerHTML = limparHtml(s);          // já limpo: só as marcas de texto permitidas
    var frag = document.createDocumentFragment();
    while (d.firstChild) frag.appendChild(d.firstChild);
    return frag;
  }

  /* O texto corrido guarda HTML, mas só o de formatação: negrito, itálico,
     sublinhado, subtítulo, listas e quebras. Tudo o mais — atributos,
     estilos, scripts, o que vier colado do Word — some aqui, antes de gravar
     e antes de mostrar. Negrito e itálico que o Word manda como estilo de
     <span> viram <b> e <i>. */
  var TAGS_TEXTO = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', BR: 'br', DIV: 'div', P: 'div',
    UL: 'ul', OL: 'ol', LI: 'li', H1: 'h4', H2: 'h4', H3: 'h4', H4: 'h4', H5: 'h4', H6: 'h4' };
  function limparHtml(html) {
    var t = document.createElement('template');
    t.innerHTML = String(html == null ? '' : html);
    var saida = document.createElement('div');
    (function copiar(de, para) {
      Array.prototype.forEach.call(de.childNodes, function (no) {
        if (no.nodeType === 3) { para.appendChild(document.createTextNode(no.nodeValue)); return; }
        if (no.nodeType !== 1 || /^(SCRIPT|STYLE|TEMPLATE|IFRAME|OBJECT|HEAD|TITLE|META|LINK)$/.test(no.tagName)) return;
        var tag = TAGS_TEXTO[no.tagName], alvo = para;
        if (tag) { alvo = document.createElement(tag); para.appendChild(alvo); }
        else if (no.style) {
          var peso = no.style.fontWeight;
          if (peso === 'bold' || +peso >= 600) { alvo = alvo.appendChild(document.createElement('b')); }
          if (no.style.fontStyle === 'italic') { alvo = alvo.appendChild(document.createElement('i')); }
          if (/underline/.test(no.style.textDecoration || '')) { alvo = alvo.appendChild(document.createElement('u')); }
        }
        copiar(no, alvo);
      });
    })(t.content, saida);
    return saida.innerHTML;
  }
  /* as marcas da versão anterior ("# " subtítulo, **negrito**) em HTML */
  function marcasParaHtml(s) {
    var esc = function (x) { return x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var linhas = String(s == null ? '' : s).split('\n'), out = '';
    linhas.forEach(function (l, i) {
      if (/^# /.test(l)) { out += '<h4>' + esc(l.slice(2)) + '</h4>'; return; }
      out += esc(l).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      if (i < linhas.length - 1) out += '\n';
    });
    return out;
  }
  var CAMPOS_TEXTO = ['capa.observacoes', 'regiao.observacoes', 'restricoes.justificativa',
    'restricoes.observacoes', 'calculo.observacoes', 'liquidacao.texto'];

  /* ------------------------------------------------------------ imagens
     A foto entra no estudo reduzida no próprio navegador: o laudo não pede
     mais que isso, e o estudo inteiro viaja a cada gravação. */
  function lerImagem(arquivo, o) {
    o = o || {};
    return new Promise(function (ok, erro) {
      var leitor = new FileReader();
      leitor.onerror = erro;
      leitor.onload = function () {
        var img = new Image();
        img.onerror = function () { erro(new Error('imagem inválida')); };
        img.onload = function () {
          var max = o.max || 1600, k = Math.min(1, max / Math.max(img.width, img.height));
          var cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          var cx = cv.getContext('2d');
          if (!o.png) { cx.fillStyle = '#FFFFFF'; cx.fillRect(0, 0, cv.width, cv.height); }
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          ok(o.png ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', o.qualidade || 0.82));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }
  function escolherArquivos(multiplo, aoEscolher) {
    var inp = e('input', { type: 'file', accept: 'image/*', multiple: multiplo ? 'multiple' : null });
    inp.addEventListener('change', function () { aoEscolher(Array.prototype.slice.call(inp.files || [])); });
    inp.click();
  }

  /* ===================================================== o contexto
     Cria os campos. Na tela, cada campo lê e grava em P e, quando depende do
     cálculo, se inscreve para ser atualizado a cada recálculo — sem sair do
     documento, para não perder o foco. No papel, é só o texto. */
  function contexto(papel) {
    var ctx = { papel: papel };

    ctx.txt = function (caminho, o) {
      o = o || {};
      var v = pegar(caminho);
      /* vazio no papel ainda ocupa uma linha (espaço de largura zero): a linha
         em branco mede o mesmo que a preenchida, e o mesmo que na tela */
      /* sem valor é traço (o.vazio troca); vazio de propósito ('') ainda
         ocupa uma linha no papel (espaço de largura zero) */
      if (papel) return e('span', { cls: o.cls, txt: semValor(v) ? ((o.vazio !== undefined ? o.vazio : TRACO) || '\u200b') : String(v) });
      /* quebra: o texto desce de linha como no papel (campo estreito de texto
         longo), para a tela medir o mesmo que a impressão */
      var el = o.quebra
        ? e('textarea', { cls: 'c quebra ' + (o.cls || ''), rows: '1', placeholder: o.ph !== undefined ? o.ph : TRACO,
            'aria-label': o.rot || caminho, spellcheck: 'false' })
        : e('input', { cls: 'c ' + (o.cls || ''), type: 'text', value: semValor(v) ? '' : String(v),
            placeholder: o.ph !== undefined ? o.ph : TRACO, 'aria-label': o.rot || caminho, spellcheck: 'false' });
      if (o.quebra) {
        el.value = semValor(v) ? '' : String(v);
        el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') ev.preventDefault(); });
      }
      el.addEventListener('input', function () {
        if (o.quebra) { el.value = el.value.replace(/\n/g, ' '); crescer(el); }
        guardar(caminho, el.value); mudou();
      });
      return el;
    };

    ctx.num = function (caminho, o) {
      o = o || {};
      var casas = o.casas === undefined ? 2 : o.casas;
      var fator = o.pct ? 100 : 1;
      function mostrar(v) {
        if (semValor(v)) return '';
        return nz(v * fator, casas) + (o.pct ? '%' : '') + (o.suf || '');
      }
      function atual() {
        var v = pegar(caminho);
        if (semValor(v) && o.sug && R) { var s = o.sug(R); return { v: s, sug: !semValor(s) }; }
        return { v: v, sug: false };
      }
      var pre = o.pre ? e('span', { cls: 'pre', txt: o.pre }) : null;
      if (papel) {
        var a = atual(), txt = semValor(a.v) ? (o.vazio !== undefined ? o.vazio : TRACO) : mostrar(a.v);
        /* sem valor, só o traço: o R$ não aparece */
        if (semValor(a.v)) return e('span', { txt: txt });
        if (!o.separado) return e('span', { txt: (o.pre ? o.pre + ' ' : '') + txt });
        return e('span', { cls: 'afixo' }, [pre, e('span', { txt: txt })]);
      }
      var el = e('input', { cls: 'c num', type: 'text', inputmode: 'decimal', 'aria-label': o.rot || caminho,
        placeholder: o.ph !== undefined ? o.ph : TRACO });
      function pintar() {
        if (document.activeElement === el) return;
        var a = atual();
        el.value = mostrar(a.v);
        el.classList.toggle('sugerido', a.sug);
        if (pre) pre.style.visibility = semValor(a.v) ? 'hidden' : '';
      }
      el.addEventListener('input', function () {
        var v = lerNum(el.value);
        guardar(caminho, v === null ? null : v / fator);
        el.classList.remove('sugerido');
        mudou();
      });
      el.addEventListener('blur', pintar);
      if (pre) el.addEventListener('focus', function () { pre.style.visibility = ''; });
      atualizadores.push(pintar);
      pintar();
      return pre ? e('span', { cls: 'afixo' }, [pre, el]) : el;
    };

    ctx.sel = function (caminho, lista, o) {
      o = o || {};
      var v = pegar(caminho) || '';
      if (v === '-') v = '';                  /* o "-" saiu das listas: vale como vazio */
      if (papel) return e('span', { txt: v || ((o.vazio !== undefined ? o.vazio : TRACO) || '\u200b') });
      var opcoes = lista.slice();
      if (v && opcoes.indexOf(v) < 0) opcoes.unshift(v);
      var el = e('select', { cls: 'c', 'aria-label': o.rot || caminho },
        [e('option', { value: '', txt: o.vazio !== undefined ? o.vazio : TRACO })].concat(opcoes.map(function (x) {
          return e('option', { value: x, txt: x, selected: x === v ? 'selected' : null }); })));
      el.addEventListener('change', function () {
        guardar(caminho, el.value); mudou();
        if (o.remonta) remontar();
      });
      return el;
    };

    ctx.data = function (caminho, o) {
      o = o || {};
      var v = pegar(caminho) || '';
      if (papel) return e('span', { txt: v ? dataBR(v) : ((o.vazio !== undefined ? o.vazio : TRACO) || '\u200b') });
      var el = e('input', { cls: 'c', type: 'date', value: v, 'aria-label': o.rot || caminho });
      el.addEventListener('input', function () { guardar(caminho, el.value); mudou(); });
      return el;
    };

    /* texto corrido: na tela cresce com o que se digita, nunca rola */
    /* texto corrido: na tela, um editor com a barra de formatação, que
       cresce com o que se digita; no papel, o texto formatado */
    ctx.area = function (caminho, o) {
      o = o || {};
      var v = pegar(caminho) || '';
      if (papel) {
        var caixa = e('div', { cls: 'texto' + (o.estica ? ' estica' : ''), style: o.alt ? 'min-height:' + o.alt : null });
        caixa.appendChild(textoRico(v));
        return caixa;
      }
      var ed = e('div', { cls: 'texto editor', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true',
        'aria-label': o.rot || caminho, spellcheck: 'true', style: o.alt ? 'min-height:' + o.alt : null });
      ed.innerHTML = limparHtml(v);
      function gravar() { guardar(caminho, limparHtml(ed.innerHTML)); mudou(); }
      ed.addEventListener('input', gravar);
      /* colar: só a formatação permitida, no ponto do cursor */
      ed.addEventListener('paste', function (ev) {
        var d = ev.clipboardData; if (!d) return;
        ev.preventDefault();
        var html = d.getData('text/html');
        if (html) document.execCommand('insertHTML', false, limparHtml(html));
        else document.execCommand('insertText', false, d.getData('text/plain'));
      });
      /* Tab alinha colunas no texto, como no modelo (tabela do histórico do ITBI) */
      ed.addEventListener('keydown', function (ev) {
        if (ev.key === 'Tab' && !ev.shiftKey) { ev.preventDefault(); document.execCommand('insertText', false, '\t'); }
      });
      var BOTOES = [['N', 'Negrito', 'bold', 'font-weight:700'], ['I', 'Itálico', 'italic', 'font-style:italic'],
        ['S', 'Sublinhado', 'underline', 'text-decoration:underline'], ['Subtítulo', 'Subtítulo', 'sub'],
        ['• Lista', 'Lista com marcadores', 'insertUnorderedList'], ['1. Lista', 'Lista numerada', 'insertOrderedList']];
      var barra = e('div', { cls: 'ferramentas', role: 'toolbar', 'aria-label': 'Formatação do texto' },
        BOTOES.map(function (b) {
          var bt = e('button', { type: 'button', txt: b[0], title: b[1], 'aria-label': b[1], style: b[3] || null });
          /* mousedown sem foco: a seleção no texto não se perde */
          bt.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
          bt.addEventListener('click', function () {
            ed.focus();
            if (b[2] === 'sub') {
              var dentro = document.queryCommandValue('formatBlock').toLowerCase() === 'h4';
              document.execCommand('formatBlock', false, dentro ? 'div' : 'h4');
            } else document.execCommand(b[2]);
            gravar();
          });
          return bt;
        }));
      var area = e('div', { cls: 'area-texto' + (o.estica ? ' estica' : '') }, [barra, ed]);
      /* ponto de extensão, inerte por padrão: quem hospeda a página pode
         acrescentar botões à barra (a versão de revisão testa a redação
         por IA das observações). O módulo não chama nada de fora. */
      var ext = window.ComparativoExtensoes;
      if (ext && typeof ext.barraTexto === 'function') {
        try {
          ext.barraTexto({ caminho: caminho, barra: barra, area: area, editor: ed, pegar: pegar,
            escrever: function (texto) { ed.innerHTML = limparHtml(marcasParaHtml(texto)); gravar(); } });
        } catch (erro) { if (window.console) console.error(erro); }
      }
      return area;
    };

    ctx.chk = function (caminho) {
      var v = !!pegar(caminho);
      if (papel) return e('span', { cls: 'marca', txt: v ? '✓' : '' });
      var b = e('button', { cls: 'marca', type: 'button', role: 'checkbox', 'aria-checked': v ? 'true' : 'false',
        'aria-label': caminho, txt: v ? '✓' : '' });
      b.addEventListener('click', function () {
        var n = !pegar(caminho);
        guardar(caminho, n); b.textContent = n ? '✓' : ''; b.setAttribute('aria-checked', n ? 'true' : 'false');
        mudou();
      });
      return b;
    };

    /* valor calculado: texto que o recálculo reescreve */
    ctx.calc = function (f, o) {
      o = o || {};
      var el = e('span', { cls: o.cls });
      /* resultado vazio mostra o traço (o.vazio troca, p.ex. por '') */
      var vazio = o.vazio !== undefined ? o.vazio : TRACO;
      function pintar() { var t = R ? f(R) : ''; el.textContent = t === null || t === undefined || t === '' ? vazio : t; }
      if (!papel) atualizadores.push(pintar);
      pintar();
      return el;
    };

    /* imagem: clicar escolhe (ou troca) o arquivo; o botão tira */
    ctx.img = function (caminho, o) {
      o = o || {};
      var src = pegar(caminho);
      var quadro = e('div', { cls: 'quadro-img', style: 'height:' + (o.alt || '50mm') });
      if (src) quadro.appendChild(e('img', { src: src, alt: o.legenda || '' }));
      else quadro.appendChild(e('div', { cls: 'vazia', txt: papel ? '' : (o.vazio || 'Clique para inserir a imagem') }));
      if (!papel) {
        quadro.classList.add('escolher');
        quadro.title = src ? 'Clique para trocar a imagem' : 'Clique para inserir a imagem';
        quadro.addEventListener('click', function (ev) {
          if (ev.target.closest('.acoes-img')) return;
          escolherArquivos(false, function (arqs) {
            if (!arqs[0]) return;
            lerImagem(arqs[0], o).then(function (url) { guardar(caminho, url); mudou(); remontar(); })
              .catch(function () { avisar('Imagem não lida', 'O arquivo escolhido não é uma imagem que o navegador abra.'); });
          });
        });
        if (src) {
          var tirar = e('button', { type: 'button', txt: 'Remover' });
          tirar.addEventListener('click', function () { guardar(caminho, null); mudou(); remontar(); });
          quadro.appendChild(e('div', { cls: 'acoes-img' }, [tirar]));
        }
      }
      if (o.nu) return quadro;
      var fig = e('div', { cls: 'foto' + (o.conter ? ' conter' : '') }, [quadro]);
      if (o.legenda !== undefined) {
        fig.appendChild(e('div', { cls: 'legenda' + (o.forte ? ' forte' : '') },
          [typeof o.legenda === 'string' ? o.legenda : o.legenda]));
      }
      return fig;
    };
    return ctx;
  }

  /* ------------------------------------------------ peças da folha */
  function g(cols, filhos, o) {
    o = o || {};
    return e('div', { cls: 'g ' + (o.cls || ''), style: 'grid-template-columns:' + cols +
      (o.gap ? ';column-gap:' + o.gap : '') + (o.estilo ? ';' + o.estilo : '') }, filhos);
  }
  function rot(t, cls) { return e('div', { cls: 'rot ' + (cls || '') }, [t]); }
  function val(filho, cls) { return e('div', { cls: 'val ' + (cls || '') }, [filho]); }
  /* Pares rótulo → campo num quadro: o campo começa logo depois do rótulo
     mais longo do quadro, e todos os campos do quadro ficam alinhados. No
     papel, o quadro termina pouco depois do texto, como na Capa. */
  function pares(ctx, linhas, o) {
    o = o || {};
    var filhos = [];
    linhas.forEach(function (l) { filhos.push(rot(l[0], o.rot)); filhos.push(val(l[1], o.val)); });
    return e('div', { cls: 'caixa pares' + (ctx.papel ? ' justa' : '') },
      [e('div', { cls: 'g grade-pares' }, filhos)]);
  }
  /* Ficha técnica: pares pergunta → resposta em linha, n pares por linha.
     A pergunta numa célula sombreada, em maiúsculas na cor do laudo; a
     resposta numa célula branca, logo ao lado. A coluna de cada pergunta tem
     o tamanho da pergunta mais longa daquela coluna. */
  function ficha(nPares, celulas, pesos, cls) {
    var filhos = [];
    /* os fios são bordas das células (à direita e embaixo), nunca o fundo
       num vão: vão de fração de pixel sai ora fino, ora grosso */
    /* posição de cada par na grade, contando os pares que uma resposta
       estendida (c[3]) ocupa */
    var pos = [], p = 0;
    celulas.forEach(function (c) { pos.push(p); p += 1 + (c[3] ? c[3] / 2 : 0); });
    var nLin = Math.ceil(p / nPares);
    /* c[2]: classe da resposta ('dir' para valores em R$) */
    celulas.forEach(function (c, i) {
      var lin = Math.floor(pos[i] / nPares), fimPar = pos[i] + (c[3] ? c[3] / 2 : 0);
      var fim = (fimPar % nPares === nPares - 1 ? ' ult-col' : '') + (lin === nLin - 1 ? ' ult-lin' : '');
      filhos.push(e('div', { cls: 'ficha-perg' + (lin === nLin - 1 ? ' ult-lin' : ''), txt: c[0] }));
      /* c[3]: a resposta se estende por mais c[3] colunas da grade (ocupa o
         lugar de um par que não existe naquela linha) */
      filhos.push(e('div', { cls: 'ficha-resp' + fim + (c[2] ? ' ' + c[2] : ''),
        style: c[3] ? 'grid-column:span ' + (1 + c[3]) : null }, [c[1]]));
    });
    var cols = []; for (var k = 0; k < nPares; k++) cols.push('max-content minmax(0,' + ((pesos && pesos[k]) || 1) + 'fr)');
    return e('div', { cls: 'ficha-tec' + (cls ? ' ' + cls : ''), style: 'grid-template-columns:' + cols.join(' ') }, filhos);
  }
  /* célula branca de valor: no papel, termina pouco depois do texto */
  function celula(ctx, campo, cls) { return val(campo, 'cel' + (ctx.papel ? ' justo' : '') + (cls ? ' ' + cls : '')); }
  function faixa(t, cls) { return e('div', { cls: 'faixa ' + (cls || '') }, [t]); }
  function tit(t, cls) { return e('div', { cls: 'tit ' + (cls || ''), txt: t }); }
  function espaco(cls) { return e('div', { cls: 'espaco ' + (cls || '') }); }

  /* O cabeçalho repete em toda página; os logos se escolhem só na Capa. */
  function cabecalho(ctx, editavel) {
    function logo(chave, lado) {
      var box = e('div', { cls: 'logo ' + lado });
      if (editavel && !ctx.papel) {
        box.appendChild(ctx.img('logos.' + chave, { nu: true, alt: '100%', png: true, max: 700, conter: true,
          vazio: chave === 'cliente' ? 'Logo do cliente' : 'Logo da empresa' }));
        box.querySelector('.quadro-img').style.width = '100%';
      } else if (P.logos && P.logos[chave]) box.appendChild(e('img', { src: P.logos[chave], alt: '' }));
      return box;
    }
    return [e('div', { cls: 'cab' }, [logo('cliente', 'esquerda'),
      e('div', { cls: 'titulo', txt: 'Laudo de Avaliação de Imóvel Urbano' }), logo('empresa', 'direita')]),
      e('div', { cls: 'fio' })];
  }
  function pagina(ctx, filhos, o) {
    o = o || {};
    return e('section', { cls: 'pagina', 'data-parte': o.parte || '' },
      cabecalho(ctx, o.logos).concat([e('div', { cls: 'corpo' + (o.estica ? ' estica' : '') }, filhos)]));
  }

  /* =============================================================== CAPA */
  function folhaCapa(ctx) {
    var c = 'capa.';
    var topo = g('auto 1.5fr auto 1.25fr auto .55fr auto .7fr', [
      rot('PROPONENTE', 'marinho'), celula(ctx, ctx.txt(c + 'proponente')),
      rot('TIPO LAUDO', 'marinho'), celula(ctx, ctx.sel(c + 'tipoLaudo', LS.tipoLaudo)),
      rot('PROPOSTA Nº', 'marinho'), celula(ctx, ctx.txt(c + 'proposta')),
      rot('MATRÍCULA DO IMÓVEL', 'marinho'), celula(ctx, ctx.txt(c + 'matricula'))], { gap: '2.2mm' });

    var dados = e('div', { cls: 'pilha larga' }, [
      g('auto 1.4fr auto .35fr auto .7fr auto 1.4fr', [
        rot('LOGRADOURO', 'tinta'), celula(ctx, ctx.txt(c + 'logradouro')),
        rot('IDENTIFICAÇÃO NUMÉRICA', 'tinta'), celula(ctx, ctx.txt(c + 'numero')),
        rot('COMPLEMENTO', 'tinta'), celula(ctx, ctx.txt(c + 'complemento')),
        rot('NOME DO EMPREENDIMENTO', 'tinta'), celula(ctx, ctx.txt(c + 'empreendimento'))], { gap: '1mm' }),
      g('auto 1fr auto .9fr auto .3fr auto .8fr 1.6fr', [
        rot('BAIRRO', 'tinta'), celula(ctx, ctx.txt(c + 'bairro')),
        rot('CIDADE', 'tinta'), celula(ctx, ctx.txt(c + 'cidade')),
        rot('UF', 'tinta'), celula(ctx, ctx.txt(c + 'uf')),
        rot('CEP', 'tinta'), celula(ctx, ctx.txt(c + 'cep')), e('div')], { gap: '1mm' })]);

    var fotos = g('1fr 1fr', [
      ctx.img(c + 'fotoFachada', { alt: '80mm', legenda: 'Fachada', forte: true }),
      ctx.img(c + 'fotoLogradouro', { alt: '80mm', legenda: 'Logradouro', forte: true })], { gap: '5mm' });

    /* Imóvel, Dimensões e Resultado no formato da ficha técnica: pergunta
       sombreada, resposta branca (pedido do avaliador) */
    var imovel = e('div', {}, [faixa('IMÓVEL'), ficha(1, [
      ['Tipologia', ctx.sel(c + 'tipologia', LS.tipologia)],
      ['Uso', ctx.sel(c + 'uso', LS.uso)],
      ['Ocupação', ctx.sel(c + 'ocupacao', LS.ocupacao)]]),
      espaco(),
      ficha(1, [
        ['Vaga(s) de garagem', ctx.sel(c + 'vaga', LS.vagas)],
        ['Nº total de vagas', ctx.num(c + 'vagasTotal', { casas: 0 })]])]);
    /* os dois quadros com a mesma coluna de pergunta: as respostas alinham */
    Array.prototype.forEach.call(imovel.querySelectorAll('.ficha-tec'), function (f) {
      f.style.gridTemplateColumns = '32mm minmax(0,1fr)'; });

    var a = c + 'areas.';
    function celArea(caminho) { return e('td', {}, [ctx.num(caminho, { casas: 2 })]); }
    function celCalc(f) { return e('td', {}, [ctx.calc(f)]); }
    var FONTES = ['matricula', 'iptu', 'estimada', 'doc'];
    function linhaArea(rotulo, chave) {
      return e('tr', {}, [e('td', { cls: 'perg', txt: rotulo })].concat(FONTES.map(function (k) {
        return celArea(a + chave + '.' + k); })));
    }
    var cabDim = function () {
      return e('tr', {}, ['Tipo de área', 'Matrícula', 'IPTU', 'Estimada', 'Doc. complementar'].map(function (t) {
        return e('th', { txt: t }); }));
    };
    /* dois quadros, alinhados com os dois do Imóvel ao lado */
    var LARG_DIM = [26, 18.5, 18.5, 18.5, 18.5];
    var larguras = function () {
      return e('colgroup', {}, LARG_DIM.map(function (w) { return e('col', { style: 'width:' + w + '%' }); }));
    };
    var dim = e('div', {}, [faixa('DIMENSÕES (m²)'), e('table', { cls: 't ficha-t', style: 'table-layout:fixed' }, [
      larguras(),
      cabDim(),
      /* as quatro fontes com a mesma lógica: terreno, privativa e comum se
         digitam; a construção total é a soma das duas últimas */
      linhaArea('Terreno', 'terreno'),
      e('tr', {}, [e('td', { cls: 'perg', txt: 'Construção total' })].concat(FONTES.map(function (k) {
        return celCalc(function (r) { return fn(r.capa.construcao[k]); }); })))]),
      espaco(),
      e('table', { cls: 't ficha-t', style: 'table-layout:fixed' }, [
        larguras(),
        linhaArea('Privativa/Útil', 'privativa'),
        linhaArea('Comum', 'comum')])]);

    /* Resultado: seis colunas fixas; a vaga autônoma e o valor total ficam
       em quadros próprios logo abaixo, nas mesmas colunas (como no Imóvel) */
    var COLS_RES = '43mm minmax(0,1fr) 27mm minmax(0,1fr) 31mm minmax(0,1.3fr)';
    var resCima = ficha(3, [
      ['Área terreno', ctx.calc(function (r) { return fn(r.paradigma.areaTerreno); })],
      ['Valor (R$/m²)', ctx.calc(function (r) { return r.valor.m2Terreno ? fn(r.valor.m2Terreno) : ''; })],
      ['Valor (R$)', ctx.calc(function (r) { return rs(r.valor.terreno || null); }), 'dir'],
      ['Área privativa/construída', ctx.calc(function () { return fn(pegar('capa.areas.privativa.matricula')); })],
      ['Valor (R$/m²)', ctx.calc(function (r) { return fn(r.valor.m2Privativa); })],
      ['Valor (R$)', ctx.calc(function (r) { return rs(r.valor.benfeitoria); }), 'dir']]);
    resCima.style.gridTemplateColumns = COLS_RES;
    var vaga = ficha(1, [['Valor vaga(s) autônoma(s)', ctx.num(c + 'valorVagaAutonoma', { pre: 'R$', separado: true }), 'dir']]);
    vaga.style.cssText = 'grid-column:1 / 3;grid-template-columns:43mm minmax(0,1fr);margin:0 -.25mm';
    var total = ficha(1, [['Valor total (R$)', ctx.calc(function (r) { return rs(r.valor.mercado); }), 'dir']]);
    total.style.cssText = 'grid-column:5 / 7;grid-template-columns:31mm minmax(0,1fr);margin:0 -.25mm';
    var res = e('div', {}, [faixa('RESULTADO DA AVALIAÇÃO'), resCima, espaco(),
      e('div', { style: 'display:grid;grid-template-columns:' + COLS_RES + ';border:.25mm solid transparent;border-top:0;border-bottom:0' },
        [vaga, total])]);

    var valores = e('div', {}, [
      faixa('VALOR DE MERCADO'),
      e('div', { cls: 'caixa' }, [val(ctx.calc(function (r) { return rs(r.valor.mercadoArredondado); }), 'centro')]),
      espaco(),
      faixa('VALOR DE LIQUIDAÇÃO FORÇADA'),
      e('div', { cls: 'caixa' }, [val(ctx.calc(function (r) { return rs(r.liquidacao.vlfArredondado); }), 'centro')])]);

    /* no papel, a caixa branca termina pouco depois do texto */
    var linhaEmp = function (r, campo) {
      return g('38% 62%', [rot(r, 'marinho'), val(campo, 'cel' + (ctx.papel ? ' justo' : ''))]);
    };
    var empresa = g('50% 1fr 38%', [
      e('div', { cls: 'pilha' }, [linhaEmp('EMPRESA', ctx.txt(c + 'empresa')),
        linhaEmp('REGISTRO', registroProfissional(ctx, 'conselhoEmpresa', false)),
        linhaEmp('RESPONSÁVEL TÉCNICO', ctx.txt(c + 'responsavel')),
        linhaEmp('DATA DE ENTREGA', ctx.data(c + 'dataEntrega'))]),
      e('div'),
      e('div', { style: 'display:flex;flex-direction:column;justify-content:flex-end;text-align:center' }, [
        ctx.img(c + 'assinatura', { nu: true, alt: '11mm', png: true, max: 800, vazio: 'Assinatura (opcional)' }),
        e('div', { style: 'border-top:.25mm solid var(--pg-borda);margin-top:1mm;padding-top:1.2mm;color:var(--pg-rot)' },
          [ctx.calc(function () { return pegar('capa.responsavel') || ''; }, { vazio: '' })]),
        registroProfissional(ctx, 'conselho', true)])],
      { gap: '0' });
    var assin = empresa.querySelector('.quadro-img');
    if (assin) { assin.style.background = 'transparent'; }

    return [pagina(ctx, [topo, espaco(), faixa('DADOS DO IMÓVEL'), dados, espaco(), fotos, espaco('g2'),
      g('32% 1fr', [imovel, dim], { gap: '5mm' }), espaco(), res, espaco(), valores, espaco('g2'), empresa,
      tit('OBSERVAÇÕES GERAIS DA AVALIAÇÃO', 'menor'), ctx.area(c + 'observacoes', { alt: '40mm', estica: true })],
      { logos: true, parte: 'capa', estica: true })];
  }

  /* Registro do responsável sob a assinatura: CREA ou CAU / UF - número,
     centralizado. Na tela, duas listas e o número; no papel, a linha pronta. */
  function registroProfissional(ctx, pre, centro) {
    var c = 'capa.' + (pre || 'conselho'), estilo = 'display:flex;align-items:center;gap:1mm;' +
      (centro ? 'color:var(--pg-rot);padding-top:.8mm;justify-content:center' : '');
    if (ctx.papel) {
      var cons = pegar(c), uf = pegar(c + 'UF'), nro = pegar(c + 'Numero');
      /* sem registro: traço no quadro da empresa; sob a assinatura, nada */
      var txt = cons || uf || nro ? (cons || '') + '/' + (uf || '') + ' - ' + (nro || '') : (centro ? '' : TRACO);
      return e('div', { style: estilo, txt: txt });
    }
    var sel = function (cam, lista, larg) { var el = ctx.sel(cam, lista); el.style.width = larg; return el; };
    var numero = ctx.txt(c + 'Numero', { ph: 'número', rot: 'Número do registro' });
    numero.style.width = '26mm';
    return e('div', { style: estilo }, [sel(c, LS.conselho, '15mm'), e('span', { txt: '/' }),
      sel(c + 'UF', LS.uf, '11mm'), e('span', { txt: '-' }), numero]);
  }

  /* ==================================================== REGIÃO + IMÓVEL */
  function folhaRegiao(ctx) {
    var r = 'regiao.', im = 'imovel.';
    function marcado(caminho, texto) {
      return e('div', { cls: 'val' }, [ctx.chk(caminho), e('span', { txt: texto })]);
    }
    /* os três quadros de cima têm quatro linhas cada e a mesma altura */
    var melh = e('div', { cls: 'coluna' }, [faixa('MELHORAMENTOS PÚBLICOS', 'fina'), e('div', { cls: 'caixa' },
      repetir(4, function (i) {
        return g('1fr 1fr', [marcado(r + 'melhoramentos.' + MELHORAMENTOS[2 * i][0], MELHORAMENTOS[2 * i][1]),
          marcado(r + 'melhoramentos.' + MELHORAMENTOS[2 * i + 1][0], MELHORAMENTOS[2 * i + 1][1])]);
      }))]);
    var serv = e('div', { cls: 'coluna' }, [faixa('SERVIÇOS PÚBLICOS E COMUNITÁRIOS', 'fina'),
      ficha(2, SERVICOS.map(function (x) { return [x[1], ctx.sel(r + 'servicos.' + x[0], LS.distancias)]; }))]);
    var pec = e('div', { cls: 'coluna' }, [faixa('PECULIARIDADES / FATORES RESTRITIVOS', 'fina'), e('div', { cls: 'caixa' }, [
      g('1fr 1fr', [marcado(r + 'peculiaridades.comunidade', 'Comunidade'), marcado(r + 'peculiaridades.inundacao', 'Risco a inundação')]),
      g('1fr 1fr', [marcado(r + 'peculiaridades.feira', 'Feira Livre'), marcado(r + 'peculiaridades.ambiental', 'Risco ambiental')]),
      g('1fr 1fr', [marcado(r + 'peculiaridades.outros', 'Outros'), e('div')]),
      g('1fr 1fr', [e('div', { cls: 'val' }), e('div')])])]);
    /* na mesma ficha técnica, nas colunas dos quadros de cima */
    var regiaoLinha2 = [
      e('div', { cls: 'coluna' }, [ficha(1, [['Padrão da região', ctx.sel(r + 'padrao', LS.padraoRegiao)],
        ['Ocupação predominante', ctx.sel(r + 'ocupacao', LS.ocupacaoPredominante)]])]),
      e('div', { cls: 'coluna' }, [ficha(1, [['Tráfego na região', ctx.sel(r + 'trafego', LS.trafego)],
        ['Implantação', ctx.sel(r + 'implantacao', LS.implantacao)]])]),
      /* uma linha só, esticada à altura dos quadros vizinhos (duas linhas):
         campo de duas linhas de propósito */
      e('div', { cls: 'coluna' }, [ficha(1, [['Zoneamento', ctx.txt(r + 'zoneamento')]], null, 'dupla')])];

    var terreno = ficha(3, [
      ['Topografia', ctx.sel(im + 'topografia', LS.topografia)],
      ['Formato', ctx.sel(im + 'formato', LS.formato)],
      ['Frentes múltiplas', ctx.sel(im + 'multFrentes', LS.multFrentes)]]);
    var n0 = function (cam) { return ctx.num(cam, { casas: 0 }); };
    /* quatro colunas: as contagens e, no fim da linha, fachada e conservação */
    var edif = ficha(4, [
      ['Pavimentos', n0(im + 'pavimentos')],
      ['Total de unidades', n0(im + 'unidades')],
      ['Vagas de garagem', n0(im + 'vagas')],
      ['Fachada', ctx.sel(im + 'fachada', LS.padraoRegiao)],
      ['Unidades por andar', n0(im + 'unidadesAndar')],
      ['Elevadores', n0(im + 'elevadores')],
      ['Subsolos', n0(im + 'subsolos')],
      ['Conservação do condomínio', ctx.sel(im + 'conservacaoCondominio', LS.conservacaoCondominio)]]);
    var infra = g('repeat(5,1fr)', INFRA.map(function (x) { return marcado(im + 'infra.' + x[0], x[1]); }));

    var unidade = ficha(4, [
      ['Padrão construtivo', ctx.sel(im + 'padrao', LS.padrao)],
      ['Intervalo de valor', ctx.sel(im + 'intervalo', LS.intervalo)],
      ['Idade', e('span', { cls: 'afixo junto' },
        [ctx.num(im + 'idade', { casas: 0 }), e('span', { cls: 'pre', txt: ' ano(s)' })])],
      ['Estado de conservação', ctx.sel(im + 'conservacao', LS.conservacao)]], [1.3, .75, .35, 1.2]);

    /* ambientes: 5 linhas no mínimo, mais pelo botão até encher a página */
    var amb = P.imovel.ambientes;
    var nAmb = Math.max(N_AMBIENTES, amb.length);
    function tabelaAmb(de, ate) {
      var th = function (t, o) { return e('th', Object.assign({ txt: t }, o || {})); };
      return e('table', { cls: 't pontos ficha-t ambientes', style: 'table-layout:fixed' }, [
        e('colgroup', {}, COLS_AMBIENTE.map(function (cc) { return e('col', { style: 'width:' + cc[2] + '%' }); })),
        e('tr', {}, [th('AMBIENTE', { rowspan: '2' }), th('QTD.', { rowspan: '2' }),
          th('REVESTIMENTOS', { colspan: '3' }), th('ESQUADRIAS', { colspan: '2' })]),
        e('tr', {}, COLS_AMBIENTE.slice(2).map(function (cc) { return th(cc[1]); }))]
        .concat(repetir(ate - de, function (k) {
          var base = im + 'ambientes.' + (de + k) + '.';
          /* linha de ambiente vazia fica em branco, sem traço */
          return e('tr', {}, COLS_AMBIENTE.map(function (cc) {
            var campo = cc[0] === 'quantidade' ? ctx.num(base + cc[0], { casas: 0, vazio: '', ph: '' })
              : cc[3] ? ctx.sel(base + cc[0], LS[cc[3]], { vazio: '' })
              : ctx.txt(base + cc[0], { vazio: '', ph: '' });
            return e('td', {}, [campo]);
          }));
        })));
    }
    function botoesAmb() {
      if (ctx.papel) return e('div');
      var mais = e('button', { type: 'button', cls: 'botao-linha', txt: '+ Adicionar linha' });
      if (nAmb >= AMB_MAX) { mais.disabled = true; mais.title = 'A página está cheia'; }
      mais.addEventListener('click', function () {
        while (amb.length < nAmb) amb.push(ambienteVazio());
        if (amb.length >= AMB_MAX) return;
        amb.push(ambienteVazio()); mudou(); remontar();
      });
      return e('div', { cls: 'linha-botoes' }, [mais]);
    }
    var paginas = [pagina(ctx, [
      tit('Dados da Região'),
      g('1fr 1fr 1fr', [serv, melh, pec], { gap: '6mm', cls: 'colunas' }), espaco('g2'),
      g('1fr 1fr 1fr', regiaoLinha2, { gap: '6mm', cls: 'colunas' }),
      tit('OBSERVAÇÕES GERAIS SOBRE A REGIÃO', 'menor'),
      ctx.area(r + 'observacoes', { alt: '78mm' }),
      tit('Dados do Imóvel'),
      faixa('TERRENO', 'esq'), terreno, espaco(),
      faixa('EDIFICAÇÃO (QUANDO EMPREENDIMENTO VERTICALIZADO)', 'esq'), edif, espaco(),
      faixa('INFRAESTRUTURA DO EMPREENDIMENTO', 'esq'), infra, espaco(),
      faixa('PADRÃO CONSTRUTIVO', 'esq'), unidade, espaco(),
      faixa('DIVISÃO INTERNA POR AMBIENTE', 'esq'),
      e('div', { cls: 'com-botoes' }, [tabelaAmb(0, nAmb), botoesAmb()])], { parte: 'regiao' })];
    return paginas;
  }

  /* Tabela de perguntas no formato da ficha técnica: cabeçalho e pergunta
     sombreados, respostas brancas. cols: [[título, largura %], …]; cada
     linha: [pergunta, campo, campo, …]. */
  function tabelaPerguntas(cols, linhas) {
    return e('table', { cls: 't ficha-t perguntas', style: 'table-layout:fixed' }, [
      e('colgroup', {}, cols.map(function (c) { return e('col', { style: 'width:' + c[1] + '%' }); })),
      e('tr', {}, cols.map(function (c) { return e('th', { txt: c[0] }); }))].concat(linhas.map(function (l) {
        return e('tr', {}, [e('td', { cls: 'perg', txt: l[0] })].concat(l.slice(1).map(function (x) {
          return e('td', { cls: x.cls || '' }, [x.el || x]); })));
      })));
  }

  /* as duas perguntas de divergência de área abrem a página seguinte */
  function divergencias(ctx) {
    var im = 'imovel.';
    function linha(chave, rotulo, f) {
      return [rotulo, ctx.sel(im + chave + '.resposta', LS.validacao),
        ctx.calc(function (rr) { var v = f(rr); return v === null ? TRACO : pc(v); }),
        { el: ctx.txt(im + chave + '.justificativa', { quebra: true }), cls: 'esq' }];
    }
    return [faixa('DIVERGÊNCIA ENTRE DOCUMENTAÇÕES E ÁREA ESTIMADA EM VISTORIA', 'esq'),
      tabelaPerguntas([['Área', 24], ['Resposta', 12], ['Divergência', 12], ['Justificativa', 52]], [
        linha('divTerreno', 'Área de terreno', function (rr) { return rr.capa.divTerreno; }),
        linha('divConstruida', 'Área construída', function (rr) { return rr.capa.divConstruida; })])];
  }

  /* ============================================================ RESTRIÇÕES */
  function folhaRestricoes(ctx) {
    var r = 'restricoes.';
    var itens = PERGUNTAS.map(function (q, i) {
      var b = r + 'itens.' + i + '.';
      return [q, ctx.sel(b + 'resposta', LS.validacao), { el: ctx.txt(b + 'obs', { quebra: true }), cls: 'esq' }];
    });
    return [pagina(ctx, divergencias(ctx).concat([
      tit('Restrições do Imóvel'),
      faixa('RECOMENDAÇÃO COMO GARANTIA', 'esq'),
      tabelaPerguntas([['Pergunta', 64], ['Resposta', 12], ['Data da vistoria', 24]], [
        ['Considerando as diligências e aspectos técnicos analisados neste laudo, o imóvel é recomendado como garantia?',
          ctx.sel(r + 'garantia', LS.validacao), ctx.txt(r + 'dataVistoria', { cls: 'centro' })]]),
      tit('JUSTIFICATIVA (EM CASO NEGATIVO)', 'menor'),
      ctx.area(r + 'justificativa', { alt: '20mm' }),
      espaco('g2'),
      faixa('VERIFICAÇÕES', 'esq'),
      tabelaPerguntas([['Pergunta', 50], ['Resposta', 10], ['Observação', 40]], itens),
      tit('OBSERVAÇÕES GERAIS', 'menor'),
      ctx.area(r + 'observacoes', { alt: '32mm' })]), { parte: 'restricoes' })];
  }

  /* ======================================================== FICHAS */
  /* Fichas de pesquisa no formato da ficha técnica, como a Capa e a Região:
     pergunta sombreada, resposta branca. As listas de texto longo
     (topografia, padrão, conservação) ficam na primeira coluna, a mais larga. */
  function fichaParadigma(ctx) {
    var p = 'paradigma.';
    var calc = function (f) { return ctx.calc(function (r) { var v = f(r); return semValor(v) ? TRACO : String(v); }); };
    var n0 = function (cam) { return ctx.num(cam, { casas: 0 }); };
    var f = ficha(4, [
      ['Endereço', calc(function (r) { return r.paradigma.endereco; }), null, 6],
      ['Área terreno', calc(function (r) { return fn(r.paradigma.areaTerreno); })],
      ['Área privativa', calc(function (r) { return fn(r.paradigma.areaPrivativa); })],
      ['Idade aparente', calc(function (r) { return r.paradigma.idade; })],
      ['Vagas de garagem', calc(function (r) { return r.paradigma.vagas; })],
      ['Padrão', calc(function (r) { return r.paradigma.padrao; })],
      ['Intervalo de valor', calc(function (r) { return r.paradigma.intervalo; })],
      ['Conservação', calc(function (r) { return r.paradigma.conservacao; })],
      ['Testada', ctx.num(p + 'testada')],
      ['Topografia', calc(function (r) { return r.paradigma.topografia; })],
      ['Frentes múltiplas', calc(function (r) { return r.paradigma.multFrentes; })],
      ['Índ. local', ctx.num(p + 'indiceLocal')],
      ['Andar', ctx.num(p + 'andar', { casas: 0, suf: ' º' })],
      ['Dormitórios', n0(p + 'dormitorios')],
      ['Suítes', n0(p + 'suites')],
      ['Banheiros', n0(p + 'banheiros'), null, 2]], [1.7, 1, 1.1, .8]);
    return e('div', {}, [faixa('PARADIGMA / AVALIANDO'), f]);
  }

  function fichaComparativo(ctx, i) {
    var b = 'amostra.' + i + '.';
    var t = function (cam, o) { o = o || {}; o.quebra = true; return ctx.txt(b + cam, o); };
    var nn = function (cam, o) { return ctx.num(b + cam, o); };
    var sel = function (cam, lista) { return ctx.sel(b + cam, lista); };
    var link = ctx.papel
      ? (pegar(b + 'link') ? e('a', { href: pegar(b + 'link'), txt: pegar(b + 'link'),
          style: 'word-break:break-all' }) : e('span', { txt: TRACO }))
      : ctx.txt(b + 'link', { ph: 'https://', quebra: true });
    var campos = ficha(3, [
      ['Endereço', t('endereco')], ['Nº', t('numero')], ['Complemento', t('complemento')],
      ['Empreendimento', t('empreendimento')], ['Bairro', t('bairro')], ['CEP', t('cep')],
      ['Tipo de imóvel', sel('tipo', LS.tipologia)], ['Cidade', t('cidade')], ['UF', t('uf')],
      ['Valor', nn('valor', { pre: 'R$' })], ['Transação', sel('transacao', LS.transacao)], ['Data', ctx.data(b + 'data')],
      ['Topografia', sel('topografia', LS.topografia)], ['Área terreno', nn('areaTerreno', { casas: 1 })],
      ['Área construída', nn('areaConstruida')],
      ['Padrão', sel('padrao', LS.padrao)], ['Testada', nn('testada')], ['Idade aparente', nn('idade', { casas: 0 })],
      ['Conservação', sel('conservacao', LS.conservacao)], ['Frentes múltiplas', sel('multFrentes', LS.multFrentes)],
      ['Andar', nn('andar', { casas: 0, suf: ' º' })],
      ['Intervalo de valor', sel('intervalo', LS.intervalo)], ['Índ. local', nn('indiceLocal')],
      ['Dormitórios', nn('dormitorios', { casas: 0 })],
      ['Fonte', t('fonte')], ['Suítes', nn('suites', { casas: 0 })], ['Banheiros', nn('banheiros', { casas: 0 })],
      ['Contato', t('contato')], ['Telefone', t('telefone')], ['Vagas de garagem', nn('vagas', { casas: 0 })],
      ['Link da oferta', link, null, 4]], [1.5, .75, .75]);
    var foto = ctx.img(b + 'foto', { nu: true, alt: 'auto', vazio: 'Foto do comparativo' });
    foto.classList.add('encher');
    foto.style.minHeight = '40mm';
    foto.style.height = 'auto';
    foto.style.flex = '1 1 auto';
    return e('div', { style: 'margin-bottom:5mm' }, [faixa('ELEMENTO COMPARATIVO ' + (i + 1)),
      g('19.5% 1fr', [e('div', { cls: 'caixa', style: 'display:flex' }, [foto]), campos], { gap: '2mm' })]);
  }

  function folhaFichas(ctx) {
    var p1 = [fichaParadigma(ctx), tit('Amostra')];
    for (var i = 0; i < 4; i++) p1.push(fichaComparativo(ctx, i));
    var p2 = [fichaComparativo(ctx, 4),
      tit('Croqui de Situação do Imóvel Avaliando e Elementos Comparativos'),
      ctx.img('croquiSituacao', { nu: true, alt: '78mm', max: 2000, vazio: 'Clique para inserir o croqui de situação' })];
    return [pagina(ctx, p1, { parte: 'fichas' }), pagina(ctx, p2, { parte: 'fichas' })];
  }

  /* ======================================================== CÁLCULO */
  function painelTratamento() {
    var cal = P.calculo, letra = M.TABELAS[cal.tabela] ? cal.tabela : M.USUAIS.tabela;
    var T = M.TABELAS[letra];
    var sel = e('select', { 'aria-label': 'Tabela de homogeneização' }, ['A', 'B', 'C'].map(function (x) {
      return e('option', { value: x, selected: x === letra ? 'selected' : null,
        txt: 'Tabela ' + x + ' — ' + M.TABELAS[x].nome + ' (' + M.TABELAS[x].uso + ')' }); }));
    sel.addEventListener('change', function () { guardar('calculo.tabela', sel.value); mudou(); remontar(); });
    var usos = T.colunas.map(function (cc) {
      var ch = cc[0], f = (cal.fatores || {})[ch] || {};
      var cx = e('input', { type: 'checkbox', checked: f.usar !== false ? 'checked' : null });
      cx.addEventListener('change', function () { guardar('calculo.fatores.' + ch + '.usar', cx.checked); mudou(); remontar(); });
      return e('label', {}, [cx, M.FATORES[ch].rot]);
    });
    function campoNum(caminho, sugestao, rotulo, casas) {
      var el = e('input', { type: 'text', inputmode: 'decimal', 'aria-label': rotulo });
      function pintar() {
        if (document.activeElement === el) return;
        var v = pegar(caminho), s = semValor(v);
        el.value = nz(s ? sugestao() : v, casas);
        el.classList.toggle('sugerido', s);
      }
      el.addEventListener('input', function () { guardar(caminho, lerNum(el.value)); el.classList.remove('sugerido'); mudou(); });
      el.addEventListener('blur', pintar);
      atualizadores.push(pintar);
      pintar();
      return e('label', {}, [e('span', { cls: 'k', txt: rotulo }), el]);
    }
    var extras = [campoNum('calculo.fam', function () { return M.USUAIS.fam; }, 'FAM / FC adotado', 2)];
    if (letra === 'C') extras.unshift(campoNum('calculo.expoenteAuVg', function () { return M.USUAIS.expoenteAuVg; },
      'Expoente do fator Au/Vg', 4));
    return e('section', { cls: 'painel' }, [
      e('h2', { txt: 'Tratamento dos dados' }),
      e('p', { txt: 'Não sai no laudo. É o que a aba oculta Cálculo_apoio da planilha decidia: qual tabela de ' +
        'homogeneização usar e quais fatores entram. Os fatores e o fator oferta se digitam na própria tabela ' +
        'abaixo — em letra clara está o valor calculado; digitar substitui (é o Quadro Auxiliar), apagar devolve o cálculo.' }),
      e('div', { cls: 'linha' }, [e('span', { cls: 'k', txt: 'Tabela' }), sel]),
      e('div', { cls: 'linha' }, [e('span', { cls: 'k', txt: 'Fatores em uso' })].concat(usos)),
      e('div', { cls: 'linha' }, extras)]);
  }

  function folhaCalculo(ctx) {
    var cal = 'calculo.';
    var topo = g('1.35fr 14mm 1fr 14mm 1fr', [
      e('div', { cls: 'caixa' }, [g('38% 62%', [rot('METODOLOGIA', 'marinho'), val('Comparativo Direto de Dados de Mercado')]),
        g('38% 62%', [rot('TRATAMENTO DE DADOS', 'marinho'), val('Fatores')])]), e('div'),
      e('div', { cls: 'caixa' }, [g('60% 40%', [rot('FUNDAMENTAÇÃO', 'marinho'), val(ctx.sel(cal + 'fundamentacao', LS.fundamentacao), 'centro')]),
        g('60% 40%', [rot('PRECISÃO', 'marinho'), val(ctx.calc(function (r) { return r.est.precisao || TRACO; }), 'centro')])]), e('div'),
      e('div', { cls: 'caixa' }, [g('60% 40%', [rot('COTA-PARTE TERRENO', 'marinho'),
          val(ctx.num(cal + 'cotaTerreno', { pct: true, casas: 0, sug: function () { return M.USUAIS.cotaTerreno; } }), 'centro')]),
        g('60% 40%', [rot('COTA-PARTE CONSTRUÇÃO', 'marinho'),
          val(ctx.num(cal + 'cotaConstrucao', { pct: true, casas: 0, sug: function (r) { return r.tabela.cotaConstrucao; } }), 'centro')])])]);

    var T = R.tabela;
    var cab = e('tr', {}, [e('th', { txt: 'EC' }), e('th', { txt: 'Valor Ofertado ou Negociado' }),
      e('th', { txt: 'Fator Oferta' }), e('th', { txt: 'Área (m²)' }), e('th', { txt: 'Unit. deduzido F. oferta (R$/m²)' })]
      .concat(T.colunas.map(function (c) { return e('th', { txt: c.rot }); }))
      .concat([e('th', { txt: 'Fator Resultante ∑' }), e('th', { txt: 'Valor unit. Homog. (R$/m²)' })]));
    var linhas = repetir(N, function (i) {
      var linha = function (r) { return r.tabela.linhas[i]; };
      var tds = [e('td', { txt: String(i + 1) }),
        e('td', {}, [ctx.calc(function (r) { return semValor(linha(r).valor) ? TRACO : rs(linha(r).valor); })]),
        e('td', {}, [ctx.num(cal + 'oferta.' + i, { sug: function (r) { return linha(r).oferta; } })]),
        e('td', {}, [ctx.calc(function (r) { return fn(linha(r).area); })]),
        e('td', {}, [ctx.calc(function (r) { return fn(linha(r).unit); })])];
      T.colunas.forEach(function (c) {
        if (!c.usar) { tds.push(e('td', { txt: TRACO })); return; }
        tds.push(e('td', {}, [ctx.num(cal + 'fatores.' + c.chave + '.valores.' + i, {
          sug: function (r) { return linha(r).sugeridos[c.chave]; } })]));
      });
      tds.push(e('td', {}, [ctx.calc(function (r) { return fn(linha(r).resultante); })]));
      tds.push(e('td', {}, [ctx.calc(function (r) { return semValor(linha(r).homog) ? TRACO : rs(linha(r).homog); })]));
      return e('tr', {}, tds);
    });
    var nCol = 7 + T.colunas.length;
    var tabela = e('table', { cls: 't homog' }, [cab].concat(linhas));
    var avaliando = e('table', { cls: 't homog', style: 'margin-top:2mm' }, [e('tr', {}, [
      e('td', { txt: 'Avaliando', style: 'width:14%' }), e('td', { style: 'width:6%;border:none;background:transparent' }),
      e('td', { style: 'width:8%' }, [ctx.calc(function (r) { return fn(r.est.areaAvaliando); })]),
      e('td', { style: 'border:none;background:transparent' })])]);

    function estat(rotulo, f1, f2) {
      return e('tr', {}, [e('td', { txt: rotulo, cls: 'dir', style: 'border:none;background:transparent;width:30%' }),
        e('td', { style: 'width:12%' }, [ctx.calc(f1)]), e('td', { style: 'border:none;background:transparent' }),
        e('td', { style: 'width:12%' }, [ctx.calc(f2)])]);
    }
    var estatistica = e('table', { cls: 't homog', style: 'margin-top:2mm' }, [
      estat('Média (R$/m²)', function (r) { return fn(r.est.media); }, function (r) { return fn(r.est.mediaH); }),
      estat('Desvio Padrão (R$/m²)', function (r) { return fn(r.est.desvio); }, function (r) { return fn(r.est.desvioH); }),
      estat('Coef. de Variação (%)', function (r) { return pc(r.est.cv); }, function (r) { return pc(r.est.cvH); })]);

    function bloco(titulo, linhas2) {
      return e('div', {}, [e('div', { txt: titulo, style: 'text-align:center;font-weight:700;color:var(--pg-rot);font-size:var(--t-faixa);border-bottom:.25mm solid var(--pg-fio);padding-bottom:.6mm' }),
        e('table', { cls: 't denso' }, linhas2.map(function (l) {
          return e('tr', {}, [e('td', { cls: 'dir', txt: l[0], style: 'border:none;background:transparent' }),
            e('td', { style: 'border:none;border-bottom:.25mm solid var(--pg-fio);border-left:.25mm solid var(--pg-fio)' }, [ctx.calc(l[1])])]);
        }))]);
    }
    var blocos = g('1fr 1fr 1.35fr 1.1fr', [
      bloco('Validação Inicial', [
        ['0,5 x Área do Avaliando', function (r) { return r.est.validacao ? fn(r.est.validacao.metade) : TRACO; }],
        ['Área do Avaliando', function (r) { return r.est.validacao ? fn(r.est.validacao.area) : TRACO; }],
        ['2 x Área do Avaliando', function (r) { return r.est.validacao ? fn(r.est.validacao.dobro) : TRACO; }]]),
      bloco('Limites Inf. e Sup.', [
        ['0,7 x Média', function (r) { return r.est.limites ? fn(r.est.limites.inferior) : TRACO; }],
        ['Média', function (r) { return r.est.limites ? fn(r.est.limites.media) : TRACO; }],
        ['1,3 x Média', function (r) { return r.est.limites ? fn(r.est.limites.superior) : TRACO; }]]),
      bloco('Intervalo de Confiança', [
        ['Grau de Liberdade (N-1)', function (r) { return semValor(r.est.gl) ? TRACO : String(r.est.gl); }],
        ['T', function (r) { return fn(r.est.t); }],
        ['Amplitude do Interv. de Confiança (%)', function (r) { return pc(r.est.amplitude); }]]),
      bloco('Valor do Imóvel / Paradigma', [
        ['Mínimo', function (r) { return fn(r.est.minimo); }],
        ['Médio', function (r) { return fn(r.est.medio); }],
        ['Máximo', function (r) { return fn(r.est.maximo); }]])], { gap: '7mm' });

    var filhos = [topo, tit('Tabela de Homogeneização'), tabela, avaliando, estatistica,
      espaco('g2'), blocos,
      tit('OBSERVAÇÕES GERAIS', 'menor'), ctx.area(cal + 'observacoes', { alt: '90mm' }), espaco(),
      faixa('VALOR DE MERCADO'),
      e('div', { cls: 'caixa' }, [val(ctx.calc(function (r) { return rs(r.valor.mercado); }), 'centro')])];
    void nCol;
    return [pagina(ctx, filhos, { parte: 'calculo' })];
  }

  /* ======================================================== GRÁFICO */
  function SVG(tag, attrs, filhos) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs || {}) if (attrs[k] !== null && attrs[k] !== undefined) {
      if (k === 'txt') el.textContent = attrs[k]; else el.setAttribute(k, attrs[k]);
    }
    (filhos || []).forEach(function (f) { if (f) el.appendChild(f); });
    return el;
  }
  /* escala "redonda" como a do Excel: passo 1, 2 ou 5 × 10ⁿ e folga no topo */
  function escala(max, marcas) {
    if (!(max > 0)) return { max: 1, passo: 0.2 };
    var bruto = max / (marcas || 5), p = Math.pow(10, Math.floor(Math.log10(bruto)));
    var passo = [1, 2, 2.5, 5, 10].map(function (m) { return m * p; }).filter(function (s) { return s >= bruto; })[0];
    return { max: Math.ceil(max * 1.05 / passo) * passo, passo: passo };
  }

  function graficoDispersao(r) {
    var W = 720, H = 400, x0 = 70, x1 = 700, y0 = 360, y1 = 40;
    var vals = [r.grafico.bissetriz];
    r.grafico.pontos.forEach(function (p) { if (p.x !== null) vals.push(p.x); if (p.y !== null) vals.push(p.y); });
    var s = escala(Math.max.apply(null, vals));
    var X = function (v) { return x0 + (x1 - x0) * v / s.max; }, Y = function (v) { return y0 - (y0 - y1) * v / s.max; };
    var fil = [SVG('text', { x: (x0 + x1) / 2, y: 22, 'text-anchor': 'middle', cls: 'tit-g', 'class': 'tit-g',
      txt: 'Preços Observados x Valores Estimados' })];
    for (var v = 0; v <= s.max + 1e-9; v += s.passo) {
      fil.push(SVG('line', { x1: X(v), x2: X(v), y1: y0, y2: y1, 'class': 'grade' }));
      fil.push(SVG('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), 'class': 'grade' }));
      fil.push(SVG('text', { x: X(v), y: y0 + 13, 'text-anchor': 'middle', 'font-size': 8, txt: nz(v, 2) }));
      fil.push(SVG('text', { x: x0 - 5, y: Y(v) + 3, 'text-anchor': 'end', 'font-size': 8, txt: nz(v, 2) }));
    }
    fil.push(SVG('line', { x1: X(0), y1: Y(0), x2: X(r.grafico.bissetriz), y2: Y(r.grafico.bissetriz), 'class': 'bissetriz' }));
    r.grafico.pontos.forEach(function (p, i) {
      if (p.x === null || p.y === null) return;
      fil.push(SVG('circle', { cx: X(p.x), cy: Y(p.y), r: 5, 'class': 'ec' + (i + 1) }));
    });
    fil.push(SVG('text', { x: (x0 + x1) / 2, y: H - 12, 'text-anchor': 'middle', 'font-size': 9,
      txt: 'Valor Unitário Observado (R$/m²)' }));
    fil.push(SVG('text', { x: 14, y: (y0 + y1) / 2, 'text-anchor': 'middle', 'font-size': 9,
      transform: 'rotate(-90 14 ' + (y0 + y1) / 2 + ')', txt: 'Valor Unitário Estimado (R$/m²)' }));
    return SVG('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'grafico', role: 'img',
      'aria-label': 'Preços observados versus valores estimados' }, fil);
  }

  function folhaGrafico(ctx) {
    var caixa = e('div', { cls: 'caixa', style: 'padding:2mm' });
    function desenhar(r) { caixa.textContent = ''; caixa.appendChild(graficoDispersao(r)); }
    if (!ctx.papel) atualizadores.push(desenhar);
    desenhar(R);
    var leg = e('table', { cls: 't denso', style: 'width:38%;margin-top:3mm' }, [
      e('tr', {}, [e('th', { txt: 'EC' }), e('th', { txt: 'Unit. Observado (R$/m²)' }), e('th', { txt: 'Unit. Estimado (R$/m²)' })])]
      .concat(repetir(N, function (i) {
        return e('tr', {}, [e('td', {}, [e('span', { cls: 'legenda-ec ec' + (i + 1), style: 'vertical-align:middle;margin-right:1.5mm' }), String(i + 1)]),
          e('td', {}, [ctx.calc(function (r) { return fn(r.tabela.linhas[i].unit); })]),
          e('td', {}, [ctx.calc(function (r) { return fn(r.tabela.linhas[i].homog); })])]);
      })));
    return [pagina(ctx, [tit('Poder de Predição do Modelo'), caixa, leg,
      tit('Croqui de Localização'),
      ctx.img('grafico.croqui', { nu: true, alt: '105mm', max: 2000, vazio: 'Clique para inserir o croqui de localização' })],
      { parte: 'grafico' })];
  }

  /* ================================================= LIQUIDAÇÃO FORÇADA */
  function graficoPonte(r) {
    var L = r.liquidacao, W = 520, H = 360, x0 = 78, x1 = 510, y0 = 318, y1 = 36;
    var fil = [SVG('text', { x: (x0 + x1) / 2, y: 18, 'text-anchor': 'middle', 'class': 'tit-g', 'font-size': 10,
      txt: 'Ponte — Valor de Mercado até a Liquidação Forçada' })];
    if (!L.ponte) return SVG('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'grafico' }, fil);
    var s = escala(L.vm, 10);
    var Y = function (v) { return y0 - (y0 - y1) * v / s.max; };
    for (var v = 0; v <= s.max + 1e-6; v += s.passo) {
      fil.push(SVG('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), 'class': 'grade' }));
      fil.push(SVG('text', { x: x0 - 5, y: Y(v) + 3, 'text-anchor': 'end', 'font-size': 7, txt: 'R$ ' + nz(v, 0) }));
    }
    var larg = (x1 - x0) / L.ponte.length;
    L.ponte.forEach(function (b, i) {
      var cx = x0 + larg * (i + 0.5), w = larg * 0.42;
      fil.push(SVG('rect', { x: cx - w / 2, y: Y(b.base + b.valor), width: w,
        height: Math.max(0.5, Y(b.base) - Y(b.base + b.valor)), 'class': b.tipo }));
      fil.push(SVG('text', { x: cx, y: Y(b.base + b.valor / 2) + 3, 'text-anchor': 'middle', 'font-size': 7.5,
        txt: 'R$ ' + nz(b.valor, 0) }));
      fil.push(SVG('text', { x: cx, y: y0 + 12, 'text-anchor': 'middle', 'font-size': 6.5, txt: b.rot }));
    });
    return SVG('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'grafico', role: 'img',
      'aria-label': 'Ponte do valor de mercado até a liquidação forçada' }, fil);
  }

  function folhaLiquidacao(ctx) {
    var l = 'liquidacao.';
    /* no formato da ficha técnica: rótulo sombreado, valor branco à direita */
    function lin(rotulo, campo) {
      return e('tr', {}, [e('td', { cls: 'perg' }, [rotulo]), e('td', { cls: 'dir', style: 'width:30%' }, [campo])]);
    }
    var cr = function (f) { return ctx.calc(function (r) { var L = r.liquidacao; return f(L); }); };
    var r0 = function (v) { return semValor(v) || +v === 0 ? TRACO : 'R$ ' + nz(v, 0); };
    var premissas = e('div', {}, [faixa('PREMISSAS', 'esq'), e('table', { cls: 't ficha-t perguntas', style: 'table-layout:fixed' }, [
      lin('Valor de mercado (VM)', cr(function (L) { return r0(L.vm); })),
      lin('Prazo estimado até a venda (meses)', ctx.num(l + 'prazo', { casas: 0 })),
      lin(e('span', { cls: 'afixo', style: 'justify-content:flex-start' }, [ctx.txt(l + 'rotuloTaxa'), e('span', { cls: 'pre', txt: ' (% a.a.)' })]),
        ctx.num(l + 'taxa', { pct: true, casas: 2 })),
      lin('Inflação acumulada — IPCA (% a.a.)', ctx.num(l + 'ipca', { pct: true, casas: 2 })),
      lin('IR sobre rendimento (regressivo)', cr(function (L) { return pc(L.ir, 1); })),
      lin('Tesouro Prefixado líquido de IR (% a.a.)', cr(function (L) { return pc(L.taxaLiquida); })),
      lin('Taxa real de juros (líq. IR) = (1+Selic_líq)/(1+IPCA)−1', cr(function (L) { return pc(L.taxaReal); })),
      lin('Taxa de desconto mensal = (1+Selic_líq IR)^(1/12)−1', cr(function (L) { return pc(L.taxaMensal, 3); })),
      lin('IPTU (R$ / ano)', ctx.num(l + 'iptuAno', { pre: 'R$' })),
      lin('Condomínio (R$ / mês)', ctx.num(l + 'condominioMes', { pre: 'R$' })),
      lin('Fator de valor presente (anuidade, N meses)', cr(function (L) { return fn(L.fvp, 3); }))]),
      espaco(),
      faixa('DEDUÇÕES NO PERÍODO ATÉ A VENDA', 'esq'), e('table', { cls: 't ficha-t perguntas', style: 'table-layout:fixed' }, [
      lin('(a) Custo de oportunidade (desconto à taxa real)', cr(function (L) { return r0(L.custoOportunidade); })),
      lin('(b) Perda inflacionária no período', cr(function (L) { return r0(L.perdaInflacao); })),
      lin('(c) IPTU acumulado (a valor presente)', cr(function (L) { return r0(L.iptu); })),
      lin('(d) Condomínio acumulado (a valor presente)', cr(function (L) { return r0(L.condominio); })),
      lin('Total das deduções (a+b+c+d)', cr(function (L) { return r0(L.deducoes); }))])]);
    premissas.querySelectorAll('.afixo .c').forEach(function (x) { x.style.width = '38mm'; x.style.flex = 'none'; });

    var ponte = e('div', { cls: 'caixa', style: 'padding:1.5mm' });
    function desenhar(r) { ponte.textContent = ''; ponte.appendChild(graficoPonte(r)); }
    if (!ctx.papel) atualizadores.push(desenhar);
    desenhar(R);

    /* o "X" do mercado: um por linha, escolhido com um clique */
    var mercado = e('table', { cls: 't ficha-t' }, MERCADO.map(function (m) {
      var tds = [e('td', { cls: 'perg', style: 'width:19%', txt: m[1].replace(/:$/, '') })];
      LS[m[0]].forEach(function (op) {
        var marcado = pegar(l + m[0]) === op;
        tds.push(e('td', { cls: 'dir', style: 'width:9%', txt: op }));
        var x = e('td', { style: 'width:7.2%;font-weight:700' });
        if (ctx.papel) x.textContent = marcado ? 'X' : '';
        else {
          var b = e('button', { type: 'button', cls: 'marca', 'aria-label': m[1] + ' ' + op, txt: marcado ? 'X' : '',
            style: 'margin:0 auto;width:4mm;height:1.3em;display:flex;font-weight:700' });
          b.addEventListener('click', function () {
            guardar(l + m[0], pegar(l + m[0]) === op ? '' : op); mudou(); remontar();
          });
          x.appendChild(b);
        }
        tds.push(x);
      });
      return e('tr', {}, tds);
    }));

    var tDesagio = e('table', { cls: 't marinho denso' }, [
      e('tr', {}, [e('th', { txt: 'Deságio' }), e('th', { txt: 'Valor de Liquidação Forçada' })])]
      .concat(repetir(7, function (i) {
        var tr = e('tr', { cls: i === 3 ? 'atual' : null });
        tr.appendChild(e('td', {}, [cr(function (L) { return L.porDesagio ? pc(L.porDesagio[i].desagio) : TRACO; })]));
        tr.appendChild(e('td', {}, [cr(function (L) { return L.porDesagio ? r0(L.porDesagio[i].vlf) : TRACO; })]));
        return tr;
      })));
    var tVar = e('table', { cls: 't marinho denso' }, [
      e('tr', {}, ['Variação', 'Valor de Mercado', 'VLF', 'VLF / VM', 'Desconto', 'Deságio'].map(function (t) {
        return e('th', { txt: t }); }))]
      .concat(repetir(7, function (i) {
        var q = function (f) { return cr(function (L) { return L.porVariacao ? f(L.porVariacao[i]) : TRACO; }); };
        return e('tr', { cls: i === 3 ? 'atual' : null }, [
          e('td', {}, [q(function (x) { return pc(x.variacao, 0); })]), e('td', {}, [q(function (x) { return r0(x.vm); })]),
          e('td', {}, [q(function (x) { return r0(x.vlf); })]), e('td', {}, [q(function (x) { return pc(x.razao, 1); })]),
          e('td', {}, [q(function (x) { return r0(x.desconto); })]), e('td', {}, [q(function (x) { return pc(x.desagio, 1); })])]);
      })));
    var subt = function (t) {
      return e('div', { txt: t, style: 'text-align:center;font-weight:700;color:var(--pg-rot);font-size:var(--t-faixa);border-top:.25mm solid var(--pg-borda);padding:.8mm 0' });
    };

    return [pagina(ctx, [
      tit('Cálculo de Liquidação Forçada - Venda Compulsória'),
      ctx.area(l + 'texto', { alt: '40mm' }), espaco('g2'),
      g('40% 1fr', [premissas, ponte], { gap: '8mm' }), espaco('g2'),
      faixa('VALOR DE LIQUIDAÇÃO FORÇADA'),
      e('div', { cls: 'caixa' }, [val(ctx.calc(function (r) {
        return rs(r.liquidacao.vlf); }), 'centro')]),
      espaco(),
      g('1fr 1fr', [ficha(1, [['Deságio sobre o valor de mercado', ctx.calc(function (r) { return pc(r.liquidacao.desagio); })]]),
        e('div')]),
      espaco(), mercado, espaco('g2'), espaco('g2'),
      faixa('SENSIBILIDADE DO MODELO'),
      e('div', { style: 'background:var(--pg-cel);padding:3mm 0 3mm' }, [
        g('9% 27% 8% 42% 14%', [e('div'), e('div', {}, [subt('VLF por nível de Deságio (sobre o Valor de Mercado)'), tDesagio]),
          e('div'), e('div', {}, [subt('VLF e Deságio por variação do Valor de Mercado (±15%)'), tVar]), e('div')])])],
      { parte: 'liquidacao' })];
  }

  /* ============================================================= FOTOS */
  function folhaFotos(ctx) {
    var fotos = P.fotos || [];
    var nPag = Math.max(1, Math.ceil(fotos.length / FOTOS_POR_PAGINA));
    if (ctx.papel && !fotos.length) return [];
    /* as páginas são as do papel; o botão de acrescentar fica abaixo da grade,
       fora do fluxo, na última página (a tela mede o mesmo que a impressão) */
    return repetir(nPag, function (pg) {
      var celulas = [];
      for (var k = pg * FOTOS_POR_PAGINA; k < Math.min(fotos.length, (pg + 1) * FOTOS_POR_PAGINA); k++) {
        celulas.push(celulaFoto(ctx, k));
      }
      var grade = g('1fr 1fr', celulas, { gap: '6mm', estilo: 'row-gap:4mm' });
      var ultima = pg === nPag - 1 && !ctx.papel;
      return pagina(ctx, [tit('Relatório Fotográfico'),
        ultima ? e('div', { cls: 'com-botoes' }, [grade, e('div', { cls: 'linha-botoes', style: 'margin-top:4mm' },
          [botaoAdicionar('Adicionar fotos', 'fotos', { alt: 'auto', cls: 'botao-linha' })])]) : grade], { parte: 'fotos' });
    });
  }
  function celulaFoto(ctx, k) {
    var b = 'fotos.' + k + '.';
    var fig = ctx.img(b + 'img', { alt: '56mm', legenda: ctx.txt(b + 'legenda', { cls: 'centro', ph: 'Legenda' }) });
    if (!ctx.papel) {
      var acoes = fig.querySelector('.acoes-img') || e('div', { cls: 'acoes-img' });
      if (!acoes.parentNode) fig.querySelector('.quadro-img').appendChild(acoes);
      acoes.textContent = '';
      [['←', -1], ['→', 1]].forEach(function (m) {
        var bt = e('button', { type: 'button', txt: m[0], title: 'Mover' });
        bt.addEventListener('click', function () {
          var j = k + m[1]; if (j < 0 || j >= P.fotos.length) return;
          var t = P.fotos[k]; P.fotos[k] = P.fotos[j]; P.fotos[j] = t; mudou(); remontar();
        });
        acoes.appendChild(bt);
      });
      var tira = e('button', { type: 'button', txt: 'Remover' });
      tira.addEventListener('click', function () { P.fotos.splice(k, 1); mudou(); remontar(); });
      acoes.appendChild(tira);
    }
    return fig;
  }
  /* inserir várias imagens de uma vez, na ordem em que foram escolhidas */
  function botaoAdicionar(texto, lista, o) {
    var b = e('button', { type: 'button', cls: o.cls || 'adicionar', txt: '+ ' + texto, style: 'height:' + o.alt });
    b.addEventListener('click', function () {
      escolherArquivos(true, function (arqs) {
        if (!arqs.length) return;
        Promise.all(arqs.map(function (a) { return lerImagem(a, o.imagem || {}); })).then(function (urls) {
          urls.forEach(function (u) { P[lista].push(lista === 'fotos' ? { img: u, legenda: '' } : { img: u }); });
          mudou(); remontar();
        }).catch(function () { avisar('Imagem não lida', 'Algum dos arquivos não é uma imagem que o navegador abra.'); });
      });
    });
    return b;
  }

  /* ============================================================ ANEXOS
     Documentos (matrícula, IPTU) como imagem, uma por página, sem cabeçalho
     — como as páginas finais do laudo impresso. */
  function folhaAnexos(ctx) {
    var anexos = P.anexos || [];
    var paginas = anexos.map(function (a, k) {
      var pg = e('section', { cls: 'pagina anexo', 'data-parte': 'anexos' }, [e('img', { src: a.img, alt: 'Anexo ' + (k + 1) })]);
      if (!ctx.papel) {
        var acoes = e('div', { cls: 'acoes-img', style: 'top:4mm;right:4mm' });
        [['←', -1], ['→', 1]].forEach(function (m) {
          var bt = e('button', { type: 'button', txt: m[0] === '←' ? '↑' : '↓', title: 'Mover' });
          bt.addEventListener('click', function () {
            var j = k + m[1]; if (j < 0 || j >= P.anexos.length) return;
            var t = P.anexos[k]; P.anexos[k] = P.anexos[j]; P.anexos[j] = t; mudou(); remontar();
          });
          acoes.appendChild(bt);
        });
        var tira = e('button', { type: 'button', txt: 'Remover' });
        tira.addEventListener('click', function () { P.anexos.splice(k, 1); mudou(); remontar(); });
        acoes.appendChild(tira);
        pg.appendChild(acoes);
      }
      return pg;
    });
    if (!ctx.papel) {
      paginas.unshift(e('section', { cls: 'painel' }, [e('h2', { txt: 'Anexos' }),
        e('p', { txt: 'Matrícula, extrato do IPTU e outros documentos entram no fim do laudo, uma imagem por página. ' +
          'Documento em PDF: exporte cada página como imagem (JPG ou PNG) antes de inserir.' }),
        botaoAdicionar('Adicionar páginas de anexo', 'anexos', { alt: 'auto', imagem: { max: 2400, qualidade: 0.85 } })]));
    }
    return paginas;
  }

  /* ================================================================ abas */
  var ABAS = [
    { id: 'capa', rot: 'Capa', render: folhaCapa },
    { id: 'regiao', rot: 'Região + Imóvel', render: folhaRegiao },
    { id: 'restricoes', rot: 'Restrições do imóvel', render: folhaRestricoes },
    { id: 'fichas', rot: 'Fichas de pesquisa', render: folhaFichas },
    { id: 'calculo', rot: 'Cálculo', render: folhaCalculo, painel: painelTratamento },
    { id: 'grafico', rot: 'Gráfico', render: folhaGrafico },
    { id: 'liquidacao', rot: 'Liquidação forçada', render: folhaLiquidacao },
    { id: 'fotos', rot: 'Relatório fotográfico', render: folhaFotos },
    { id: 'anexos', rot: 'Anexos', render: folhaAnexos },
    { id: 'impressao', rot: 'Impressão', render: folhaImpressao, painel: painelImpressao }
  ];
  function abaDe(id) { return ABAS.filter(function (a) { return a.id === id; })[0]; }

  function montarAbas() {
    var nav = document.getElementById('abas');
    nav.textContent = '';
    if (!abaDe(abaAtiva)) abaAtiva = 'capa';
    ABAS.forEach(function (a) {
      var b = e('button', { cls: 'aba', role: 'tab', 'aria-selected': a.id === abaAtiva ? 'true' : 'false', txt: a.rot });
      b.addEventListener('click', function () {
        if (a.id === abaAtiva) return;
        rolagem[abaAtiva] = window.scrollY;
        abaAtiva = a.id; montarAbas(); montarFolha();
        if (casca) casca.vista();
      });
      nav.appendChild(b);
    });
  }

  var rolagem = {};
  function montarFolha(manterRolagem) {
    var y = manterRolagem ? window.scrollY : (rolagem[abaAtiva] || 0);
    atualizadores = [];
    var alvo = document.getElementById('folha');
    alvo.textContent = '';
    var aba = abaDe(abaAtiva);
    if (aba.painel) alvo.appendChild(aba.painel());
    aba.render(contexto(false)).forEach(function (p) { alvo.appendChild(p); });
    ajustarZoom();
    aplicar();
    Array.prototype.forEach.call(alvo.querySelectorAll('textarea.quebra'), crescer);
    window.scrollTo(0, y);
  }
  /* campo de texto que quebra: a altura acompanha as linhas */
  function crescer(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  function remontar() { montarFolha(true); }

  /* A folha é A4 de verdade; na tela ela cresce até caber na largura. */
  function ajustarZoom() {
    /* as abas grudam logo abaixo da barra, que pode quebrar em duas linhas */
    var barra = document.querySelector('.barra');
    if (barra) document.documentElement.style.setProperty('--barra-alt', barra.offsetHeight + 'px');
    var largura = document.getElementById('folha').clientWidth - 32;
    var z = Math.max(0.3, Math.min(1.25, largura / 1020));
    document.documentElement.style.setProperty('--zoom', z.toFixed(3));
  }
  window.addEventListener('resize', function () { ajustarZoom(); });

  function aplicar() {
    if (!R) return;
    atualizadores.forEach(function (f) { try { f(R); } catch (err) { console.error(err); } });
    var topo = document.getElementById('resumo-topo');
    topo.textContent = '';
    resumo().forEach(function (d) {
      topo.appendChild(e('div', {}, [e('span', { cls: 'r', txt: d[0] }), e('span', { cls: 'v', txt: d[1] })]));
    });
  }

  /* Os números do topo, já escritos; a casca os mostra no cartão do estudo. */
  function resumo() {
    var mil = function (v) { return semValor(v) ? '—' : 'R$ ' + nz(v, 0); };
    return [['Valor de mercado', mil(R.valor.mercadoArredondado)],
      ['R$/m²', semValor(R.valor.m2Privativa) ? '—' : 'R$ ' + nz(R.valor.m2Privativa, 2)],
      ['Liquidação forçada', mil(R.liquidacao.vlfArredondado)],
      ['Precisão', R.est.precisao || '—']];
  }

  var tGuardar = null;
  function mudou() {
    try { R = M.calcular(P); } catch (err) { console.error(err); return; }
    aplicar();
    clearTimeout(tGuardar);
    tGuardar = setTimeout(guardarEstudo, 350);
  }
  function guardarEstudo() {
    if (casca) { casca.devolver(P, resumo()); return; }
    local.gravar(P).catch(function () {
      avisar('Estudo não guardado', 'O navegador recusou guardar o estudo (janela anônima ou sem espaço). ' +
        'Use "Salvar" para baixar o estudo — ou abra-o pela plataforma, que guarda tudo.');
    });
  }

  /* Sozinho no navegador, o estudo mora no IndexedDB: com fotos, ele passa
     dos ~5 MB que o localStorage aceita. O localStorage fica só para ler
     estudos guardados antes. */
  var local = {
    base: function () {
      return new Promise(function (ok, erro) {
        var r = indexedDB.open('comparativo', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('estudo'); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { erro(r.error); };
      });
    },
    ler: function () {
      return local.base().then(function (db) {
        return new Promise(function (ok) {
          var q = db.transaction('estudo', 'readonly').objectStore('estudo').get('premissas');
          q.onsuccess = function () { ok(q.result || null); };
          q.onerror = function () { ok(null); };
        });
      }).catch(function () { return null; }).then(function (p) {
        if (p) return p;
        try { return JSON.parse(localStorage.getItem('comparativo.premissas')); } catch (err) { return null; }
      });
    },
    gravar: function (p) {
      return local.base().then(function (db) {
        return new Promise(function (ok, erro) {
          var tx = db.transaction('estudo', 'readwrite');
          tx.objectStore('estudo').put(JSON.parse(JSON.stringify(p)), 'premissas');
          tx.oncomplete = function () { ok(); };
          tx.onerror = tx.onabort = function () { erro(tx.error); };
        });
      });
    }
  };

  var tempoAviso = null;
  function avisar(titulo, texto) {
    var velho = document.getElementById('aviso-flutuante');
    if (velho) velho.remove();
    var el = e('div', { cls: 'aviso-flutuante', id: 'aviso-flutuante' }, [e('b', { txt: titulo }), e('span', { txt: texto })]);
    document.body.appendChild(el);
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(function () { el.remove(); }, 7000);
  }

  /* ========================================================== impressão */
  var PARTES = [['capa', 'Capa'], ['regiao', 'Região + Imóvel'], ['restricoes', 'Restrições do imóvel'],
    ['fichas', 'Fichas de pesquisa'], ['calculo', 'Cálculo'], ['grafico', 'Gráfico'],
    ['liquidacao', 'Liquidação forçada'], ['fotos', 'Relatório fotográfico'], ['anexos', 'Anexos']];
  function imprimirLaudo(partes) {
    var alvo = document.getElementById('impressao');
    alvo.textContent = '';
    var ctx = contexto(true);
    partes.forEach(function (id) { abaDe(id).render(ctx).forEach(function (p) { alvo.appendChild(p); }); });
    var imgs = Array.prototype.slice.call(alvo.querySelectorAll('img'));
    Promise.all(imgs.map(function (im) {
      return im.complete ? null : new Promise(function (ok) { im.onload = im.onerror = ok; });
    })).then(function () { window.print(); });
  }
  /* ------------------------------------------ a prévia da impressão
     O laudo como sai no papel, página a página: as mesmas funções, no
     contexto de papel, com as cores do papel claro em qualquer tema. Página
     que passa da folha A4 ganha o aviso — no papel ela sairia em duas. */
  function partesEscolhidas() {
    var esc = P.impressao || {};
    return PARTES.filter(function (p) { return esc[p[0]] !== false; });
  }
  function painelImpressao() {
    var esc = P.impressao || {};
    var marcas = PARTES.map(function (p) {
      var cx = e('input', { type: 'checkbox', checked: esc[p[0]] !== false ? 'checked' : null });
      cx.addEventListener('change', function () {
        guardar('impressao.' + p[0], cx.checked); mudou(); remontar();
      });
      return e('label', {}, [cx, p[1]]);
    });
    var botao = e('button', { type: 'button', cls: 'botao', id: 'btn-imprimir-previa', txt: 'Imprimir estas páginas' });
    botao.addEventListener('click', function () {
      imprimirLaudo(partesEscolhidas().map(function (p) { return p[0]; }));
    });
    return e('section', { cls: 'painel' }, [
      e('h2', { txt: 'Impressão' }),
      e('p', { txt: 'O laudo como sai no papel A4, página a página, sempre no papel claro. Aqui não se edita: ' +
        'volte à aba da página para ajustar. Uma página marcada em vermelho passa da folha e sairia em duas.' }),
      e('div', { cls: 'linha' }, [e('span', { cls: 'k', txt: 'Partes do laudo' })].concat(marcas)),
      e('div', { cls: 'linha' }, [botao])]);
  }
  function folhaImpressao() {
    var ctx = contexto(true), paginas = [];
    partesEscolhidas().forEach(function (p) {
      abaDe(p[0]).render(ctx).forEach(function (pg) { paginas.push({ pg: pg, parte: p[1] }); });
    });
    var caixa = e('div', { cls: 'previa' });
    if (!paginas.length) caixa.appendChild(e('p', { cls: 'rotulo-pagina', txt: 'Nenhuma parte escolhida.' }));
    paginas.forEach(function (x, i) {
      var rotulo = e('div', { cls: 'rotulo-pagina', txt: 'Página ' + (i + 1) + ' de ' + paginas.length + ' · ' + x.parte });
      caixa.appendChild(e('div', { cls: 'folha-previa' }, [rotulo, x.pg]));
    });
    /* depois de desenhada, mede: a altura da página em mm contra a da folha */
    requestAnimationFrame(function () {
      caixa.querySelectorAll('.folha-previa').forEach(function (f) {
        var pg = f.querySelector('.pagina'), mm = pg.offsetHeight * 25.4 / 96;
        var limite = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pg-h')) || 381.8;
        if (mm > limite + 0.8) {
          f.classList.add('passa');
          f.querySelector('.rotulo-pagina').textContent += ' — passa da folha A4 (sairia em ' +
            Math.ceil(mm / limite - 0.01) + ' folhas)';
        }
      });
    });
    return [caixa];
  }

  function abrirDialogoImpressao() {
    var dlg = document.getElementById('dlg-imprimir'), lista = document.getElementById('dlg-imprimir-lista');
    lista.textContent = '';
    var esc = P.impressao || {};
    PARTES.forEach(function (p) {
      var n = p[0] === 'fichas' ? '2 páginas' : p[0] === 'fotos'
        ? (P.fotos.length ? Math.ceil(P.fotos.length / FOTOS_POR_PAGINA) + ' página(s)' : 'sem fotos')
        : p[0] === 'anexos' ? (P.anexos.length ? P.anexos.length + ' página(s)' : 'sem anexos') : '1 página';
      var cx = e('input', { type: 'checkbox', value: p[0], checked: esc[p[0]] !== false ? 'checked' : null });
      lista.appendChild(e('label', {}, [cx, p[1], e('span', { cls: 'n', txt: n })]));
    });
    dlg.showModal();
  }

  function baixar(nome, txt, tipo) {
    var url = URL.createObjectURL(new Blob([txt], { type: tipo }));
    var a = document.createElement('a'); a.href = url; a.download = nome; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  /* ----------------------------------------------------------- a casca
     Aberto pela plataforma (index.html?casca), o estudo vem dela e volta para
     ela; sozinho no navegador, mora no IndexedDB. Sem estudo guardado, abre
     o que a página trouxer em window.COMPARATIVO_INICIAL (a versão de
     revisão traz um laudo de exemplo), ou em branco. */
  var casca = null;
  var CANAL = 'imovaluation';

  function iniciar() {
    if (!/[?&]casca(&|=|$)/.test(location.search) || window.parent === window) {
      local.ler().then(function (salvo) { montar(salvo || window.COMPARATIVO_INICIAL || null); });
      return;
    }
    var aberto = false;
    window.addEventListener('message', function (ev) {
      var m = ev.data;
      if (aberto || ev.source !== window.parent || ev.origin !== location.origin) return;
      if (!m || m.canal !== CANAL || m.tipo !== 'abrir' || !m.estudo) return;
      aberto = true;
      casca = {
        devolver: function (p, r) {
          window.parent.postMessage({ canal: CANAL, tipo: 'mudou', premissas: p, resumo: r }, location.origin);
        },
        vista: function () {
          rolagem[abaAtiva] = window.scrollY;
          var aba = abaDe(abaAtiva);
          window.parent.postMessage({ canal: CANAL, tipo: 'vista',
            vista: { aba: abaAtiva, rotulo: aba ? aba.rot : '', rolagem: rolagem } }, location.origin);
        }
      };
      if (m.estudo.nome) document.title = m.estudo.nome + ' · Comparativo direto';
      var v = m.estudo.vista;
      if (v && typeof v.aba === 'string') abaAtiva = v.aba;
      if (v && v.rolagem && typeof v.rolagem === 'object') rolagem = v.rolagem;
      montar(m.estudo.premissas);
      window.parent.postMessage({ canal: CANAL, tipo: 'resumo', resumo: resumo() }, location.origin);
      var parado = null;
      window.addEventListener('scroll', function () {
        clearTimeout(parado); parado = setTimeout(casca.vista, 600);
      }, { passive: true });
      document.getElementById('btn-json').textContent = 'Baixar premissas';
      document.getElementById('btn-novo').hidden = true;   // estudo novo se cria na pasta
    });
    window.parent.postMessage({ canal: CANAL, tipo: 'pronto', modulo: 'comparativo' }, location.origin);
  }

  /* O guardado passa por cima do vazio, campo a campo: premissa de uma versão
     anterior do módulo ganha as chaves novas sem perder as suas. */
  function mesclar(base, salvo) {
    if (salvo === null || salvo === undefined) return base;
    if (Array.isArray(base)) {
      if (!Array.isArray(salvo)) return base;
      if (!base.length) return salvo;                       // listas livres: fotos, anexos
      /* lista que cresce (linhas de ambiente): o que foi salvo além do
         tamanho padrão entra também, sobre o molde da primeira linha */
      var n = Math.max(base.length, salvo.length), out = [];
      for (var i = 0; i < n; i++) out.push(i < salvo.length ? mesclar(base[i] !== undefined ? base[i] : base[0], salvo[i]) : base[i]);
      return out;
    }
    if (base && typeof base === 'object') {
      if (typeof salvo !== 'object' || Array.isArray(salvo)) return base;
      var o = {};
      Object.keys(base).forEach(function (k) { o[k] = mesclar(base[k], salvo[k]); });
      Object.keys(salvo).forEach(function (k) { if (!(k in o)) o[k] = salvo[k]; });
      return o;
    }
    return salvo;
  }

  var ligado = false;
  /* Estudos da versão 1: comum estimada era cópia da matrícula; doc.
     complementar era texto ("-"); o registro era uma linha só. */
  function migrar(p) {
    if (!p || typeof p !== 'object' || (p.versao || 1) >= 5) return p;
    var v0 = p.versao || 1;
    if ((p.versao || 1) < 2) {
    var ar = p.capa && p.capa.areas;
    if (ar) {
      if (ar.comum && (ar.comum.estimada === null || ar.comum.estimada === undefined)) ar.comum.estimada = ar.comum.matricula;
      ['terreno', 'privativa', 'comum'].forEach(function (k) {
        if (ar[k] && typeof ar[k].doc === 'string') ar[k].doc = lerNum(ar[k].doc);
      });
      delete ar.total;
    }
    var crea = p.capa && p.capa.assinaturaCrea;
    if (typeof crea === 'string' && crea.trim()) {
      var m = /^\s*(CREA|CAU)\s*\/?\s*([A-Za-z]{2})?\s*[-–]?\s*(.*)$/i.exec(crea);
      if (m) { p.capa.conselho = m[1].toUpperCase(); p.capa.conselhoUF = (m[2] || '').toUpperCase(); p.capa.conselhoNumero = m[3].trim(); }
      else p.capa.conselhoNumero = crea.trim();
    }
    if (p.capa) delete p.capa.assinaturaCrea;
    if (p.capa && p.capa.uso === '-') p.capa.uso = '';
    if (p.capa && ['Ocupado', 'Desocupado'].indexOf(p.capa.ocupacao) < 0) p.capa.ocupacao = '';
    }
    if (v0 < 3) {
    /* versão 2 → 3: o registro da empresa ganha conselho e UF, como o do
       responsável — o número vem do campo antigo, conselho e UF do responsável */
    if (p.capa) {
      var ant = p.capa.creaEmpresa;
      if (ant !== undefined && ant !== null && String(ant).trim()) {
        p.capa.conselhoEmpresaNumero = String(ant).trim();
        if (!p.capa.conselhoEmpresa) p.capa.conselhoEmpresa = p.capa.conselho || '';
        if (!p.capa.conselhoEmpresaUF) p.capa.conselhoEmpresaUF = p.capa.conselhoUF || '';
      }
      delete p.capa.creaEmpresa;
    }
    }
    /* versão 3 → 4: o texto corrido deixa as marcas ("# ", **) e passa a HTML
       de formatação, escrito pela barra de ferramentas */
    if (v0 < 4) {
    CAMPOS_TEXTO.forEach(function (c) {
      var v = pegar(c, p);
      if (typeof v === 'string') {
        var ks = c.split('.'); p[ks[0]][ks[1]] = marcasParaHtml(v);
      }
    });
    }
    /* versão 4 → 5: a divisão interna abre com 5 linhas (eram 13); as linhas
       vazias do fim saem, até sobrarem 5 */
    var amb = p.imovel && p.imovel.ambientes;
    if (Array.isArray(amb)) {
      var vazia = function (a) { return !a || Object.keys(a).every(function (k) { return semValor(a[k]); }); };
      while (amb.length > N_AMBIENTES && vazia(amb[amb.length - 1])) amb.pop();
    }
    p.versao = 5;
    return p;
  }

  function montar(p) {
    try { P = mesclar(premissasVazias(), migrar(p && typeof p === 'object' ? p : null)); }
    catch (err) { P = premissasVazias(); }
    R = M.calcular(P);
    aplicarCor();
    montarAbas(); montarFolha();
    if (ligado) return;
    ligado = true;
    var corInp = document.getElementById('cor-laudo');
    corInp.addEventListener('input', function () { guardar('aparencia.cor', corInp.value.toUpperCase()); aplicarCor(); mudou(); });
    document.getElementById('cor-padrao').addEventListener('click', function () {
      guardar('aparencia.cor', COR_PADRAO); aplicarCor(); mudou();
    });
    var btnTema = document.getElementById('btn-tema');
    function escuroAgora() {
      var t = document.documentElement.getAttribute('data-tema');
      if (t) return t === 'escuro';
      try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (err) { return false; }
    }
    function aplicarTema(t) {
      if (t === 'claro' || t === 'escuro') document.documentElement.setAttribute('data-tema', t);
      else document.documentElement.removeAttribute('data-tema');
      btnTema.textContent = escuroAgora() ? 'Tema claro' : 'Tema escuro';
      try { localStorage.setItem('comparativo.tema', t); } catch (err) {}
    }
    var temaSalvo = 'sistema';
    try { temaSalvo = localStorage.getItem('comparativo.tema') || 'sistema'; } catch (err) {}
    aplicarTema(temaSalvo);
    btnTema.addEventListener('click', function () { aplicarTema(escuroAgora() ? 'claro' : 'escuro'); });

    document.getElementById('btn-json').addEventListener('click', function () {
      var nome = String(P.capa.matricula || P.capa.empreendimento || 'estudo').replace(/[^\w.-]+/g, '-');
      baixar('comparativo-' + nome + '.json', JSON.stringify(P), 'application/json');
    });
    /* apagar tudo pede um segundo clique, na própria barra */
    var btnNovo = document.getElementById('btn-novo'), tNovo = null;
    btnNovo.addEventListener('click', function () {
      if (!btnNovo.classList.contains('confirmar')) {
        btnNovo.classList.add('confirmar'); btnNovo.textContent = 'Apagar tudo? Clique de novo';
        tNovo = setTimeout(function () { btnNovo.classList.remove('confirmar'); btnNovo.textContent = 'Estudo em branco'; }, 4000);
        return;
      }
      clearTimeout(tNovo); btnNovo.classList.remove('confirmar'); btnNovo.textContent = 'Estudo em branco';
      P = premissasVazias(); rolagem = {}; abaAtiva = 'capa';
      aplicarCor(); mudou(); montarAbas(); montarFolha();
    });
    var arq = document.getElementById('arquivo-json');
    document.getElementById('btn-abrir').addEventListener('click', function () { arq.value = ''; arq.click(); });
    arq.addEventListener('change', function () {
      var f = arq.files && arq.files[0];
      if (!f) return;
      f.text().then(function (t) {
        var p = JSON.parse(t);
        if (!p || typeof p !== 'object' || !p.capa) throw new Error('formato');
        P = mesclar(premissasVazias(), migrar(p)); rolagem = {};
        aplicarCor(); mudou(); montarFolha();
      }).catch(function () { avisar('Arquivo não reconhecido', 'Escolha um arquivo de premissas salvo por este módulo.'); });
    });

    var dlg = document.getElementById('dlg-imprimir');
    document.getElementById('btn-imprimir').addEventListener('click', abrirDialogoImpressao);
    document.getElementById('dlg-imprimir-cancelar').addEventListener('click', function () { dlg.close(); });
    document.getElementById('dlg-imprimir-ok').addEventListener('click', function () {
      var esc = {}, partes = [];
      dlg.querySelectorAll('input[type="checkbox"]').forEach(function (cx) {
        esc[cx.value] = cx.checked; if (cx.checked) partes.push(cx.value);
      });
      P.impressao = esc; mudou();
      dlg.close();
      if (partes.length) imprimirLaudo(partes);
    });
    window.addEventListener('afterprint', function () { document.getElementById('impressao').textContent = ''; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
