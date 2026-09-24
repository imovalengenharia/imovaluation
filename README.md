# Imovaluation

Plataforma de modelagens imobiliárias: a casca autentica, cobra e guarda; cada modelagem é um
aplicativo dentro dela. O **Involutivo de Glebas** é o primeiro.

## Usar no seu computador

Só precisa do **Node.js** (gratuito), versão LTS: https://nodejs.org — sem Docker, sem
instalar banco de dados: o Postgres vem embutido e se prepara sozinho na primeira vez.

1. Instale o Node.js (versão **LTS**), com as opções padrão.
2. Baixe o código: no GitHub, botão verde **Code → Download ZIP**, e descompacte.
3. Na pasta descompactada, dê dois cliques em:
   - **Windows:** `iniciar.bat` (se aparecer "O Windows protegeu o computador":
     **Mais informações → Executar assim mesmo**)
   - **Mac:** `iniciar.command` (se o Mac bloquear: botão direito → **Abrir**)
4. O navegador abre em http://localhost:3000. Crie a sua conta e use.

Uma janela preta fica aberta enquanto a plataforma roda: **fechar a janela para a
plataforma**. Na primeira vez leva de 1 a 3 minutos (instala os componentes); depois,
segundos.

Os estudos ficam na pasta `Imovaluation`, dentro da sua pasta de usuário — fora da pasta
do código. **Para atualizar**, baixe o ZIP de novo, descompacte onde quiser e rode o
`iniciar`: os estudos continuam lá.

Sem serviço de e-mail, o link de "esqueci a senha" aparece na própria janela preta.

Com Docker, em vez do Node: `docker compose up --build -d`.

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
