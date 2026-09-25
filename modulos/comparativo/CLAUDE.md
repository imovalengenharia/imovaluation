# CLAUDE.md — Comparativo direto de dados de mercado

Avaliação de casas, apartamentos, lotes e salas pelo **método comparativo
direto de dados de mercado, com tratamento por fatores**, e o laudo pronto
para imprimir. É o porte da planilha do avaliador "Laudo de Avaliação de
Imóvel Urbano" (a de referência é a do laudo da Mat. 33.794): **a mesma
planilha, aba a aba, com os mesmos campos nas mesmas posições, e o mesmo
laudo impresso.** O id do módulo é `comparativo`. As convenções de interface e
a fronteira com a casca estão no `CLAUDE.md` da raiz; aqui fica o que é só
deste módulo.

## Comandos

```bash
node testes/auditoria.js        # a suíte inteira, em Node, sem navegador
python3 -m http.server 8777     # e abrir http://localhost:8777/ — sozinho, sem a casca
```

Como no involutivo: sem build, sem dependências; o publicado são exatamente
`index.html`, `motor.js` e `app.js`.

## A planilha e o módulo

| aba da planilha | no módulo |
|---|---|
| Capa | aba **Capa** (logos, fotos, áreas, resultado, empresa, observações) |
| Região + Imóvel | aba **Região + Imóvel** |
| Restrições Imóvel | aba **Restrições do imóvel** |
| Fichas Pesquisa (2 páginas) | aba **Fichas de pesquisa** (paradigma, 5 comparativos, croqui) |
| Cálculo | aba **Cálculo** |
| Gráfico | aba **Gráfico** (dispersão observado × estimado, croqui) |
| Liquidação forçada | aba **Liquidação forçada** (premissas, ponte, sensibilidade) |
| Fotos, Fotos (2), (3), (5) | aba **Relatório fotográfico** — 8 fotos por página, quantas páginas precisar |
| (documentos anexados ao PDF) | aba **Anexos** — uma imagem por página, sem cabeçalho |
| — | aba **Impressão**: a prévia do laudo como sai no papel, página a página e numerada, sempre no papel claro; página que passa da folha A4 fica marcada em vermelho. É o que o avaliador usa para ajustar o laudo no link web, onde `window.print()` não funciona |
| Cálculo_apoio, Inf. Auxiliar, Listas Suspensas | **ocultas**: as tabelas e fórmulas moram no `motor.js`; as escolhas do Cálculo_apoio ficam no painel "Tratamento dos dados", sobre a página do Cálculo, que não sai no laudo |
| Declaração, LIC | fora — não fazem parte do laudo impresso |

"Imprimir laudo" abre um diálogo com as partes (lembradas em `P.impressao`) e
chama `window.print()`. A impressão monta as páginas escolhidas em
`#impressao` com o contexto de papel e esconde o resto.

## Arquitetura

- **`motor.js`** — cálculo puro, sem DOM. `Motor.calcular(P)` devolve
  `{ paradigma, amostra[], tabela, est, valor, capa, liquidacao, grafico }`.
  Exporta também as tabelas da Inf. Auxiliar (`PADROES`, `TOPOGRAFIA`,
  `CONSERVACAO`, coeficientes de andar), as `LISTAS` suspensas, `FATORES`,
  `TABELAS` (A, B, C) e `USUAIS`. Cada conta tem ao lado o nome da célula
  da planilha (`// AJ74`), para a conferência linha a linha continuar possível.
- **`app.js`** — interface. Cada aba é uma função `folhaX(ctx)` que devolve
  páginas (`<section class="pagina">`). O `ctx` vem de `contexto(papel)`: na
  tela, `ctx.num/txt/sel/data/area/chk/img` criam campos que leem e gravam em
  `P`; no papel, o mesmo chamado devolve só o texto. **É a mesma função nos
  dois casos** — o que se vê na tela é o que sai impresso. Valor calculado é
  `ctx.calc(f)`, que se inscreve em `atualizadores` e é reescrito a cada
  recálculo sem sair do documento (o foco não se perde). Mudança de estrutura
  (trocar a tabela, inserir foto, marcar X) chama `remontar()`.
