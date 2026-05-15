# QA — Parâmetros Padrão de Simulação

Sempre usar valores com **impacto agressivo** para validar visualmente que o cálculo funcionou.

## Insumo

| Campo | Valor |
|-------|-------|
| Insumo | Farinha de trigo |
| Preço simulado | R$ 600,00 |

Justificativa: Farinha de trigo tem custo atual baixo (~R$ 3/kg). Elevar para R$ 600 gera impacto enorme no CMV de receitas como Pizza Marguerita, visível nos KPI cards e tabelas.

## Receita

| Campo | Valor |
|-------|-------|
| Receita | Pizza Marguerita |
| Preço simulado | R$ 300,00 |

Justificativa: Pizza Marguerita usa farinha como insumo principal. O impacto deve aparecer em vários componentes da árvore e no CMV final.

## Procedimento de Verificação

1. **Selecionar insumo/receita** no combobox — snapshot para confirmar
2. **Preencher preço simulado** — snapshot
3. **Clicar "Simular Impacto"** — aguardar 10s
4. **Rolar a página** para ver:
   - KPI cards (Impacto na Rede, CMV Médio, etc.) — valores devem ser visivelmente diferentes de zero
   - Gráfico Evolução Custo — deve mostrar barras azul vs laranja com diferença
   - Tabela Resultados por Loja — deve ter valores diferentes de zero
   - Receitas Impactadas (modo insumo) / Tabela de Composição (modo receita)
5. **Capturar screenshot** da seção de resultados como evidência

## Critérios de Aceite

- KPI cards mostram valores não-zero (impacto real)
- Tabelas mostram linhas com dados
- Gráfico renderiza sem erro
- Nenhum console.error no navegador

## Por que isso é importante

Simulações com valores baixos ou insumos sem vínculo com receitas produzem resultados zerados — não é possível distinguir entre "cálculo funcionou e deu zero" de "cálculo quebrou e mostrou zero".
