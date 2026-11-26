import { createPrototypeStore } from "#/lib/prototype-store.ts";

// PROTOTYPE, wipe me (prototype/catalog): made-up products for the variants of
// the Productos screens, held in memory. A reload starts over.

export const typeOptions = [
  { value: "producto", label: "Producto" },
  { value: "servicio", label: "Servicio" },
];

export const visibilityOptions = [
  { value: "ventas-compras", label: "Ventas y compras" },
  { value: "ventas", label: "Solo ventas" },
  { value: "compras", label: "Solo compras" },
  { value: "integraciones", label: "Solo integraciones" },
];

export const vatOptions = [
  { value: "0", label: "0 %" },
  { value: "10.5", label: "10,5 %" },
  { value: "21", label: "21 %" },
  { value: "27", label: "27 %" },
];

const categoryTree: [string, string[]][] = [
  ["Bebidas", ["Gaseosas", "Aguas", "Vinos"]],
  ["Almacén", ["Yerba y té", "Galletitas", "Conservas"]],
  ["Limpieza", ["Hogar", "Ropa"]],
  ["Ferretería", ["Herramientas", "Tornillería"]],
  ["Servicios", ["Instalación", "Mantenimiento"]],
];

/** Each category and, under it, its subcategories: `Bebidas › Gaseosas`. */
export const categoryOptions = categoryTree.flatMap(([parent, children]) => [
  { value: parent, label: parent },
  ...children.map((child) => ({ value: `${parent}/${child}`, label: `${parent} › ${child}` })),
]);

/** The filter's options, under their category's heading; picking a category takes its subcategories too. */
export const categoryFilterOptions = categoryTree.flatMap(([parent, children]) => [
  { value: parent, label: `Todo ${parent}`, section: parent },
  ...children.map((child) => ({ value: `${parent}/${child}`, label: child, section: parent })),
]);

export interface ProductValues {
  type: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  visibility: string;
  pos: boolean;
  /** As typed, in es-AR: `1234,56`. */
  cost: string;
  margin: string;
  price: string;
  vat: string;
}

export interface Product extends ProductValues {
  id: string;
  active: boolean;
}

export const emptyProductValues: ProductValues = {
  type: "producto",
  name: "",
  sku: "",
  barcode: "",
  category: "",
  description: "",
  visibility: "ventas-compras",
  pos: true,
  cost: "",
  margin: "",
  price: "",
  vat: "21",
};

