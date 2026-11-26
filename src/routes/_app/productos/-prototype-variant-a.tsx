import { EllipsisIcon, PackageIcon } from "lucide-react";
import { createContext, useContext, useState } from "react";

import { ArchivedBadge } from "#/components/admin-form.tsx";
import { DataTable, NoMatches, RowName, useClientDataTable } from "#/components/data-table.tsx";
import type { DataTableColumn } from "#/components/data-table.tsx";
import { matchingRows } from "#/components/data-table-rows.ts";
import { FormDialog, useFormDialog } from "#/components/form-dialog.tsx";
import type { FormDialogControl } from "#/components/form-dialog.tsx";
import { CreateButton } from "#/components/form-page.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { NewBadge } from "#/components/prototype-switcher.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Checkbox } from "#/components/ui/checkbox.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu.tsx";
import { Separator } from "#/components/ui/separator.tsx";

import { DetailList, collapsibleSection } from "#/routes/_app/clientes/-prototype-form.tsx";
import {
  addProduct,
  categoryOptions,
  emptyProductValues,
  filterProducts,
  formatMoney,
  formatPercent,
  labelOf,
  productSearchText,
  setProductsActive,
  typeOptions,
  updateProduct,
  useProducts,
  visibilityOptions,
} from "#/routes/_app/productos/-prototype-data.ts";
import type { Product } from "#/routes/_app/productos/-prototype-data.ts";
import {
  ProductFields,
  costOf,
  marginOf,
  priceOf,
  productSections,
  useProductFilters,
  useProductForm,
} from "#/routes/_app/productos/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant A "Tabla + diálogo" for Productos.

interface RowActions {
  selected: string[];
  toggle: (id: string) => void;
  view: (product: Product) => void;
  edit: (product: Product) => void;
}

const RowActionsContext = createContext<RowActions>({
  selected: [],
  toggle: () => undefined,
  view: () => undefined,
  edit: () => undefined,
});

function SelectCell({ product }: { product: Product }) {
  const actions = useContext(RowActionsContext);
  return (
    <Checkbox
      aria-label={`Seleccionar ${product.name}`}
      checked={actions.selected.includes(product.id)}
      onCheckedChange={() => actions.toggle(product.id)}
    />
  );
}

function NameCell({ product }: { product: Product }) {
  const actions = useContext(RowActionsContext);
  return (
    <RowName
      name={product.name}
      onOpen={() => actions.view(product)}
      status={<ArchivedBadge active={product.active} ending="o" />}
    />
  );
}

