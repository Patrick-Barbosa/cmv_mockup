# Skill: test-simulator-page

Teste funcional completo da Página Simulador (SimulatorPage) via `playwright-cli`.

## Pré-condições

- Backend rodando em http://localhost:8000
- Frontend rodando em http://localhost:5173
- `playwright-cli` instalado

## Parâmetros Fixos

```
RESOLUÇÃO:     1920x1080
MODO:          headed (--headed) — para mostrar o cursor do mouse
EVIDÊNCIA:     vídeo obrigatório (playwright-cli video-start / video-stop)
ARMAZENAMENTO: brain/issue-{id}-{slug}/evidence/simulacao-completa-{data}.webm
```

## Roteiro de Teste

### FASE 0 — Setup

```bash
# Fechar sessão anterior se houver
playwright-cli close 2>/dev/null

# Nome do arquivo de evidência
EVIDENCIA="brain/issue-{id}-{slug}/evidence/simulacao-completa-$(date +%Y%m%d-%H%M).webm"
rm -f "$EVIDENCIA"

# Abrir navegador headed 1080p
playwright-cli open --headed
playwright-cli resize 1920 1080
playwright-cli goto "http://localhost:5173/simulador"
sleep 5

# Iniciar gravação
playwright-cli video-start "$EVIDENCIA" --size="1920x1080"
```

### FASE 1 — Insumo (Farinha de trigo, R$ 600.000, Abril)

#### 1.1 Selecionar todas as lojas

O filtro de lojas vem pré-selecionado com "2 lojas selecionadas".
É preciso abrir o popover, clicar "Selecionar todas" e fechar.

```bash
sleep 2
# Abrir popover de lojas
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.includes('lojas selecionadas'))?.click()
}"
sleep 2

# Clicar "Selecionar todas"
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === 'Selecionar todas')?.click()
}"
sleep 1

# Fechar popover (clicar no mesmo botão toggle)
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.includes('Todas as lojas'))?.click()
}"
sleep 2
```

#### 1.2 Selecionar Farinha de trigo

```bash
# Abrir combobox de insumo
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('button[role=combobox]'))
    .find(b => b.textContent.includes('Selecione'))?.click()
}"
sleep 2

# Selecionar Farinha de trigo
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('[role=option]'))
    .find(o => o.textContent.trim() === 'Farinha de trigo')?.click()
}"
sleep 2
```

#### 1.3 Preencher preço simulado

```bash
playwright-cli fill "input[placeholder*='Ex']" "600000,00"
sleep 1
```

#### 1.4 Simular Impacto

Usar `dispatchEvent(new MouseEvent('click', {bubbles:true}))` para garantir
que o evento chegue ao React independente de zona de clique.

```bash
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === 'Simular Impacto')
    ?.dispatchEvent(new MouseEvent('click', {bubbles:true}))
}"
sleep 12  # Aguardar resposta da API + renderização
```

#### 1.5 Scroll Lento Seção por Seção

Sempre em etapas com pausas de 3-4s:

```bash
# Seção 1: KPIs (~600px)
playwright-cli eval "() => window.scrollTo(0, 600)"; sleep 4
# Seção 2: Gráfico (~1400px)
playwright-cli eval "() => window.scrollTo(0, 1400)"; sleep 4
# Seção 3: Tabela Lojas (~2400px)
playwright-cli eval "() => window.scrollTo(0, 2400)"; sleep 4
# Seção 4: Tabela Receitas (~3400px)
playwright-cli eval "() => window.scrollTo(0, 3400)"; sleep 4
# Voltar ao topo
playwright-cli eval "() => window.scrollTo(0, 0)"; sleep 3
```

### FASE 2 — Receita (Pizza margherita, R$ 300, Maio)

#### 2.1 Trocar para modo Receita

⚠️ Os radio buttons são `<button role="radio">`, NÃO `<input type="radio">`.
O segundo botão (índice 1) é o "Receita".

```bash
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('[role=radio]'))[1]?.click()
}"
sleep 3
```

#### 2.2 Trocar mês para Maio/2026

O combobox de mês mostra "2026-04". Clicar e selecionar "2026-05".

```bash
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('button[role=combobox]'))
    .find(b => b.textContent.includes('2026-04') || b.textContent.includes('2026-0'))
    ?.click()
}"
sleep 2

playwright-cli eval "() => {
  Array.from(document.querySelectorAll('[role=option]'))
    .find(o => o.textContent.trim() === '2026-05')?.click()
}"
sleep 2
```

#### 2.3 Selecionar Pizza margherita

```bash
playwright-cli eval "() => {
  Array.from(document.querySelectorAll('button[role=combobox]'))
    .find(b => b.textContent.includes('Selecione'))?.click()
}"
sleep 2

playwright-cli eval "() => {
  Array.from(document.querySelectorAll('[role=option]'))
    .find(o => o.textContent.trim() === 'Pizza margherita')?.click()
}"
sleep 3
```

#### 2.4 Preencher preço e Simular

```bash
playwright-cli fill "input[placeholder*='Ex']" "300,00"
sleep 1

playwright-cli eval "() => {
  Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === 'Simular Impacto')
    ?.dispatchEvent(new MouseEvent('click', {bubbles:true}))
}"
sleep 12
```

#### 2.5 Scroll Lento (mesmo padrão)

```bash
playwright-cli eval "() => window.scrollTo(0, 600)"; sleep 4
playwright-cli eval "() => window.scrollTo(0, 1400)"; sleep 4
playwright-cli eval "() => window.scrollTo(0, 2400)"; sleep 4
playwright-cli eval "() => window.scrollTo(0, 3400)"; sleep 4
playwright-cli eval "() => window.scrollTo(0, 0)"; sleep 3
```

### FASE 3 — Finalizar

```bash
playwright-cli video-stop
playwright-cli close
echo "✅ Vídeo salvo: $EVIDENCIA"
```

## Verificações Pós-Teste

Após cada simulação, extrair os KPI values para confirmar impacto real:

```bash
playwright-cli eval "() => document.body.innerText.substring(200, 800)" 2>&1
```

Valores esperados (aproximados):
| Simulação | Impacto na Rede | CMV |
|-----------|----------------|-----|
| Insumo (R$ 600.000) | **-R$ 44Bi** (-358.814%) | **358.837%** |
| Receita (R$ 300) | **-R$ 21,6M** (-175,9%) | **198,8%** |

## Problemas Conhecidos & Workarounds

| Problema | Workaround |
|----------|-----------|
| Store filter abre popover que não fecha com `document.body.click()` | Clicar no botão trigger novamente (texto "Todas as lojas") |
| Radio buttons não são `<input>`, são `<button role="radio">` | Usar `document.querySelectorAll('[role=radio]')[1].click()` |
| Botão "Simular Impacto" não responde a `playwright-cli click` | Usar `dispatchEvent(new MouseEvent('click', {bubbles:true}))` |
| Tabela de resultados fica atrás do EditableTreeViewer (modo receita) | Scroll lento para revelar seções conforme usuário desce |
| Combobox de insumo vs mês confundidos | O de insumo contém "Selecione...", o de mês contém "2026-" |
| EditableTreeViewer mostra "Custo total atual: R$ 0,00" | Bug conhecido — não afeta a simulação principal |
| Seed 2.3M registros leva ~75s para carregar | Aguardar backend iniciar completamente |

## Dependências

- Aprendizado: `brain/learnings/qa-simulacao-padrao.md`
- Seed data: `backend/app/database/seed.py` (gera 14 meses de vendas)
