/* Pequenas peças que as rotas de modelagens, pastas e estudos dividem. */

/* O recado de uma ação volta pela URL como código, nunca como texto livre. */
export const RECADOS = {
  'pasta-mudou': ['erro', 'A pasta mudou enquanto você confirmava. Confira os estudos e tente de novo.'],
  'destino': ['erro', 'Pasta de destino não encontrada.'],
  'nome': ['erro', 'Informe um nome.'],
  'pasta-apagada': ['ok', 'Pasta apagada.'],
  'estudo-apagado': ['ok', 'Estudo apagado.'],
  'duplicado': ['ok', 'Estudo duplicado.'],
  'movido': ['ok', 'Estudo movido.'],
};

export function lerRecado(req) {
  const [tipo, texto] = RECADOS[req.query.r] || [];
  return { erro: tipo === 'erro' ? texto : '', ok: tipo === 'ok' ? texto : '' };
}

export const urlPasta = (modulo, pastaId, recado) =>
  `/modelagens/${modulo}${pastaId ? '/' + pastaId : ''}${recado ? '?r=' + recado : ''}`;

export const lerNome = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
