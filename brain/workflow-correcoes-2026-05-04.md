# Workflow de Correções - SimulatorPage
## Data: 2026-05-04 | Status: ✅ Backend Validado | ⏳ Validação Visual Pendente

---

## 🔄 Fluxo Executado

### Etapa 1: PO Identifica Bugs
- **Problema 1**: Faturamento simulado menor que atual (ao aumentar preço)
- **Problema 2**: Gráfico não mostrava todos os dias
- **Problema 3**: Unidades não aparecem em sub-componentes

### Etapa 2: Backend Developer Corrige
- **Arquivo**: `backend/app/services/simulator_service.py`
- **Correções**:
  1. Linha ~161-181: Faturamento usa `change_value` como preço de venda (não custo)
  2. Linha ~132-133: Permite simulação de receita sem componentes (só preço venda)
  3. Linha ~807-809: Adiciona todos os dias ao gráfico (não só dias com vendas)

### Etapa 3: Validação API (Passou ✅)
```
1. Faturamento Simulado (receita):
   - Faturamento atual: R$ 291.50
   - Faturamento simulado: R$ 990.00
   - Impacto: +R$ 698.50 (AUMENTOU!) ✅

2. Gráfico (30 dias):
   - Total dias: 30 ✅
   - Primeiro: 2026-04-01 ✅
   - Último: 2026-04-30 ✅

3. Unidades nos componentes:
   - API retorna campo "unidade" ✅
```

### Etapa 4: Validação Visual (Pendente ⏳)
- Navegador MCP não conectado
- Precisa verificar no navegador:

---

## 🎯 Validações Visuais Necessárias

### Teste 1: Faturamento Simulado
1. Acessar http://localhost:8080
2. Selecionar **Receita**: "Bolo de pote de chocolate"
3. Alterar **Preço Simulado** de R$ 13,25 para R$ 45,00
4. Clicar em "Simular Impacto"
5. **Verificar na tabela**:
   - Faturamento atual deve ser R$ 291,50
   - Faturamento simulado deve ser R$ 990,00
   - Impacto deve ser POSITIVO (+R$ 698,50)

### Teste 2: Gráfico de Evolução
1. Após simular, verificar gráfico de linhas
2. **Verificar**:
   - Gráfico deve mostrar 30 dias (não apenas 5)
   - Dias sem vendas devem aparecer com valor 0

### Teste 3: Unidades na Composição
1. Selecionar uma **Receita** (não insumo)
2. Clicar em editar composição
3. **Verificar**:
   - Cada componente deve mostrar a unidade (kg, g, un)
   - Sub-componentes também devem mostrar unidade

---

## 📁 Evidências

### Arquivo Principal
`brain/evidencias-correcoes-2026-05-04.md`

### Resumo dos Fixes
| Bug | Correção | Status |
|-----|----------|--------|
| Faturamento simulado | change_value = preço venda | ✅ API validado |
| Gráfico dias | retorna 30 dias | ✅ API validado |
| Unidades | API retorna unidade | ✅ API validado |

---

## 🔧 Comandos Úteis

```bash
# Iniciar ambiente
cd /home/pk/Documentos/codebase/cmv_mockup
docker compose up -d

# Testar API
curl -X POST http://localhost:8000/api/simulator/simulate -d '{"type":"recipe_change","change_type":"absoluto","change_value":45,"recipe_id":4,"novos_componentes":[]}'

# Ver logs
docker compose logs -f backend
```

---

**Próximo Passo**: Validação visual no navegador quando MCP conectar