import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { fixedCrumbs } from "#/components/app-breadcrumbs.tsx";
import { FormPage, useFormPage } from "#/components/form-page.tsx";
import { PrototypeSwitcher, variantSearch } from "#/components/prototype-switcher.tsx";

import { addClient, emptyClientValues } from "#/routes/_app/clientes/-prototype-data.ts";
import {
  ClientFields,
  titledSection,
  useClientForm,
} from "#/routes/_app/clientes/-prototype-form.tsx";

// PROTOTYPE (prototype/catalog), variant C: the create on a page of its own.

export const Route = createFileRoute("/_app/clientes/nuevo")({
  head: () => ({ meta: [{ title: "Nuevo cliente · ringmaster" }] }),
  validateSearch: variantSearch,
  staticData: { crumbs: fixedCrumbs("Nuevo cliente") },
  component: NewClient,
});

function NewClient() {
  const navigate = useNavigate();
  const page = useFormPage({ to: "/clientes", search: { variant: "C" } });
  const form = useClientForm({
    values: emptyClientValues,
    onRefused: page.showProblems,
    onValid: (values) => {
      addClient(values);
      page.leave();
    },
  });
  return (
    <>
      <FormPage
        page={page}
        form={form}
        title="Nuevo cliente"
        description="Una persona o empresa a la que la organización le vende."
        submitLabel="Crear cliente"
        creates
        pending={false}
        onClear={() => undefined}
      >
        <ClientFields form={form} frame={titledSection} />
      </FormPage>
      <PrototypeSwitcher
        current="C"
        onChange={(variant) => void navigate({ to: "/clientes", search: { variant } })}
      />
    </>
  );
}
