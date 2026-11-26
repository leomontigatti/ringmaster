import { useStore } from "@tanstack/react-form";
import { EyeIcon, FolderTreeIcon, ShapesIcon } from "lucide-react";
import { useState } from "react";

import { useAppForm } from "#/components/app-form.tsx";
import { useFieldContext } from "#/components/form-fields.tsx";
import { placeAttributes } from "#/components/field-size.ts";
import { useFieldId } from "#/components/field-problem.tsx";
import { archivedFilter, includesArchivedPick } from "#/components/filter-groups.ts";
import type { FilterGroup } from "#/components/filter-groups.ts";
import type { FieldProblem } from "#/components/form-problems.ts";
import { NewBadge } from "#/components/prototype-switcher.tsx";
import { Field, FieldDescription, FieldLabel } from "#/components/ui/field.tsx";
import { Switch } from "#/components/ui/switch.tsx";

import type { SectionFrame } from "#/routes/_app/clientes/-prototype-form.tsx";
import {
  amountText,
  categoryFilterOptions,
  categoryOptions,
  formatMoney,
  formatPercent,
  labelOf,
  marginFrom,
  parseAmount,
  priceFrom,
  productStore,
  sameSku,
  typeOptions,
  vatOptions,
  visibilityOptions,
} from "#/routes/_app/productos/-prototype-data.ts";
import type {
  Product,
  ProductFilters,
  ProductValues,
} from "#/routes/_app/productos/-prototype-data.ts";

// PROTOTYPE (prototype/catalog): what every variant of the Productos screens
// shares: the fields with the live price, the checks, the values, the filters.

const amountFields = [
  ["cost", "Ingresá el costo como número, por ejemplo 1234,50."],
  ["margin", "Ingresá el margen como número, por ejemplo 35."],
  ["price", "Ingresá el precio como número, por ejemplo 2450,00."],
] satisfies [keyof ProductValues, string][];

export function productProblems(values: ProductValues, editingId?: string): FieldProblem[] {
  const problems: FieldProblem[] = [];
  if (values.name.trim() === "") {
    problems.push({ field: "name", message: "Ingresá el nombre." });
  }
  const duplicate = sameSku(productStore.get(), values.sku, editingId);
  if (values.sku.trim() === "") {
    problems.push({ field: "sku", message: "Ingresá el SKU." });
  } else if (duplicate) {
    problems.push({
      field: "sku",
      message: `Ya hay un producto con el SKU ${values.sku.trim()}: ${duplicate.name}.`,
    });
  }
  for (const [field, message] of amountFields) {
    if (values[field].trim() !== "" && parseAmount(values[field]) === null) {
      problems.push({ field, message });
    }
  }
  return problems;
}

export function useProductForm(props: {
  values: ProductValues;
  editingId?: string;
  onRefused: (problems: FieldProblem[]) => void;
  onValid: (values: ProductValues) => void;
}) {
  return useAppForm({
    defaultValues: props.values,
    onSubmit: ({ value }) => {
      const problems = productProblems(value, props.editingId);
      if (problems.length > 0) {
        props.onRefused(problems);
        return;
      }
      const locked = value.visibility === "compras" || value.visibility === "integraciones";
      props.onValid(locked ? { ...value, pos: false } : value);
    },
  });
}

type ProductForm = ReturnType<typeof useProductForm>;

/** `Mostrar en Punto de Venta`: a switch, off and locked for what is never sold at the counter. */
function PosSwitch(props: { locked: boolean }) {
  const field = useFieldContext<boolean>();
  const id = useFieldId(field.name);
  const hintId = `${id}-hint`;
  return (
    <Field {...placeAttributes({ size: "half" }, "half")}>
      <Field orientation="horizontal" className="w-fit">
        <Switch
          id={id}
          checked={field.state.value && !props.locked}
          disabled={props.locked}
          aria-describedby={props.locked ? hintId : undefined}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <FieldLabel htmlFor={id}>
          Mostrar en Punto de Venta
          <NewBadge />
        </FieldLabel>
      </Field>
      {props.locked && (
        <FieldDescription id={hintId}>
          Lo que es solo de compras o de integraciones no se vende en el punto de venta.
        </FieldDescription>
      )}
    </Field>
  );
}

