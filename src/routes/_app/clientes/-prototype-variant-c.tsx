import { Link } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";

import { ArchivedBadge } from "#/components/admin-form.tsx";
import { DataTable, NoMatches, RowName, useClientDataTable } from "#/components/data-table.tsx";
import type { DataTableColumn } from "#/components/data-table.tsx";
import { matchingRows } from "#/components/data-table-rows.ts";
import { CreateButton } from "#/components/form-page.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { useState } from "react";

import {
  clientSearchQuery,
  clientSearchText,
  filterClients,
  labelOf,
  paymentTermLabel,
  taxCategoryOptions,
  useClients,
} from "#/routes/_app/clientes/-prototype-data.ts";
import type { Client } from "#/routes/_app/clientes/-prototype-data.ts";
import { useClientFilters } from "#/routes/_app/clientes/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant C "Páginas": the list with its filter
// bar; the create, the client's page and its edit each a page of their own
// (`nuevo.tsx`, `$clientId/index.tsx`, `$clientId/editar.tsx`).

const columns: DataTableColumn<Client>[] = [
  {
    id: "name",
    header: "Razón social",
    cell: (client) => (
      <RowName
        name={client.name}
        link={{
          to: "/clientes/$clientId",
          params: { clientId: client.id },
          search: { variant: "C" },
        }}
        status={<ArchivedBadge active={client.active} ending="o" />}
        detail={client.companyName || undefined}
      />
    ),
  },
  { id: "doc", header: "Documento", cell: (client) => client.docNumber },
  {
    id: "tax",
    header: "Condición IVA",
    cell: (client) => labelOf(taxCategoryOptions, client.taxCategory),
  },
  { id: "city", header: "Ciudad", cell: (client) => client.city },
  { id: "term", header: "Condición de pago", cell: (client) => paymentTermLabel(client) },
];

export function ClientsVariantC() {
  const clients = useClients();
  const filters = useClientFilters();
  const [query, setQuery] = useState("");
  const rows = matchingRows(
    filterClients(clients, filters.filters),
    clientSearchText,
    clientSearchQuery(query),
  );
  const { table, pager } = useClientDataTable({ rows, columns, getRowId: (client) => client.id });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Las personas y empresas a las que la organización les vende."
        actions={
          <CreateButton link={<Link to="/clientes/nuevo" search={{ variant: "C" }} />}>
            Nuevo cliente
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
          label: "Buscar cliente",
          placeholder: "Buscar por nombre, documento, correo, teléfono o ciudad",
        }}
        filters={{ groups: filters.groups, onPick: filters.onPick, onRemove: filters.onRemove }}
        empty={<NoMatches icon={UsersIcon} />}
      />
    </div>
  );
}