/** A number typed the es-AR way (`1.234,56`); null when it is none. */
export function parseAmount(text: string): number | null {
  const clean = text.trim().replace(/\$/g, "").replace(/\./g, "").replace(",", ".").trim();
  if (clean === "") {
    return null;
  }
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

/** A number as a field holds it: two decimals, comma. */
export const amountText = (value: number) => value.toFixed(2).replace(".", ",");

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export const formatMoney = (value: number | null) => (value === null ? "—" : money.format(value));

export const formatPercent = (value: number | null) =>
  value === null ? "—" : `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} %`;

/** Price with VAT from cost without VAT and margin: cost × (1 + margin) × (1 + VAT). */
export function priceFrom(cost: number, margin: number, vat: number) {
  return cost * (1 + margin / 100) * (1 + vat / 100);
}

/** The margin a price with VAT leaves over the cost. */
export function marginFrom(cost: number, price: number, vat: number) {
  return (price / (1 + vat / 100) / cost - 1) * 100;
}

type Seed = [
  type: string,
  name: string,
  sku: string,
  barcode: string,
  category: string,
  cost: number,
  margin: number,
  vat: string,
  visibility?: string,
  active?: boolean,
];

const seeds: Seed[] = [
  [
    "producto",
    "Gaseosa cola 2,25 L",
    "BEB-001",
    "7790001000012",
    "Bebidas/Gaseosas",
    1450,
    35,
    "21",
  ],
  [
    "producto",
    "Gaseosa lima limón 1,5 L",
    "BEB-002",
    "7790001000029",
    "Bebidas/Gaseosas",
    1180,
    35,
    "21",
  ],
  [
    "producto",
    "Agua mineral sin gas 2 L",
    "BEB-010",
    "7790001000104",
    "Bebidas/Aguas",
    780,
    40,
    "21",
  ],
  [
    "producto",
    "Agua saborizada pomelo 1,5 L",
    "BEB-011",
    "7790001000111",
    "Bebidas/Aguas",
    920,
    40,
    "21",
  ],
  [
    "producto",
    "Vino tinto malbec 750 ml",
    "BEB-020",
    "7790001000203",
    "Bebidas/Vinos",
    3900,
    45,
    "21",
  ],
  [
    "producto",
    "Vino blanco torrontés 750 ml",
    "BEB-021",
    "7790001000210",
    "Bebidas/Vinos",
    3600,
    45,
    "21",
  ],
  [
    "producto",
    "Yerba mate suave 1 kg",
    "ALM-001",
    "7790002000019",
    "Almacén/Yerba y té",
    3200,
    30,
    "10.5",
  ],
  [
    "producto",
    "Yerba mate con palo 500 g",
    "ALM-002",
    "7790002000026",
    "Almacén/Yerba y té",
    1750,
    30,
    "10.5",
  ],
  [
    "producto",
    "Té negro en saquitos x 50",
    "ALM-003",
    "7790002000033",
    "Almacén/Yerba y té",
    980,
    35,
    "10.5",
  ],
  [
    "producto",
    "Galletitas de agua 300 g",
    "ALM-010",
    "7790002000101",
    "Almacén/Galletitas",
    850,
    38,
    "21",
  ],
  [
    "producto",
    "Galletitas dulces con chips 200 g",
    "ALM-011",
    "7790002000118",
    "Almacén/Galletitas",
    1100,
    38,
    "21",
  ],
  [
    "producto",
    "Tomate perita en lata 400 g",
    "ALM-020",
    "7790002000200",
    "Almacén/Conservas",
    720,
    32,
    "21",
  ],
  [
    "producto",
    "Arvejas en lata 350 g",
    "ALM-021",
    "7790002000217",
    "Almacén/Conservas",
    640,
    32,
    "21",
    "ventas-compras",
    false,
  ],
  ["producto", "Lavandina 1 L", "LIM-001", "7790003000016", "Limpieza/Hogar", 560, 45, "21"],
  [
    "producto",
    "Detergente limón 750 ml",
    "LIM-002",
    "7790003000023",
    "Limpieza/Hogar",
    1250,
    45,
    "21",
  ],
  [
    "producto",
    "Limpiador de pisos lavanda 900 ml",
    "LIM-003",
    "7790003000030",
    "Limpieza/Hogar",
    990,
    45,
    "21",
  ],
  ["producto", "Jabón en polvo 800 g", "LIM-010", "7790003000108", "Limpieza/Ropa", 2300, 40, "21"],
  [
    "producto",
    "Suavizante para ropa 900 ml",
    "LIM-011",
    "7790003000115",
    "Limpieza/Ropa",
    1400,
    40,
    "21",
  ],
  [
    "producto",
    "Martillo de carpintero 500 g",
    "FER-001",
    "7790004000013",
    "Ferretería/Herramientas",
    7800,
    50,
    "21",
  ],
  [
    "producto",
    "Destornillador plano 6 mm",
    "FER-002",
    "7790004000020",
    "Ferretería/Herramientas",
    2100,
    55,
    "21",
  ],
  [
    "producto",
    "Cinta métrica 5 m",
    "FER-003",
    "7790004000037",
    "Ferretería/Herramientas",
    3400,
    50,
    "21",
  ],
  [
    "producto",
    "Taladro percutor 650 W",
    "FER-004",
    "7790004000044",
    "Ferretería/Herramientas",
    58000,
    30,
    "21",
  ],
  [
    "producto",
    "Tornillos autoperforantes x 100",
    "FER-010",
    "7790004000105",
    "Ferretería/Tornillería",
    1900,
    60,
    "21",
  ],
  [
    "producto",
    "Tarugos 8 mm x 50",
    "FER-011",
    "7790004000112",
    "Ferretería/Tornillería",
    850,
    60,
    "21",
  ],
  [
    "producto",
    "Bulonera surtida (insumo)",
    "FER-090",
    "",
    "Ferretería/Tornillería",
    12500,
    0,
    "21",
    "compras",
  ],
  [
    "producto",
    "Bolsa de consorcio x 10",
    "LIM-090",
    "7790003000900",
    "Limpieza",
    700,
    35,
    "21",
    "ventas-compras",
    false,
  ],
  [
    "servicio",
    "Instalación de aire acondicionado",
    "SER-001",
    "",
    "Servicios/Instalación",
    45000,
    40,
    "21",
    "ventas",
  ],
  [
    "servicio",
    "Instalación eléctrica por hora",
    "SER-002",
    "",
    "Servicios/Instalación",
    9000,
    50,
    "21",
    "ventas",
  ],
  [
    "servicio",
    "Mantenimiento preventivo mensual",
    "SER-010",
    "",
    "Servicios/Mantenimiento",
    30000,
    35,
    "21",
    "ventas",
  ],
  ["servicio", "Envío a domicilio", "SER-020", "", "Servicios", 2500, 20, "27", "integraciones"],
];

const seededProducts: Product[] = seeds.map((seed, index) => {
  const [
    type,
    name,
    sku,
    barcode,
    category,
    cost,
    margin,
    vat,
    visibility = "ventas-compras",
    active = true,
  ] = seed;
  return {
    id: String(index + 1),
    type,
    name,
    sku,
    barcode,
    category,
    description: "",
    visibility,
    pos: visibility === "ventas-compras" || visibility === "ventas",
    cost: amountText(cost),
    margin: amountText(margin),
    price: amountText(priceFrom(cost, margin, Number(vat))),
    vat,
    active,
  };
});

export const productStore = createPrototypeStore(seededProducts);

export const useProducts = productStore.useRows;

export function addProduct(values: ProductValues): Product {
  const product: Product = { ...values, id: String(Date.now()), active: true };
  productStore.set([product, ...productStore.get()]);
  return product;
}

export function updateProduct(id: string, values: ProductValues) {
  productStore.set(productStore.get().map((one) => (one.id === id ? { ...one, ...values } : one)));
}

export function setProductsActive(ids: string[], active: boolean) {
  productStore.set(
    productStore.get().map((one) => (ids.includes(one.id) ? { ...one, active } : one)),
  );
}

export const labelOf = (options: { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? "";

/** Another product with the same SKU, ignoring case. */
export const sameSku = (products: Product[], sku: string, exceptId?: string) =>
  products.find(
    (one) => one.id !== exceptId && one.sku.trim().toLowerCase() === sku.trim().toLowerCase(),
  );

export const productSearchText = (product: Product) =>
  `${product.name} ${product.sku} ${product.barcode}`;

export interface ProductFilters {
  archived?: boolean;
  type?: string | null;
  category?: string | null;
  visibility?: string | null;
}

export function filterProducts(products: Product[], filters: ProductFilters) {
  return products.filter(
    (product) =>
      (filters.archived || product.active) &&
      (!filters.type || product.type === filters.type) &&
      (!filters.category ||
        product.category === filters.category ||
        product.category.startsWith(`${filters.category}/`)) &&
      (!filters.visibility || product.visibility === filters.visibility),
  );
}
