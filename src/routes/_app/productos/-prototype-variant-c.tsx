import { Link } from "@tanstack/react-router";
import { PackageIcon } from "lucide-react";
import { useState } from "react";

import { ArchivedBadge } from "#/components/admin-form.tsx";
import { DataTable, NoMatches, RowName, useClientDataTable } from "#/components/data-table.tsx";
import type { DataTableColumn } from "#/components/data-table.tsx";
import { matchingRows } from "#/components/data-table-rows.ts";
import { CreateButton } from "#/components/form-page.tsx";
import { PageHeader } from "#/components/page-header.tsx";

import {
  categoryOptions,
  filterProducts,
  formatMoney,
  formatPercent,
  labelOf,
  productSearchText,
  typeOptions,
  useProducts,
} from "#/routes/_app/productos/-prototype-data.ts";
import type { Product } from "#/routes/_app/productos/-prototype-data.ts";
import {
  costOf,
  marginOf,
  priceOf,
  useProductFilters,
} from "#/routes/_app/productos/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant C "Páginas" for Productos: the list and
// its filter bar; the create, the product's page and its edit are pages.

const columns: DataTableColumn<Product>[] = [
  {
    id: "name",
    header: "Nombre",
    cell: (product) => (
      <RowName
        name={product.name}
        link={{
          to: "/productos/$productId",
          params: { productId: product.id },
          search: { variant: "C" },
        }}
        status={<ArchivedBadge active={product.active} ending="o" />}
      />
    ),
  },
  { id: "sku", header: "SKU", cell: (product) => product.sku },
  { id: "type", header: "Tipo", cell: (product) => labelOf(typeOptions, product.type) },
  {
    id: "category",
    header: "Categoría",
    cell: (product) => labelOf(categoryOptions, product.category),
  },
  { id: "cost", header: "Costo", cell: (product) => formatMoney(costOf(product)) },
  { id: "price", header: "Precio", cell: (product) => formatMoney(priceOf(product)) },
  { id: "margin", header: "Margen", cell: (product) => formatPercent(marginOf(product)) },
];

export function ProductsVariantC() {
  const products = useProducts();
  const filters = useProductFilters();
  const [query, setQuery] = useState("");
  const rows = matchingRows(filterProducts(products, filters.filters), productSearchText, query);
  const { table, pager } = useClientDataTable({ rows, columns, getRowId: (product) => product.id });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Productos"
        description="Lo que la organización vende y compra, con su costo y su precio."
        actions={
          <CreateButton link={<Link to="/productos/nuevo" search={{ variant: "C" }} />}>
            Nuevo producto
          </CreateButton>
        }
      />
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
        filters={{ groups: filters.groups, onPick: filters.onPick, onRemove: filters.onRemove }}
        empty={<NoMatches icon={PackageIcon} />}
      />
    </div>
  );
}
