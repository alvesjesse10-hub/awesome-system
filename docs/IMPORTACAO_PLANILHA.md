# Importação da planilha histórica (CONTROLE_FINANCEIRO_AMBIENS.xlsm)

Este documento descreve o script `backend/scripts/import-legacy-spreadsheet.ts` (e os
módulos em `backend/scripts/legacy-import/`), que importa os dados históricos da
planilha Excel/macro (`CONTROLE_FINANCEIRO_AMBIENS.xlsm`) para o banco do sistema.
Cobre o mapeamento coluna a coluna de cada aba e todas as decisões tomadas para
dados que não têm equivalente exato no nosso schema.

**O arquivo real da planilha nunca deve ser commitado no repositório** — contém
dados financeiros e de clientes reais. Rode o script localmente apontando para o
caminho onde o arquivo está salvo na sua máquina.

## Como rodar

```bash
cd backend
npx ts-node scripts/import-legacy-spreadsheet.ts --file /caminho/CONTROLE_FINANCEIRO_AMBIENS.xlsm --dry-run
```

Revise o relatório impresso (quantos registros seriam criados, avisos de
aproximação, o que foi pulado e por quê). Quando estiver tudo certo, rode sem
`--dry-run` para gravar de verdade:

```bash
npx ts-node scripts/import-legacy-spreadsheet.ts --file /caminho/CONTROLE_FINANCEIRO_AMBIENS.xlsm
```

Flags:
- `--file` (obrigatório): caminho do `.xlsm`/`.xlsx`.
- `--dry-run`: faz todo o parsing e mapeamento e imprime o relatório, sem gravar
  nada no banco.
- `--imported-by-email`: e-mail do usuário responsável pela importação (usado nos
  campos `createdByUserId`); padrão `admin@ambiens.com.br`.

Pré-requisitos: banco migrado (`npx prisma migrate deploy`) e com o seed rodado
(`npx prisma db seed`) — o script assume que as 3 empresas (Ambiens/Smart/IGH), o
plano de contas base e o centro de custo "Geral" de cada empresa já existem.

Cada execução (dry-run ou não) grava um `ImportBatch` por aba processada, com
`rowsProcessed`, `rowsFailed` e o log de avisos/erros — exceto em modo dry-run,
onde nada é persistido.

## Ordem de execução

O orquestrador roda os importadores nesta ordem, porque cada um alimenta os
caches de contexto (`ImportContext`) usados pelos seguintes:

1. **Cadastro de contas** → reconcilia o plano de contas (subcategorias).
2. **Saldo bancos** → cria as contas bancárias.
3. **Cadastro de clientes** → carrega cache de enriquecimento (não cria clientes).
4. **Cadastro de pessoal** → cria colaboradores.
5. **Lançamentos** → cria lançamentos financeiros, transferências e clientes sob
   demanda.
6. **Acompanhamento** → cria os jobs/projetos.

## Aba "Cadastro de contas" → Plano de contas

Apesar do nome, esta aba **não é um cadastro de contas bancárias** — é a lista de
subcategorias do plano de contas, organizada em uma coluna por grupo (`Receitas`,
`Custo Fixo`, `Despesa Fixa`, `Custo Variável`, `Despesa Variável`, `Bonificação`,
`Investimentos`). O script lê cada coluna, reconcilia contra o plano de contas já
seedado (por grupo + nome normalizado) e cria as subcategorias que existem na
planilha mas não no banco.

## Aba "Saldo bancos" → Contas bancárias

Os nomes na coluna "Bancos" desta aba são as mesmas chaves usadas como "Centro de
custo" em Lançamentos: `Ambiens`, `Smart`, `IGH` (conta corrente de cada empresa),
`Aplicação Ambiens`, `Aplicação Smart`, `Aplicação Geral`, `Renda Fixa` (contas de
investimento). A linha `Total` é ignorada.

Toda conta é criada com **`initialBalance = 0`**. Isso não é uma perda de dado:
validamos matematicamente (reconciliação linha a linha) que o saldo desta aba é
100% derivado da soma dos lançamentos "Pago" da aba Lançamentos mais as
transferências entre contas. Importando o histórico completo de lançamentos (já
linkado por `bankAccountId`, ver abaixo) e as transferências, o saldo calculado
pelo sistema reproduz exatamente o saldo da planilha original — sem precisar
tratar o valor da planilha como um "saldo inicial" opaco.

