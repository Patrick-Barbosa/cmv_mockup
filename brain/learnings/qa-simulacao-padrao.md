# QA — Parâmetros Padrão de Simulação

Sempre usar valores com **impacto agressivo** para validar visualmente que o cálculo funcionou.

## Insumo

| Campo | Valor |
|-------|-------|
| Insumo | Farinha de trigo |
| Preço simulado | R$ 600,00 |

Justificativa: Farinha de trigo tem custo atual baixo (~R$ 3/kg). Elevar para R$ 600 gera impacto enorme no CMV de receitas como Pizza margherita, visível nos KPI cards e tabelas.

## Receita

| Campo | Valor |
|-------|-------|
| Receita | Pizza margherita |
| Preço simulado | R$ 300,00 |

> ⚠️ **Nome exato no banco**: "Pizza margherita" (com 'm' minúsculo, 'gh'). Verifique com `curl /api/get_produtos_select2?q=Pizza` antes de usar.

Justificativa: Pizza margherita usa farinha como insumo principal. O impacto deve aparecer em vários componentes da árvore e no CMV final.

## Procedimento de Verificação

1. **Selecionar insumo/receita** no combobox — pausa 2s
2. **Preencher preço simulado** — pausa 1s
3. **Clicar "Simular Impacto"** — aguardar 12s
4. **Rolar a página seção por seção** (lento, com pausas de 3-4s entre cada):
   - Seção 1: KPI cards (Impacto na Rede, CMV Médio, etc.)
   - Seção 2: Gráfico Evolução Custo
   - Seção 3: Tabela Resultados por Loja
   - Seção 4: Tabela Receitas Impactadas
5. **Sempre gravar VÍDEO** (`playwright-cli video-start / video-stop`) — não apenas screenshot
6. **Verificar** que itens com impacto (vendas > 0) aparecem PRIMEIROS na tabela
7. **Verificar** que itens com zero vendas (receitas intermediárias) aparecem por último

## Critérios de Aceite do Vídeo

- Vídeo mostra toda a página (do topo ao fim) com scroll lento seção por seção
- KPI cards mostram valores não-zero (impacto real)
- Receitas com vendas aparecem primeiro na tabela
- Tabelas mostram linhas com dados
- Gráfico renderiza sem erro
- Nenhum console.error no navegador

## Critérios de Aceite

- KPI cards mostram valores não-zero (impacto real)
- Tabelas mostram linhas com dados
- Gráfico renderiza sem erro
- Nenhum console.error no navegador

## Por que isso é importante

Simulações com valores baixos ou insumos sem vínculo com receitas produzem resultados zerados — não é possível distinguir entre "cálculo funcionou e deu zero" de "cálculo quebrou e mostrou zero".
