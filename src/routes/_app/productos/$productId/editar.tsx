import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { PackageIcon } from "lucide-react";

import { PageCrumbs } from "#/components/app-breadcrumbs.tsx";
import { EmptyState } from "#/components/empty-state.tsx";
import { FormPage, useFormPage } from "#/components/form-page.tsx";
import { PrototypeSwitcher, variantSearch } from "#/components/prototype-switcher.tsx";

import { titledSection } from "#/routes/_app/clientes/-prototype-form.tsx";
import { updateProduct, useProducts } from "#/routes/_app/productos/-prototype-data.ts";
import type { Product } from "#/routes/_app/productos/-prototype-data.ts";
import { ProductFields, useProductForm } from "#/routes/_app/productos/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant C: the product's edit on a page of its own.

export const Route = createFileRoute("/_app/productos/$productId/editar")({
  head: () => ({ meta: [{ title: "Editar producto · ringmaster" }] }),
  validateSearch: variantSearch,
  staticData: { crumbs: Crumbs },
  component: EditProduct,
});

function EditProduct() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const product = useProducts().find((one) => one.id === productId);
  return (
    <>
      {product ? (
        <ProductForm product={product} />
      ) : (
        <EmptyState
          icon={PackageIcon}
          title="Producto no encontrado"
          description="El prototipo guarda los productos en memoria: al recargar la página, los nuevos se pierden."
        />
      )}
      <PrototypeSwitcher
        current="C"
        onChange={(variant) => void navigate({ to: "/productos", search: { variant } })}
      />
    </>
  );
}

function ProductForm({ product }: { product: Product }) {
  const page = useFormPage({
    to: "/productos/$productId",
    params: { productId: product.id },
    search: { variant: "C" },
  });
  const form = useProductForm({
    values: product,
    editingId: product.id,
    onRefused: page.showProblems,
    onValid: (values) => {
      updateProduct(product.id, values);
      page.leave();
    },
  });
  return (
    <FormPage
      page={page}
      form={form}
      title={product.name}
      description="Cómo se vende el producto y cuánto cuesta."
      submitLabel="Guardar"
      pending={false}
      onClear={() => undefined}
    >
      <ProductFields form={form} frame={titledSection} />
    </FormPage>
  );
}

function Crumbs() {
  const { productId } = Route.useParams();
  const product = useProducts().find((one) => one.id === productId);
  return (
    <PageCrumbs
      items={[
        {
          label: product?.name ?? "Producto",
          link: (
            <Link to="/productos/$productId" params={{ productId }} search={{ variant: "C" }} />
          ),
        },
        { label: "Editar" },
      ]}
    />
  );
}