Tipo da conta: `INVESTMENT` para as 4 contas de aplicação/renda fixa, `CHECKING`
para as 3 contas correntes de empresa.

### Empresa dona de cada conta / centro de custo

| Centro de custo / Banco | Empresa | Observação |
|---|---|---|
| Ambiens | Ambiens | |
| Smart | Smart | |
| IGH | IGH | |
| Aplicação Ambiens | Ambiens | |
| Aplicação Smart | Smart | |
| Aplicação Geral | Ambiens | **aproximação** — planilha não indica dono; atribuída à empresa titular do arquivo |
| Renda Fixa | Ambiens | **aproximação** — mesma razão acima |

Todo lançamento cujo "Centro de custo" caia em uma dessas duas aproximações gera
um aviso no relatório (`planilha não indica a empresa dona; atribuída a Ambiens
por padrão (revisar depois)`), para que alguém possa mover manualmente pela tela
se necessário.

## Aba "Cadastro de clientes" → enriquecimento (não cria Client diretamente)

A aba real só tem ~2 linhas preenchidas e não indica a empresa dona de cada
cliente. Em vez de criar `Client` a partir dela (o que forçaria uma empresa
arbitrária), o script guarda os dados de contato num cache em memória (nome
normalizado → email/telefone/endereço/documento) e usa esse cache só para
**enriquecer** clientes criados sob demanda durante a importação de Lançamentos —
que sabem a empresa certa porque a receita tem um Centro de custo.

## Aba "Cadastro de pessoal" → Colaboradores (`Employee`)

A aba (8 linhas reais) também não indica empresa — todos os colaboradores são
importados sob **Ambiens** (empresa titular do arquivo). Mova manualmente pela
tela de Colaboradores se algum pertencer a Smart/IGH.

A coluna "Comissão" contém valores em R$ (ex.: 1700, 4900), não percentuais — por
isso `commissionType` é sempre `FIXED` na importação, diferente do padrão
`PERCENTAGE` usado no cadastro manual pela tela.

Colunas: Nome, Email, Contato→`phone`, cpf/cnpj→`document`, Pix→`pixKey`,
Função→`role` (padrão "Não informado" se vazio), Remuneração→`baseSalary`,
Comissão→`commissionValue`.

## Aba "Lançamentos" → `FinancialEntry` / `AccountTransfer`

Colunas usadas (cabeçalho na linha 15 da planilha real): Cliente, Descrição,
N°f, Tipo, Centro de custo, Plano de contas, Valor, N° parcelas, Data de
entrada, Data de vencimento, Data de pagamento, Status, situação.

### Linhas puladas

Uma linha é pulada (e um aviso é registrado) quando:
- `Tipo` ou `Centro de custo` está vazio — normalmente linhas de planejamento
  futuro incompletas (ex.: orçamentos para eventos de 2026/2027 ainda sem centro
  de custo definido), confirmado inspecionando os dados reais.
- `Valor`, `Data de entrada` ou `Data de vencimento` inválidos/ausentes.
- O `Centro de custo` não é reconhecido (ver tabela acima).
- A categoria (`Plano de contas` + grupo derivado do `Tipo`) não existe no plano
  de contas, mesmo após a reconciliação da aba Cadastro de contas.

### Natureza, categoria e conta bancária

- `Tipo` → grupo do plano de contas (`mapEntryGroup` em `mappings.ts`):
  `Receitas`→RECEITA, `Custo Fixo`→CUSTO_FIXO, `Despesa Fixa`→DESPESA_FIXA,
  `Custo Variável`→CUSTO_VARIAVEL, `Despesa Variável`→DESPESA_VARIAVEL,
  `Bonificação`→BONIFICACAO, `Investimentos`→INVESTIMENTO.
- `nature` (REVENUE/EXPENSE) é derivada do grupo resolvido (RECEITA→REVENUE,
  qualquer outro→EXPENSE), consistente com o resto do sistema — não confiamos no
  sinal da própria planilha para isso.
