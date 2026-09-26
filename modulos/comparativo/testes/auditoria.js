/* ============================================================================
   AUDITORIA DO MOTOR — COMPARATIVO DIRETO
   1 · aderência à planilha de origem (laudo Mat. 33.794, tabela C), célula a
       célula, contra os valores que o Excel gravou no arquivo;
   2 · as tabelas A (terrenos) e B (unidades padronizadas), contra a mesma
       planilha recalculada com a tabela trocada;
   3 · coerência interna e bordas (amostra incompleta, fatores desligados,
       sugestões, arredondamento, t de Student).
   Roda com:  node testes/auditoria.js
   ========================================================================== */
require('../motor.js');
var Motor = globalThis.Motor;

var ok = 0, falhas = [], bloco = '';
function B(t) { bloco = t; console.log('\n\x1b[1m' + t + '\x1b[0m'); }
function conferir(nome, valor, esperado, tol) {
  var passou, detalhe;
  tol = tol || { rel: 1e-9 };
  if (typeof esperado !== 'number' || esperado === null) {
    passou = valor === esperado; detalhe = String(valor) + (passou ? '' : '  esperado ' + String(esperado));
  } else if (typeof valor !== 'number' || !isFinite(valor)) {
    passou = false; detalhe = String(valor) + '  esperado ' + fmt(esperado);
  } else {
    var dif = Math.abs(valor - esperado);
    var rel = esperado !== 0 ? dif / Math.abs(esperado) : dif;
    passou = tol.abs !== undefined ? dif <= tol.abs : rel <= tol.rel;
    detalhe = fmt(valor) + (passou ? '' : '  esperado ' + fmt(esperado) + '  (dif ' + rel.toExponential(2) + ')');
  }
  if (passou) ok++; else falhas.push(bloco + ' → ' + nome + ': ' + detalhe);
  console.log('  ' + (passou ? '\x1b[32mOK  \x1b[0m' : '\x1b[31mFALHA\x1b[0m') + ' ' + nome.padEnd(52) + detalhe);
}
function fmt(v) {
  if (typeof v !== 'number') return String(v);
  return v.toLocaleString('pt-BR', { maximumFractionDigits: Math.abs(v) >= 1000 ? 2 : 6 });
}
function clonar(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------------------------------------------- o laudo de referência
   Independente de premissasVazias() do app.js, de propósito: mudar a tela
   não pode quebrar a aderência à planilha. */
function amostra(o) {
  return Object.assign({ tipo: 'Apartamento', topografia: 'Plano', multFrentes: 'Esquina',
    padrao: 'Apartamento - Padrão Luxo', transacao: 'Oferta' }, o);
}
function REF() {
  return {
    capa: {
      logradouro: ' Rua Tibúrcio Cavalcante', numero: 500, complemento: '     Apto 1600', bairro: 'Meireles',
      cidade: 'Fortaleza', uf: 'CE', empreendimento: 'Edifício Mansão Macedo Condominium',
      areas: { terreno: { matricula: 6025.8, iptu: 6025.8, estimada: 6025.8 },
               privativa: { matricula: 883.32, iptu: 883.32, estimada: 883.32 },
               comum: { matricula: 412.97, iptu: 412.97, estimada: 412.97 } }
    },
    imovel: { topografia: 'Plano', multFrentes: 'Esquina', vagas: 12, padrao: 'Apartamento - Padrão Luxo',
              idade: 17, intervalo: 'Médio/Máximo', conservacao: 'c - regular',
              divTerreno: { resposta: '-' }, divConstruida: { resposta: '-' } },
    paradigma: { indiceLocal: 1796.02, andar: 16 },
    amostra: [
      amostra({ valor: 7000000, transacao: 'Venda', areaTerreno: 6025.8, areaConstruida: 883.32, idade: 17,
                andar: 19, indiceLocal: 1796.02, vagas: 12, intervalo: 'Médio/Máximo', conservacao: 'c - regular' }),
      amostra({ valor: 9500000, areaTerreno: 6025.8, areaConstruida: 883.32, idade: 17, andar: 15,
                indiceLocal: 1796.02, vagas: 12, intervalo: 'Médio/Máximo', conservacao: 'c - regular' }),
      amostra({ valor: 13800000, areaConstruida: 819, idade: 2, andar: 12, indiceLocal: 2514.68, vagas: 10,
                intervalo: 'Máximo', conservacao: 'a - novo' }),
      amostra({ valor: 10500000, areaConstruida: 604, idade: 2, andar: 21, indiceLocal: 6588.35, vagas: 8,
                intervalo: 'Médio', conservacao: 'a - novo' }),
      amostra({ valor: 5200000, areaConstruida: 475, idade: 25, andar: 16, indiceLocal: 1796.02, vagas: 5,
                intervalo: 'Médio', conservacao: 'c - regular' })
    ],
    calculo: { tabela: 'C', cotaTerreno: 0.36, cotaConstrucao: 0.64, oferta: [1, 0.95, 0.95, 0.95, 0.95],
               expoenteAuVg: 0.08904457092285156,
               fatores: { multFrentes: { usar: false }, extra: { usar: false } } },
    liquidacao: { prazo: 24, taxa: 0.1416, ipca: 0.0464, iptuAno: 51455.85, condominioMes: 12000 }
  };
}

/* ======================================================================== */
B('1a · FICHAS — Pc, Foc (Ross-Heidecke) e andar');
var R = Motor.calcular(REF());
conferir('Pc do avaliando (N16)', R.paradigma.pc, 9.117);
conferir('vida útil / residual (U16, AC16)', R.paradigma.vidaUtil * 100 + R.paradigma.residual, 50 * 100 + 0.2);
conferir('% de vida (AI16)', R.paradigma.pctVida, 0.34);
conferir('Foc do avaliando (AN16)', R.paradigma.foc, 0.802192448);
conferir('coeficiente de andar do avaliando (AY15)', R.paradigma.coefAndar, 116);
[[9.117, 0.802192448], [9.117, 0.802192448], [9.551, 0.98336], [8.683, 0.98336], [8.683, 0.6874]]
  .forEach(function (e, i) {
    conferir('EC' + (i + 1) + ' Pc', R.amostra[i].pc, e[0]);
    conferir('EC' + (i + 1) + ' Foc', R.amostra[i].foc, e[1]);
  });

B('1b · TABELA DE HOMOGENEIZAÇÃO C — linha a linha (Cálculo_apoio!L74:AM78)');
var ESPERADO_C = [
  [7924.647919213874, 1, 1, 1, 1, 0.9872340425531915, 1, 0.9872340425531915, 7823.48220109625],
  [10217.13535298646, 1, 1, 1, 1, 1.0043290043290043, 1, 1.0043290043290043, 10261.36537615956],
  [16007.326007326008, 0.981276638241626, 0.7142141346016193, 0.9545597319652394, 0.8157668076797917,
   1.0175438596491229, 1.0095479615553826, 0.7584945332755344, 12141.469268916064],
  [16514.900662251657, 0.9535969631994334, 0.27260543231613377, 1.0499827248646783, 0.8157668076797917,
   0.9789029535864979, 1.002259987428639, 0.5869775606768394, 9693.876105548798],
  [10400, 0.9253839083882192, 1, 1.0499827248646783, 1.1669951236543497, 1, 1.0229748625258064,
   1.0872245939662033, 11307.135777248513]];
var COLS_C = ['area', 'localizacao', 'padrao', 'idade', 'andar', 'auvg'];
ESPERADO_C.forEach(function (e, i) {
  var l = R.tabela.linhas[i], ec = 'EC' + (i + 1) + ' ';
  conferir(ec + 'unitário deduzida a oferta', l.unit, e[0]);
  COLS_C.forEach(function (c, j) { conferir(ec + Motor.FATORES[c].rot, l.fatores[c], e[j + 1], { rel: 1e-12 }); });
  conferir(ec + 'mult. frentes desligado', l.fatores.multFrentes, null);
  conferir(ec + 'fator resultante', l.resultante, e[7]);
  conferir(ec + 'unitário homogeneizado', l.homog, e[8]);
});

B('1c · ESTATÍSTICA E INTERVALO DE CONFIANÇA (Cálculo)');
conferir('média observada (L24)', R.est.media, 12212.8019883556);
conferir('desvio observado (L25)', R.est.desvio, 3826.3450974686616);
conferir('CV observado (L26)', R.est.cv, 0.3133060784181159);
conferir('média homogeneizada (AM24)', R.est.mediaH, 10245.465745793837);
conferir('desvio homogeneizado (AM25)', R.est.desvioH, 1650.1879313913087);
conferir('CV homogeneizado (AM26)', R.est.cvH, 0.16106519433426197);
conferir('graus de liberdade (AE29)', R.est.gl, 4);
conferir('t de Student 80% (AE30)', R.est.t, 1.5332062740589443, { rel: 1e-12 });
conferir('semi-amplitude (AG31)', R.est.semi, 1131.4854983140792);
conferir('amplitude do IC (AE31)', R.est.amplitude, 0.22087536601810379);
conferir('grau de precisão (Z11)', R.est.precisao, 'III');
conferir('0,5 × área (J29)', R.est.validacao.metade, 441.66);
conferir('2 × área (J31)', R.est.validacao.dobro, 1766.64);
conferir('0,7 × média (R29)', R.est.limites.inferior, 7171.826022055686);
conferir('1,3 × média (R31)', R.est.limites.superior, 13319.105469531989);
conferir('valor mínimo (AM29)', R.est.minimo, 8050561.0322038205);
conferir('valor médio (AM30)', R.est.medio, 9050024.802574612);
conferir('valor máximo (AM31)', R.est.maximo, 10049488.572945405);
conferir('valor de mercado (C67)', R.valor.mercado, 9050024.802574612);

B('1d · CAPA');
conferir('construção total — matrícula (T40)', R.capa.construcao.matricula, 1296.29);
conferir('R$/m² privativo (V48)', R.valor.m2Privativa, 10245.465745793837);
conferir('valor de mercado arredondado (C55)', R.valor.mercadoArredondado, 9051000);
conferir('liquidação forçada arredondada (C58)', R.liquidacao.vlfArredondado, 6862000);
conferir('construção total — estimada = privativa + comum', R.capa.construcao.estimada, 1296.29, { rel: 1e-12 });
conferir('construção total — doc. complementar vazia fica vazia', R.capa.construcao.doc, null);
var PDoc = REF(); PDoc.capa.areas.privativa.doc = 880; PDoc.capa.areas.comum.doc = 410;
conferir('construção total — doc. complementar soma', Motor.calcular(PDoc).capa.construcao.doc, 1290);
conferir('divergência de terreno: áreas iguais → Não', R.capa.divTerreno.resposta, 'Não');
conferir('divergência de terreno: áreas iguais → 0%', R.capa.divTerreno.pct, 0);

B('1e · LIQUIDAÇÃO FORÇADA');
var L = R.liquidacao;
conferir('dias até a venda (M26)', L.dias, 730);
conferir('IR regressivo (F29)', L.ir, 0.15);
conferir('taxa líquida de IR (F30)', L.taxaLiquida, 0.12036);
conferir('taxa real (F31)', L.taxaReal, 0.07068042813455655);
conferir('taxa mensal (F32)', L.taxaMensal, 0.0095158288302295);
conferir('fator de valor presente (F35)', L.fvp, 21.36633191613707);
conferir('(a) custo de oportunidade (F38)', L.custoOportunidade, 1155426.4142039535);
conferir('(b) perda inflacionária (F39)', L.perdaInflacao, 684609.7616714275);
conferir('(c) IPTU (F40)', L.iptu, 91618.56417724681);
conferir('(d) condomínio (F41)', L.condominio, 256395.98299364484);
conferir('total das deduções (F42)', L.deducoes, 2188050.7230462725);
conferir('valor de liquidação forçada (C46)', L.vlf, 6861974.079528339);
conferir('deságio (E47)', L.desagio, 0.2417728979509317);
conferir('ponte: base de (a) (H27)', L.ponte[1].base, 7894598.388370659);
conferir('ponte: base de (d) (H30)', L.ponte[4].base, 6861974.07952834);
conferir('sensibilidade −3 p.p. (E61)', L.porDesagio[0].vlf, 7133474.823605578);
conferir('sensibilidade +3 p.p. (E67)', L.porDesagio[6].vlf, 6590473.335451101);
/* sensibilidade por VM: a mesma conta do VLF (corrigida em relação à planilha,
   que tirava a perda inflacionária do VM cheio e dava R$ 6.761.777 a 0%) */
conferir('VM atual → VLF = VLF da página (J64 = C46)', L.porVariacao[3].vlf, 6861974.079528339);
var kVP = 1 / Math.pow(1 + L.taxaReal, 2) / Math.pow(1 + L.ipca, 2);   // 24 meses
conferir('VM −15% → VLF (J61)', L.porVariacao[0].vlf, 0.85 * L.vm * kVP - L.iptu - L.condominio);
conferir('VM +15% → VLF (J67)', L.porVariacao[6].vlf, 1.15 * L.vm * kVP - L.iptu - L.condominio);
conferir('VLF/VM a −15% (K61)', L.porVariacao[0].razao, (0.85 * L.vm * kVP - L.iptu - L.condominio) / (0.85 * L.vm));
conferir('deságio a 0% = deságio da página (M64 = E47)', L.porVariacao[3].desagio, 0.2417728979509317);

B('1f · GRÁFICO');
conferir('extremo da bissetriz (N48)', R.grafico.bissetriz, 19817.88079470199);

/* ======================================================================== */
B('2a · TABELA A — terrenos (planilha recalculada com I22 = "A")');
var PA = REF();
PA.calculo = { tabela: 'A', oferta: [1, 0.9, 0.9, 0.95, 0.9],
  fatores: { testada: { valores: [1.02, null, 0.97, 1.05, null] },
             profundidade: { valores: [null, 0.98, null, 1.03, 1.01] },
             multFrentes: { valores: [0.95, null, null, null, 1.04] },
             extra1: { usar: false }, extra2: { usar: false } } };
[6000, 5800, 5200, 4100, 6900].forEach(function (a, i) { PA.amostra[i].areaTerreno = a; });
PA.amostra[2].topografia = 'Declive até 5%';
PA.amostra[3].topografia = 'Em aclive até 20%';
var RA = Motor.calcular(PA);
var ESPERADO_A = [   /* L, P, R, U, W, Z, AC, AJ, AM de Cálculo_apoio!28:32 */
  [1166.6666666666667, 0.9989278797777069, 1, 1.02, null, 1, 0.95, 0.9689278797777069, 1130.415859740658],
  [1474.1379310344828, 0.9904973549429357, 1, null, 0.98, 1, null, 0.9704973549429357, 1430.6469628900172],
  [2388.4615384615386, 0.9638227155990182, 0.7142141346016193, 0.97, null, 1.0526315789473684, null,
   0.7006684291480059, 1673.5195942342757],
  [2432.9268292682927, 0.9530071148492049, 0.27260543231613377, 1.05, 1.03, 1.1111111111111112, null,
   0.41672365827644986, 1013.8581686116067],
  [678.2608695652174, 1.0344478335866174, 1, null, 1.01, 1, 1.04, 1.0844478335866174, 735.5385306065753]];
var COLS_A = ['area', 'localizacao', 'testada', 'profundidade', 'topografia', 'multFrentes'];
ESPERADO_A.forEach(function (e, i) {
  var l = RA.tabela.linhas[i], ec = 'EC' + (i + 1) + ' ';
  conferir(ec + 'unitário', l.unit, e[0]);
  COLS_A.forEach(function (c, j) { conferir(ec + Motor.FATORES[c].rot, l.fatores[c], e[j + 1], { rel: 1e-12 }); });
  conferir(ec + 'resultante (sem cota-parte)', l.resultante, e[7]);
  conferir(ec + 'homogeneizado', l.homog, e[8]);
});
conferir('média homogeneizada (AM24)', RA.est.mediaH, 1196.7958232166266);
conferir('desvio homogeneizado (AM25)', RA.est.desvioH, 364.89131408860726);
conferir('área do avaliando = terreno (J34)', RA.est.areaAvaliando, 6025.8);
conferir('valor de mercado (C67)', RA.valor.mercado, 7211652.271538748);

B('2b · TABELA B — unidades padronizadas (planilha recalculada com I22 = "B")');
var PB = REF();
PB.calculo = { tabela: 'B', cotaTerreno: 0.36, cotaConstrucao: 0.64, oferta: [1, 0.95, 0.9, 0.92, 0.95],
  fatores: { vaga: { valores: [1.02, null, 0.97, 1.05, null] }, extra1: { usar: false },
             extra2: { valores: [null, 1.03, null, 0.96, 1.01] } } };
var RB = Motor.calcular(PB);
var ESPERADO_B = [   /* L, P, R, U, W, Z, AC, AH, AJ, AM de Cálculo_apoio!51:55 */
  [7924.647919213874, 1, 1, 1, 1, 1.02, 0.9872340425531915, null, 1.0072340425531916, 7981.975159480528],
  [10217.13535298646, 1, 1, 1, 1, null, 1.0043290043290043, 1.03, 1.0343290043290043, 10567.879436749154],
  [15164.835164835165, 0.981276638241626, 0.7142141346016193, 0.9545597319652394, 0.8157668076797917, 0.97,
   1.0175438596491229, null, 0.7189465717201518, 10902.706252459444],
  [15993.377483443708, 0.9535969631994334, 0.27260543231613377, 1.0499827248646783, 0.8157668076797917, 1.05,
   0.9789029535864979, 0.96, 0.5947175732482003, 9511.54264499605],
  [10400, 0.9253839083882192, 1, 1.0499827248646783, 1.1669951236543497, null, 1, 1.01, 1.0742497314403971,
   11172.19720698013]];
var COLS_B = ['area', 'localizacao', 'padrao', 'idade', 'vaga', 'andar', 'extra2'];
ESPERADO_B.forEach(function (e, i) {
  var l = RB.tabela.linhas[i], ec = 'EC' + (i + 1) + ' ';
  conferir(ec + 'unitário', l.unit, e[0]);
  COLS_B.forEach(function (c, j) { conferir(ec + Motor.FATORES[c].rot, l.fatores[c], e[j + 1], { rel: 1e-12 }); });
  conferir(ec + 'resultante (com cota-parte)', l.resultante, e[8]);
  conferir(ec + 'homogeneizado', l.homog, e[9]);
});
conferir('média homogeneizada (AM24)', RB.est.mediaH, 10027.260140133061);
conferir('desvio homogeneizado (AM25)', RB.est.desvioH, 1305.6331024999567);
conferir('valor de mercado (C67)', RB.valor.mercado, 8857279.426982336);

/* ======================================================================== */
B('3a · t DE STUDENT (T.INV.2T a 20%)');
[[1, 3.077683537175254], [2, 1.8856180831641267], [3, 1.6377443536962102], [5, 1.4758840488244813],
 [9, 1.3830287383964925], [29, 1.3114336473015527]].forEach(function (c) {
  conferir(c[0] + ' grau(s) de liberdade', Motor.tInv2T(0.2, c[0]), c[1], { rel: 1e-10 });
});

B('3b · ARREDONDAMENTO (ROUNDUP a milhar)');
conferir('9.050.024,80 → 9.051.000', Motor.arredondarMilharAcima(9050024.8), 9051000);
conferir('9.051.000 exato fica', Motor.arredondarMilharAcima(9051000), 9051000);
conferir('resíduo de ponto flutuante não sobe', Motor.arredondarMilharAcima(6862000.0000000001), 6862000);

B('3c · SUGESTÕES');
var PS = REF(); PS.calculo.oferta = [null, null, null, null, null];
var RS = Motor.calcular(PS);
conferir('oferta vazia em venda = 1,00', RS.tabela.linhas[0].oferta, 1);
conferir('oferta vazia em oferta = usual', RS.tabela.linhas[1].oferta, Motor.USUAIS.ofertaOferta);
conferir('sugestão marcada como tal', RS.tabela.linhas[1].ofertaSugerida, true);
var PC = REF(); delete PC.calculo.cotaConstrucao;
conferir('cota da construção vazia = 1 − terreno', Motor.calcular(PC).tabela.cotaConstrucao, 0.64, { rel: 1e-12 });
var PM = REF(); PM.calculo.fatores.localizacao = { valores: [null, null, 0.8, null, null] };
var RM = Motor.calcular(PM);
conferir('fator digitado substitui o calculado', RM.tabela.linhas[2].fatores.localizacao, 0.8);
conferir('… e o calculado segue como sugestão', RM.tabela.linhas[2].sugeridos.localizacao, 0.7142141346016193);
var PD = REF(); PD.calculo.fatores.andar = { usar: false };
conferir('fator desligado não entra', Motor.calcular(PD).tabela.linhas[0].resultante, 1, { rel: 1e-12 });

B('3d · AMOSTRA INCOMPLETA');
var PI = REF(); PI.amostra[4] = {};
var RI = Motor.calcular(PI);
conferir('comparativo vazio fica fora', RI.tabela.linhas[4].homog, null);
conferir('n conta só os válidos', RI.est.n, 4);
conferir('graus de liberdade = n − 1', RI.est.gl, 3);
var media4 = ESPERADO_C.slice(0, 4).reduce(function (a, e) { return a + e[8]; }, 0) / 4;
conferir('média dos quatro', RI.est.mediaH, media4);
var PV = REF(); PV.amostra[3].andar = null;
var RV = Motor.calcular(PV);
conferir('andar em branco: fator neutro, linha segue', RV.tabela.linhas[3].fatores.andar, null);
conferir('… e continua na amostra', RV.est.n, 5);
var P0 = { };
var R0 = Motor.calcular(P0);
conferir('estudo vazio não quebra', R0.valor.mercado, null);
conferir('… nem a liquidação', R0.liquidacao.vlf, undefined);

B('3e · COERÊNCIA');
var somaH = R.tabela.linhas.reduce(function (a, l) { return a + l.homog; }, 0);
conferir('valor médio = média × área', R.est.medio, somaH / 5 * 883.32);
conferir('mínimo < médio < máximo', R.est.minimo < R.est.medio && R.est.medio < R.est.maximo, true);
conferir('VLF = VM − deduções', L.vlf, L.vm - L.custoOportunidade - L.perdaInflacao - L.iptu - L.condominio);
var PL = REF(); PL.liquidacao.prazo = 5;
conferir('IR 22,5% até 180 dias', Motor.calcular(PL).liquidacao.ir, 0.225);
PL.liquidacao.prazo = 12;
conferir('IR 17,5% até 720 dias', Motor.calcular(PL).liquidacao.ir, 0.175);
var PDv = REF(); PDv.capa.areas.privativa.iptu = 900; PDv.capa.areas.privativa.doc = 880;
var DV = Motor.calcular(PDv).capa.divConstruida;
conferir('divergência automática da área construída: Sim', DV.resposta, 'Sim');
conferir('divergência = a maior fonte em módulo (IPTU)', DV.pct, 900 / 883.32 - 1);
conferir('diferença do IPTU em m²', DV.fontes[1].dif, 16.68);
conferir('diferença da doc. complementar em m²', DV.fontes[2].dif, -3.32);
var PDs = REF(); PDs.capa.areas.terreno.estimada = null;
conferir('sem estimada, sem resposta', Motor.calcular(PDs).capa.divTerreno.resposta, null);

B('4 · PESQUISA DA REGIÃO POR IA (o padrão do pedido)');
var PesquisaRegiao = require('../pesquisa-regiao.js');
var PQ = REF(); PQ.capa.bairro = 'Meireles'; PQ.capa.cidade = 'Fortaleza'; PQ.capa.uf = 'CE';
var pq = PesquisaRegiao.pedido(PQ, { jaEscrito: 'O bairro' });
conferir('três seções, cada uma com subtítulo "# "', PesquisaRegiao.SECOES.length === 3 && PesquisaRegiao.SECOES.every(function (sec) { return pq.indexOf('# ' + sec) >= 0; }), true);
conferir('sem diagnóstico de mercado (fora do escopo)', /Fora do escopo[^\n]*liquidez, valorização/.test(pq) && !/Síntese mercadológica/.test(pq), true);
conferir('limite de palavras do quadro no pedido', pq.indexOf('nunca passe de ' + PesquisaRegiao.PALAVRAS_MAX) >= 0, true);
conferir('pede nomes próprios (vias, metrô, shoppings…)',
  ['avenidas', 'metrô', 'shoppings', 'supermercados', 'escolas', 'hospitais', 'praças'].every(function (w) { return pq.indexOf(w) >= 0; }), true);
conferir('proíbe inventar nomes', /nunca invente/.test(pq), true);
conferir('leva os dados do laudo (bairro, cidade)', /Bairro: Meireles/.test(pq) && /Fortaleza \/ CE/.test(pq), true);
conferir('leva o que estava no campo como pista', /O bairro$/.test(pq.trim()), true);
conferir('com busca na web, manda pesquisar', /Pesquise na web/.test(PesquisaRegiao.pedido(PQ, { comBusca: true })), true);
conferir('sem busca, não promete pesquisa', /Pesquise na web/.test(pq), false);

console.log('\n' + '─'.repeat(78));
console.log(falhas.length === 0
  ? '\x1b[32m' + ok + ' conferências, nenhuma falha\x1b[0m'
  : '\x1b[31m' + falhas.length + ' falha(s)\x1b[0m\n  ' + falhas.join('\n  '));
process.exit(falhas.length ? 1 : 0);
