import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { PackageIcon, TagIcon, TruckIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { DataTable, NoMatches, RowName, useClientDataTable } from "#/components/data-table.tsx";
import type { DataTableColumn } from "#/components/data-table.tsx";
import { EmptyState, EmptyStateLink } from "#/components/empty-state.tsx";
import { FilterBar } from "#/components/filter-bar.tsx";
import { FormDialog, useFormDialog } from "#/components/form-dialog.tsx";
import { FormGrid, useAppForm } from "#/components/app-form.tsx";
import { activeRecord } from "#/components/admin-form.tsx";
import { CreateButton, FormPage, useFormPage } from "#/components/form-page.tsx";
import type { RecordHeader } from "#/components/form-page.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { Detail, RecordSection } from "#/components/record-section.tsx";
import { showSaveFailed } from "#/components/save-failure.ts";
import { Button } from "#/components/ui/button.tsx";
import { Checkbox } from "#/components/ui/checkbox.tsx";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { emptyPhoneEntry } from "#/lib/phones.ts";

// Each pattern of docs/agents/style-guide.md, drawn once, so an agent or a
// reviewer can compare a screen with it. Only `pnpm dev` serves this page.
export const Route = createFileRoute("/_app/dev/patrones")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound();
    }
  },
  head: () => ({ meta: [{ title: "Patrones · ringmaster" }] }),
  component: Patterns,
});

function Pattern(props: { title: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={`flex flex-col gap-4 ${props.wide ? "" : "max-w-xl"}`}>
      <h2 className="text-lg font-semibold">{props.title}</h2>
      {props.children}
    </section>
  );
}

const patternColumns: DataTableColumn<{ id: string; name: string; city: string }>[] = [
  { id: "name", header: "Nombre", cell: (row) => <RowName name={row.name} /> },
  { id: "city", header: "Localidad", cell: (row) => row.city },
];

const patternRows = [
  { id: "1", name: "Ana Gómez", city: "Córdoba" },
  { id: "2", name: "Juan Pérez", city: "Villa María" },
];

function PatternTable() {
  const { table, pager, query, setQuery } = useClientDataTable({
    rows: patternRows,
    columns: patternColumns,
    getRowId: (row) => row.id,
    searchText: (row) => row.name,
  });
  return (
    <DataTable
      table={table}
      pager={pager}
      search={{
        value: query,
        onChange: setQuery,
        label: "Buscar cliente",
        placeholder: "Buscar por nombre",
      }}
      empty={<NoMatches icon={UsersIcon} />}
    />
  );
}

/** A short fixed list: no search, only the rows and their count. */
function PatternFixedTable() {
  const { table, pager } = useClientDataTable({
    rows: patternRows,
    columns: patternColumns,
    getRowId: (row) => row.id,
  });
  return <DataTable table={table} pager={pager} empty={null} />;
}

/** A page of settings: one section per setting, each with its own form page or link. */
function PatternSettings() {
  return (
    <div className="flex flex-col gap-6">
      <RecordSection
        title="Moneda"
        action={
          <Button variant="outline" size="sm">
            Editar
          </Button>
        }
      >
        <dl>
          <Detail label="Los precios se cargan en" value="Pesos argentinos" />
        </dl>
      </RecordSection>
      <RecordSection
        title="Importación"
        action={
          <Button variant="outline" size="sm">
            Importar
          </Button>
        }
      >
        <p className="text-muted-foreground text-sm">
          Subí una planilla y mirá qué se carga antes de guardarlo.
        </p>
      </RecordSection>
    </div>
  );
}

function PatternFilters() {
  const [supplier, setSupplier] = useState<string | null>("acme");
  return (
    <FilterBar
      groups={[
        {
          id: "category",
          label: "Rubro",
          icon: TagIcon,
          required: true,
          value: "tools",
          options: [{ value: "tools", label: "Herramientas", section: "Ferretería" }],
        },
        {
          id: "supplier",
          label: "Proveedor",
          icon: TruckIcon,
          value: supplier,
          options: [
            { value: "acme", label: "Acme SA" },
            { value: "sur", label: "Distribuidora Sur" },
          ],
        },
      ]}
      onPick={(_, value) => setSupplier(value)}
      onRemove={() => setSupplier(null)}
    />
  );
}

