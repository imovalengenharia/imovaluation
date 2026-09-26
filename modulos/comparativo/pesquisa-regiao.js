/* Pesquisa da região por IA — o PADRÃO de toda pesquisa do campo
   "Observações gerais sobre a região" (decisão do dono do produto).

   O que a pesquisa entrega: texto técnico de laudo (ABNT NBR 14653-2), nunca
   genérico, com NOMES PRÓPRIOS — vias, estações, shoppings, mercados,
   escolas, hospitais, praças, parques — em quatro seções fixas. O texto vai
   direto para o campo, sem etapa de aprovar/descartar: o usuário paga por
   clique (créditos) e fica com o que a pesquisa trouxe.

   Arquivo puro, sem DOM e sem rede: monta o pedido a partir das premissas.
   Quem chama a IA é quem hospeda o módulo — a casca, no servidor, com busca
   na web; a versão de revisão (claude.ai), com o Claude do visualizador.
   Funciona no navegador (window.PesquisaRegiao) e no Node (require). */
(function (raiz) {
  'use strict';

  var SECOES = [
    'Localização e caracterização',
    'Sistema viário e mobilidade',
    'Equipamentos e pontos de interesse',
    'Síntese mercadológica'
  ];

  function texto(v) { return v === null || v === undefined ? '' : String(v).trim(); }
  function marcados(o, nomes) {
    var ks = Object.keys(o || {}).filter(function (k) { return o[k] === true; });
    return ks.length ? ks.map(function (k) { return (nomes && nomes[k]) || k; }).join(', ') : 'não informado';
  }

  /* Os dados do laudo que a pesquisa considera (e não pode contradizer). */
  function dados(P) {
    var c = (P && P.capa) || {}, r = (P && P.regiao) || {};
    var serv = r.servicos || {};
    var ou = function (v) { return texto(v) || 'não informado'; };
    return [
      'Endereço do imóvel: ' + ou([c.logradouro, c.numero, c.complemento].map(texto).filter(Boolean).join(', ')),
      'Empreendimento: ' + ou(c.empreendimento),
      'Bairro: ' + ou(c.bairro),
      'Cidade/UF: ' + ou([c.cidade, c.uf].map(texto).filter(Boolean).join(' / ')),
      'CEP: ' + ou(c.cep),
      'Tipologia / uso: ' + ou([c.tipologia, c.uso].map(texto).filter(Boolean).join(' / ')),
      'Padrão da região (avaliador): ' + ou(r.padrao),
      'Ocupação predominante (avaliador): ' + ou(r.ocupacao),
      'Tráfego (avaliador): ' + ou(r.trafego),
      'Implantação: ' + ou(r.implantacao),
      'Zoneamento: ' + ou(r.zoneamento),
      'Melhoramentos públicos marcados: ' + marcados(r.melhoramentos),
      'Distância a serviços (avaliador): ' + (Object.keys(serv).filter(function (k) { return texto(serv[k]); })
        .map(function (k) { return k + ' ' + texto(serv[k]); }).join('; ') || 'não informado'),
      'Peculiaridades / fatores restritivos marcados: ' + marcados(r.peculiaridades)
    ].join('\n');
  }

  /* O pedido completo. `jaEscrito`: o texto que estava no campo (serve de
     contexto; o resultado o substitui). `comBusca`: o hospedeiro oferece
     busca na web (a casca); sem ela, a IA usa só o que sabe e é mais
     cautelosa com nomes. */
  function pedido(P, o) {
    o = o || {};
    var jaEscrito = texto(o.jaEscrito).slice(0, 3000);
    return [
      'Você é engenheiro avaliador sênior e redige o item "Observações gerais sobre a região" de um laudo de avaliação de imóvel urbano pelo método comparativo direto (ABNT NBR 14653-1 e 14653-2). É um documento técnico: nada de texto genérico que serviria a qualquer bairro.',
      '',
      o.comBusca
        ? 'Pesquise na web a região do imóvel antes de escrever e use o que encontrar, priorizando fontes oficiais (prefeitura, órgãos de transporte) e dados atuais.'
        : 'Use o que você sabe sobre a região do imóvel.',
      '',
      'Escreva exatamente estas quatro seções, nesta ordem, cada uma com o subtítulo numa linha própria começando por "# ", seguido de um parágrafo corrido (sem listas, sem marcadores):',
      '# ' + SECOES[0] + ' — bairro, zona ou regional da cidade, bairros limítrofes, vocação, tipologia predominante (verticalizada ou horizontal), padrão construtivo e socioeconômico, adensamento.',
      '# ' + SECOES[1] + ' — nomes das principais avenidas e ruas arteriais e coletoras que servem o imóvel e como ligam o bairro aos eixos da cidade; transporte público com nomes: estações de metrô, VLT ou BRT, terminais e corredores de ônibus.',
      '# ' + SECOES[2] + ' — com nomes próprios: shoppings e centros comerciais, supermercados e atacarejos, escolas, colégios e universidades, hospitais e unidades de saúde, praças, parques, orla e espaços de lazer e cultura, serviços públicos e de segurança.',
      '# ' + SECOES[3] + ' — atratividade, demanda e liquidez para a tipologia do imóvel, fatores de valorização e eventuais fatores restritivos, coerente com os dados do laudo.',
      '',
      'Rigor:',
      '- Cite apenas nomes que você tenha segurança de que existem e ficam na região; nunca invente nome de via, estação, estabelecimento ou equipamento.',
      '- Indique a distância aproximada ao imóvel ("cerca de 800 m", "a aproximadamente 2 km") só quando tiver segurança; senão, "nas proximidades" ou "no entorno".',
      '- Não contradiga os dados já preenchidos pelo avaliador (abaixo); eles prevalecem.',
      '- Se não conhecer o local o bastante para nomear o que uma seção pede, escreva o que for seguro e termine o texto com uma linha "[Confirmar em vistoria: …]" dizendo o que falta.',
      '',
      'Forma: português formal, terceira pessoa, estilo de laudo; de 250 a 400 palavras no total; nada antes da primeira seção nem depois da última (salvo a linha de confirmação); sem markdown além do "# " dos subtítulos.',
      '',
      'Dados do laudo:',
      dados(P),
      jaEscrito ? '\nAnotações que estavam no campo (use como pistas; o seu texto as substitui):\n' + jaEscrito : ''
    ].join('\n');
  }

  var PesquisaRegiao = { SECOES: SECOES, dados: dados, pedido: pedido };
  if (typeof module !== 'undefined' && module.exports) module.exports = PesquisaRegiao;
  else raiz.PesquisaRegiao = PesquisaRegiao;
})(typeof window !== 'undefined' ? window : this);