/** The product's fields, the basic ones first; the price follows the cost and the margin as they are typed. */
export function ProductFields(props: { form: ProductForm; frame: SectionFrame }) {
  const { form, frame } = props;
  const visibility = useStore(form.store, (state) => state.values.visibility);
  const locked = visibility === "compras" || visibility === "integraciones";

  function setPrice(changed: Partial<ProductValues>) {
    const values = { ...form.state.values, ...changed };
    const cost = parseAmount(values.cost);
    if (cost === null) {
      return;
    }
    const price = priceFrom(cost, parseAmount(values.margin) ?? 0, Number(values.vat));
    form.setFieldValue("price", amountText(price), { dontRunListeners: true });
  }

  function setMargin(price: string) {
    const values = form.state.values;
    const cost = parseAmount(values.cost);
    const amount = parseAmount(price);
    if (!cost || amount === null) {
      return;
    }
    const margin = marginFrom(cost, amount, Number(values.vat));
    form.setFieldValue("margin", amountText(margin), { dontRunListeners: true });
  }

  return (
    <>
      <form.AppField name="type">
        {(field) => <field.SelectField label="Tipo" options={typeOptions} />}
      </form.AppField>
      <form.AppField name="name">
        {(field) => <field.TextField label="Nombre" size="half" required />}
      </form.AppField>
      <form.AppField name="sku">
        {(field) => <field.TextField label="SKU" required placeholder="BEB-001" />}
      </form.AppField>
      <form.AppField name="barcode">
        {(field) => <field.TextField label="Código de barras" placeholder="7790001000012" />}
      </form.AppField>
      <form.AppField name="category">
        {(field) => (
          <field.SelectField
            label="Categoría"
            size="half"
            options={categoryOptions}
            placeholder="Sin categoría"
          />
        )}
      </form.AppField>
      <form.AppField name="visibility">
        {(field) => <field.SelectField label="Visibilidad" options={visibilityOptions} />}
      </form.AppField>
      <form.AppField name="pos">{() => <PosSwitch locked={locked} />}</form.AppField>
      {frame({
        title: "Precios",
        open: true,
        children: (
          <>
            <form.AppField
              name="cost"
              listeners={{ onChange: ({ value }) => setPrice({ cost: value }) }}
            >
              {(field) => <field.TextField label="Costo sin IVA" placeholder="1234,50" />}
            </form.AppField>
            <form.AppField
              name="margin"
              listeners={{ onChange: ({ value }) => setPrice({ margin: value }) }}
            >
              {(field) => <field.TextField label="Margen %" placeholder="35" />}
            </form.AppField>
            <form.AppField
              name="vat"
              listeners={{ onChange: ({ value }) => setPrice({ vat: value }) }}
            >
              {(field) => (
                <field.SelectField label="Alícuota de IVA" options={vatOptions} required />
              )}
            </form.AppField>
            <form.AppField name="price" listeners={{ onChange: ({ value }) => setMargin(value) }}>
              {(field) => (
                <field.TextField
                  label="Precio con IVA"
                  placeholder="2450,00"
                  hint="Cambiarlo recalcula el margen."
                />
              )}
            </form.AppField>
          </>
        ),
      })}
      {frame({
        title: "Más datos",
        children: (
          <form.AppField name="description">
            {(field) => <field.TextareaField label="Descripción" />}
          </form.AppField>
        ),
      })}
    </>
  );
}

export const priceOf = (product: ProductValues) => parseAmount(product.price);

export const costOf = (product: ProductValues) => parseAmount(product.cost);

export const marginOf = (product: ProductValues) => parseAmount(product.margin);

/** The product's values by section, as its detail shows them. */
export function productSections(product: Product) {
  return [
    {
      title: "Datos principales",
      details: [
        ["Tipo", labelOf(typeOptions, product.type)],
        ["SKU", product.sku],
        ["Código de barras", product.barcode || null],
        ["Categoría", labelOf(categoryOptions, product.category) || null],
        ["Visibilidad", labelOf(visibilityOptions, product.visibility)],
        ["Punto de Venta", product.pos ? "Se muestra" : "No se muestra"],
      ],
    },
    {
      title: "Precios",
      details: [
        ["Costo sin IVA", formatMoney(costOf(product))],
        ["Margen", formatPercent(marginOf(product))],
        ["Alícuota de IVA", labelOf(vatOptions, product.vat)],
        ["Precio con IVA", formatMoney(priceOf(product))],
      ],
    },
    { title: "Más datos", details: [["Descripción", product.description || null]] },
  ] satisfies { title: string; details: [string, string | null][] }[];
}

export function useProductFilters() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const groups: FilterGroup[] = [
    archivedFilter(filters.archived, { group: "Archivados", included: "Incluidos" }),
    {
      id: "type",
      label: "Tipo",
      icon: ShapesIcon,
      options: typeOptions,
      value: filters.type ?? null,
    },
    {
      id: "category",
      label: "Categoría",
      icon: FolderTreeIcon,
      options: categoryFilterOptions,
      value: filters.category ?? null,
    },
    {
      id: "visibility",
      label: "Visibilidad",
      icon: EyeIcon,
      options: visibilityOptions,
      value: filters.visibility ?? null,
    },
  ];
  function pick(groupId: string, value: string | null) {
    if (groupId === "archivados") {
      setFilters({ ...filters, archived: includesArchivedPick(value) });
      return;
    }
    setFilters({ ...filters, [groupId]: value });
  }
  return { filters, groups, onPick: pick, onRemove: (groupId: string) => pick(groupId, null) };
}
