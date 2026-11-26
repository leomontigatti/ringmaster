import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { PencilIcon, UsersIcon } from "lucide-react";

import { activeRecord } from "#/components/admin-form.tsx";
import { AlertStack } from "#/components/alert-stack.tsx";
import { PageCrumbs } from "#/components/app-breadcrumbs.tsx";
import { EmptyState } from "#/components/empty-state.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { PrototypeSwitcher, variantSearch } from "#/components/prototype-switcher.tsx";
import { RecordSection } from "#/components/record-section.tsx";
import { Button } from "#/components/ui/button.tsx";

import {
  labelOf,
  setClientsActive,
  taxCategoryOptions,
  useClients,
} from "#/routes/_app/clientes/-prototype-data.ts";
import {
  DetailList,
  SystemClientAlert,
  clientSections,
} from "#/routes/_app/clientes/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant C: the client's page, its sections as
// cards, `Editar` to its edit page and `Archivar` in `Acciones`.

export const Route = createFileRoute("/_app/clientes/$clientId/")({
  head: () => ({ meta: [{ title: "Cliente · ringmaster" }] }),
  validateSearch: variantSearch,
  staticData: { crumbs: Crumbs },
  component: ClientPage,
});

const idle = { pending: false, error: null };

function ClientPage() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const client = useClients().find((one) => one.id === clientId);
  const switcher = (
    <PrototypeSwitcher
      current="C"
      onChange={(variant) => void navigate({ to: "/clientes", search: { variant } })}
    />
  );
  if (!client) {
    return (
      <>
        <EmptyState
          icon={UsersIcon}
          title="Cliente no encontrado"
          description="El prototipo guarda los clientes en memoria: al recargar la página, los nuevos se pierden."
        />
        {switcher}
      </>
    );
  }
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title={client.name}
        status={record.status}
        description={client.companyName || labelOf(taxCategoryOptions, client.taxCategory)}
        actions={
          !client.system && (
            <>
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    to="/clientes/$clientId/editar"
                    params={{ clientId }}
                    search={{ variant: "C" }}
                  />
                }
              >
                <PencilIcon data-icon="inline-start" aria-hidden />
                Editar
              </Button>
              {record.actions(false)}
            </>
          )
        }
      />
      <AlertStack>
        {client.system && <SystemClientAlert />}
        {record.alert}
      </AlertStack>
      <div className="grid gap-4 lg:grid-cols-2">
        {clientSections(client).map((section) => (
          <RecordSection key={section.title} title={section.title}>
            <DetailList details={section.details} />
          </RecordSection>
        ))}
      </div>
      {switcher}
    </div>
  );
}

function Crumbs() {
  const { clientId } = Route.useParams();
  const client = useClients().find((one) => one.id === clientId);
  return <PageCrumbs items={[{ label: client?.name ?? "Cliente" }]} />;
}
