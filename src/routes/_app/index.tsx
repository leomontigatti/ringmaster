import { HouseIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "#/components/empty-state.tsx";
import { pageHead } from "#/lib/page-title.ts";

// The home page every member opens on: empty until the first areas land.
export const Route = createFileRoute("/_app/")({
  head: () => pageHead("Inicio"),
  component: Home,
});

function Home() {
  const { viewer } = Route.useRouteContext();
  return (
    <EmptyState
      icon={HouseIcon}
      title={`Hola, ${viewer.name}`}
      description={`Este es el inicio de ${viewer.organizationName}. Todavía no hay nada para mostrar acá.`}
    />
  );
}
