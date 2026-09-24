/* Registro de módulos: quais modelagens existem e onde moram.
   Começa com uma entrada; generaliza-se quando houver a segunda. O plano que
   libera cada uma entra na fatia da assinatura. */
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
};

export const moduloExiste = id => Object.hasOwn(MODULOS, id);
