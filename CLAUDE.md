# Painel de Comando — Dialética

## Quem usa

Franklin, dono da Dialética, empresa de projeto e execução de obras elétricas em São Mateus, Espírito Santo. **Ele não é programador.** Explique decisões em linguagem simples, sem jargão, e nunca peça que ele edite código. Ele descreve o que quer em português e você implementa.

Toda a interface é em português do Brasil. Moeda em real, datas em dd/mm/aaaa.

## O que é o projeto

Um painel de gestão que roda no celular dele como aplicativo instalado. Cobre a empresa (custos, contratos, obras, caixa) e a vida pessoal (custo de vida, patrimônio, renda passiva), porque o plano dele é usar o lucro da empresa para construir ativos que geram renda.

O painel não é um ERP. Ele existe para responder uma pergunta por vez e travar decisões erradas. Não transforme em software genérico de gestão.

## Stack e estrutura

Sem build, sem npm, sem framework de projeto. Decisão deliberada: ele precisa poder trocar um arquivo e pronto.

```
index.html      todo o código, inclusive CSS e React
manifest.json   torna instalável como aplicativo
icone.svg       ícone da tela inicial
```

`index.html` carrega React 18 UMD e ReactDOM da pasta `vendor/` (baixados do cdnjs, sem CDN em produção — funciona offline). O JSX foi **pré-compilado uma vez** (setembro/2026) para JS puro (`React.createElement(...)`) dentro de um `<script>` comum, para não depender de Babel no navegador. O código continua legível e editável normalmente — só trocou a sintaxe de tag por chamada de função.

`build.js` foi a ferramenta usada nessa conversão única (procura `<script type="text/babel">`, que não existe mais no arquivo — não precisa rodar de novo). Se quiser escrever um trecho novo em JSX por conveniência, `vendor/babel.min.js` continua na pasta (não é carregado pelo navegador) e pode ser usado via Node para transformar esse trecho antes de colar no lugar certo.

**Não introduza dependências novas, bundler, TypeScript ou múltiplos arquivos de código sem pedir autorização.**

## Armazenamento

Tudo num único registro do `localStorage`, chave `dialetica:painel`, gravado como JSON, com debounce de 700ms. O objeto `loja` isola isso; se precisar mudar de mecanismo, mude só ali.

Existe `migrar(s)` para converter dados de formatos antigos, controlado pelo campo `versao`. **Se alterar a forma dos dados, escreva a migração junto e incremente a versão.** Ele já tem dados reais lançados; perder isso é inaceitável.

A aba Backup exporta e importa o JSON inteiro. Mantenha ela funcionando em qualquer refatoração.

## Modelo de dados

```js
{
  custos:      [{ id, nome, valor, tipo: "fixo"|"variavel", unidade: "mes"|"obra"|"percentual" }],
  contratos:   [{ id, cliente, valor, meses, inicio, ativo, escopo,
                  visitas: [{ id, data, servico, obs, feita }] }],
  obras:       [{ id, cliente, nome, contrato, custoPrevisto, inicio, prazo, status, obs,
                  medicoes: [{ id, data, descricao, valor, recebida, vencimento }],
                  etapas:   [{ id, t, ok }],
                  equipe:   [{ id, nome, funcao, diaria }] }],
  lancamentos: [{ id, data, desc, valor, tipo: "e"|"s", forma, status: "pago"|"previsto",
                  vencimento, categoria, obraId, ativoId, contratoId, aporte, medicaoId }],
  ativos:      [{ id, nome, investimento, retorno, status: "fila"|"execucao"|"operando",
                  etapas, obs }],
  clientes:    [{ id, nome, contato, tipo, origem }],
  metas:       [{ id, nome, alvo, prazo, fonte, atual, submetas: [{ id, t, ok }] }],
  custoVida:   [{ id, nome, valor }],
  rendas:      [{ id, nome, valor }],
  patrimonio:  [{ id, nome, valor, tipo }],
  saldoInicial, reserva, giro, fundoAtivos,
  potes: { reserva, giro, ativos },
  marcos: { margens, ciclo, operacao60, lucro6, primeiroAtivo6 },
  fechamentos: { "2026-09": { fixos, contratos, lucro } },
  ultimoBackup, versao
}
```

