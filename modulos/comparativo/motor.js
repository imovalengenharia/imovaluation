/* ============================================================================
   MOTOR DO COMPARATIVO DIRETO — porte fiel da planilha "Laudo de Avaliação de
   Imóvel Urbano" (abas Fichas Pesquisa, Cálculo_apoio, Cálculo e Liquidação
   forçada). Cálculo puro, sem DOM.

   Entrada:  premissas P (ver premissasVazias() em app.js)
   Saída:    { paradigma, amostra[], tabela, est, valor, capa, liquidacao, grafico }

   Cada célula da planilha tem aqui o nome dela ao lado, para a conferência
   linha a linha continuar possível.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------ tabelas da Inf. Auxiliar */

  /* Padrões construtivos (IBAPE): Pc por intervalo (mínimo … máximo), vida
     útil de referência (anos) e valor residual. 'Inf. Auxiliar'!O5:W39 */
  var PADROES = [
    ['Barraco - Padrão Rústico', [0.091, 0.1135, 0.136, 0.1565, 0.177], 5, 0],
    ['Barraco - Padrão Simples', [0.178, 0.1905, 0.203, 0.21850000000000003, 0.234], 10, 0],
    ['Casa - Padrão Rústico', [0.409, 0.44499999999999995, 0.481, 0.517, 0.553], 60, 0.2],
    ['Casa - Padrão Proletário', [0.624, 0.679, 0.734, 0.7889999999999999, 0.844], 60, 0.2],
    ['Casa - Padrão Econômico', [0.919, 0.9945, 1.07, 1.1455000000000002, 1.221], 70, 0.2],
    ['Casa - Padrão Simples', [1.251, 1.374, 1.497, 1.62, 1.743], 70, 0.2],
    ['Casa - Padrão Médio', [1.903, 2.0285, 2.154, 2.2545, 2.355], 70, 0.2],
    ['Casa - Padrão Superior', [2.356, 2.5060000000000002, 2.656, 2.832, 3.008], 70, 0.2],
    ['Casa - Padrão Fino', [3.331, 3.598, 3.865, 4.132, 4.399], 60, 0.2],
    ['Casa - Padrão Luxo', [4.843, 4.843, 4.843, 4.843, 4.843], 60, 0.2],
    ['Apartamento - Padrão Econômico', [2.473, 2.6105, 2.748, 2.8855000000000004, 3.023], 60, 0.2],
    ['Apartamento - Padrão Simples(s/ elevador)', [3.18, 3.3565, 3.533, 3.685, 3.837], 60, 0.2],
    ['Apartamento - Padrão Simples(c/ elevador)', [3.562, 3.76, 3.958, 4.156000000000001, 4.354], 60, 0.2],
    ['Apartamento - Padrão Médio(s/ elevador)', [3.828, 4.023, 4.218, 4.429, 4.64], 60, 0.2],
    ['Apartamento - Padrão Médio(c/ elevador)', [4.568, 4.8215, 5.075, 5.329000000000001, 5.583], 60, 0.2],
    ['Apartamento - Padrão Superior(s/ elevador)', [5.377, 5.6754999999999995, 5.974, 6.273, 6.572], 60, 0.2],
    ['Apartamento - Padrão Superior(c/ elevador)', [6.144, 6.4855, 6.827, 6.958, 7.089], 60, 0.2],
    ['Apartamento - Padrão Fino', [7.09, 7.25, 7.41, 7.6965, 7.983], 50, 0.2],
    ['Apartamento - Padrão Luxo', [7.984, 8.3335, 8.683, 9.117, 9.551], 50, 0.2],
    ['Escritório - Padrão Econômico', [2.081, 2.197, 2.313, 2.4285, 2.544], 70, 0.2],
    ['Escritório - Padrão Simples(s/ elevador)', [3.378, 3.5655, 3.753, 3.883, 4.013], 70, 0.2],
    ['Escritório - Padrão Simples(c/ elevador)', [3.742, 3.95, 4.158, 4.365500000000001, 4.573], 70, 0.2],
    ['Escritório - Padrão Médio(s/ elevador)', [4.014, 4.172000000000001, 4.33, 4.5465, 4.763], 60, 0.2],
    ['Escritório - Padrão Médio(c/ elevador)', [4.745, 5.009, 5.273, 5.52, 5.767], 60, 0.2],
    ['Escritório - Padrão Superior(s/ elevador)', [5.206, 5.495, 5.784, 6.0735, 6.363], 60, 0.2],
    ['Escritório - Padrão Superior(c/ elevador)', [5.768, 6.0695, 6.371, 6.721500000000001, 7.072], 60, 0.2],
    ['Escritório - Padrão Fino', [7.073, 7.501, 7.929, 8.3255, 8.722], 50, 0.2],
    ['Escritório - Padrão Luxo', [9.935, 10.1555, 10.376, 10.376, 10.376], 50, 0.2],
    ['Galpão - Padrão Econômico', [0.518, 0.5635, 0.609, 0.6545, 0.7], 60, 0.2],
    ['Galpão - Padrão Simples', [0.982, 1.0535, 1.125, 1.1965, 1.268], 60, 0.2],
    ['Galpão - Padrão Médio', [1.368, 1.5135, 1.659, 1.7650000000000001, 1.871], 80, 0.2],
    ['Galpão - Padrão Superior', [1.872, 1.872, 1.872, 1.872, 1.872], 80, 0.2],
    ['Cobertura - Padrão Simples', [0.071, 0.10649999999999998, 0.142, 0.1775, 0.213], 20, 0.1],
    ['Cobertura - Padrão Médio', [0.229, 0.261, 0.293, 0.32499999999999996, 0.357], 20, 0.1],
    ['Cobertura - Padrão Superior', [0.333, 0.4095, 0.486, 0.5625, 0.639], 30, 0.1]
  ];
  var INTERVALOS = ['Mínimo', 'Mínimo/Médio', 'Médio', 'Médio/Máximo', 'Máximo'];

  /* Posicionamento vertical: coeficiente por andar, residencial e comercial
     (escritórios). Térreo = 0; do 24º para cima vale a última linha.
     'Inf. Auxiliar'!B256:D280 */
  var ANDAR_RES = [98, 100, 104, 106, 108, 109, 110, 111, 112, 112.5, 113, 113.5, 114, 114.5, 115,
                   115.5, 116, 116.5, 117, 117.5, 118, 118.5, 119, 119.5, 120];
  var ANDAR_COM = [98, 100, 102, 103, 104, 104.5, 105, 105.5, 106, 106.25, 106.5, 106.75, 107, 107.25,
                   107.5, 107.75, 108, 108.25, 108.5, 108.75, 109, 109.25, 109.5, 109.75, 110];

  /* Topografia: fatores corretivos genéricos aproximados. 'Inf. Auxiliar'!F256:J268 */
  var TOPOGRAFIA = {
    'Plano': 1, 'Declive até 5%': 0.95, 'Declive de 5% a 10%': 0.9, 'Declive de 10% a 20%': 0.8,
    'Declive acima de 20%': 0.7, 'Em aclive até 10%': 0.95, 'Em aclive até 20%': 0.9,
    'Em aclive acima de 20%': 0.85, 'Abaixo do nível da rua até 1,00 m': 1,
    'Abaixo do nível da rua de 1,00 m a 2,50 m': 0.9, 'Abaixo do nível da rua de 2,50 m a 4,00 m': 0.8,
    'Acima do nível da rua até 2,00 m': 1, 'Acima do nível da Rua de 2,00 m até 4,00 m': 0.9
  };

  /* Ross-Heidecke: depreciação pelo estado de conservação (a … i). A planilha
     compara sem distinguir maiúscula ("B - entre nova e regular"). */
  var CONSERVACAO = [
    ['a - novo', 0], ['b - entre nova e regular', 0.0032], ['c - regular', 0.0252],
    ['d - entre regular e reparos simples', 0.0809], ['e - reparos simples', 0.181],
    ['f - entre reparos simples e importantes', 0.332], ['g - reparos importantes', 0.526],
    ['h - entre reparos importantes e s/ valor', 0.752], ['i - sem valor', 1]
  ];

  /* As listas suspensas da planilha ('Listas Suspensas'), na mesma ordem. */
  var LISTAS = {
    tipologia: ['Apartamento', 'Casa', 'Casa em condomínio', 'Depósito Autônomo', 'Flat', 'Galpão',
      'Laje Corporativa', 'Loja', 'Prédio Coml./Misto', 'Sala Comercial', 'Terreno',
      'Terreno em Condomínio', 'Vaga Autônoma'],
    uso: ['Comercial', 'Residencial', 'Misto', 'Não Residencial'],
    ocupacao: ['Ocupado', 'Desocupado'],
    conselho: ['CREA', 'CAU'],
    uf: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE',
      'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'],
    padraoRegiao: ['Baixo', 'Baixo-médio', 'Médio', 'Médio-alto', 'Alto', '-'],
    ocupacaoPredominante: ['Residencial', 'Comercial', 'Misto', 'Industrial', 'Outros'],
    trafego: ['Reduzido', 'Moderado', 'Intenso'],
    implantacao: ['Condomínio', 'Isolado'],
    topografia: Object.keys(TOPOGRAFIA),
    formato: ['Regular', 'Irregular'],
    multFrentes: ['Meio de quadra', 'Esquina', 'Frente 2 ruas ou +'],
    conservacaoCondominio: ['Bom', 'Regular', 'Ruim', 'em implantação', '-'],
    distancias: ['até 500m', 'de 500m a 1km', 'acima de 1km', 'não se aplica'],
    padrao: PADROES.map(function (p) { return p[0]; }),
    intervalo: INTERVALOS,
    conservacao: CONSERVACAO.map(function (c) { return c[0]; }),
    validacao: ['n/a', 'Sim', 'Não', '-'],
    simNao: ['Sim', 'Não', '-'],
    transacao: ['Oferta', 'Venda'],
    fundamentacao: ['I', 'II', 'III'],
    tabela: ['A', 'B', 'C'],
    vagas: ['Vinculada', 'Autônoma', 'Vinculada + Autônoma'],
    tipoLaudo: ['Simplificado - Vistoria externa', 'Simplificado - Vistoria interna',
      'Simplificado - Vistoria remota', 'Simplificado - Sem vistoria'],
    zoneamento: ['Residencial', 'Comercial', 'Misto', 'Industrial', 'Expansão', 'Rural', 'Urbano'],
    oferta: ['alto', 'médio/alto', 'médio', 'médio/baixo', 'baixo'],
    demanda: ['alto', 'médio/alto', 'médio', 'médio/baixo', 'baixo'],
    absorcao: ['rápida', 'normal/rápida', 'normal', 'normal/difícil', 'difícil'],
    desempenho: ['aquecido', 'normal/aquecido', 'normal', 'normal/recessivo', 'recessivo'],
    /* Divisão interna por ambiente: acabamentos usuais de vistoria (piso,
       parede, teto/forro; esquadrias: portas e janelas). "Não vistoriado"
       serve à vistoria remota; "Sem revestimento", ao imóvel em obra. */
    revPiso: ['Carpete', 'Cerâmica', 'Cimentado', 'Cimento queimado', 'Epóxi / resina', 'Granito',
      'Ladrilho hidráulico', 'Laminado', 'Madeira (assoalho / taco)', 'Mármore', 'Pedra natural',
      'Porcelanato', 'Vinílico', 'Sem revestimento', 'Não vistoriado'],
    revParede: ['Azulejo', 'Cerâmica', 'Gesso liso', 'Granito', 'Lambri de madeira', 'Mármore',
      'Papel de parede', 'Pastilha', 'Pedra decorativa', 'Pintura acrílica', 'Pintura látex (PVA)',
      'Porcelanato', 'Textura', 'Tijolo aparente', 'Sem revestimento (reboco)', 'Não vistoriado'],
    revTeto: ['Concreto aparente', 'Forro de gesso', 'Forro de gesso com sanca', 'Forro de madeira',
      'Forro de PVC', 'Forro drywall', 'Forro mineral', 'Laje com pintura', 'Laje com textura',
      'Sem revestimento', 'Não vistoriado'],
    portas: ['Aço', 'Alumínio', 'Madeira maciça', 'Madeira semioca', 'Madeira com vidro', 'PVC',
      'Vidro temperado', 'Sem porta', 'Não vistoriado'],
    janelas: ['Aço', 'Alumínio', 'Alumínio com persiana', 'Madeira', 'Pele de vidro', 'PVC',
      'Vidro temperado', 'Sem janela', 'Não vistoriado'],
    /* sugestões para o nome do ambiente (o campo continua livre) */
    ambientes: ['Área de serviço', 'Banheiro', 'Circulação', 'Closet', 'Copa', 'Cozinha', 'Depósito',
      'Despensa', 'Dormitório', 'Escritório', 'Estar íntimo', 'Gabinete', 'Hall', 'Home theater',
      'Lavabo', 'Lavanderia', 'Quarto de empregada', 'Sala de estar', 'Sala de jantar', 'Suíte',
      'Varanda', 'Varanda gourmet']
  };
  /* As listas suspensas saem sem o "-" e em ordem alfabética (pedido do
     avaliador), comparando como se lê em português: sem distinguir maiúscula
     nem acento, e números pela grandeza. Ficam de fora as escalas do mercado
     da Liquidação forçada, que não são listas: são a régua de alto a baixo. */
  var ESCALAS = { oferta: 1, demanda: 1, absorcao: 1, desempenho: 1 };
  var ordem = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
  Object.keys(LISTAS).forEach(function (k) {
    if (ESCALAS[k]) return;
    LISTAS[k] = LISTAS[k].filter(function (x) { return x !== '-'; }).slice().sort(ordem.compare);
  });

  /* As três tabelas de homogeneização do Cálculo_apoio. Peso 't' multiplica
     o desvio do fator pela cota-parte do terreno; 'c', pela da construção.
     calc: o motor calcula o fator; sem calc, o fator é do Quadro Auxiliar
     (digitado pelo avaliador) e, vazio, não ajusta nada. */
  var FATORES = {
    area:         { rot: 'Fator Área', calc: true },
    localizacao:  { rot: 'Fator Localização', calc: true },
    testada:      { rot: 'Fator Testada' },
    profundidade: { rot: 'Fator Profundidade' },
    topografia:   { rot: 'Fator Topografia', calc: true },
    multFrentes:  { rot: 'Fator Frentes Múltiplas' },
    padrao:       { rot: 'Fator Padrão', calc: true },
    idade:        { rot: 'Fator Idade / Conserv.', calc: true },
    vaga:         { rot: 'Fator Vaga de Garagem' },
    andar:        { rot: 'Fator Andar', calc: true },
    auvg:         { rot: 'Fator Au/Vg', calc: true },
    extra1:       { rot: 'Fator Extra 1' },
    extra2:       { rot: 'Fator Extra 2' },
    extra:        { rot: 'Fator Extra' }
  };
  var TABELAS = {
    A: { nome: 'Terrenos', uso: 'terreno, terreno em condomínio',
         colunas: [['area'], ['localizacao'], ['testada'], ['profundidade'], ['topografia'],
                   ['multFrentes'], ['extra1'], ['extra2']] },
    B: { nome: 'Unidades padronizadas', uso: 'apartamentos, salas comerciais',
         colunas: [['area'], ['localizacao', 't'], ['padrao', 'c'], ['idade', 'c'], ['vaga'],
                   ['andar'], ['extra1'], ['extra2']] },
    C: { nome: 'Unidades isoladas', uso: 'casas, casas em condomínio, lojas',
         colunas: [['area'], ['localizacao', 't'], ['padrao', 'c'], ['idade', 'c'], ['multFrentes'],
                   ['andar'], ['auvg'], ['extra']] }
  };

  var N_AMOSTRA = 5;

  /* Sugestões: o que vale enquanto o avaliador não informa. */
  var USUAIS = {
    ofertaOferta: 0.9,          // oferta anunciada: margem usual de negociação de 10%
    ofertaVenda: 1,             // transação efetiva: fator unitário
    cotaTerreno: 0.3,
    expoenteAuVg: 0.089,
    fam: 1,
    tabela: 'C'
  };

  /* ------------------------------------------------------------ utilidades */
  function num(v) {
    if (v === null || v === undefined || v === '' || v === '-') return null;
    var x = +v;
    return isFinite(x) ? x : null;
  }
  function vazio(v) { return v === null || v === undefined || v === ''; }
  function media(xs) { return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length; }
  /* STDEV do Excel: desvio-padrão amostral (n − 1) */
  function desvio(xs) {
    if (xs.length < 2) return null;
    var m = media(xs);
    return Math.sqrt(xs.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (xs.length - 1));
  }
  /* ROUNDUP(x; −3): afasta do zero até o milhar. O Excel guarda 15 dígitos,
     e a mesma poda aqui evita que 6.862.000,0000001 suba para 6.863.000. */
  function arredondarMilharAcima(x) {
    if (x === null || !isFinite(x)) return null;
    var q = +(Math.abs(x) / 1000).toPrecision(15);
    return (x < 0 ? -1 : 1) * Math.ceil(q) * 1000;
  }

  /* t de Student bicaudal (T.INV.2T): pela beta incompleta regularizada. */
  function lnGama(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5, ser = 1.000000000190015;
    tmp -= (x + 0.5) * Math.log(tmp);
    for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betaFC(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-16) break;
    }
    return h;
  }
  function betaInc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lnGama(a + b) - lnGama(a) - lnGama(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betaFC(a, b, x) / a : 1 - bt * betaFC(b, a, 1 - x) / b;
  }
  /* probabilidade bicaudal P(|T| > t) com gl graus de liberdade */
  function caudaT(t, gl) { return betaInc(gl / 2, 0.5, gl / (gl + t * t)); }
  function tInv2T(p, gl) {
    if (!(gl >= 1) || !(p > 0 && p < 1)) return null;
    var lo = 0, hi = 1;
    while (caudaT(hi, gl) > p) hi *= 2;
    for (var i = 0; i < 200; i++) {
      var meio = (lo + hi) / 2;
      if (caudaT(meio, gl) > p) lo = meio; else hi = meio;
      if (hi - lo < 1e-15 * hi) break;
    }
    return (lo + hi) / 2;
  }

  /* ------------------------------------------- atributos de cada imóvel */
  function padraoDe(nome) {
    for (var i = 0; i < PADROES.length; i++) if (PADROES[i][0] === nome) return PADROES[i];
    return null;
  }
  /* Pc: HLOOKUP(intervalo; P4:T39; linha do padrão) */
  function pcDe(padrao, intervalo) {
    var p = padraoDe(padrao), j = INTERVALOS.indexOf(intervalo);
    return p && j >= 0 ? p[1][j] : null;
  }
  function depreciacao(conservacao) {
    var s = String(conservacao || '').toLowerCase();
    for (var i = 0; i < CONSERVACAO.length; i++) if (CONSERVACAO[i][0] === s) return CONSERVACAO[i][1];
    return null;
  }
  /* Foc de Ross-Heidecke = R + (1 − C)·(1 − ½(x + x²))·(1 − R), x = idade / vida útil */
  function focDe(padrao, idade, conservacao) {
    var p = padraoDe(padrao), c = depreciacao(conservacao), i = num(idade);
    if (!p || c === null || i === null || !p[2]) return null;
    var x = i / p[2], R = p[3];
    return R + (1 - c) * (1 - 0.5 * (x + x * x)) * (1 - R);
  }
  /* INDEX(C256:D280; MIN(andar; 24) + 1; residencial ou comercial) */
  function coefAndar(andar, residencial) {
    var a = num(andar);
    if (a === null || a < 0) return null;
    var i = Math.min(Math.floor(a), 24);
    return (residencial ? ANDAR_RES : ANDAR_COM)[i];
  }
  function atributos(x, residencial, area, vagas) {
    var pad = padraoDe(x.padrao), idade = num(x.idade);
    var a = num(area), v = num(vagas);
    return {
      pc: pcDe(x.padrao, x.intervalo),
      vidaUtil: pad ? pad[2] : null,
      residual: pad ? pad[3] : null,
      pctVida: pad && idade !== null ? idade / pad[2] : null,
      foc: focDe(x.padrao, x.idade, x.conservacao),
      topo: Object.prototype.hasOwnProperty.call(TOPOGRAFIA, x.topografia) ? TOPOGRAFIA[x.topografia] : null,
      coefAndar: coefAndar(x.andar, residencial),
      auvg: a !== null && v ? a / v : null
    };
  }
  function razao(a, b) { return a !== null && b !== null && b !== 0 ? a / b : null; }

  /* ================================================================ calcular */
  function calcular(P) {
    var capa = P.capa || {}, im = P.imovel || {}, par = P.paradigma || {};
    var calc = P.calculo || {}, areas = capa.areas || {};
    var aT = areas.terreno || {}, aP = areas.privativa || {}, aC = areas.comum || {};

    /* ---------------------------------------------------------- a capa */
    /* Construção total = privativa + comum, nas quatro fontes (T40, Y40, AD40
       e, a pedido do avaliador, também na estimada e na doc. complementar,
       que a planilha deixava fora: lá a comum estimada copiava a da matrícula) */
    var soma = function (a, b) { return a === null && b === null ? null : (a || 0) + (b || 0); };
    var construcao = {};
    ['matricula', 'iptu', 'estimada', 'doc'].forEach(function (k) { construcao[k] = soma(num(aP[k]), num(aC[k])); });
    /* 'Região + Imóvel'!AL68 e AL71: só com resposta "Sim" */
    function divergencia(resp, mat, iptu, est) {
      if (resp !== 'Sim' || est === null || !est) return null;
      return iptu !== null && mat !== null && iptu > mat ? iptu / est - 1 : (mat !== null ? mat / est - 1 : null);
    }
    var divTerreno = divergencia((im.divTerreno || {}).resposta, num(aT.matricula), num(aT.iptu), num(aT.estimada));
    var divConstruida = divergencia((im.divConstruida || {}).resposta, num(aP.matricula), num(aP.iptu), num(aP.estimada));

    /* ------------------------------------------ o paradigma (Fichas F11:AN16) */
    var paradigma = {
      endereco: [capa.logradouro, capa.numero, capa.complemento, capa.bairro, capa.cidade, capa.uf]
        .some(function (v) { return !vazio(v); })
        ? String(capa.logradouro || '') + ', ' + (vazio(capa.numero) ? '' : capa.numero) + ' - ' +
          String(capa.complemento || '') + ' - ' + String(capa.bairro || '') + ' - ' +
          String(capa.cidade || '') + ' - ' + String(capa.uf || '') + '- ' + String(capa.empreendimento || '')
        : '',
      areaTerreno: num(aT.estimada),                                 // F12 = Capa!I47 = AD39
      areaPrivativa: num(aP.estimada),                               // S12 = Capa!AD42
      idade: num(im.idade), vagas: num(im.vagas),                    // AE12, AN12
      padrao: im.padrao || '', intervalo: im.intervalo || '', conservacao: im.conservacao || '',
      topografia: im.topografia || '', multFrentes: im.multFrentes || '',
      indiceLocal: num(par.indiceLocal), andar: num(par.andar)
    };
    /* AY15: residencial se o padrão for de apartamento */
    var resAv = /apartamento/i.test(paradigma.padrao);
    var atP = atributos({ padrao: paradigma.padrao, intervalo: paradigma.intervalo, idade: paradigma.idade,
      conservacao: paradigma.conservacao, topografia: paradigma.topografia, andar: paradigma.andar },
      resAv, paradigma.areaPrivativa, paradigma.vagas);
    Object.keys(atP).forEach(function (k) { paradigma[k] = atP[k]; });

    /* ---------------------------------------------- a amostra (Fichas) */
    var amostra = [];
    for (var i = 0; i < N_AMOSTRA; i++) {
      var x = (P.amostra || [])[i] || {};
      /* AY25: residencial se o tipo do comparativo for "Apartamento" */
      var at = atributos(x, x.tipo === 'Apartamento', num(x.areaConstruida), num(x.vagas));
      amostra.push(at);
    }

    /* ------------------------------------ a tabela de homogeneização */
    var letra = TABELAS[calc.tabela] ? calc.tabela : USUAIS.tabela;
    var T = TABELAS[letra];
    var cotaTerreno = num(calc.cotaTerreno);
    if (cotaTerreno === null) cotaTerreno = USUAIS.cotaTerreno;
    var cotaConstrucao = num(calc.cotaConstrucao);
    if (cotaConstrucao === null) cotaConstrucao = 1 - cotaTerreno;
    var expoente = num(calc.expoenteAuVg);
    if (expoente === null) expoente = USUAIS.expoenteAuVg;
    var fam = num(calc.fam);
    if (fam === null || fam === 0) fam = USUAIS.fam;

    /* J34 / J57 / J80: a área do avaliando que entra no fator área */
    var areaAvaliando = letra === 'A' ? paradigma.areaTerreno : paradigma.areaPrivativa;
    var fatoresP = calc.fatores || {};
    var colunas = T.colunas.map(function (c) {
      var f = fatoresP[c[0]] || {};
      return { chave: c[0], rot: FATORES[c[0]].rot, peso: c[1] || null, calc: !!FATORES[c[0]].calc,
               usar: f.usar !== false };
    });

    /* o fator que o motor calcula para o comparativo i */
    function fatorCalculado(chave, i, x, area) {
      var a = amostra[i];
      switch (chave) {
        case 'area': {                                               // P74
          var r = razao(area, areaAvaliando);
          if (r === null || r <= 0) return null;
          return r >= 0.7 && r <= 1.3 ? Math.pow(r, 0.25) : Math.pow(r, 0.125);
        }
        case 'localizacao': return razao(paradigma.indiceLocal, num(x.indiceLocal));   // R74
        case 'topografia': return razao(paradigma.topo, a.topo);                       // Z28
        case 'padrao': return razao(paradigma.pc, a.pc);                               // U74
        case 'idade': return razao(paradigma.foc, a.foc);                              // W74
        case 'andar': return razao(paradigma.coefAndar, a.coefAndar);                  // I98
        case 'auvg': {                                                                 // W98
          var b = razao(a.auvg, paradigma.auvg);
          return b === null || b <= 0 ? null : Math.pow(b, expoente);
        }
      }
      return null;
    }

    var linhas = [];
    for (var k = 0; k < N_AMOSTRA; k++) {
      var y = (P.amostra || [])[k] || {};
      var valor = num(y.valor);
      var area = num(letra === 'A' ? y.areaTerreno : y.areaConstruida);   // J74
      var ofertaInf = num((calc.oferta || [])[k]);
      var oferta = ofertaInf !== null ? ofertaInf
        : (y.transacao === 'Venda' ? USUAIS.ofertaVenda : USUAIS.ofertaOferta);
      var unitario = valor !== null && area ? valor * oferta / area : null;   // L74
      var fatores = {}, sugeridos = {}, desvios = 0;
      colunas.forEach(function (c) {
        var manual = num(((fatoresP[c.chave] || {}).valores || [])[k]);
        var sug = c.calc ? fatorCalculado(c.chave, k, y, area) : null;
        sugeridos[c.chave] = sug;
        var f = !c.usar ? null : (manual !== null ? manual : sug);
        fatores[c.chave] = f;
        if (f === null) return;
        var w = c.peso === 't' ? cotaTerreno : c.peso === 'c' ? cotaConstrucao : 1;
        desvios += (f - 1) * w;                                       // AJ74
      });
      var valida = unitario !== null && unitario !== 0;
      var resultante = valida ? 1 + desvios : null;
      linhas.push({ ec: k + 1, valor: valor, oferta: oferta, ofertaSugerida: ofertaInf === null,
                    area: area, unit: unitario, fatores: fatores, sugeridos: sugeridos,
                    resultante: resultante, homog: valida ? unitario * resultante : null });
    }

    /* ------------------------------------------------------ estatística */
    var us = linhas.filter(function (l) { return l.homog !== null; });
    var unit = us.map(function (l) { return l.unit; }), hom = us.map(function (l) { return l.homog; });
    var n = us.length;
    var est = { n: n };
    est.media = n ? media(unit) : null;                               // L24
    est.desvio = desvio(unit);                                        // L25
    est.cv = est.media && est.desvio !== null ? est.desvio / est.media : null;
    est.mediaH = n ? media(hom) : null;                               // AM24
    est.desvioH = desvio(hom);                                        // AM25
    est.cvH = est.mediaH && est.desvioH !== null ? est.desvioH / est.mediaH : null;
    est.gl = n ? n - 1 : null;                                        // AE29
    est.t = est.gl ? tInv2T(0.2, est.gl) : null;                      // AE30: 80% de confiança
    est.semi = est.t !== null && est.desvioH !== null ? est.t * est.desvioH / Math.sqrt(n) : null;  // AG31
    est.amplitude = est.semi !== null && est.mediaH ? 2 * est.semi / est.mediaH : null;           // AE31
    /* Z11: grau de precisão pela amplitude do intervalo de confiança */
    est.precisao = est.amplitude === null ? null
      : est.amplitude <= 0.3 ? 'III' : est.amplitude <= 0.4 ? 'II' : 'I';
    est.areaAvaliando = areaAvaliando;
    est.validacao = areaAvaliando === null ? null
      : { metade: areaAvaliando * 0.5, area: areaAvaliando, dobro: areaAvaliando * 2 };
    est.limites = est.mediaH === null ? null
      : { inferior: est.mediaH * 0.7, media: est.mediaH, superior: est.mediaH * 1.3 };
    var comArea = areaAvaliando !== null && est.mediaH !== null;
    est.minimo = comArea && est.semi !== null ? (est.mediaH - est.semi) * areaAvaliando : null;   // AM29
    est.medio = comArea ? est.mediaH * areaAvaliando : null;                                        // AM30
    est.maximo = comArea && est.semi !== null ? (est.mediaH + est.semi) * areaAvaliando : null;   // AM31

    /* -------------------------------------------------- valor do imóvel */
    var terreno = 0;                                                  // D58 (só no evolutivo)
    var benfeitoria = est.medio === null ? null : est.medio - terreno; // D61
    var mercado = benfeitoria === null ? null : (terreno + benfeitoria) * fam;   // C67
    var privMat = num(aP.matricula);                                  // Capa!I48 = T42
    var valor = {
      terreno: terreno, benfeitoria: benfeitoria, fam: fam, mercado: mercado,
      mercadoArredondado: arredondarMilharAcima(mercado),             // Capa!C55
      m2Terreno: terreno && paradigma.areaTerreno ? terreno / paradigma.areaTerreno : null,  // Capa!V47
      m2Privativa: benfeitoria !== null && privMat ? benfeitoria / privMat : null            // Capa!V48
    };

    /* ------------------------------------------------ liquidação forçada */
    var L = P.liquidacao || {};
    var liq = { vm: mercado };                                        // F25
    liq.prazo = num(L.prazo);                                         // F26
    liq.dias = liq.prazo === null ? null : liq.prazo / 12 * 365;      // M26
    liq.taxa = num(L.taxa);                                           // F27
    liq.ipca = num(L.ipca);                                           // F28
    liq.ir = liq.dias === null ? null                                 // F29: tabela regressiva
      : liq.dias <= 180 ? 0.225 : liq.dias <= 360 ? 0.2 : liq.dias <= 720 ? 0.175 : 0.15;
    liq.taxaLiquida = liq.taxa === null || liq.ir === null ? null : liq.taxa * (1 - liq.ir);    // F30
    liq.taxaReal = liq.taxaLiquida === null || liq.ipca === null ? null
      : (1 + liq.taxaLiquida) / (1 + liq.ipca) - 1;                   // F31
    liq.taxaMensal = liq.taxaLiquida === null ? null : Math.pow(1 + liq.taxaLiquida, 1 / 12) - 1;  // F32
    liq.iptuAno = num(L.iptuAno) || 0;                                // F33
    liq.condominioMes = num(L.condominioMes) || 0;                    // F34
    liq.fvp = liq.taxaMensal === null || liq.prazo === null ? null
      : liq.taxaMensal === 0 ? liq.prazo
      : (1 - Math.pow(1 + liq.taxaMensal, -liq.prazo)) / liq.taxaMensal;                         // F35
    var pronto = liq.vm !== null && liq.taxaReal !== null && liq.fvp !== null;
    function deducoes(vm) {
      var anos = liq.prazo / 12;
      var a = vm * (1 - 1 / Math.pow(1 + liq.taxaReal, anos));                          // F38
      var b = vm / Math.pow(1 + liq.taxaReal, anos) * (1 - 1 / Math.pow(1 + liq.ipca, anos)); // F39
      var c = liq.iptuAno / 12 * liq.fvp;                                              // F40
      var d = liq.condominioMes * liq.fvp;                                             // F41
      return { a: a, b: b, c: c, d: d, total: a + b + c + d };
    }
    if (pronto) {
      var D = deducoes(liq.vm);
      liq.custoOportunidade = D.a; liq.perdaInflacao = D.b; liq.iptu = D.c; liq.condominio = D.d;
      liq.deducoes = D.total;                                         // F42
      liq.vlf = liq.vm - D.total;                                     // C46
      liq.vlfArredondado = arredondarMilharAcima(liq.vlf);            // Capa!C58
      liq.desagio = liq.vm ? D.total / liq.vm : null;                 // E47
      /* a ponte do gráfico: G26:I31 */
      liq.ponte = [
        { rot: 'Valor de mercado', base: 0, valor: liq.vm, tipo: 'total' },
        { rot: '(a) Custo de oportunidade', base: liq.vm - D.a, valor: D.a, tipo: 'deducao' },
        { rot: '(b) Perda inflacionária', base: liq.vm - D.a - D.b, valor: D.b, tipo: 'deducao' },
        { rot: '(c) IPTU', base: liq.vm - D.a - D.b - D.c, valor: D.c, tipo: 'deducao' },
        { rot: '(d) Condomínio', base: liq.vm - D.total, valor: D.d, tipo: 'deducao' },
        { rot: 'Liquidação forçada', base: 0, valor: liq.vlf, tipo: 'final' }];
      /* sensibilidade: D61:E67 e H61:M67 */
      liq.porDesagio = [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03].map(function (d) {
        var g = liq.desagio + d;
        return { desagio: g, vlf: liq.vm * (1 - g), atual: d === 0 };
      });
      /* J61:M67 — a mesma conta do VLF acima, aplicada a cada VM: a perda
         inflacionária incide sobre o VM já descontado (F39). A planilha de
         origem a tirava do VM cheio, e a linha 0% não batia com o VLF da
         página (R$ 6.761.777 × R$ 6.861.974 no laudo 33.794); corrigido a
         pedido do avaliador. */
      liq.porVariacao = [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15].map(function (v) {
        var vm = liq.vm * (1 + v), vlf = vm - deducoes(vm).total;
        return { variacao: v, vm: vm, vlf: vlf, razao: vlf / vm, desconto: vm - vlf,
                 desagio: (vm - vlf) / vm, atual: v === 0 };
      });
    }

    /* ----------------------------------------------------------- gráfico */
    var pontos = linhas.map(function (l) { return { ec: l.ec, x: l.unit, y: l.homog }; });
    var maxX = Math.max.apply(null, [0].concat(linhas.map(function (l) { return l.unit || 0; })));
    var grafico = { pontos: pontos, bissetriz: maxX * 1.2 };          // N48 = MAX(D44:K48)·1,2

    return {
      paradigma: paradigma, amostra: amostra,
      tabela: { letra: letra, nome: T.nome, colunas: colunas, linhas: linhas,
                cotaTerreno: cotaTerreno, cotaConstrucao: cotaConstrucao, expoenteAuVg: expoente },
      est: est, valor: valor,
      capa: { construcao: construcao,
              divTerreno: divTerreno, divConstruida: divConstruida },
      liquidacao: liq, grafico: grafico
    };
  }

  root.Motor = {
    calcular: calcular, PADROES: PADROES, INTERVALOS: INTERVALOS, TOPOGRAFIA: TOPOGRAFIA,
    CONSERVACAO: CONSERVACAO, LISTAS: LISTAS, FATORES: FATORES, TABELAS: TABELAS,
    N_AMOSTRA: N_AMOSTRA, USUAIS: USUAIS, tInv2T: tInv2T, focDe: focDe, pcDe: pcDe,
    coefAndar: coefAndar, arredondarMilharAcima: arredondarMilharAcima
  };
})(typeof window !== 'undefined' ? window : globalThis);
