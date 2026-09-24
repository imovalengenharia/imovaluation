# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

**Imovaluation** é uma plataforma de modelagens: a **casca** autentica, cobra e
guarda; cada **modelagem** (na tela, "tipo de análise da qualidade do
investimento imobiliário") é um aplicativo dentro dela. A primeira é **Glebas
urbanizáveis** (`modulos/involutivo/`). Atenção ao vocabulário, que o dono do
produto corrigiu: **involutivo é um método de avaliação usado dentro do estudo**,
não o nome da análise — na interface, o produto é "Glebas urbanizáveis". A plataforma nasceu do zero — nada de código, modelo de dados ou
hábito de projeto anterior. O nome exibido vem de `PLATAFORMA_NOME`
(padrão `Imovaluation`).

| | onde | linguagem | como roda |
|---|---|---|---|
| casca | `casca/` | Node 22, Fastify, Postgres 16, ESM | `npm run dev` → http://localhost:3000 |
| involutivo | `modulos/involutivo/` | JavaScript puro, sem build, sem dependências | abrir `index.html` no navegador — ou dentro da casca |

Cada módulo tem o seu `CLAUDE.md`, com o contrato de cálculo e as armadilhas
que são só dele. **Antes de mexer num módulo, leia o dele.**

## Comandos

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d banco   # só o Postgres (ou um Postgres 16 local)
cp .env.exemplo .env
npm install
npm run dev                 # migra o banco e sobe a casca, recarregando ao salvar
npm test                    # casca no Postgres e no PGlite + auditoria do involutivo
npm run test:navegador      # a ponte casca ↔ módulo no Chromium (Playwright)
npm run local               # como o usuário roda: PGlite em ~/Imovaluation, abre o navegador
docker compose up --build -d # a plataforma inteira em Docker (Dockerfile + compose.yaml)
node --env-file=.env --test --test-concurrency=1 --test-name-pattern='recuperação' 'testes/*.test.js'
cd modulos/involutivo && node testes/auditoria.js                  # só o motor
```

A suíte **apaga e recria** o banco de `DATABASE_URL_TESTE` a cada arquivo de
teste. Nunca aponte essa variável para um banco com dados.

## A fronteira casca ↔ módulo

É estreita de propósito, e cabe em três obrigações:

1. A casca entrega ao módulo **quem é o usuário** e **qual estudo abrir**.
2. O módulo devolve o estudo em JSON quando ele muda; a casca salva.
3. O módulo não sabe o que é assinatura, plano, pasta ou cobrança.

Na prática: a página `/estudos/:id` é só a barra da casca e um `<iframe>` com
`/m/<modulo>/index.html?casca`. A conversa é por `postMessage`, sempre no canal
`'imovaluation'` e sempre conferindo `origin` e `source` dos dois lados:

```
módulo → casca   { canal, tipo: 'pronto', modulo }            ao carregar
casca  → módulo  { canal, tipo: 'abrir', usuario: { nome },
                   estudo: { id, nome, modulo, premissas, vista } }
                                                              premissas null = estudo novo
módulo → casca   { canal, tipo: 'resumo', resumo }            logo depois de abrir
módulo → casca   { canal, tipo: 'mudou', premissas, resumo }  a cada recálculo, o P inteiro
módulo → casca   { canal, tipo: 'vista', vista }              troca de aba, rolagem
```

- **`resumo`**: até 6 pares `[rótulo, valor]` já escritos pelo módulo; a casca
  mostra no cartão do estudo sem entender nenhum. Mandado também ao abrir, para
  o cartão ter números mesmo sem edição (`PUT /api/estudos/:id/resumo`, que não
  mexe em `atualizado_em`).
- **`vista`**: onde a leitura parou (no involutivo: `{ aba, rotulo, rolagem }`).
  A casca grava à parte (`PUT /api/estudos/:id/vista`), sem contar como edição:
  troca de aba grava na hora, rolagem espera 1,5 s parada. O `rotulo` aparece no
  cartão ("parou em Fluxo de caixa"). É assim que o estudo reabre onde parou.

O `src` do iframe só é posto por `publico/estudo.js`, **depois** de ele
escutar as mensagens: com o `src` direto no HTML, o `'pronto'` do módulo às
vezes chegava antes do ouvinte e o estudo abria em branco — só em produção.

A casca agrupa as mudanças (800 ms) e grava com `PUT /api/estudos/:id/premissas`.
Ela **não lê** as premissas: guarda o JSON como veio e o devolve ao abrir. A
migração de formato de premissas antigas é do módulo, não da casca.

Sem `?casca` na URL, o módulo não espera ninguém e volta a guardar no
`localStorage` — é assim que ele continua abrindo sozinho, e é assim que se
desenvolve e audita um módulo. **Não quebre isso**: nenhum módulo importa nada
da casca nem faz `fetch` para ela.

### Módulo novo

Uma pasta em `modulos/` com o mesmo desenho do involutivo — motor puro sem DOM,
interface separada, CSS em tokens, suíte de auditoria própria, `CLAUDE.md`
próprio — e uma entrada em `casca/modulos.js`. O lado módulo da ponte são ~30
linhas: copie o bloco "a casca" de `modulos/involutivo/app.js`. A pasta
`modulos/` é CommonJS (`modulos/package.json`) porque os módulos rodam no
navegador sem build e as suítes fazem `require` do motor; a casca é ESM.

### Rodar no computador de quem usa

`iniciar.bat` / `iniciar.command` → `casca/local.js`. O banco é o **PGlite**
(`casca/banco-embutido.js`): o próprio Postgres compilado para WebAssembly, dentro
do processo do Node, com os dados em `~/Imovaluation` — fora da pasta do código,
para sobreviver a cada ZIP novo. A casca sobe em `localhost:3000`, só para este
computador.

Cada escolha aqui veio de um bloqueio real no computador de quem usa:

- **Docker** não abre sem virtualização ligada na BIOS.
- **Instalador do Node** pede administrador. Os atalhos baixam o Node **portátil**
  oficial (versão e SHA-256 fixos no atalho) para a pasta do usuário, uma vez só.
- **Postgres nativo embutido** (`embedded-postgres`, abandonado): depende do
  `VCRUNTIME140.dll`, se recusa a rodar como administrador e falha em caminho com
  acento no Windows. O PGlite não tem nenhum desses problemas.

`banco-embutido.js` tem a mesma interface de `banco.js`. O PGlite é uma conexão
só: dentro de `transacao(fn)`, use só o `c.query` recebido — chamar o banco de fora
ali dentro trava para sempre. **`npm test` roda a suíte nos dois bancos**
(`test:embutido` = `BANCO_TESTE=embutido`, em memória). Servidores instalam com
`--omit=optional` e não levam o PGlite.

O pool do `pg` tem ouvinte de `'error'` (`banco.js`): sem ele, qualquer conexão
ociosa que cai — banco reiniciado, por exemplo — derruba o servidor inteiro.

## A casca — arquitetura

- `servidor.js` monta tudo: cabeçalhos de segurança, checagem de `Origin`,
  leitura da sessão, porteiro (`app.exigirLogin`), estáticos, rotas.
- `rotas/conta.js` — cadastro, entrar, sair, recuperação de senha.
- A navegação é **metodologia → pastas de trabalho → estudos**, e cada nível só
  mostra o que é dele — decisão do dono do produto, repetida duas vezes:
  `/modelagens` mostra **só as metodologias** (nada de pasta, estudo ou lista de
  recentes que misture metodologias); `/modelagens/:modulo` mostra as pastas
  **daquela** metodologia; `/modelagens/:modulo/:pasta`, os estudos da pasta;
  `/estudos/:id`, o módulo. Na tela, o nome é "metodologia"; no código, `modulo`.
- Nas grades de pastas e de estudos, o quadrado **"Nova pasta de trabalho" /
  "Novo estudo" vem sempre em primeiro**; o que já existe vem ao lado e abaixo,
  nunca antes dele (pedido do dono do produto). Cada cartão mostra **criada/o em**
  (data) e **alterada/o em** (data e hora, fuso de São Paulo), automáticas: a
  pasta usa a mais recente entre `pasta.alterada_em` (renomear, estudo que entra,
  sai ou é apagado) e o `atualizado_em` dos estudos dela. Rotas em `rotas/modelagens.js`, `rotas/pastas.js`,
  `rotas/estudos.js` (com a API da ponte); consultas em `pastas.js`.
- Diálogos são `<dialog>` nativos abertos por `data-abrir="<id>"`
  (`publico/casca.js`); as ações em si são formulários comuns.
- `paginas/` — HTML por template literal (`html\`\``), que escapa tudo o que é
  interpolado. Não há motor de template. Não há JavaScript de página, exceto
  `publico/estudo.js` (o lado casca da ponte).
