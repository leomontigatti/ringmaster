import { EllipsisIcon, UsersIcon } from "lucide-react";
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

import {
  addClient,
  clientSearchQuery,
  clientSearchText,
  emptyClientValues,
  filterClients,
  labelOf,
  paymentBucketOptions,
  paymentTermLabel,
  setClientsActive,
  taxCategoryOptions,
  updateClient,
  useClients,
} from "#/routes/_app/clientes/-prototype-data.ts";
import type { Client } from "#/routes/_app/clientes/-prototype-data.ts";
import {
  ClientFields,
  useClientForm,
  DetailList,
  SystemClientAlert,
  clientSections,
  collapsibleSection,
  useClientFilters,
} from "#/routes/_app/clientes/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant A "Tabla + diálogo": the table with
// quick filter chips and a bulk selection, each row's menu, and the create and
// the edit in a wide dialog whose sections fold.

interface RowActions {
  selected: string[];
  toggle: (id: string) => void;
  view: (client: Client) => void;
  edit: (client: Client) => void;
}

const RowActionsContext = createContext<RowActions>({
  selected: [],
  toggle: () => undefined,
  view: () => undefined,
  edit: () => undefined,
});

function SelectCell({ client }: { client: Client }) {
  const actions = useContext(RowActionsContext);
  if (client.system) {
    return null;
  }
  return (
    <Checkbox
      aria-label={`Seleccionar ${client.name}`}
      checked={actions.selected.includes(client.id)}
      onCheckedChange={() => actions.toggle(client.id)}
    />
  );
}

function NameCell({ client }: { client: Client }) {
  const actions = useContext(RowActionsContext);
  return (
    <RowName
      name={client.name}
      onOpen={() => actions.view(client)}
      status={<ArchivedBadge active={client.active} ending="o" />}
      detail={client.companyName || undefined}
    />
  );
}

