# Roadmap — MVP

## Valor Central

> **"O que é o menor produto que consegue provar o valor central?"**

O valor central do produto é: **mostrar ao cliente seu CMV real e simular o impacto de qualquer mudança**.  
Tudo que não serve diretamente a esse objetivo é pós-MVP.

---

## Primeiro Teste

**Crepelocks — Rio de Janeiro**

Temos uma franquia parceira disposta a ser o primeiro ambiente de teste real do produto. Isso define uma meta concreta: o MVP precisa estar funcional o suficiente para ser usado por uma unidade real, com dados reais, e gerar pelo menos um insight acionável para o gestor.

Usar a Crepelocks como referência significa que as decisões de escopo, prioridade e onboarding devem sempre passar pelo filtro: *"um gestor da Crepelocks conseguiria usar isso hoje?"*

---

## Tarefas

### Backend

- [x] Cadastro de Insumos
- [x] Cadastro de Receitas
- [ ] Migrar para FastAPI
- [ ] Cadastro do custo dos insumos
- [ ] Cálculo do Custo Unitário
- [ ] Input de Vendas por Produto e por Loja
- [ ] CMV Ideal por Produto
- [ ] Cálculo do CMV Real
- [ ] Simulador de Impacto de Insumos
- [ ] Suporte Multi-Unidade
- [ ] Comparativo de Fornecedores por Insumo
- [ ] Engine de Alertas de Desvio de CMV
- [ ] Geração de Relatórios Exportáveis

### Frontend

- [ ] Tela de Cadastro de Insumos
- [ ] Tela de Cadastro de Receitas
- [ ] Tela de Cadastro do custo dos insumos
- [ ] Tela de Input de Vendas
- [ ] Tela de CMV Ideal
- [ ] Tela de CMV Real
- [ ] Interface do Simulador de Impacto
- [ ] Dashboard Multi-Unidade
- [ ] Tela de Comparativo de Fornecedores
- [ ] Dashboard Principal de Indicadores
- [ ] Templates de Importação de Dados
- [ ] Tela de Alertas
- [ ] Exportação de Relatórios

---

## Detalhamento das Tarefas

### Cadastro de Insumos

**O que é:**  
Tela e API para cadastrar insumos com nome, unidade de medida e preço de compra atual.

**Por que fazer:**  
É a base de dados que alimenta todos os cálculos do produto. Sem insumos cadastrados corretamente, nenhum cálculo de custo é possível.

**Valor para o cliente:**  
Centraliza informações que hoje estão espalhadas em planilhas, cadernos ou na cabeça do gestor.

---

### Cadastro de Receitas

**O que é:**  
Tela e API para cadastrar receitas vinculando insumos e suas respectivas quantidades por preparo.

**Por que fazer:**  
É o segundo pilar do núcleo matemático do produto. A receita é a estrutura que conecta insumo a produto final e permite calcular custo real.

**Valor para o cliente:**  
Formaliza e padroniza receitas que muitas vezes não existem documentadas, criando uma base confiável para decisões de custo.

---

### Cadastro do Preço dos Produtos

**O que é:**  
Tela e API para cadastrar o preço de venda de cada produto.

**Por que fazer:**  
Sem o preço de venda, não é possível calcular a margem nem o CMV percentual, que é o indicador mais usado no setor.

**Valor para o cliente:**  
Permite ao sistema calcular automaticamente se o preço atual cobre os custos com a margem desejada.

---

### Cálculo do Custo Unitário

**O que é:**  
Lógica de backend que calcula automaticamente o custo de cada produto com base nos insumos e quantidades da receita cadastrada.

**Por que fazer:**  
É o resultado direto da combinação dos cadastros anteriores. Valida que o núcleo matemático do produto está correto e confiável.

**Valor para o cliente:**  
Elimina o cálculo manual e sujeito a erro que a maioria dos gestores faz hoje em planilhas.

---

### Input de Vendas por Produto e por Loja

**O que é:**  
Funcionalidade para inserir ou importar o volume de vendas, registrando tanto o produto quanto a unidade de origem de cada venda.

**Por que fazer:**  
Sem o dado de vendas não é possível calcular o CMV real. Registrar por loja desde o início garante que a feature de visão multi-unidade seja suportada sem retrabalho de modelagem de dados no futuro.

**Valor para o cliente:**  
Primeira vez que o cliente vê custo e venda no mesmo lugar, com granularidade por produto e por unidade.

---

### CMV Ideal por Produto

**O que é:**  
Campo onde o gestor define o CMV percentual ideal para cada produto, armazenado como parâmetro de referência para comparação.

**Por que fazer:**  
Precisa existir antes do cálculo do CMV Real para que o desvio possa ser calculado e exibido logo na primeira visualização. Sem o ideal definido, o número real não tem contexto nem gera ação.

**Valor para o cliente:**  
Transforma um número em diagnóstico. O cliente sai sabendo não só onde está, mas o quanto está perdendo e em qual produto.

---

### Cálculo do CMV Real

**O que é:**  
Cálculo automático do CMV real do negócio com base no custo dos produtos vendidos versus a receita gerada no período, já mostrando o desvio em relação ao CMV ideal configurado.