**`lancamentos` é a única fonte de verdade sobre dinheiro.** Obra, ativo e caixa filtram esse array por `obraId` / `ativoId`. Nunca volte a guardar valores financeiros dentro de obra ou de ativo: foi exatamente o bug que tornou o painel inconsistente.

**Toda medição gera, na hora em que é lançada, um `lancamento` espelho com `status: "previsto"` e `medicaoId` apontando pra ela** (setembro/2026). É assim que uma medição pendente aparece em "a receber" no Caixa e no Painel, com data prevista. Ao marcar a medição como recebida, é esse MESMO lançamento que muda para `status: "pago"` — nunca crie um lançamento novo nesse momento, senão duplica dinheiro. Excluir uma medição também deve excluir o lançamento vinculado (por `medicaoId`), senão sobra um "a receber" fantasma. Dados de antes dessa mudança (sem `medicaoId`) foram migrados uma vez em `migrar()` (`versao` 2 → 3): toda medição pendente sem vínculo ganhou seu lançamento previsto retroativamente.

## Regras de negócio (o coração do produto)

Estas regras foram desenhadas com ele e não são preferência de interface. **Não altere sem perguntar.**

Fases, em ordem, cada uma liberada só quando a anterior fecha:

0. Saber os números — custo fixo levantado, variáveis mapeados, margem por tipo de obra, ciclo de caixa em dias
1. Previsibilidade — contratos de manutenção cobrindo 100% do custo fixo
2. Sair do operacional — reserva de 3 meses e encarregado contratado antes de qualquer ajudante
3. Subir o ticket — operação rodou 60 dias sem ele no canteiro
4. Primeiro ativo — reserva de 6 meses e lucro em 6 meses seguidos
5. Segundo ativo — primeiro ativo se pagando há 6 meses

Divisão do lucro em três potes, nesta prioridade: reserva até 6 meses de custo fixo, capital de giro, fundo de ativos. **Enquanto a reserva não enche, o fundo de ativos recebe zero** e a parte dele é desviada para a reserva.

Travas que aparecem em vermelho no Painel: mais de um ativo em execução; dinheiro no fundo de ativos com reserva abaixo de 6 meses; folha no custo fixo sem o recorrente cobrir 100%; cobranças vencidas.

Dois medidores no topo, e são o produto inteiro: recorrente sobre custo fixo (empresa) e renda passiva sobre custo de vida (vida).

## Design

Metáfora: quadro de distribuição. Cada fase é um disjuntor que fecha quando energiza.

Paleta em variáveis CSS no bloco `CSS`: base `#E7E7E1`, papel `#F7F7F2`, carbono `#22252A`, neutro `#3C7FB1`, terra `#4F8B3B`, fase `#B4292E`, cobre `#A9702B`. Vêm das cores de fio da NBR. Tipografia Barlow e Barlow Condensed.

Cantos de 2px, quase sem sombra, aparência de equipamento e não de SaaS. Mantenha isso.

Feito para tela de celular estreita, cerca de 380px. Teste mentalmente nessa largura antes de entregar.

## Estado atual

Funciona: custos fixos e variáveis com sugestões, contratos com agenda de visitas, obras com medições, gastos, etapas e equipe, caixa com contas a receber e a pagar, fechamento mensal em três toques, fluxo de caixa projetado, metas com submetas, ativos com aportes e payback real, vida, clientes, backup.

## Pendências conhecidas

1. ~~Hospedar~~ — feito: GitHub Pages, publica sozinho a cada `git push` (repo `painel-dialetica`)
2. ~~Service worker~~ — feito (`sw.js`, cache `dialetica-v1`). Testado de verdade (servidor local derrubado / rede desligada via DevTools): o painel abre normalmente sem internet depois da primeira visita.
3. ~~Pré-compilar o JSX~~ — feito, ver nota acima sobre `build.js`
4. ~~Gerar ícone PNG 192 e 512~~ — feito (`icone-192.png`, `icone-512.png`, gerados do `icone.svg` via Chrome headless), incluídos no manifest e no `<head>`
5. Backup automático periódico, já que hoje depende de ele lembrar

## Como trabalhar com ele

Entregue mudanças pequenas e testáveis. Depois de cada alteração, diga em uma frase o que ele vai ver de diferente na tela. Se uma mudança puder afetar dados existentes, mande ele fazer backup antes.
