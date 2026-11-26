import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PrototypeSwitcher, variantSearch } from "#/components/prototype-switcher.tsx";

import { ClientsVariantA } from "#/routes/_app/clientes/-prototype-variant-a.tsx";
import { ClientsVariantB } from "#/routes/_app/clientes/-prototype-variant-b.tsx";
import { ClientsVariantC } from "#/routes/_app/clientes/-prototype-variant-c.tsx";

// PROTOTYPE (prototype/catalog): three variants of the Clientes list, create,
// edit and archive, switchable with `?variant=A|B|C` on /clientes, over the
// in-memory clients of `-prototype-data.ts`.

export const Route = createFileRoute("/_app/clientes/")({
  head: () => ({ meta: [{ title: "Clientes · ringmaster" }] }),
  validateSearch: variantSearch,
  component: Clients,
});

function Clients() {
  const { variant = "A" } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <>
      {variant === "A" && <ClientsVariantA />}
      {variant === "B" && <ClientsVariantB />}
      {variant === "C" && <ClientsVariantC />}
      <PrototypeSwitcher
        current={variant}
        onChange={(next) =>
          void navigate({ to: "/clientes", search: { variant: next }, replace: true })
        }
      />
    </>
  );
}
