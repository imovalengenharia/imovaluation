/* Registro de módulos: quais modelagens existem e onde moram.
   Começa com uma entrada; generaliza-se quando houver a segunda. O plano que
   libera cada uma entra na fatia da assinatura. */
export const MODULOS = {
  involutivo: {
    id: 'involutivo',
    nome: 'Involutivo de Glebas',
    descricao: 'Valor de gleba urbanizável pelo método involutivo: áreas, faseamento, '
      + 'vendas, fluxo de caixa mês a mês e a TIR travada na TMA.',
    pasta: 'involutivo',          // modulos/involutivo/, publicado em /m/involutivo/
    /* desenho do cartão: uma gleba parcelada em quadras e lotes */
    ilustracao: 'gleba',
  },
};

export const moduloExiste = id => Object.hasOwn(MODULOS, id);
