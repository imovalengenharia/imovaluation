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
linha) e Padrão construtivo (antes "Unidade privativa"); na Capa, Imóvel (dois quadros com a mesma coluna
de pergunta), Dimensões (`table.t.ficha-t`: cabeçalho e primeira coluna
sombreados; duas tabelas de colunas fixas, alinhadas com os quadros do
Imóvel) e Resultado (seis colunas fixas; vaga autônoma e valor total em
quadros próprios abaixo, nas mesmas colunas — resposta esticada e recorte
vazio na grade foram recusados); e depois estendido à Região: Serviços públicos
(2 pares por linha) e os três quadros de baixo (padrão/ocupação,
tráfego/implantação, zoneamento), cada ficha esticada à altura da coluna. Recusados antes: quadros soltos de pares, que
sobravam espalhados no papel, e rótulo pequeno sobre o valor em células
largas ("muito espaço para pouco preenchimento; não dá para saber o que é
pergunta e o que é resposta").

**Página da Região + Imóvel** (pedido do avaliador): as observações da região
têm altura fixa de 78 mm (2/3 do que ocupavam esticadas); a faixa é
"Infraestrutura do empreendimento"; as duas perguntas de divergência de área
abrem a página de Restrições. Ambientes: 5 linhas no mínimo — padrão pedido pelo avaliador; a migração 4 → 5 tira as linhas vazias do fim de estudos antigos (não precisam
acabar no fim da página); um só botão, "+ Adicionar linha" (sem botão de remover
— recusado), acrescenta até `AMB_MAX` (17), o que cabe na página — sem
página de continuação, pedido do avaliador. Mudou a altura das observações ou
de algo acima da tabela, remeça `AMB_MAX`.

**Capa**: fachada e logradouro com 80 mm de altura (pedido do avaliador); as
observações gerais da avaliação esticam até o fim da página e ficam com o
que sobra (~94 mm). Crescer algo na Capa encolhe as observações.

**Células da mesma cor encostadas** (sombreada sobre sombreada, marinho ao
lado de marinho) se separam por fio branco (`--pg-cel`), só por dentro — a
borda de fora do quadro fica. Pedido do avaliador: "parecem grudadas".

**Nenhuma lista corta o texto**: a opção mais longa cabe no campo; as linhas
das fichas das amostras com listas longas têm colunas próprias; "Idade
estimada" virou "Idade". Travado no teste "a opção mais longa de cada lista
cabe no campo".

**Divisão interna por ambiente** (pedido do avaliador, com a proposta
técnica): Ambiente (16%, digitado pelo avaliador — sem lista nem sugestão, pedido dele),
Qtd., e acabamentos em listas com cabeçalho em dois níveis: REVESTIMENTOS
(piso `revPiso`, parede `revParede`, teto/forro `revTeto`) e ESQUADRIAS
(portas `portas`, janelas `janelas`). Chaves das premissas mantidas (piso,
parede, teto, porta, esquadrias): texto antigo fora da lista continua
aparecendo (a lista o acrescenta). "Não vistoriado" serve à vistoria remota.

**Listas que crescem sobrevivem ao reabrir**: `mesclar()` junta o salvo ao
estado inicial; lista salva mais longa que a do molde (linhas de ambiente
acrescentadas) entra inteira, sobre o molde da primeira linha. Antes, era
cortada no tamanho padrão e a linha acrescentada sumia ao reabrir. Travado
no teste "linhas de ambiente: 5 de saída, e as acrescentadas voltam".

**Ponto de extensão da barra de texto** (`window.ComparativoExtensoes.barraTexto`,
em `ctx.area`): inerte por padrão; quem hospeda a página pode acrescentar
botões à barra de um quadro de texto, recebendo `{caminho, barra, area,
editor, pegar, escrever}`. A versão de revisão (claude.ai) usa para testar
a redação por IA das observações da região. Na plataforma, a IA virá pela
casca (servidor, com a chave da API e busca na web), nunca de `fetch` do
módulo.

**Um formato de campo em todo o laudo** (pedido do avaliador: "input de capa
igual input de restrição"). Todo par rótulo → valor está no formato da ficha
técnica: `ficha()` (grade) ou `table.t.ficha-t` (tabela). Restrições
(`tabelaPerguntas`: pergunta sombreada, resposta e observação brancas),
fichas de pesquisa (paradigma 4 pares por linha; amostras 3 pares, listas
longas na primeira coluna, foto ao lado), premissas e deduções da liquidação,
níveis de mercado e o deságio seguem esse formato. Rótulo curto em
maiúsculas; pergunta ou fórmula longa em letra de frase (`table.perguntas`).
Títulos: de seção com `tit()` (10,5 pt, letra de título); de quadro de texto
com `tit(…, 'menor')` em maiúsculas ("OBSERVAÇÕES GERAIS"). Rótulos marinho
(capa e topo do Cálculo) sempre em negrito. Nenhuma página começa com
`espaco()`: o conteúdo começa à mesma distância do cabeçalho.

**Sem valor é "-", em todo campo** (pedido do avaliador). Texto, lista,
data, número e cálculo vazios saem como traço no papel e mostram traço na
tela (placeholder, opção vazia da lista). Valor em R$ vazio ou zero é só
"-", sem o "R$" (`rs()`; o prefixo do campo some enquanto vazio). Exceções,
com `vazio: ''`: linhas em branco da tabela de ambientes, nome e registro
sob a assinatura; as marcas "X" da liquidação não são campo.

**Uma altura de linha só** (pedido do avaliador, repetido: "divergências nas
alturas das linhas dos campos"). Token `--alt-linha` (4,95 mm = 4,6 mm + 1 pt, pedido do avaliador) no `.pagina`:
todo `.rot`, `.val`, `.ficha-perg/.ficha-resp`, `td` e `th` de uma linha de
texto mede isso, fio incluído — linha com fio próprio no `.g` (caixas,
`.linhas`, fichas das amostras) desconta o fio da altura mínima. Nada de
`min-height`/`height` solto em campo; na tabela, o campo não pesa na
largura da coluna (`td .c{width:0;min-width:100%}`), para o cabeçalho quebrar
igual na tela e no papel. Única exceção: Zoneamento (`.ficha-tec.dupla`),
campo de duas linhas esticado à altura dos quadros vizinhos. **Regressão
travada** em `testes/navegador/comparativo.test.js` ("todas as linhas de
campo têm a mesma altura"), que mede cada linha, no papel e em cada aba, e
confere que cada página da tela termina onde termina a impressa.

**A tela mede o mesmo que o papel** (pedido do avaliador: "o espaçamento da
impressão representado fielmente nas abas de preenchimento"). Cada página da
tela tem, bloco a bloco, a altura da página impressa. Por isso: o campo `.c`
tem a altura da linha de texto (sublinhado em sombra, sem respiro vertical);
campo de texto estreito que no papel quebra de linha usa `quebra: true`
(textarea de uma linha que cresce); vazio no papel ocupa uma linha (espaço de
largura zero); a barra de formatação fica na linha do título, fora do fluxo;
botões só de tela (linhas de ambiente, adicionar fotos) ficam abaixo da
grade, fora do fluxo (`.com-botoes` + `.linha-botoes`); as fotos paginam como
no papel. Conferir com um script que compara, página a página, a altura de
cada bloco do `.corpo` na tela e na aba Impressão.

**Tópico novo** (`.tit`, `.subtit`): 5 mm de respiro dos campos de cima, em
todo o laudo, sem `espaco()` antes; o primeiro da página fica a 2,6 mm.

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