- **`index.html`** — a página e todo o CSS. Duas camadas de tokens: a moldura
  da plataforma (a mesma do involutivo) e a folha do laudo (`--pg-*`),
  conferidas nos dois temas; na impressão a folha volta sempre ao papel claro.

### A folha

O modelo do avaliador é impresso pelo Excel "ajustado à página": tudo sai
~22% menor que o tamanho nominal. A folha reproduz isso — é desenhada numa
página virtual de **270 mm × 381,8 mm** (`--pg-w`, `--pg-h`) e sai no A4 com
`zoom: 210/270` (`--pg-escala`). Na tela, a mesma folha cresce até caber na
largura (`--zoom`). **Mudou medida, confira a altura impressa**: cada página
precisa caber em 297 mm (o teste é gerar o PDF e medir `.pagina` em mídia
print). A página tem altura mínima, não fixa: texto longo demais transborda
para uma folha seguinte em vez de sumir cortado.

A folha usa Arial e o azul-marinho `#002060` do modelo — exceção deliberada à
tipografia da plataforma, porque o laudo é documento do avaliador e tem de
sair igual ao que ele já entrega. Pelo mesmo motivo, dentro da folha valem os
formatos do laudo (duas casas em áreas, fatores e percentuais da estatística;
`R$` junto do número; "-" no vazio), e não a regra de uma casa decimal da
plataforma. Fora da folha (barra, painel, resumo do cartão) valem as regras
de sempre.

**A cor do laudo é escolha do avaliador** (`P.aparencia.cor`, padrão
`#002060`, seletor "Cor do laudo" na barra). `aplicarCor()` gera, num
`<style id="estilo-cor">` posto depois do CSS da página, os tokens da folha
nos dois temas: a cor cheia em `--pg-marinho`/`--pg-rot` (faixas, títulos,
rótulos), texto preto ou branco sobre a faixa conforme a luminância, e os
campos digitáveis num tom bem claro da mesma cor (`--pg-edita`, 92% de
branco). No papel — impressão e aba Impressão — a cor cheia vai junto e os
campos saem em branco, porque lá não há campo, só texto. Cor nova na folha
deriva desses tokens; nada de azul fixo.