function PatternFormPage(props: { title: string; record?: RecordHeader }) {
  const page = useFormPage({ to: "/dev/patrones" });
  const form = useAppForm({
    defaultValues: { name: "" },
    onSubmit: () => page.showProblems([{ field: "name", message: "Ingresá el nombre." }]),
  });
  return (
    <FormPage
      page={page}
      form={form}
      title={props.title}
      submitLabel={props.record ? "Guardar" : "Crear producto"}
      creates={!props.record}
      record={props.record}
      pending={false}
      onClear={() => undefined}
    >
      <form.AppField name="name">{(field) => <field.TextField label="Nombre" />}</form.AppField>
    </FormPage>
  );
}

const patternUnits = [
  { value: "unit", label: "Unidad", mark: <PackageIcon aria-hidden /> },
  { value: "box", label: "Caja", mark: <PackageIcon aria-hidden /> },
];

function PatternMarkedSelect() {
  const form = useAppForm({ defaultValues: { unit: "unit" } });
  return (
    <FormGrid>
      <form.AppField name="unit">
        {(field) => <field.MarkedSelectField label="Unidad de venta" options={patternUnits} />}
      </form.AppField>
    </FormGrid>
  );
}

const patternCategories = [
  { value: "tools", label: "Herramientas", detail: "12 productos" },
  { value: "paint", label: "Pinturería", detail: "8 productos" },
  { value: "electric", label: "Electricidad", detail: "20 productos" },
];

/** Several records picked from a list: with picks, and with nothing to pick. */
function PatternMultiCombobox() {
  const form = useAppForm({ defaultValues: { picked: ["paint"], none: [] as string[] } });
  const shared = {
    emptyText: "No hay rubros.",
    noMatchText: (query: string) => `Ningún rubro coincide con “${query}”.`,
    removeLabel: (name: string) => `Quitar ${name}`,
  };
  return (
    <FormGrid>
      <form.AppField name="picked">
        {(field) => (
          <field.MultiComboboxField label="Rubros" options={patternCategories} {...shared} />
        )}
      </form.AppField>
      <form.AppField name="none">
        {(field) => <field.MultiComboboxField label="Sin opciones" options={[]} {...shared} />}
      </form.AppField>
    </FormGrid>
  );
}

function PatternFieldSizes() {
  const form = useAppForm({
    defaultValues: {
      name: "",
      taxId: "",
      phone: emptyPhoneEntry,
      email: "",
      address: "",
      taxCondition: "",
      city: "",
      note: "",
    },
  });
  return (
    <FormGrid>
      <form.AppField name="name">
        {(field) => <field.TextField label="Razón social (un cuarto)" />}
      </form.AppField>
      <form.AppField name="taxId">
        {(field) => <field.TextField label="CUIT (un cuarto)" />}
      </form.AppField>
      <form.AppField name="phone">
        {(field) => <field.PhoneField label="Teléfono (un cuarto)" />}
      </form.AppField>
      <form.AppField name="email">
        {(field) => <field.TextField label="Correo electrónico (la mitad)" size="half" startsRow />}
      </form.AppField>
      <form.AppField name="address">
        {(field) => <field.TextField label="Domicilio (la mitad)" size="half" />}
      </form.AppField>
      <form.AppField name="taxCondition">
        {(field) => (
          <field.SelectField
            label="Condición frente al IVA (un cuarto)"
            options={[{ value: "", label: "Sin condición" }]}
          />
        )}
      </form.AppField>
      <form.AppField name="city">
        {(field) => <field.TextField label="Localidad (un cuarto)" />}
      </form.AppField>
      <form.AppField name="note">
        {(field) => <field.TextareaField label="Nota (todo el ancho)" />}
      </form.AppField>
    </FormGrid>
  );
}

/** An edit page that is its record's only page: its status and toggle beside the title. */
function PatternRecordFormPage() {
  const [active, setActive] = useState(true);
  return (
    <PatternFormPage
      title="Editar producto"
      record={activeRecord({
        active,
        ending: "o",
        archived: {
          title: "Producto archivado",
          consequence: "No aparece en las listas.",
        },
        toggle: { pending: false, error: null },
        onChange: setActive,
      })}
    />
  );
}

/** A small record created over its list: here every save is refused, so the dialog stays. */
function PatternFormDialog() {
  const dialog = useFormDialog();
  const form = useAppForm({
    defaultValues: { name: "" },
    onSubmit: () => dialog.showProblems([{ field: "name", message: "Ingresá el nombre." }]),
  });
  const action = { pending: false, error: null, errorField: "", setError: () => undefined };
  return (
    <>
      <Button variant="outline" className="w-fit" onClick={() => dialog.show()}>
        Nuevo rubro
      </Button>
      <FormDialog
        dialog={dialog}
        form={form}
        action={action}
        title="Nuevo rubro"
        description="Un rubro agrupa productos en las listas."
        submitLabel="Crear rubro"
      >
        <form.AppField name="name">{(field) => <field.TextField label="Nombre" />}</form.AppField>
      </FormDialog>
    </>
  );
}

