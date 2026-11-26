import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PrototypeSwitcher, variantSearch } from "#/components/prototype-switcher.tsx";

import { ProductsVariantA } from "#/routes/_app/productos/-prototype-variant-a.tsx";
import { ProductsVariantB } from "#/routes/_app/productos/-prototype-variant-b.tsx";
import { ProductsVariantC } from "#/routes/_app/productos/-prototype-variant-c.tsx";

// PROTOTYPE (prototype/catalog): three variants of the Productos list, create,
// edit and archive, switchable with `?variant=A|B|C` on /productos, over the
// in-memory products of `-prototype-data.ts`.

export const Route = createFileRoute("/_app/productos/")({
  head: () => ({ meta: [{ title: "Productos · ringmaster" }] }),
  validateSearch: variantSearch,
  component: Products,
});

function Products() {
  const { variant = "A" } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <>
      {variant === "A" && <ProductsVariantA />}
      {variant === "B" && <ProductsVariantB />}
      {variant === "C" && <ProductsVariantC />}
      <PrototypeSwitcher
        current={variant}
        onChange={(next) =>
          void navigate({ to: "/productos", search: { variant: next }, replace: true })
        }
      />
    </>
  );
}
