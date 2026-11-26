import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";

import { PageCrumbs } from "#/components/app-breadcrumbs.tsx";
import { EmptyState } from "#/components/empty-state.tsx";
import { FormPage, useFormPage } from "#/components/form-page.tsx";
import { PrototypeSwitcher, variantSearch } from "#/components/prototype-switcher.tsx";

import { updateClient, useClients } from "#/routes/_app/clientes/-prototype-data.ts";
import type { Client } from "#/routes/_app/clientes/-prototype-data.ts";
import {
  ClientFields,
  titledSection,
  useClientForm,
} from "#/routes/_app/clientes/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant C: the client's edit on a page of its own.

export const Route = createFileRoute("/_app/clientes/$clientId/editar")({
  head: () => ({ meta: [{ title: "Editar cliente · ringmaster" }] }),
  validateSearch: variantSearch,
  staticData: { crumbs: Crumbs },
  component: EditClient,
});

function EditClient() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const client = useClients().find((one) => one.id === clientId);
  return (
    <>
      {client && !client.system ? (
        <ClientForm client={client} />
      ) : (
        <EmptyState
          icon={UsersIcon}
          title="Cliente no encontrado"
          description="El prototipo guarda los clientes en memoria: al recargar la página, los nuevos se pierden."
        />
      )}
      <PrototypeSwitcher
        current="C"
        onChange={(variant) => void navigate({ to: "/clientes", search: { variant } })}
      />
    </>
  );
}

function ClientForm({ client }: { client: Client }) {
  const page = useFormPage({
    to: "/clientes/$clientId",
    params: { clientId: client.id },
    search: { variant: "C" },
  });
  const form = useClientForm({
    values: client,
    onRefused: page.showProblems,
    onValid: (values) => {
      updateClient(client.id, values);
      page.leave();
    },
  });
  return (
    <FormPage
      page={page}
      form={form}
      title={client.name}
      description="Los datos del cliente para facturarle y cobrarle."
      submitLabel="Guardar"
      pending={false}
      onClear={() => undefined}
    >
      <ClientFields form={form} editingId={client.id} frame={titledSection} />
    </FormPage>
  );
}

function Crumbs() {
  const { clientId } = Route.useParams();
  const client = useClients().find((one) => one.id === clientId);
  return (
    <PageCrumbs
      items={[
        {
          label: client?.name ?? "Cliente",
          link: <Link to="/clientes/$clientId" params={{ clientId }} search={{ variant: "C" }} />,
        },
        { label: "Editar" },
      ]}
    />
  );
}