- `bankAccountId` é resolvido casando o nome do `Centro de custo` diretamente com
  o nome de uma `BankAccount` da empresa resolvida (mesma chave usada na aba
  Saldo bancos).
- `clientId` só é preenchido em lançamentos de RECEITA, usando a coluna
  `Cliente` (nome da agência). O cliente é criado sob demanda
  (`findOrCreateClient`), escopado à empresa resolvida, e enriquecido com dados
  do cache de "Cadastro de clientes" se o nome bater.
- `supplierId` **nunca** é preenchido pela importação. Lançamentos de despesa não
  têm uma referência formal de fornecedor na planilha — o nome do fornecedor,
  quando existe, está embutido no texto livre da `Descrição`. Optamos por não
  fabricar registros de `Supplier` a partir desse texto livre; quem quiser
  formalizar fornecedores específicos pode fazer isso manualmente depois.
- `status`: `PAID` se `Data de pagamento` estiver preenchida, senão `PENDING` —
  não confiamos nas colunas de texto `Status`/`situação` da própria planilha para
  essa decisão (elas viram apenas o campo livre `situacao`, mantido para
  referência).

### Parcelamento

**Só é tratado como parcelamento (linhas agrupadas sob o mesmo
`installmentGroupId`) quando a própria planilha preenche explicitamente a coluna
"N° parcelas"** — o que acontece em 78 das 2698 linhas reais. Sem esse sinal
explícito, cada linha vira seu próprio lançamento independente
(`installmentTotal = 1`), mesmo que compartilhe Cliente/Descrição/Tipo/Centro de
custo idênticos com outras linhas.

Essa regra existe porque a planilha reaproveita descrições genéricas para
lançamentos recorrentes **não relacionados** — por exemplo, "Aplicação
financeira" aparece em dezenas de movimentações de investimento distintas ao
longo de mais de um ano, e salários mensais usam o nome do colaborador como
`Descrição` (ex.: "Kelwin" se repete todo mês). Agrupar por
Cliente+Descrição+Tipo+Centro de custo sem exigir o sinal de parcela explícito
originalmente causou grupos de parcelamento falsos (ex.: 19 "parcelas" de
"Aplicação financeira" com datas e valores completamente diferentes ao longo de
16 meses) — corrigido antes da importação final.

Quando o agrupamento é válido (78 linhas com `N° parcelas` preenchido, formando
grupos reais como "NETFLIX | ONE PIECE ATIVAÇÃO 2° TEMPORADA | V00" com 5
parcelas), o número da parcela e o total do grupo vêm diretamente da planilha; o
`installmentGroupId` é gerado (`randomUUID()`) só para grupos com mais de uma
linha.

### Transferências entre contas

Linhas com `Tipo` = `Trasf.sáida`/`Trasf.Entrada` **e** descrição
"Transferencia entre contas" são pareadas por (valor, data) com a linha oposta
(saída ↔ entrada) e viram um único `AccountTransfer`. No arquivo real, isso
produz 4 pares: 3 transferências Smart→Ambiens e 1 IGH→Ambiens.

Linhas do mesmo tipo mas com outra descrição (ex.: "Ajuste de conta", 3 linhas
reais) não têm um par correspondente e **não** são modeladas como
`AccountTransfer` fabricando um lado inexistente. Em vez disso, viram um
`FinancialEntry` normal na categoria "Outras Receitas" (entrada) ou "Outras
Despesas" (saída), preservando o efeito no saldo da conta sem inventar dado que
a planilha não tem.

Transferências sem par (não deveria acontecer no arquivo real, mas o script
trata defensivamente) geram um aviso e são puladas.

## Aba "Acompanhamento" → `Job`

404 jobs reais, cabeçalho na linha 8. Todos são importados sob a empresa
**Ambiens** — a planilha não distingue a empresa dona de cada job — com um aviso
único no relatório. `clientId` e `responsibleEmployeeId` ficam sempre `null`:
"Marca"/"Agência" são texto livre que não batem de forma confiável com registros
formais de `Client`, e a coluna "Responsavél" só contém placeholders
("Exemplo 01".."Exemplo 05") que não correspondem a nenhum colaborador real do
Cadastro de pessoal.

Linhas com nome duplicado (6 casos reais, ex.: "ESCRITORIO VOE | V00" aparece
duas vezes) são deduplicadas — a segunda ocorrência é pulada, já existindo um job
com aquele nome na empresa.

