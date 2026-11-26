import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { CheckIcon, PencilIcon } from "lucide-react";
import { useState } from "react";

import { ArchivedBadge, activeRecord } from "#/components/admin-form.tsx";
import { FormGrid } from "#/components/app-form.tsx";
import { AlertStack } from "#/components/alert-stack.tsx";
import { matchingRows } from "#/components/data-table-rows.ts";
import { FormProblemsContext } from "#/components/field-problem.tsx";
import { FilterBar } from "#/components/filter-bar.tsx";
import type { FieldProblem } from "#/components/form-problems.ts";
import { CreateButton } from "#/components/form-page.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { NewBadge } from "#/components/prototype-switcher.tsx";
import { RecordSection } from "#/components/record-section.tsx";
import { SearchInput } from "#/components/search-input.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card.tsx";

import { DetailList, titledSection } from "#/routes/_app/clientes/-prototype-form.tsx";
import {
  addProduct,
  categoryOptions,
  emptyProductValues,
  filterProducts,
  formatMoney,
  labelOf,
  productSearchText,
  setProductsActive,
  updateProduct,
  useProducts,
} from "#/routes/_app/productos/-prototype-data.ts";
import type { Product } from "#/routes/_app/productos/-prototype-data.ts";
import {
  ProductFields,
  priceOf,
  productSections,
  useProductFilters,
  useProductForm,
} from "#/routes/_app/productos/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant B "Maestro-detalle" for Productos.

type Mode = "view" | "edit" | "create";

export function ProductsVariantB() {
  const products = useProducts();
  const filters = useProductFilters();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("1");
  const [mode, setMode] = useState<Mode>("view");
  const rows = matchingRows(filterProducts(products, filters.filters), productSearchText, query);
  const selected = products.find((product) => product.id === selectedId);

  function pick(id: string) {
    setSelectedId(id);
    setMode("view");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Productos"
        description="Lo que la organización vende y compra, con su costo y su precio."
        actions={<CreateButton onClick={() => setMode("create")}>Nuevo producto</CreateButton>}
      />
      <div className="flex items-start gap-6">
        <div className="flex w-88 shrink-0 flex-col gap-3 rounded-xl border p-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            Lista y detalle lado a lado
            <NewBadge />
          </span>
          <SearchInput
            value={query}
            onChange={setQuery}
            label="Buscar producto"
            placeholder="Nombre, SKU o código de barras"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterBar
              groups={filters.groups}
              onPick={filters.onPick}
              onRemove={filters.onRemove}
            />
          </div>
          <ul
            aria-label="Productos"
            className="-mx-1 flex max-h-136 flex-col gap-0.5 overflow-y-auto"
          >
            {rows.map((product) => (
              <li key={product.id}>
                <ButtonPrimitive
                  className="hover:bg-muted aria-current:bg-muted flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium"
                  aria-current={product.id === selectedId && mode !== "create" ? "true" : undefined}
                  onClick={() => pick(product.id)}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      {product.name}
                      <ArchivedBadge active={product.active} ending="o" />
                    </span>
                    <span className="text-muted-foreground text-xs font-normal">
                      {product.sku} ·{" "}
                      {labelOf(categoryOptions, product.category) || "Sin categoría"}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums">{formatMoney(priceOf(product))}</span>
                </ButtonPrimitive>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="text-muted-foreground px-2 py-6 text-center text-sm">
                Ningún producto coincide con la búsqueda.
              </li>
            )}
          </ul>
          <span className="text-muted-foreground text-sm">
            {rows.length} de {products.length} registros
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {mode === "create" && (
            <PaneForm key="new" onCancel={() => setMode("view")} onSaved={pick} />
          )}
          {mode === "edit" && selected && (
            <PaneForm
              key={selected.id}
              product={selected}
              onCancel={() => setMode("view")}
              onSaved={pick}
            />
          )}
          {mode === "view" && selected && (
            <PaneView product={selected} onEdit={() => setMode("edit")} />
          )}
        </div>
      </div>
    </div>
  );
}

const idle = { pending: false, error: null };

function PaneView(props: { product: Product; onEdit: () => void }) {
  const { product } = props;
  const record = activeRecord({
    active: product.active,
    ending: "o",
    archived: {
      title: "Producto archivado",
      consequence: "No aparece al vender ni al comprar.",
    },
    toggle: idle,
    onChange: (active) => setProductsActive([product.id], active),
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
            {product.name}
            {record.status}
          </h2>
          <p className="text-muted-foreground text-sm">{product.sku}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={props.onEdit}>
            <PencilIcon data-icon="inline-start" aria-hidden />
            Editar
          </Button>
          {record.actions(false)}
        </div>
      </div>
      <AlertStack>{record.alert}</AlertStack>
      <div className="grid gap-4 xl:grid-cols-2">
        {productSections(product).map((section) => (
          <RecordSection key={section.title} title={section.title}>
            <DetailList details={section.details} />
          </RecordSection>
        ))}
      </div>
    </div>
  );
}

function PaneForm(props: {
  product?: Product;
  onCancel: () => void;
  onSaved: (id: string) => void;
}) {
  const { product } = props;
  const [problems, setProblems] = useState<FieldProblem[]>([]);
  const form = useProductForm({
    values: product ?? emptyProductValues,
    editingId: product?.id,
    onRefused: setProblems,
    onValid: (values) => {
      if (product) {
        updateProduct(product.id, values);
        props.onSaved(product.id);
        return;
      }
      props.onSaved(addProduct(values).id);
    },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            {product ? product.name : "Nuevo producto"}
            <NewBadge />
          </span>
        </CardTitle>
        <CardDescription>Cómo se vende el producto y cuánto cuesta.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProblemsContext.Provider value={problems}>
          <FormGrid>
            <ProductFields form={form} frame={titledSection} />
          </FormGrid>
        </FormProblemsContext.Provider>
      </CardContent>
      <CardFooter className="sticky bottom-0">
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" onClick={props.onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setProblems([]);
              void form.handleSubmit();
            }}
          >
            <CheckIcon data-icon="inline-start" aria-hidden />
            {product ? "Guardar" : "Crear producto"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