function RowMenu({ client }: { client: Client }) {
  const actions = useContext(RowActionsContext);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${client.name}`} />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => actions.view(client)}>Ver</DropdownMenuItem>
          {!client.system && (
            <DropdownMenuItem onClick={() => actions.edit(client)}>Editar</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {!client.system && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant={client.active ? "destructive" : "default"}
              onClick={() => setClientsActive([client.id], !client.active)}
            >
              {client.active ? "Archivar" : "Restaurar"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: DataTableColumn<Client>[] = [
  { id: "select", header: "", cell: (client) => <SelectCell client={client} /> },
  { id: "name", header: "Razón social", cell: (client) => <NameCell client={client} /> },
  { id: "doc", header: "Documento", cell: (client) => client.docNumber },
  {
    id: "tax",
    header: "Condición IVA",
    cell: (client) => labelOf(taxCategoryOptions, client.taxCategory),
  },
  { id: "city", header: "Ciudad", cell: (client) => client.city },
  { id: "term", header: "Condición de pago", cell: (client) => paymentTermLabel(client) },
  { id: "menu", header: "", cell: (client) => <RowMenu client={client} /> },
];

const idleAction = { pending: false, error: null, errorField: "", setError: () => undefined };

export function ClientsVariantA() {
  const clients = useClients();
  const filters = useClientFilters();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [viewing, setViewing] = useState<Client | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);
  const dialog = useFormDialog();
  const rows = matchingRows(
    filterClients(clients, filters.filters),
    clientSearchText,
    clientSearchQuery(query),
  );
  const { table, pager } = useClientDataTable({ rows, columns, getRowId: (client) => client.id });
  const selectable = rows.filter((client) => !client.system).map((client) => client.id);
  const shownSelected = selected.filter((id) => selectable.includes(id));

  function edit(client: Client | null) {
    setViewing(null);
    setEditing(client);
    dialog.show();
  }

  function bulk(active: boolean) {
    setClientsActive(shownSelected, active);
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
        title="Clientes"
        description="Las personas y empresas a las que la organización les vende."
        actions={<CreateButton onClick={() => edit(null)}>Nuevo cliente</CreateButton>}
      />
      <QuickChips filters={filters} />
      <div className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2">
        <Checkbox
          aria-label="Seleccionar todos"
          checked={selectable.length > 0 && shownSelected.length === selectable.length}
          indeterminate={shownSelected.length > 0 && shownSelected.length < selectable.length}
          onCheckedChange={(checked) => setSelected(checked ? selectable : [])}
        />
        <span className="text-sm">
          {shownSelected.length === 0
            ? "Seleccioná clientes para archivarlos o restaurarlos juntos"
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
            label: "Buscar cliente",
            placeholder: "Buscar por nombre, documento, correo, teléfono o ciudad",
          }}
          filters={{
            groups: filters.groups.filter((group) => ["province", "tag"].includes(group.id)),
            onPick: filters.onPick,
            onRemove: filters.onRemove,
          }}
          empty={<NoMatches icon={UsersIcon} />}
        />
      </RowActionsContext.Provider>
      {viewing && (
        <ClientViewDialog
          client={clients.find((one) => one.id === viewing.id) ?? viewing}
          onClose={() => setViewing(null)}
          onEdit={() => edit(viewing)}
        />
      )}
      <ClientDialog key={editing?.id ?? "new"} client={editing} dialog={dialog} />
    </div>
  );
}

/** The tax, payment-term and archived filters as one-click chips. */
function QuickChips({ filters }: { filters: ReturnType<typeof useClientFilters> }) {
  const { taxCategory, paymentBucket, archived } = filters.filters;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {taxCategoryOptions.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={taxCategory === option.value ? "default" : "outline"}
          aria-pressed={taxCategory === option.value}
          onClick={() =>
            filters.onPick("taxCategory", taxCategory === option.value ? null : option.value)
          }
        >
          {option.label}
        </Button>
      ))}
      <Separator orientation="vertical" className="data-vertical:h-5 data-vertical:self-auto" />
      {paymentBucketOptions.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={paymentBucket === option.value ? "default" : "outline"}
          aria-pressed={paymentBucket === option.value}
          onClick={() =>
            filters.onPick("paymentBucket", paymentBucket === option.value ? null : option.value)
          }
        >
          {option.label}
        </Button>
      ))}
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
  );
}

function ClientViewDialog(props: { client: Client; onClose: () => void; onEdit: () => void }) {
  const { client } = props;
  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <span className="flex flex-wrap items-center gap-2">
              {client.name}
              <ArchivedBadge active={client.active} ending="o" />
              <NewBadge />
            </span>
          </DialogTitle>
          <DialogDescription>Los datos del cliente para facturarle y cobrarle.</DialogDescription>
        </DialogHeader>
        {client.system && <SystemClientAlert />}
        {clientSections(client).map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h3 className="font-medium">{section.title}</h3>
            <DetailList details={section.details} />
          </section>
        ))}
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cerrar
          </Button>
          {!client.system && <Button onClick={props.onEdit}>Editar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientDialog(props: { client: Client | null; dialog: FormDialogControl }) {
  const { client, dialog } = props;
  const form = useClientFormFor(client, dialog);
  return (
    <FormDialog
      dialog={dialog}
      form={form}
      action={idleAction}
      className="max-h-dvh overflow-y-auto sm:max-w-2xl"
      title={
        <>
          {client ? client.name : "Nuevo cliente"}
          {client && <ArchivedBadge active={client.active} ending="o" />}
          <NewBadge />
        </>
      }
      description="Los datos del cliente para facturarle y cobrarle."
      submitLabel={client ? "Guardar" : "Crear cliente"}
      aside={
        client && (
          <Button
            variant={client.active ? "destructive" : "outline"}
            onClick={() => {
              setClientsActive([client.id], !client.active);
              dialog.hide();
            }}
          >
            {client.active ? "Archivar" : "Restaurar"}
          </Button>
        )
      }
    >
      <ClientFields form={form} editingId={client?.id} frame={collapsibleSection} />
    </FormDialog>
  );
}

function useClientFormFor(client: Client | null, dialog: FormDialogControl) {
  return useClientForm({
    values: client ?? emptyClientValues,
    onRefused: (problems) => dialog.showProblems(problems),
    onValid: (values) => {
      if (client) {
        updateClient(client.id, values);
      } else {
        addClient(values);
      }
      dialog.hide();
    },
  });
}
