/* Tudo o que muda entre máquinas vem do ambiente. */
const producao = process.env.NODE_ENV === 'production';

function exigir(nome, padraoDev) {
  const v = process.env[nome];
  if (v) return v;
  if (producao) throw new Error(`variável de ambiente ${nome} não definida`);
  return padraoDev;
}

export function lerConfig(sobrepor = {}) {
  const c = {
    producao,
    nome: process.env.PLATAFORMA_NOME || 'Imovaluation',
    urlBanco: exigir('DATABASE_URL', 'postgres://imovaluation:imovaluation@localhost:5432/imovaluation'),
    /* no Render, RENDER_EXTERNAL_URL vem pronto com o endereço do serviço */
    urlPublica: (process.env.URL_PUBLICA || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').replace(/\/$/, ''),
    porta: Number(process.env.PORTA || process.env.PORT || 3000),
    smtp: process.env.SMTP_URL || null,
    remetente: process.env.EMAIL_REMETENTE || 'Imovaluation <nao-responda@localhost>',
    /* "usuario:senha" fecha o site inteiro atrás de uma senha do navegador —
       para o site de teste, antes de a plataforma abrir ao público */
    acessoRestrito: process.env.ACESSO_RESTRITO || null,
    sessaoDias: 30,
    recuperacaoMinutos: 60,
    ...sobrepor,
  };
  return c;
}

export const COOKIE_SESSAO = 'sessao';
