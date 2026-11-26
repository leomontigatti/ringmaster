import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { PackageIcon, PencilIcon } from "lucide-react";

import { activeRecord } from "#/components/admin-form.tsx";
import { AlertStack } from "#/components/alert-stack.tsx";
import { PageCrumbs } from "#/components/app-breadcrumbs.tsx";
import { EmptyState } from "#/components/empty-state.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { PrototypeSwitcher, variantSearch } from "#/components/prototype-switcher.tsx";
import { RecordSection } from "#/components/record-section.tsx";
import { Button } from "#/components/ui/button.tsx";

import { DetailList } from "#/routes/_app/clientes/-prototype-form.tsx";
import { setProductsActive, useProducts } from "#/routes/_app/productos/-prototype-data.ts";
import { productSections } from "#/routes/_app/productos/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant C: the product's page, its sections as
// cards, `Editar` to its edit page and `Archivar` in `Acciones`.

export const Route = createFileRoute("/_app/productos/$productId/")({
  head: () => ({ meta: [{ title: "Producto · ringmaster" }] }),
  validateSearch: variantSearch,
  staticData: { crumbs: Crumbs },
  component: ProductPage,
});

const idle = { pending: false, error: null };

function ProductPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const product = useProducts().find((one) => one.id === productId);
  const switcher = (
    <PrototypeSwitcher
      current="C"
      onChange={(variant) => void navigate({ to: "/productos", search: { variant } })}
    />
  );
  if (!product) {
    return (
      <>
        <EmptyState
          icon={PackageIcon}
          title="Producto no encontrado"
          description="El prototipo guarda los productos en memoria: al recargar la página, los nuevos se pierden."
        />
        {switcher}
      </>
    );
  }
  const record = activeRecord({
    active: product.active,
    ending: "o",
    archived: { title: "Producto archivado", consequence: "No aparece al vender ni al comprar." },
    toggle: idle,
    onChange: (active) => setProductsActive([product.id], active),
  });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={product.name}
        status={record.status}
        description={product.sku}
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  to="/productos/$productId/editar"
                  params={{ productId }}
                  search={{ variant: "C" }}
                />
              }
            >
              <PencilIcon data-icon="inline-start" aria-hidden />
              Editar
            </Button>
            {record.actions(false)}
          </>
        }
      />
      <AlertStack>{record.alert}</AlertStack>
      <div className="grid gap-4 lg:grid-cols-2">
        {productSections(product).map((section) => (
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
  const { productId } = Route.useParams();
  const product = useProducts().find((one) => one.id === productId);
  return <PageCrumbs items={[{ label: product?.name ?? "Producto" }]} />;
}
