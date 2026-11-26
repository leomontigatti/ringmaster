import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { fixedCrumbs } from "#/components/app-breadcrumbs.tsx";
import { FormPage, useFormPage } from "#/components/form-page.tsx";
import { PrototypeSwitcher, variantSearch } from "#/components/prototype-switcher.tsx";

import { titledSection } from "#/routes/_app/clientes/-prototype-form.tsx";
import { addProduct, emptyProductValues } from "#/routes/_app/productos/-prototype-data.ts";
import { ProductFields, useProductForm } from "#/routes/_app/productos/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant C: the create on a page of its own.

export const Route = createFileRoute("/_app/productos/nuevo")({
  head: () => ({ meta: [{ title: "Nuevo producto · ringmaster" }] }),
  validateSearch: variantSearch,
  staticData: { crumbs: fixedCrumbs("Nuevo producto") },
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  const page = useFormPage({ to: "/productos", search: { variant: "C" } });
  const form = useProductForm({
    values: emptyProductValues,
    onRefused: page.showProblems,
    onValid: (values) => {
      addProduct(values);
      page.leave();
    },
  });
  return (
    <>
      <FormPage
        page={page}
        form={form}
        title="Nuevo producto"
        description="Algo que la organización vende o compra, con su costo y su precio."
        submitLabel="Crear producto"
        creates
        pending={false}
        onClear={() => undefined}
      >
        <ProductFields form={form} frame={titledSection} />
      </FormPage>
      <PrototypeSwitcher
        current="C"
        onChange={(variant) => void navigate({ to: "/productos", search: { variant } })}
      />
    </>
  );
}