function RowMenu({ product }: { product: Product }) {
  const actions = useContext(RowActionsContext);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${product.name}`} />
        }
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => actions.view(product)}>Ver</DropdownMenuItem>
          <DropdownMenuItem onClick={() => actions.edit(product)}>Editar</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant={product.active ? "destructive" : "default"}
          onClick={() => setProductsActive([product.id], !product.active)}
        >
          {product.active ? "Archivar" : "Restaurar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: DataTableColumn<Product>[] = [
  { id: "select", header: "", cell: (product) => <SelectCell product={product} /> },
  { id: "name", header: "Nombre", cell: (product) => <NameCell product={product} /> },
  { id: "sku", header: "SKU", cell: (product) => product.sku },
  {
    id: "category",
    header: "Categoría",
    cell: (product) => labelOf(categoryOptions, product.category),
  },
  { id: "cost", header: "Costo", cell: (product) => formatMoney(costOf(product)) },
  { id: "price", header: "Precio", cell: (product) => formatMoney(priceOf(product)) },
  { id: "margin", header: "Margen", cell: (product) => formatPercent(marginOf(product)) },
  { id: "menu", header: "", cell: (product) => <RowMenu product={product} /> },
];

const idleAction = { pending: false, error: null, errorField: "", setError: () => undefined };

export function ProductsVariantA() {
  const products = useProducts();
  const filters = useProductFilters();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const dialog = useFormDialog();
  const rows = matchingRows(filterProducts(products, filters.filters), productSearchText, query);
  const { table, pager } = useClientDataTable({ rows, columns, getRowId: (product) => product.id });
  const selectable = rows.map((product) => product.id);
  const shownSelected = selected.filter((id) => selectable.includes(id));
  const { type, visibility, archived } = filters.filters;

  function edit(product: Product | null) {
    setViewing(null);
    setEditing(product);
    dialog.show();
  }

  function bulk(active: boolean) {
    setProductsActive(shownSelected, active);
    setSelected([]);
  }

  const actions: RowActions = {
    selected,
    toggle: (id) =>
      setSelected(selected.includes(id) ? selected.filter((one) => one !== id) : [...selected, id]),
    view: setViewing,
    edit,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Productos"
        description="Lo que la organización vende y compra, con su costo y su precio."
        actions={<CreateButton onClick={() => edit(null)}>Nuevo producto</CreateButton>}
      />
      <div className="flex flex-wrap items-center gap-2">
        {[...typeOptions, ...visibilityOptions].map((option) => {
          const groupId = typeOptions.includes(option) ? "type" : "visibility";
          const on = (groupId === "type" ? type : visibility) === option.value;
          return (
            <Button
              key={option.value}
              size="sm"
              variant={on ? "default" : "outline"}
              aria-pressed={on}
              onClick={() => filters.onPick(groupId, on ? null : option.value)}
            >
              {option.label}
            </Button>
          );
        })}
        <Separator orientation="vertical" className="data-vertical:h-5 data-vertical:self-auto" />
        <Button
          size="sm"
          variant={archived ? "default" : "outline"}
          aria-pressed={Boolean(archived)}
          onClick={() => filters.onPick("archivados", archived ? null : "incluidos")}
        >
          Archivados
        </Button>
        <NewBadge />
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2">
        <Checkbox
          aria-label="Seleccionar todos"
          checked={selectable.length > 0 && shownSelected.length === selectable.length}
          indeterminate={shownSelected.length > 0 && shownSelected.length < selectable.length}
          onCheckedChange={(checked) => setSelected(checked ? selectable : [])}
        />
        <span className="text-sm">
          {shownSelected.length === 0
            ? "Seleccioná productos para archivarlos o restaurarlos juntos"
            : `${shownSelected.length} seleccionados`}
        </span>
        {shownSelected.length > 0 && (
          <>
            <Button size="sm" variant="outline" onClick={() => bulk(false)}>
              Archivar
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulk(true)}>
              Restaurar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Quitar selección
            </Button>
          </>
        )}
        <span className="ml-auto flex items-center gap-2 text-sm">
          Selección múltiple y menú por fila
          <NewBadge />
        </span>
      </div>
      <RowActionsContext.Provider value={actions}>
        <DataTable
          table={table}
          pager={pager}
          search={{
            value: query,
            onChange: (value) => {
              setQuery(value);
              pager.onPageChange(1);
            },
            label: "Buscar producto",
            placeholder: "Buscar por nombre, SKU o código de barras",
          }}
          filters={{
            groups: filters.groups.filter((group) => group.id === "category"),
            onPick: filters.onPick,
            onRemove: filters.onRemove,
          }}
          empty={<NoMatches icon={PackageIcon} />}
        />
      </RowActionsContext.Provider>
      {viewing && (
        <ProductViewDialog
          product={products.find((one) => one.id === viewing.id) ?? viewing}
          onClose={() => setViewing(null)}
          onEdit={() => edit(viewing)}
        />
      )}
      <ProductDialog key={editing?.id ?? "new"} product={editing} dialog={dialog} />
    </div>
  );
}

function ProductViewDialog(props: { product: Product; onClose: () => void; onEdit: () => void }) {
  const { product } = props;
  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <span className="flex flex-wrap items-center gap-2">
              {product.name}
              <ArchivedBadge active={product.active} ending="o" />
              <NewBadge />
            </span>
          </DialogTitle>
          <DialogDescription>Cómo se vende el producto y cuánto cuesta.</DialogDescription>
        </DialogHeader>
        {productSections(product).map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h3 className="font-medium">{section.title}</h3>
            <DetailList details={section.details} />
          </section>
        ))}
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cerrar
          </Button>
          <Button onClick={props.onEdit}>Editar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog(props: { product: Product | null; dialog: FormDialogControl }) {
  const { product, dialog } = props;
  const form = useProductForm({
    values: product ?? emptyProductValues,
    editingId: product?.id,
    onRefused: (problems) => dialog.showProblems(problems),
    onValid: (values) => {
      if (product) {
        updateProduct(product.id, values);
      } else {
        addProduct(values);
      }
      dialog.hide();
    },
  });
  return (
    <FormDialog
      dialog={dialog}
      form={form}
      action={idleAction}
      className="max-h-dvh overflow-y-auto sm:max-w-2xl"
      title={
        <>
          {product ? product.name : "Nuevo producto"}
          {product && <ArchivedBadge active={product.active} ending="o" />}
          <NewBadge />
        </>
      }
      description="Cómo se vende el producto y cuánto cuesta."
      submitLabel={product ? "Guardar" : "Crear producto"}
      aside={
        product && (
          <Button
            variant={product.active ? "destructive" : "outline"}
            onClick={() => {
              setProductsActive([product.id], !product.active);
              dialog.hide();
            }}
          >
            {product.active ? "Archivar" : "Restaurar"}
          </Button>
        )
      }
    >
      <ProductFields form={form} frame={collapsibleSection} />
    </FormDialog>
  );
}