### Resolução da etapa do funil (`funnelStage`)

A planilha real não tem uma única coluna com os 8 valores do nosso enum
`FunnelStage` — a informação está espalhada entre `Status`, `Etapas` e `Situação
da proposta`. `resolveFunnelStage()` (em `import-acompanhamento.ts`) aplica, nesta
ordem de prioridade:

1. `Status` = `ENTREGUE` ou `NÃO INICIADA` → mapeamento direto.
2. `Situação da proposta` = `Ajuste com custo` ou `Pacote de ajustes` → `AJUSTE`.
3. `Etapas` = `Aguardando Pagamento` (genérico na planilha) → resolvido pelo tipo
   de venda do job: `RISCO_SUCCESS` → `AG_PAGAMENTO_RISCO`, senão →
   `AG_PAGAMENTO_UNICO`.
4. `Etapas` mapeado diretamente (`Follow`, `Finalizado`, `Ag. Pagamento Único`,
   `Ag. Pagamento Risco`; `Ag. Pagamento Success` é aproximado para
   `AG_PAGAMENTO_RISCO` por ser a etapa de recebimento variável mais próxima —
   não existe um equivalente "success" separado no nosso enum).
5. `Situação da proposta` = `Proposta aprovada` → `PROPOSTA_APROVADA`.
6. Padrão: `FOLLOW`.

### Outras aproximações de enum (valores reais sem equivalente exato)

- `Situação da proposta` = `Caiu por verba` → `ProposalStatus.PROPOSTA_REPROVADA`
  (motivo orçamento, leitura mais próxima do enum atual).
- `Resultado` = `Sem concorrência` → `JobResult.AGUARDANDO_RETORNO` (descreve a
  disputa, não um desfecho — sem informação melhor, cai em aguardando).
- Campos livres da planilha (`Tamanho do projeto`, `Tipo do evento`, `Produto`)
  que não batem com nenhum valor do enum correspondente (ex.: `"."` como
  placeholder, `"Especial"`, `"Loja, Escritorio"`) ficam em branco no registro
  importado, com um aviso no relatório listando o valor original não reconhecido.

### Valores preservados diretamente

`calculatedCommission` é importado com o valor que já estava na coluna
"Comissão" da planilha, **sem recalcular** — preserva a comissão histórica tal
como foi registrada na época, mesmo que o cálculo atual do sistema
(`calculateCommission()`) pudesse divergir para o mesmo job.

## Validação de correção

Antes de considerar o script pronto, validamos:

1. **Reconciliação de saldo bancário**: para as 7 contas reais, o saldo
   calculado pelo sistema (`initialBalance` + receitas pagas − despesas pagas +
   transferências recebidas − transferências enviadas) bate **exatamente** com o
   valor da coluna "Saldo" da aba Saldo bancos, centavo a centavo.
2. **Transferências**: os 4 pares reais de "Transferencia entre contas" batem
   por valor e data; as 3 linhas de "Ajuste de conta" (sem par) foram
   corretamente convertidas em lançamentos avulsos.
3. **Parcelamento**: nenhum grupo de parcelamento é maior que o maior valor real
   de "N° parcelas" observado na planilha (11); nenhuma linha sem "N° parcelas"
   preenchido é agrupada com outra.
4. **Jobs**: valores de exemplo conferidos manualmente contra a planilha original
   (ex.: "BYD | INTERLAGOS 2025 | V00" → risco R$ 12.900, success R$ 20.500,
   comissão R$ 3.075, tudo batendo com a linha correspondente na aba
   Acompanhamento).

## Limitações conhecidas / trabalho manual pós-importação

- Colaboradores, clientes de "Cadastro de clientes" e jobs sempre entram sob
  Ambiens quando a planilha não indica a empresa — revisar e mover manualmente
  quem pertence a Smart/IGH.
- `Aplicação Geral` e `Renda Fixa` são atribuídas a Ambiens por suposição.
- `supplierId` nunca é preenchido — formalizar fornecedores é trabalho manual
  futuro, se desejado.
- `responsibleEmployeeId` dos jobs nunca é preenchido (dado da planilha não é
  confiável para isso).
