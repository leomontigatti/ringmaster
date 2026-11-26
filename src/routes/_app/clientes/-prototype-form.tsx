import { useStore } from "@tanstack/react-form";
import {
  ChevronDownIcon,
  CalendarClockIcon,
  MapPinIcon,
  ReceiptTextIcon,
  TagIcon,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { FormGrid, useAppForm } from "#/components/app-form.tsx";
import { archivedFilter, includesArchivedPick } from "#/components/filter-groups.ts";
import type { FilterGroup } from "#/components/filter-groups.ts";
import type { FieldProblem } from "#/components/form-problems.ts";
import { Detail } from "#/components/record-section.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#/components/ui/collapsible.tsx";
import { FieldLegend, FieldSeparator, FieldSet } from "#/components/ui/field.tsx";
import { formatPhone, parsePhoneEntry } from "#/lib/phones.ts";

import {
  docTypeOptions,
  labelOf,
  paymentBucketOptions,
  paymentTermLabel,
  paymentTermOptions,
  priceListOptions,
  provinceOptions,
  sameDocument,
  tagOptions,
  taxCategoryOptions,
  useClients,
} from "#/routes/_app/clientes/-prototype-data.ts";
import type {
  Client,
  ClientFilters,
  ClientValues,
} from "#/routes/_app/clientes/-prototype-data.ts";

// PROTOTYPE (prototype/catalog): what every variant of the Clientes screens
// shares: the form's fields and checks, the record's values, the filters.
// Each variant frames the sections its own way.

export function clientProblems(values: ClientValues): FieldProblem[] {
  const problems: FieldProblem[] = [];
  if (values.name.trim() === "") {
    problems.push({ field: "name", message: "Ingresá la razón social." });
  }
  if (values.phone.number !== "" && !parsePhoneEntry(values.phone).ok) {
    problems.push({
      field: "phone",
      message:
        "Ingresá 10 números: el código de área sin 0 y el número sin 15, por ejemplo 3515551234.",
    });
  }
  if (values.email !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    problems.push({
      field: "email",
      message: "Ingresá un correo válido, por ejemplo ventas@empresa.com.ar.",
    });
  }
  if (values.paymentTerm === "custom" && !/^\d+(\s*,\s*\d+)*$/.test(values.customDays.trim())) {
    problems.push({
      field: "customDays",
      message: "Ingresá los días separados por comas, por ejemplo 30, 45, 60.",
    });
  }
  return problems;
}

export function useClientForm(props: {
  values: ClientValues;
  onRefused: (problems: FieldProblem[]) => void;
  onValid: (values: ClientValues) => void;
}) {
  return useAppForm({
    defaultValues: props.values,
    onSubmit: ({ value }) => {
      const problems = clientProblems(value);
      if (problems.length > 0) {
        props.onRefused(problems);
        return;
      }
      props.onValid(value);
    },
  });
}

export type ClientForm = ReturnType<typeof useClientForm>;

/** How a variant draws a section of the form: its title, and its fields in a grid of their own. */
export type SectionFrame = (section: {
  title: string;
  children: ReactNode;
  /** Starts open, where a variant folds its sections. */
  open?: boolean;
}) => ReactNode;

export const titledSection: SectionFrame = (section) => (
  <>
    <FieldSeparator />
    <FieldSet>
      <FieldLegend>{section.title}</FieldLegend>
      <FormGrid>{section.children}</FormGrid>
    </FieldSet>
  </>
);

export const collapsibleSection: SectionFrame = (section) => (
  <Collapsible defaultOpen={section.open}>
    <CollapsibleTrigger render={<Button variant="ghost" className="w-full justify-between" />}>
      {section.title}
      <ChevronDownIcon data-icon="inline-end" aria-hidden />
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-3">
      <FormGrid>{section.children}</FormGrid>
    </CollapsibleContent>
  </Collapsible>
);

/** The client's fields, the basic ones first, then its sections as `frame` draws them. */
export function ClientFields(props: { form: ClientForm; editingId?: string; frame: SectionFrame }) {
  const { form, frame } = props;
  const clients = useClients();
  const docNumber = useStore(form.store, (state) => state.values.docNumber);
  const paymentTerm = useStore(form.store, (state) => state.values.paymentTerm);
  const duplicate = sameDocument(clients, docNumber, props.editingId);
  return (
    <>
      {duplicate && (
        <Alert variant="warning">
          <AlertTitle>Documento repetido</AlertTitle>
          <AlertDescription>
            {`${duplicate.name} tiene el mismo documento. Podés guardar igual.`}
          </AlertDescription>
        </Alert>
      )}
      <form.AppField name="docType">
        {(field) => <field.SelectField label="Tipo de documento" options={docTypeOptions} />}
      </form.AppField>
      <form.AppField name="docNumber">
        {(field) => <field.TextField label="Número de documento" placeholder="30-71234567-1" />}
      </form.AppField>
      <form.AppField name="name">
        {(field) => <field.TextField label="Razón social" size="half" required />}
      </form.AppField>
      <form.AppField name="phone">
        {(field) => <field.PhoneField label="Teléfono" startsRow />}
      </form.AppField>
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            label="Correo electrónico"
            type="email"
            size="half"
            placeholder="ventas@empresa.com.ar"
          />
        )}
      </form.AppField>
      <form.AppField name="taxCategory">
        {(field) => (
          <field.SelectField label="Condición frente al IVA" options={taxCategoryOptions} />
        )}
      </form.AppField>
      {frame({
        title: "Domicilio",
        children: (
          <>
            <form.AppField name="address">
              {(field) => (
                <field.TextField label="Dirección" size="half" placeholder="Av. Colón 1234" />
              )}
            </form.AppField>
            <form.AppField name="apartment">
              {(field) => <field.TextField label="Depto/Piso" placeholder="3.° B" />}
            </form.AppField>
            <form.AppField name="postalCode">
              {(field) => <field.TextField label="Código postal" placeholder="5000" />}
            </form.AppField>
            <form.AppField name="province">
              {(field) => (
                <field.SelectField
                  label="Provincia"
                  size="half"
                  options={provinceOptions}
                  placeholder="Elegí una"
                />
              )}
            </form.AppField>
            <form.AppField name="city">
              {(field) => <field.TextField label="Ciudad" size="half" />}
            </form.AppField>
          </>
        ),
      })}
      {frame({
        title: "Información comercial",
        children: (
          <>
            <form.AppField name="companyName">
              {(field) => <field.TextField label="Nombre de fantasía" size="half" />}
            </form.AppField>
            <form.AppField name="priceList">
              {(field) => <field.SelectField label="Lista de precios" options={priceListOptions} />}
            </form.AppField>
            <form.AppField name="paymentTerm">
              {(field) => (
                <field.SelectField label="Condición de pago" options={paymentTermOptions} />
              )}
            </form.AppField>
            {paymentTerm === "custom" && (
              <form.AppField name="customDays">
                {(field) => (
                  <field.TextField
                    label="Días de cada cuota"
                    placeholder="30, 45, 60"
                    hint="Separados por comas."
                  />
                )}
              </form.AppField>
            )}
          </>
        ),
      })}
      {frame({
        title: "Más datos",
        children: (
          <>
            <form.AppField name="description">
              {(field) => <field.TextareaField label="Descripción" />}
            </form.AppField>
            <form.AppField name="tags">
              {(field) => <field.CheckboxGroupField legend="Etiquetas" options={tagOptions} row />}
            </form.AppField>
          </>
        ),
      })}
    </>
  );
}

