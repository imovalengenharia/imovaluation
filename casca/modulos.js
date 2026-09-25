/* Registro de módulos: quais modelagens existem e onde moram, na ordem em
   que aparecem na tela de metodologias. O plano que libera cada uma entra na
   fatia da assinatura. */
export const MODULOS = {
  involutivo: {
    id: 'involutivo',
    nome: 'Glebas urbanizáveis',
    descricao: 'Loteamentos abertos e condomínios de lotes: áreas, faseamento, vendas, '
      + 'fluxo de caixa mês a mês e os indicadores de retorno do empreendimento.',
    pasta: 'involutivo',          // modulos/involutivo/, publicado em /m/involutivo/
    /* desenho do cartão: uma gleba parcelada em quadras e lotes */
    ilustracao: 'gleba',
  },
  comparativo: {
    id: 'comparativo',
    nome: 'Comparativo direto de dados de mercado',
    descricao: 'Casas, apartamentos, lotes e salas: pesquisa de mercado, tratamento por fatores, '
      + 'liquidação forçada e o laudo de avaliação pronto para imprimir.',
    pasta: 'comparativo',         // modulos/comparativo/, publicado em /m/comparativo/
    /* desenho do cartão: o avaliando e os comparativos da amostra num quarteirão */
    ilustracao: 'comparativo',
  },
};

export const moduloExiste = id => Object.hasOwn(MODULOS, id);