- `migracoes/NNN_nome.sql` rodam em ordem na subida (`migrar.js`), cada uma numa
  transação. **Migração aplicada nunca se edita: cria-se a próxima.**

### Decisões que moldam o banco

- **Um login é uma pessoa.** Não há organização, convite nem usuário sob a
  conta de outro. Tudo pendura direto em `usuario`. Se um dia pedirem, vem
  compartilhamento de pasta entre contas — acréscimo, não migração.
- **O que não é do usuário não existe para ele**: toda consulta leva
  `usuario_id`, e o que é de outro responde 404, nunca 403. As chaves
  compostas `(usuario_id, pai_id)` e `(usuario_id, pasta_id)` fazem o próprio
  banco recusar pasta ou estudo pendurado em pasta alheia.
- **A pasta é de uma modelagem, e tem um nível só** (migração 002; `pai_id` ficou
  no banco, sempre nulo). O estudo mora sempre numa pasta da **mesma**
  modelagem: a chave `(usuario_id, pasta_id, modulo)` faz o banco recusar o resto.
- **Pasta com estudos não se apaga.** Nenhum estudo some por cascata.
- Duplicar estudo é o jeito de fazer cenário: copia premissas, resumo e vista.
- `assinatura` existe desde a primeira migração, vazia: a cobrança é a
  próxima fatia (Stripe, cartão e Pix; o plano libera módulos).