const shown = (value: string) => (value === "" ? null : value);

function phoneText(client: Client) {
  const parsed = parsePhoneEntry(client.phone);
  return parsed.ok ? formatPhone(parsed.phone) : null;
}

/** The client's values by section, as its detail shows them. */
export function clientSections(client: Client) {
  return [
    {
      title: "Datos principales",
      details: [
        ["Documento", client.docNumber === "" ? null : `${client.docType} ${client.docNumber}`],
        ["Condición frente al IVA", labelOf(taxCategoryOptions, client.taxCategory)],
        ["Teléfono", phoneText(client)],
        ["Correo electrónico", shown(client.email)],
      ],
    },
    {
      title: "Domicilio",
      details: [
        ["Dirección", shown([client.address, client.apartment].filter(Boolean).join(", "))],
        ["Código postal", shown(client.postalCode)],
        ["Ciudad", shown(client.city)],
        ["Provincia", shown(client.province)],
      ],
    },
    {
      title: "Información comercial",
      details: [
        ["Nombre de fantasía", shown(client.companyName)],
        ["Lista de precios", labelOf(priceListOptions, client.priceList)],
        ["Condición de pago", paymentTermLabel(client)],
      ],
    },
    {
      title: "Más datos",
      details: [
        ["Descripción", shown(client.description)],
        ["Etiquetas", shown(client.tags.join(", "))],
      ],
    },
  ] satisfies { title: string; details: [string, string | null][] }[];
}

export function DetailList(props: { details: [string, string | null][] }) {
  return (
    <dl className="grid grid-cols-2 gap-4">
      {props.details.map(([label, value]) => (
        <Detail key={label} label={label} value={value} />
      ))}
    </dl>
  );
}

export function SystemClientAlert() {
  return (
    <Alert variant="info">
      <AlertTitle>Cliente del sistema</AlertTitle>
      <AlertDescription>
        Las ventas sin un cliente identificado van a Consumidor Final, así que no se edita ni se
        archiva.
      </AlertDescription>
    </Alert>
  );
}

/** The list's filters, `FilterBar`'s groups, and what picking or removing one does. */
export function useClientFilters() {
  const [filters, setFilters] = useState<ClientFilters>({});
  const groups: FilterGroup[] = [
    archivedFilter(filters.archived, { group: "Archivados", included: "Incluidos" }),
    {
      id: "taxCategory",
      label: "Condición IVA",
      icon: ReceiptTextIcon,
      options: taxCategoryOptions,
      value: filters.taxCategory ?? null,
    },
    {
      id: "province",
      label: "Provincia",
      icon: MapPinIcon,
      options: provinceOptions,
      value: filters.province ?? null,
    },
    {
      id: "paymentBucket",
      label: "Plazo de pago",
      icon: CalendarClockIcon,
      options: paymentBucketOptions,
      value: filters.paymentBucket ?? null,
    },
    {
      id: "tag",
      label: "Etiqueta",
      icon: TagIcon,
      options: tagOptions,
      value: filters.tag ?? null,
    },
  ];
  function pick(groupId: string, value: string | null) {
    if (groupId === "archivados") {
      setFilters({ ...filters, archived: includesArchivedPick(value) });
      return;
    }
    setFilters({ ...filters, [groupId]: value });
  }
  return {
    filters,
    setFilters,
    groups,
    onPick: pick,
    onRemove: (groupId: string) => pick(groupId, null),
  };
}