**Por que fazer:**  
Este é o momento em que o produto prova seu valor pela primeira vez. O cliente vê o número real e o desvio imediatamente, sem precisar cruzar nada manualmente.

**Valor para o cliente:**  
Clareza imediata sobre a saúde do negócio. A maioria dos donos de rede trabalha com uma estimativa imprecisa desse número.

---

### Simulador de Impacto de Insumos

**O que é:**  
Ferramenta que permite ao gestor simular o que acontece com o CMV se o preço de um insumo mudar em X%.

**Por que fazer:**  
Reajuste de fornecedores é uma realidade constante no food service. Hoje o gestor não tem como medir rapidamente o impacto antes de tomar uma decisão.

**Valor para o cliente:**  
Antecipa decisões. O cliente consegue simular um reajuste de fornecedor antes de aceitar ou negociar, com número na mão.

---

### Visão Multi-Unidade

**O que é:**  
Dashboard com visão consolidada da rede e possibilidade de navegar para a visão individual de cada unidade.

**Por que fazer:**  
O cliente-alvo tem mais de uma unidade. Sem essa visão, o produto não resolve o problema real de gestão de rede — apenas de loja isolada. A modelagem já suporta isso desde o input de vendas.

**Valor para o cliente:**  
Permite identificar quais unidades estão performando abaixo do esperado em CMV e agir de forma direcionada.

---

### Comparativo de Fornecedores por Insumo

**O que é:**  
Tela que lista os fornecedores cadastrados para um mesmo insumo e compara preço e impacto no CMV.

**Por que fazer:**  
Troca de fornecedor é uma das principais alavancas de redução de CMV. Hoje essa decisão é feita com base em feeling ou no fornecedor de sempre.

**Valor para o cliente:**  
Torna a decisão de troca de fornecedor objetiva, com impacto calculado antes da mudança.

---

### Dashboard Principal de Indicadores

**O que é:**  
Tela inicial com os principais indicadores do negócio: CMV real, CMV ideal, desvio, produtos críticos e evolução no tempo.

**Por que fazer:**  
O cliente precisa de uma visão rápida e clara ao abrir o produto. Um dashboard bem construído reduz o tempo de extração de insight e aumenta o engajamento com a plataforma.

**Valor para o cliente:**  
Substitui a necessidade de rodar relatórios ou cruzar planilhas para ter uma visão de saúde do negócio. Informação disponível em segundos.

---

### Templates de Importação de Dados

**O que é:**  
Planilhas modelo para importação de vendas, compras e insumos, padronizando a entrada de dados na plataforma.

**Por que fazer:**  
O maior risco de churn nos primeiros clientes é a dificuldade de alimentar o sistema. Se o onboarding for travado, o cliente abandona antes de ver valor.

**Valor para o cliente:**  
Reduz o tempo e o esforço de início de uso, acelerando o momento em que o cliente vê o primeiro resultado concreto.

---

### Alertas Automáticos de Desvio de CMV

**O que é:**  
Sistema de notificações que alerta o gestor quando o CMV de um produto ou da rede ultrapassa o limite ideal configurado.

**Por que fazer:**  
O gestor não pode monitorar o sistema diariamente. O alerta garante que desvios sejam identificados no momento certo, não só quando o problema já é grande.

**Valor para o cliente:**  
Transforma o produto de uma ferramenta reativa em um sistema de monitoramento proativo, aumentando percepção de valor e reduzindo churn.

---

### Relatórios Exportáveis

**O que é:**  
Exportação de relatórios em PDF ou Excel com os principais indicadores de CMV por período, produto e unidade.

**Por que fazer:**  
Em redes, o gestor operacional precisa apresentar resultados para sócios ou diretores que muitas vezes não acessam a plataforma diretamente.

**Valor para o cliente:**  
Facilita a comunicação interna dos resultados, ampliando o número de pessoas que enxergam valor no produto dentro da empresa cliente.

---

### Melhorias de UX Baseadas em Uso Real

**O que é:**  
Ciclo contínuo de ajustes de interface, fluxos e terminologia com base em observação e feedback dos primeiros clientes usando o produto.

**Por que fazer:**  
O produto construído sem uso real tem gaps que só aparecem quando alguém de fora tenta usar. Esse refinamento é o que separa um MVP de um produto comercializável de verdade.

**Valor para o cliente:**  
Produto mais simples e intuitivo reduz tempo de treinamento, aumenta adoção por toda a equipe e diminui dependência de suporte.

---

## O que não entra no MVP

| Funcionalidade | Motivo |
|---|---|
| Aplicativo mobile nativo | Web responsivo resolve o problema no curto prazo |
| Integrações com Sistemas do Setor | Não temos acesso aos sistemas dos clientes ainda. Construir uma integração sem isso mapeado gera retrabalho certo. O caminho é validar o valor com importação manual primeiro e mapear os sistemas mais usados pelos primeiros clientes antes de qualquer decisão técnica. |
| IA preditiva de custos | Sem histórico de dados suficiente, não entrega resultado confiável |
| Módulo financeiro completo | Fora do escopo do valor central do produto |
| Infraestrutura dedicada por cliente | Demanda Enterprise; não é prioridade para o perfil MVP |