### Segurança — o que já está resolvido e não se desfaz

- Senha com scrypt do próprio Node (`senha.js`), formato
  `scrypt$N$r$p$sal$hash` para poder subir o custo depois. E-mail inexistente
  gasta o mesmo tempo que senha errada.
- Sessão e recuperação: token aleatório no cliente, **só o sha256 no banco**.
  Sessão de 30 dias, cookie `HttpOnly; SameSite=Lax` (e `Secure` em produção).
  Trocar a senha pelo link derruba todas as sessões; o link vale uma vez e uma hora.
- CSRF: `SameSite=Lax` mais recusa de todo POST/PUT com `Origin` de outro host.
  `Referrer-Policy` é `same-origin` — **não** `no-referrer`, que faz o Chrome
  mandar `Origin: null` nos formulários e trava o login inteiro.
- CSP com `script-src 'self'`: nenhum `onclick=` nem `<script>` embutido, na
  casca ou nos módulos.
- `/m/` só serve a quem entrou, e nunca `testes/`, `CLAUDE.md`, `README.md`.
- O destino depois de entrar (`voltar`) só aceita caminho interno.
- Freio de senha em memória (10 falhas por e-mail, 50 por IP, em 15 min). Com
  mais de uma instância do servidor, isso precisa ir para o banco.

## Convenções de interface

Valem na plataforma inteira — casca e todos os módulos. Quebrar qualquer uma
delas gerou retrabalho:

1. **Sugestivo.** Premissa guardada como `null` significa "por informar": o
   motor resolve o usual e o campo mostra o número em letra clara. Digitar
   torna o valor do avaliador; apagar devolve a sugestão.
2. **Simetria.** Todo campo digitável de um mesmo contexto tem a mesma largura
   e a mesma borda direita, com sufixo ou sem. Rótulo comprido encurta; campo
   não muda de tamanho.
3. **Afixos dentro do campo.** `%` e `m²` à direita, `R$` à esquerda,
   posicionados sobre o campo — e a mesma regra no valor calculado, para os
   dígitos de uma coluna caírem sempre no mesmo x. Unidade que é palavra
   (mês, a.a., parc.) fica na coluna de unidade.
4. **Zero é traço** (`—`, ou `·` nas células de tabela densa), exceto onde zero
   é um valor com sentido próprio (o mês zero é a data-base).
5. **Percentual com uma casa decimal.** Por isso os padrões ficam em números
   representáveis, para tela e motor nunca divergirem.
6. **A nota corre até o fim** do quadro; só texto corrido tem largura própria.
7. **Sem negrito decorativo.** Nenhum número é negrito.
8. **Casa única.** Cada campo mora em um lugar só.

E duas armadilhas que valem para qualquer tela:

- **Cor fora do token quebra um dos temas.** Papel é o padrão; o escuro é o
  mesmo papel à noite. Toda cor nova se define nos tokens do `:root` e se
  confere nos dois temas. A casca e o involutivo usam a mesma paleta.
- **Campo que sai do documento perde o foco.** Onde uma área se redesenha
  inteira a cada recálculo, campo digitável tem de viver fora do redesenho.

## Memória entre conversas

Cada frente — a casca, e cada modelagem — tem a sua conversa. O que for
decidido e custar caro esquecer **volta para este arquivo** (ou para o
`CLAUDE.md` do módulo). Ele envelhece mal se ninguém o atualizar.
