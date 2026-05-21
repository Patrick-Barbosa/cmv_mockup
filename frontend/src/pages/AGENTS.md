# Page Components Guide

This file documents reusable components available in `src/components/common/` for building pages.

## Imports

```ts
import {
  PageHeader,
  PageHeaderWithButton,
  ErrorAlert,
  LoadingState,
  CardSkeletons,
  TableSkeleton,
  FilterBar,
  ContentLayout,
  FullWidthLayout,
  StatsCard,
  StatsSidebar,
  DataTable,
  SimpleTable,
  CRUDDialog,
  SimulationResultTable,
  TreeViewer,
  StoreMultiSelect,
  ChartLegend,
} from "@/components/common"
```

---

## Components

### PageHeader
**Purpose**: Page title with description and optional action button
```tsx
<PageHeader
  title="Page Title"
  description="Optional description"
  action={{ label: "Add New", onClick: () => {} }}
/>
```

### PageHeaderWithButton
**Purpose**: Page title with back button and primary action
```tsx
<PageHeaderWithButton
  title="Page Title"
  backTo="/path"
  button={{ label: "Action", onClick: () => {} }}
/>
```

### ErrorAlert
**Purpose**: Display error messages with retry option
```tsx
<ErrorAlert
  title="Error title"
  message="Error message details"
  onRetry={() => fetchData()}
/>
```

### LoadingState
**Purpose**: Full-page loading indicator
```tsx
<LoadingState message="Loading data..." />
```

### CardSkeletons
**Purpose**: Skeleton loaders for stats cards
```tsx
<CardSkeletons count={4} variant="default" />
```

### TableSkeleton
**Purpose**: Skeleton loader for data tables
```tsx
<TableSkeleton columns={4} rows={5} />
```

### FilterBar
**Purpose**: Store/month filters with search
```tsx
<FilterBar
  stores={stores}
  months={months}
  selectedStore={selectedStore}
  selectedMonth={selectedMonth}
  searchTerm={searchTerm}
  onStoreChange={setSelectedStore}
  onMonthChange={setSelectedMonth}
  onSearchChange={setSearchTerm}
/>
```

### ContentLayout
**Purpose**: Two-column layout with stats sidebar
```tsx
<ContentLayout
  sidebar={
    <StatsSidebar
      stats={[
        { label: "Total", value: 1000, format: "currency" },
        { label: "Count", value: 50 },
      ]}
    />
  }
>
  <main>Main content</main>
</ContentLayout>
```

### FullWidthLayout
**Purpose**: Full-width layout with optional header
```tsx
<FullWidthLayout
  header={<PageHeader title="Full Width Page" />}
>
  <main>Content</main>
</FullWidthLayout>
```

### StatsCard
**Purpose**: Individual stat display card
```tsx
<StatsCard
  label="Total Revenue"
  value={10000}
  format="currency"
  icon={<TrendingUp />}
  variant="default" // "default" | "highlight" | "muted"
  trend={{ value: 12, positive: true }}
/>
```

### StatsSidebar
**Purpose**: Group of stats cards in sidebar layout
```tsx
<StatsSidebar
  stats={[
    { label: "Label", value: 1000, format: "currency" },
    { label: "Count", value: 50, format: "number" },
  ]}
  variant="default"
/>
```

### DataTable
**Purpose**: Full-featured table with sorting, selection, actions
```tsx
<DataTable
  columns={[
    { key: "name", label: "Name", sortable: true },
    { key: "value", label: "Value", format: "currency" },
  ]}
  data={rows}
  onSort={handleSort}
  onSelect={setSelected}
  selectedKeys={selected}
  actions={[
    { label: "Edit", onClick: (row) => edit(row) },
    { label: "Delete", onClick: (row) => delete(row) },
  ]}
/>
```

### SimpleTable
**Purpose**: Basic table without features
```tsx
<SimpleTable
  columns={[{ key: "name", label: "Name" }]}
  data={rows}
  emptyMessage="No data found"
/>
```

### CRUDDialog
**Purpose**: Create/Edit/Delete dialog with form
```tsx
<CRUDDialog
  open={isOpen}
  mode="create" // "create" | "edit" | "delete"
  title="Add Item"
  data={item}
  fields={[
    { name: "name", label: "Name", type: "text" },
    { name: "price", label: "Price", type: "number" },
  ]}
  onSave={save}
  onCancel={() => setOpen(false)}
/>
```

### SimulationResultTable
**Purpose**: Display simulation results for stores or recipes
```tsx
<SimulationResultTable
  title="Tabela de Resultados por Loja"
  data={storeResults}
  type="insumo"
  currentUnit="kg"
/>
```
- `type`: "insumo" or "receita" - determines column display
- `currentUnit`: unit for quantity display

### TreeViewer
**Purpose**: Display recursive tree structures with expand/collapse
```tsx
<TreeViewer
  nodes={treeNodes}
  renderNodeContent={(node) => (
    <>
      <span>{node.name}</span>
      <span>{node.type}</span>
    </>
  )}
/>
```
- `nodes`: Array of tree nodes with children
- `renderNodeContent`: Optional custom renderer for node content

### StoreMultiSelect
**Purpose**: Multi-select dropdown for store filtering with search
```tsx
<StoreMultiSelect
  stores={[{ id: "RJ-COPA" }, { id: "RJ-BARRA" }]}
  selected={selectedStores}
  onChange={setSelectedStores}
  disabled={false}
/>
```
- `stores`: Array of store objects with `id` property
- `selected`: Array of selected store IDs
- `onChange`: Callback when selection changes

### ChartLegend
**Purpose**: Custom legend for bar charts in simulation results
```tsx
<ChartLegend />
```

---

## Hooks

### useDataFetcher
**Purpose**: Data fetching with loading/error states
```tsx
const { data, loading, error, refetch } = useDataFetcher(fetchFn)
```

### useFilters
**Purpose**: Manage store/month filter state
```tsx
const {
  selectedStore,
  selectedMonth,
  setSelectedStore,
  setSelectedMonth,
} = useFilters(stores, months)
```

---

## Utilities

### format.ts
```ts
import { formatBRL, formatPercent, formatNumber, formatQuantity, parseBRL } from "@/lib/format"

formatBRL(1000)      // "R$ 1.000,00"
formatPercent(0.15)   // "15%"
formatNumber(1000)    // "1.000"
formatQuantity(5)     // "5 un"
parseBRL("R$ 100,00") // 100
```

---

## Best Practices

1. **Use PageHeader** at top of every page
2. **Use FilterBar** if page has store/month filters
3. **Use ContentLayout** for pages with sidebar stats
4. **Use ErrorAlert + LoadingState** for data fetching
5. **Use format.ts** instead of inline formatting functions
6. **Use CRUDDialog** for simple create/edit/delete forms
7. **Keep page-specific logic in the page file**
8. **Extract complex forms to separate components** (e.g., RecipeEditor)