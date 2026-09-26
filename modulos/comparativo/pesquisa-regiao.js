/* Pesquisa da região por IA — o PADRÃO de toda pesquisa do campo
   "Observações gerais sobre a região" (decisão do dono do produto).

   O que a pesquisa entrega: SÓ as características do bairro e da região do
   imóvel — nada de diagnóstico de mercado (liquidez, valorização, demanda,
   preço). Texto técnico de laudo, nunca genérico, com NOMES PRÓPRIOS — vias,
   estações, shoppings, mercados, escolas, hospitais, praças, parques — em
   três seções fixas, e do tamanho do quadro do laudo (até PALAVRAS_MAX, o
   que cabe nos 78 mm do campo sem crescer). O texto vai direto para o campo,
   sem etapa de aprovar/descartar: o usuário paga por clique (créditos) e
   fica com o que a pesquisa trouxe.

   Arquivo puro, sem DOM e sem rede: monta o pedido a partir das premissas.
   Quem chama a IA é quem hospeda o módulo — a casca, no servidor, com busca
   na web; a versão de revisão (claude.ai), com o Claude do visualizador.
   Funciona no navegador (window.PesquisaRegiao) e no Node (require). */
(function (raiz) {
  'use strict';

  var SECOES = [
    'Localização e caracterização',
    'Sistema viário e mobilidade',
    'Equipamentos, serviços e pontos de interesse'
  ];
  /* medido no quadro de 78 mm da página da Região: ~400 palavras cabem sem
     ele crescer; 350 deixa folga */
  var PALAVRAS_MIN = 250, PALAVRAS_MAX = 350;

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
      'Você é engenheiro avaliador e redige o item "Observações gerais sobre a região" de um laudo de avaliação de imóvel urbano (ABNT NBR 14653-2). Este item descreve SOMENTE as características do bairro e da região onde o imóvel está: o que existe ali, onde fica e como se chega. Texto técnico e contextualizado ao endereço do imóvel, nunca genérico.',
      '',
      o.comBusca
        ? 'Pesquise na web a região do imóvel antes de escrever e use o que encontrar, priorizando fontes oficiais (prefeitura, órgãos de transporte) e dados atuais.'
        : 'Use o que você sabe sobre a região do imóvel.',
      '',
      'Escreva exatamente estas três seções, nesta ordem, cada uma com o subtítulo numa linha própria começando por "# ", seguido de um parágrafo corrido (sem listas, sem marcadores):',
      '# ' + SECOES[0] + ' — posição do bairro na cidade (zona ou regional), bairros limítrofes, vocação do bairro, tipologia predominante das edificações (verticalizada ou horizontal), padrão das construções e adensamento, e onde o imóvel se situa dentro do bairro.',
      '# ' + SECOES[1] + ' — nomes das principais avenidas e ruas arteriais e coletoras que servem o imóvel e a que eixos da cidade elas levam; transporte público com nomes: estações de metrô, VLT ou BRT, terminais e corredores de ônibus.',
      '# ' + SECOES[2] + ' — com nomes próprios: shoppings e centros comerciais, supermercados, escolas, colégios e universidades, hospitais e unidades de saúde, praças, parques, orla e espaços de lazer e cultura, e serviços públicos e de segurança.',
      '',
      'Fora do escopo — não escreva: nada sobre mercado imobiliário, liquidez, valorização, demanda, preços, atratividade para investimento, nem opinião sobre o valor do imóvel ou conclusão de avaliação.',
      '',
      'Rigor:',
      '- Cite apenas nomes que você tenha segurança de que existem e ficam na região; nunca invente nome de via, estação, estabelecimento ou equipamento.',
      '- Indique a distância aproximada ao imóvel ("cerca de 800 m", "a aproximadamente 2 km") só quando tiver segurança; senão, "nas proximidades" ou "no entorno".',
      '- Não contradiga os dados já preenchidos pelo avaliador (abaixo); eles prevalecem.',
      '- Se não conhecer o local o bastante para nomear o que uma seção pede, escreva o que for seguro e termine o texto com uma linha "[Confirmar em vistoria: …]" dizendo o que falta.',
      '',
      'Tamanho: o texto vai para um quadro de tamanho fixo no laudo impresso e tem de caber nele — de ' + PALAVRAS_MIN + ' a ' + PALAVRAS_MAX + ' palavras no total, contando os subtítulos; nunca passe de ' + PALAVRAS_MAX + '.',
      'Forma: português formal, terceira pessoa, estilo de laudo; nada antes da primeira seção nem depois da última (salvo a linha de confirmação); sem markdown além do "# " dos subtítulos.',
      '',
      'Dados do laudo:',
      dados(P),
      jaEscrito ? '\nAnotações que estavam no campo (use como pistas; o seu texto as substitui):\n' + jaEscrito : ''
    ].join('\n');
  }

  var PesquisaRegiao = { SECOES: SECOES, PALAVRAS_MIN: PALAVRAS_MIN, PALAVRAS_MAX: PALAVRAS_MAX, dados: dados, pedido: pedido };
  if (typeof module !== 'undefined' && module.exports) module.exports = PesquisaRegiao;
  else raiz.PesquisaRegiao = PesquisaRegiao;
})(typeof window !== 'undefined' ? window : this);
