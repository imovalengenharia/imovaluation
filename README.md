# Imovaluation

Plataforma de modelagens imobiliárias: a casca autentica, cobra e guarda; cada modelagem é um
aplicativo dentro dela. O **Involutivo de Glebas** é o primeiro.

## Usar no seu computador

Não instala nada e não pede senha de administrador.

1. Baixe o código: no GitHub, botão verde **Code → Download ZIP**, e descompacte.
2. Na pasta descompactada, dê dois cliques em:
   - **Windows:** `iniciar.bat` (se aparecer "O Windows protegeu o computador":
     **Mais informações → Executar assim mesmo**)
   - **Mac:** `iniciar.command` (se o Mac bloquear: botão direito → **Abrir**)
3. O navegador abre em http://localhost:3000. Crie a sua conta e use.

Na primeira vez, o atalho baixa sozinho o Node.js portátil oficial (se o computador
não tiver) e os componentes: 2 a 5 minutos. Depois, abre em segundos.

Uma janela preta fica aberta enquanto a plataforma roda: **fechar a janela para a
plataforma**. Os estudos ficam na pasta `Imovaluation`, dentro da sua pasta de usuário
— fora da pasta do código. **Para atualizar**, baixe o ZIP de novo, descompacte e rode
o `iniciar`: os estudos continuam lá.

Sem serviço de e-mail, o link de "esqueci a senha" aparece na própria janela preta.

## Desenvolver

Requer Node 22.

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d banco   # só o Postgres, na porta 5432
cp .env.exemplo .env
npm install
npm run dev               # http://localhost:3000, recarregando ao salvar
```

## Testar

```bash
npm test                  # casca contra um Postgres real + auditoria do involutivo
npm run test:navegador    # a ponte casca ↔ módulo no Chromium
```

## O que já existe (fatia 1)

- **Conta** — cadastro, entrar, sair, recuperação de senha por e-mail. Um login é uma pessoa.
- **Banco** — `usuario`, `sessao`, `recuperacao_senha`, `assinatura` (vazia até a
  fatia da cobrança), `pasta`, `estudo`. Migrações em `casca/migracoes/`.
- **Pastas de trabalho** — pastas dentro de pastas; criar, renomear, mover, apagar
  (só vazias). Estudos na raiz ou em qualquer pasta.
- **Involutivo dentro** — cada estudo abre o módulo e salva sozinho as premissas no banco.

## Próximas fatias

1. Assinatura — Stripe (cartão recorrente e Pix), página de planos, webhook, cancelamento pelo assinante.
2. Registro de módulos com plano — o plano libera cada modelagem.
3. Deploy.

A arquitetura, a fronteira casca ↔ módulo e as convenções estão no [`CLAUDE.md`](CLAUDE.md).
