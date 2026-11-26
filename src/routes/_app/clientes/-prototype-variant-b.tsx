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

import {
  addClient,
  clientSearchQuery,
  clientSearchText,
  emptyClientValues,
  filterClients,
  labelOf,
  setClientsActive,
  taxCategoryOptions,
  updateClient,
  useClients,
} from "#/routes/_app/clientes/-prototype-data.ts";
import type { Client } from "#/routes/_app/clientes/-prototype-data.ts";
import {
  ClientFields,
  DetailList,
  SystemClientAlert,
  clientSections,
  titledSection,
  useClientFilters,
  useClientForm,
} from "#/routes/_app/clientes/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant B "Maestro-detalle": a compact list on
// the left, searchable and filtered; the picked client's values on the right,
// edited in place. Nothing navigates away.

type Mode = { kind: "view" } | { kind: "edit" } | { kind: "create" };

export function ClientsVariantB() {
  const clients = useClients();
  const filters = useClientFilters();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("2");
  const [mode, setMode] = useState<Mode>({ kind: "view" });
  const rows = matchingRows(
    filterClients(clients, filters.filters),
    clientSearchText,
    clientSearchQuery(query),
  );
  const selected = clients.find((client) => client.id === selectedId);

  function pick(id: string) {
    setSelectedId(id);
    setMode({ kind: "view" });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Las personas y empresas a las que la organización les vende."
        actions={
          <CreateButton onClick={() => setMode({ kind: "create" })}>Nuevo cliente</CreateButton>
        }
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
            label="Buscar cliente"
            placeholder="Nombre, documento, correo, teléfono…"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterBar
              groups={filters.groups}
              onPick={filters.onPick}
              onRemove={filters.onRemove}
            />
          </div>
          <ul
            aria-label="Clientes"
            className="-mx-1 flex max-h-136 flex-col gap-0.5 overflow-y-auto"
          >
            {rows.map((client) => (
              <li key={client.id}>
                <ButtonPrimitive
                  className="hover:bg-muted aria-current:bg-muted flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-lg px-2 py-2 text-left text-sm font-medium"
                  aria-current={
                    client.id === selectedId && mode.kind !== "create" ? "true" : undefined
                  }
                  onClick={() => pick(client.id)}
                >
                  <span className="flex items-center gap-2">
                    {client.name}
                    <ArchivedBadge active={client.active} ending="o" />
                  </span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {[client.docNumber, client.city].filter(Boolean).join(" · ") ||
                      labelOf(taxCategoryOptions, client.taxCategory)}
                  </span>
                </ButtonPrimitive>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="text-muted-foreground px-2 py-6 text-center text-sm">
                Ningún cliente coincide con la búsqueda.
              </li>
            )}
          </ul>
          <span className="text-muted-foreground text-sm">
            {rows.length} de {clients.length} registros
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <DetailPane
            client={mode.kind === "create" ? undefined : selected}
            mode={mode}
            onMode={setMode}
            onSaved={pick}
          />
        </div>
      </div>
    </div>
  );
}

function DetailPane(props: {
  client: Client | undefined;
  mode: Mode;
  onMode: (mode: Mode) => void;
  onSaved: (id: string) => void;
}) {
  const { client, mode } = props;
  if (mode.kind === "create") {
    return (
      <PaneForm key="new" onCancel={() => props.onMode({ kind: "view" })} onSaved={props.onSaved} />
    );
  }
  if (!client) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
        Elegí un cliente de la lista.
      </p>
    );
  }
  if (mode.kind === "edit") {
    return (
      <PaneForm
        key={client.id}
        client={client}
        onCancel={() => props.onMode({ kind: "view" })}
        onSaved={props.onSaved}
      />
    );
  }
  return <PaneView client={client} onEdit={() => props.onMode({ kind: "edit" })} />;
}

const idle = { pending: false, error: null };

function PaneView(props: { client: Client; onEdit: () => void }) {
  const { client } = props;
  const record = activeRecord({
    active: client.active,
    ending: "o",
    archived: {
      title: "Cliente archivado",
      consequence: "No aparece al elegir un cliente en una venta.",
    },
    toggle: idle,
    onChange: (active) => setClientsActive([client.id], active),
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
            {client.name}
            {record.status}
          </h2>
          <p className="text-muted-foreground text-sm">
            {client.companyName || labelOf(taxCategoryOptions, client.taxCategory)}
          </p>
        </div>
        {!client.system && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={props.onEdit}>
              <PencilIcon data-icon="inline-start" aria-hidden />
              Editar
            </Button>
            {record.actions(false)}
          </div>
        )}
      </div>
      <AlertStack>
        {client.system && <SystemClientAlert />}
        {record.alert}
      </AlertStack>
      <div className="grid gap-4 xl:grid-cols-2">
        {clientSections(client).map((section) => (
          <RecordSection key={section.title} title={section.title}>
            <DetailList details={section.details} />
          </RecordSection>
        ))}
      </div>
    </div>
  );
}

function PaneForm(props: { client?: Client; onCancel: () => void; onSaved: (id: string) => void }) {
  const { client } = props;
  const [problems, setProblems] = useState<FieldProblem[]>([]);
  const form = useClientForm({
    values: client ?? emptyClientValues,
    onRefused: setProblems,
    onValid: (values) => {
      if (client) {
        updateClient(client.id, values);
        props.onSaved(client.id);
        return;
      }
      props.onSaved(addClient(values).id);
    },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            {client ? client.name : "Nuevo cliente"}
            <NewBadge />
          </span>
        </CardTitle>
        <CardDescription>
          {client
            ? "Editado en el panel, sin salir de la lista."
            : "Una persona o empresa a la que la organización le vende."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProblemsContext.Provider value={problems}>
          <FormGrid>
            <ClientFields form={form} editingId={client?.id} frame={titledSection} />
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
            {client ? "Guardar" : "Crear cliente"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