**Ficha técnica** (`ficha(nPares, [[pergunta, resposta], …], pesos)`): pares
em linha dentro de um quadro na largura toda; a pergunta numa célula
sombreada (`--pg-pergunta`), em maiúsculas na cor do laudo, e a resposta
numa célula branca ao lado. É o formato que o avaliador aprovou para Terreno
(3 pares), Edificação (4 pares × 2 linhas, fachada e conservação no fim da
linha) e Unidade privativa, e depois estendido à Região: Serviços públicos
(2 pares por linha) e os três quadros de baixo (padrão/ocupação,
tráfego/implantação, zoneamento), cada ficha esticada à altura da coluna. Recusados antes: quadros soltos de pares, que
sobravam espalhados no papel, e rótulo pequeno sobre o valor em células
largas ("muito espaço para pouco preenchimento; não dá para saber o que é
pergunta e o que é resposta").

**Página da Região + Imóvel** (pedido do avaliador): as observações da região
esticam até o fim da página (mínimo 30 mm); a faixa é "Infraestrutura do
empreendimento"; as duas perguntas de divergência de área abrem a página de
Restrições. Ambientes: 13 linhas no mínimo, botão "+ Linha de ambiente" (e
"Remover última linha", só vazia) na tela; cabem `AMB_PRIMEIRA` (30) linhas
na página, o resto segue em páginas "(continuação)", com as colunas em
larguras fixas para alinhar com a primeira tabela.

**Uma escala de letra só** (pedido do avaliador: "mesma fonte e tamanho para
campos de mesma função"). Tokens no `.pagina`: `--t-campo` 6,6 pt para todo
rótulo, valor, resposta de ficha, texto corrido, legenda e tabela comum;
`--t-denso` 6,2 pt só nas tabelas largas do cálculo e da liquidação
(`table.t.denso`, `.homog`); `--t-faixa` 7 pt para faixas (todas em negrito,
centradas ou à esquerda) e títulos de bloco. Nenhum `font-size` solto em
elemento do laudo: tamanho novo vira token. A pergunta da ficha técnica usa o
mesmo tamanho do rótulo, sem espaçamento entre letras.

**Fios de uma espessura só** (pedido do avaliador: "essas linhas estão mais
grossas"). Duas armadilhas que engrossam fio: (1) fio feito de fundo
aparecendo num vão (`gap` de .25 mm) — vão de fração de pixel sai ora com 1,
ora com 2 pixels; fio é sempre `border`; (2) duas bordas encostadas — células
brancas empilhadas, fio de linha somado à borda do quadro. Células empilhadas
levam respiro entre si (`.pilha`), a última linha de um quadro não leva fio,
e a ficha técnica marca `ult-col`/`ult-lin`. Conferir com um detector que
procura, em cada página, bordas de elementos diferentes encostadas.

**Rótulo e campo, em todo o laudo** (pedido do avaliador): o campo começa
logo depois do rótulo, e num mesmo quadro todos os campos alinham pelo
rótulo mais longo — `pares(ctx, [[rótulo, campo], …])`, uma grade só com
`max-content minmax(0, 1fr)`. No papel, o quadro (`.caixa.justa`) e a célula
branca solta (`celula()` → `.val.cel.justo`) terminam 7 mm depois do texto.
Quadros de uma mesma fileira ficam nas mesmas colunas (`.colunas`/`.coluna`).
Tabelas (dimensões, homogeneização, sensibilidade), o resultado da avaliação
e as fichas de pesquisa seguem como tabela.

**Espaçamento padronizado em todo o laudo** (pedido repetido do avaliador):
entre a faixa de título e o que vem embaixo, só o `margin-bottom` da própria
`.faixa` (1,3 mm) — nunca um `espaco()` logo depois de faixa; entre blocos,
`espaco()` (2 mm) ou `espaco('g2')` (4 mm). Quadros lado a lado vão numa
grade `.colunas` com cada um em `.coluna`, para ficarem da mesma altura. Os
títulos de observações ("OBSERVAÇÕES GERAIS…") usam `tit(…, 'menor')` ou
`.subtit`, ambos em negrito. A conferência é medir, na aba Impressão, a
distância de cada `.faixa` ao elemento seguinte: tem de dar um valor só.

Texto corrido (observações, justificativa, texto da liquidação) é editado com
uma **barra de ferramentas** — negrito, itálico, sublinhado, subtítulo e listas — e guardado como HTML de formatação. `limparHtml()` passa tudo por uma
lista de marcas permitidas (b, i, u, br, div, ul, ol, li, h4) antes de gravar e
antes de mostrar: atributos, estilos e scripts somem, inclusive do que vem
colado do Word. Tab insere tabulação (para alinhar colunas no texto). Estudos
da versão 3, com as marcas antigas ("# " subtítulo, `**negrito**`), migram em
`migrar()` (`P.versao = 4`). Na Capa, o quadro de observações desce até o fim
da folha (`pagina(…, { estica: true })` + `ctx.area(…, { estica: true })`).

### Imagens

**O campo de imagem tem tamanho fixo, definido pela página, e a imagem o
ocupa inteiro, sem corte — esticada até as bordas (`object-fit: fill`), como a
foto arrastada até o quadro no Excel** (pedido expresso do avaliador, vale
para toda a modelagem: logos, fotos, fichas, croquis, assinatura). Não troque
por `cover` (corta) nem `contain` (sobra borda): as duas já foram recusadas.
Em CSS: `.quadro-img` com altura própria e `flex: none`, e a `<img>` em
posição absoluta preenchendo o quadro. Um `flex: 1` no quadro já fez o campo
da Capa crescer com a foto; a conferência é inserir uma imagem muito alta e
uma muito larga e medir o quadro antes e depois.

Logos, fotos, croquis, assinatura e anexos entram **dentro de `P`**, como data
URL, reduzidos no navegador (`lerImagem`: fotos em JPEG até 1600 px, logos em
PNG até 700 px, anexos até 2400 px). A casca guarda o JSON como veio — por
isso o `PUT /api/estudos/:id/premissas` aceita até 40 MB (`LIMITE_PREMISSAS`
em `casca/rotas/estudos.js`), e a casca só usa `keepalive` ao sair da página
quando o corpo cabe nos 64 KB que o navegador permite. Sozinho no navegador o
estudo vai para o `localStorage`, que com fotos estoura: o módulo avisa e
sugere "Salvar". PDF não entra como anexo — exporte a página como imagem.

## O contrato de cálculo

- **Paradigma** (Fichas F11:AN16): área de terreno = estimada do terreno;
  área privativa = estimada privativa; vagas = Nº de vagas da **edificação**
  (Região + Imóvel), não o "Nº total de vagas" da capa — é o que a planilha lê.
- **Pc** = tabela IBAPE por padrão × intervalo; **Foc** (Ross-Heidecke) =
  `R + (1 − C)·(1 − ½(x + x²))·(1 − R)`, `x = idade / vida útil`.
- **Tabela A** (terrenos): área = área de terreno; fatores área, localização,
  testada, profundidade, topografia, mult. frentes, extras; resultante **sem**
  cota-parte.
  **Tabela B** (unidades padronizadas) e **C** (unidades isoladas): área =
  área construída; resultante `1 + (FA−1) + (FL−1)·cota terreno + (FP−1)·cota
  construção + (FI−1)·cota construção + demais (F−1)`. A C troca o fator vaga
  pelo **Au/Vg** = `((área/vagas do comparativo) ÷ (área/vagas do avaliando))^expoente`.
- **Fator área**: `(Acomp/Aav)^¼` com razão entre 0,7 e 1,3; senão `^⅛`.
  **Andar**: coeficiente do avaliando ÷ do comparativo (residencial se for
  apartamento; comercial nos demais, como a planilha).
- **Estatística**: média e desvio amostral (STDEV), t de Student bicaudal a
  80% (`T.INV.2T(0,2; n−1)`), amplitude `2·t·s/√n ÷ média`, precisão III até
  30%, II até 40%, I acima. Valor de mercado = média homogeneizada × área ×
  FAM; a capa arredonda **para cima** ao milhar (`ROUNDUP(x; −3)`).
- **Liquidação forçada**: (a) custo de oportunidade à taxa real líquida de IR
  (tabela regressiva por dias), (b) perda inflacionária sobre o VM já
  descontado, (c) IPTU e (d) condomínio a valor presente pela anuidade mensal.

### Sugestivo, aqui

Premissa `null` é "por informar": fator oferta (1,00 em venda, 0,90 em
oferta), cota-parte da construção (1 − terreno), expoente Au/Vg (0,089), FAM
(1). **Os fatores calculados aparecem em letra clara na própria tabela do
Cálculo; digitar um valor substitui o cálculo naquela célula** — é o Quadro
Auxiliar da planilha, célula a célula, em vez de uma chave por coluna. Fator
sem cálculo (testada, profundidade, mult. frentes, vaga, extras) vazio é
neutro.

## Onde o módulo se afasta da planilha (de propósito)

- **n = comparativos válidos.** A planilha conta sempre 5 graus de liberdade
  menos um (`COUNTA` sobre os números 1…5). Com amostra incompleta, o módulo
  usa só os comparativos com valor e área.
- **Dado ausente não derruba a linha.** Na planilha, andar ou vagas em branco
  num comparativo viram `#VALOR!` e a linha inteira sai da conta; aqui o fator
  daquele dado fica neutro e a linha segue.
- **Bugs da planilha que o módulo não copia**: na tabela A, os fatores extra
  das linhas 2 a 5 leem a chave da tabela C (`$AH$80`), e o "Fator Extra 1"
  procura um cabeçalho que não existe no Quadro Auxiliar (`#N/D`); o cabeçalho
  do Cálculo mostra "Fator Au/Vg" também nas tabelas A e B. Aqui cada tabela
  tem as suas colunas certas.
- "Poder de Preedição" virou "Poder de Predição".
- O método evolutivo (a outra opção da célula METODOLOGIA do Cálculo_apoio,
  com as linhas ocultas de benfeitoria) **não foi portado**: a metodologia
  é fixa em "Comparativo Direto de Dados de Mercado".

## Onde o módulo **copia** a planilha mesmo parecendo errado

- Capa: "Valor total" não soma o valor da vaga autônoma (AI50 = Cálculo!C67).

## Corrigido em relação à planilha, a pedido do avaliador

- **Dimensões (Capa)**: matrícula, IPTU, estimada e doc. complementar têm a
  mesma lógica — terreno, privativa e comum se digitam, e a construção total
  é privativa + comum em cada coluna. Na planilha, a comum estimada copiava a
  da matrícula (AD43 = T43) e a doc. complementar era texto livre ("-").
  Estudos da versão 1 são migrados em `migrar()` (`P.versao = 2`): a comum
  estimada recebe a da matrícula, e "-" na doc. complementar vira vazio.
- **Listas da Capa**: uso sem "-"; ocupação só Ocupado / Desocupado; tipos
  de laudo "Simplificado - Vistoria externa / interna / remota / Sem vistoria".
- **Todas as listas suspensas** saem sem "-" e em ordem alfabética
  (`Intl.Collator('pt-BR')`, no fim de `LISTAS`). O motor não depende dessa
  ordem: o Pc lê `INTERVALOS` (Mínimo → Máximo), que fica intacto. Valor "-"
  guardado vale como vazio na lista. As escalas de mercado da Liquidação
  (alto → baixo) não são listas e mantêm a ordem.
- **Registros profissionais**: CREA ou CAU / UF - número, com as duas
  listas e o número digitado — sob a assinatura, centralizado (`conselho`,
  `conselhoUF`, `conselhoNumero`), e na linha "REGISTRO" da empresa
  (`conselhoEmpresa…`), logo abaixo de EMPRESA e acima de RESPONSÁVEL TÉCNICO. Estudos da versão 2
  migram o antigo `creaEmpresa` para o número, com conselho e UF do responsável. A imagem de assinatura é
  opcional e, vazia, não deixa texto no papel — o laudo pode ser assinado
  com certificado digital.

- **Sensibilidade por variação do VM** (Liquidação forçada, J61:M67): a
  planilha tirava a perda inflacionária do VM cheio, e não do VM já
  descontado como em F39 — a linha 0% dava R$ 6.761.777 no laudo 33.794,
  contra o VLF de R$ 6.861.974 da mesma página. Agora cada linha usa a mesma
  conta do VLF (`deducoes(vm)`), e a linha 0% é o próprio VLF. A tabela por
  nível de deságio (D61:E67) já era coerente e não mudou.

## Ao mexer no motor

`testes/auditoria.js` confere, célula a célula, contra os valores que o
Excel gravou no arquivo (tabela C, laudo 33.794) e contra a mesma planilha
recalculada com a tabela trocada para A e para B (recalculada com `pycel` —
o LibreOffice do ambiente não tinha o Calc). A fixture `REF()` é independente
de `premissasVazias()` do `app.js`, de propósito. Todo defeito corrigido deve
ganhar na suíte o cenário que o expunha; o bloco `3d · AMOSTRA INCOMPLETA` é
onde moram as bordas.