function Patterns() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Patrones" description="Cómo se ve cada patrón de la guía de estilo." />
      <Pattern title="Página de formulario">
        <PatternFormPage title="Nuevo producto" />
      </Pattern>
      <Pattern title="Edición de un registro sin página propia">
        <PatternRecordFormPage />
      </Pattern>
      <Pattern title="Formulario en un diálogo">
        <PatternFormDialog />
      </Pattern>
      <Pattern title="Sección de un registro">
        <RecordSection
          title="Datos"
          action={
            <Button variant="outline" size="sm">
              Editar
            </Button>
          }
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Nombre" value="Ana Gómez" />
            <Detail label="Correo electrónico" value={null} />
          </dl>
        </RecordSection>
      </Pattern>
      <Pattern title="Página de configuración">
        <PatternSettings />
      </Pattern>
      <Pattern title="Campo">
        <Field>
          <FieldLabel htmlFor="pattern-name">Nombre</FieldLabel>
          <Input id="pattern-name" />
        </Field>
      </Pattern>
      <Pattern title="Campo con ayuda">
        <Field>
          <FieldLabel htmlFor="pattern-tax-id">CUIT</FieldLabel>
          <Input id="pattern-tax-id" aria-describedby="pattern-tax-id-hint" />
          <FieldDescription id="pattern-tax-id-hint">Por ejemplo: 30-71234567-8.</FieldDescription>
        </Field>
      </Pattern>
      <Pattern title="Campos por tamaño" wide>
        <PatternFieldSizes />
      </Pattern>
      <Pattern title="Lista con marcas">
        <PatternMarkedSelect />
      </Pattern>
      <Pattern title="Varios registros de una lista">
        <PatternMultiCombobox />
      </Pattern>
      <Pattern title="Filtros">
        <div className="flex flex-wrap items-center gap-2">
          <PatternFilters />
        </div>
      </Pattern>
      <Pattern title="Tabla">
        <PatternTable />
      </Pattern>
      <Pattern title="Lista fija, sin búsqueda">
        <PatternFixedTable />
      </Pattern>
      <Pattern title="Sin datos">
        <EmptyState
          icon={UsersIcon}
          title="Sin personal"
          description="Todavía no hay personas. Empezá creando la primera."
        >
          <CreateButton link={<Link to="/personal/nueva" />}>Nueva persona</CreateButton>
        </EmptyState>
      </Pattern>
      <Pattern title="Sin datos activos">
        <EmptyState
          icon={UsersIcon}
          title="Sin personal activo"
          description="No hay personas activas. Empezá creando una, o mirá la lista entera."
        >
          <CreateButton link={<Link to="/personal/nueva" />}>Nueva persona</CreateButton>
          <EmptyStateLink variant="outline" link={<Link to="/personal" />}>
            Ver la lista
          </EmptyStateLink>
        </EmptyState>
      </Pattern>
      <Pattern title="Sin datos, sin permiso para agregar">
        <EmptyState
          icon={PackageIcon}
          title="Sin productos"
          description="Todavía no hay productos."
        />
      </Pattern>
      <Pattern title="Búsqueda sin resultados">
        <NoMatches icon={UsersIcon} />
      </Pattern>
      <Pattern title="Aviso de un guardado que falló">
        <Button variant="outline" className="w-fit" onClick={showSaveFailed}>
          Mostrar el aviso
        </Button>
      </Pattern>
      <Pattern title="Casilla">
        <Field orientation="horizontal" className="w-fit">
          <Checkbox id="pattern-stock" />
          <FieldLabel htmlFor="pattern-stock">Controla stock</FieldLabel>
        </Field>
      </Pattern>
      <Pattern title="Grupo de casillas">
        <FieldSet>
          <FieldLegend variant="label">Roles</FieldLegend>
          <FieldGroup data-slot="checkbox-group">
            <Field orientation="horizontal" className="w-fit">
              <Checkbox id="pattern-admin-role" />
              <FieldLabel htmlFor="pattern-admin-role">Administrador</FieldLabel>
            </Field>
            <Field orientation="horizontal" className="w-fit">
              <Checkbox id="pattern-staff-role" />
              <FieldLabel htmlFor="pattern-staff-role">Empleado</FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
      </Pattern>
    </div>
  );
}
