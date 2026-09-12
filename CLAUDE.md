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

`index.html` carrega React 18 UMD, ReactDOM e Babel standalone do cdnjs, e roda o JSX direto no navegador dentro de `<script type="text/babel">`.

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
                  medicoes: [{ id, data, descricao, valor, recebida }],
                  etapas:   [{ id, t, ok }],
                  equipe:   [{ id, nome, funcao, diaria }] }],
  lancamentos: [{ id, data, desc, valor, tipo: "e"|"s", forma, status: "pago"|"previsto",
                  vencimento, categoria, obraId, ativoId, contratoId, aporte }],
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

1. **Hospedar** — é a tarefa imediata, ver PRIMEIRO-PROMPT.md
2. Service worker para funcionar offline de verdade; hoje a primeira carga precisa de internet por causa do CDN
3. Pré-compilar o JSX para dispensar o Babel no navegador e acelerar a abertura
4. Gerar ícone PNG 192 e 512 além do SVG, para compatibilidade mais ampla
5. Backup automático periódico, já que hoje depende de ele lembrar

## Como trabalhar com ele

Entregue mudanças pequenas e testáveis. Depois de cada alteração, diga em uma frase o que ele vai ver de diferente na tela. Se uma mudança puder afetar dados existentes, mande ele fazer backup antes.
