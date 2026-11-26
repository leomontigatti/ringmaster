import type { PhoneEntry } from "#/lib/phones.ts";
import { createPrototypeStore } from "#/lib/prototype-store.ts";

// PROTOTYPE, wipe me (prototype/catalog): made-up clients for the variants of
// the Clientes screens, held in memory. No real person or company: every name,
// document, phone and email is invented. A reload starts over.

export const docTypeOptions = ["DNI", "CUIT", "CUIL", "Pasaporte"].map((value) => ({
  value,
  label: value,
}));

export const taxCategoryOptions = [
  { value: "ri", label: "Responsable Inscripto" },
  { value: "cf", label: "Consumidor Final" },
  { value: "mono", label: "Monotributista" },
  { value: "exento", label: "Exento" },
  { value: "no-alcanzado", label: "IVA no alcanzado" },
];

export const provinceOptions = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
].map((value) => ({ value, label: value }));

export const priceListOptions = [
  { value: "base", label: "Precio base" },
  { value: "predeterminado", label: "Predeterminado" },
];

export const paymentTermOptions = [
  { value: "contado", label: "Contado" },
  { value: "30", label: "30 días" },
  { value: "30-60-90", label: "30/60/90 días" },
  { value: "custom", label: "Otros plazos" },
];

export const tagOptions = [
  "Mayorista",
  "Minorista",
  "Distribuidor",
  "Revendedor",
  "Online",
  "Moroso",
].map((value) => ({ value, label: value }));

export const paymentBucketOptions = [
  { value: "contado", label: "Contado" },
  { value: "1-15", label: "1 a 15 días" },
  { value: "16-30", label: "16 a 30 días" },
  { value: "31-60", label: "31 a 60 días" },
  { value: "mas-60", label: "Más de 60 días" },
];

export interface ClientValues {
  docType: string;
  docNumber: string;
  name: string;
  phone: PhoneEntry;
  email: string;
  taxCategory: string;
  address: string;
  apartment: string;
  postalCode: string;
  province: string;
  city: string;
  companyName: string;
  priceList: string;
  paymentTerm: string;
  customDays: string;
  description: string;
  tags: string[];
}

export interface Client extends ClientValues {
  id: string;
  active: boolean;
  /** The protected `Consumidor Final`: no edit, no archive. */
  system: boolean;
}

export const emptyClientValues: ClientValues = {
  docType: "CUIT",
  docNumber: "",
  name: "",
  phone: { country: "AR", number: "" },
  email: "",
  taxCategory: "cf",
  address: "",
  apartment: "",
  postalCode: "",
  province: "",
  city: "",
  companyName: "",
  priceList: "base",
  paymentTerm: "contado",
  customDays: "",
  description: "",
  tags: [],
};

type Seed = [
  name: string,
  companyName: string,
  docType: string,
  docNumber: string,
  taxCategory: string,
  phone: string,
  email: string,
  address: string,
  city: string,
  province: string,
  postalCode: string,
  paymentTerm: string,
  tags: string[],
  active?: boolean,
];

const seeds: Seed[] = [
  [
    "Distribuidora Los Aromos S.R.L.",
    "Los Aromos",
    "CUIT",
    "30-71234567-1",
    "ri",
    "3514567890",
    "ventas@losaromos.example.com",
    "Av. Colón 1234",
    "Córdoba",
    "Córdoba",
    "5000",
    "30",
    ["Mayorista", "Distribuidor"],
  ],
  [
    "Martina Ferreyra",
    "",
    "DNI",
    "32456789",
    "cf",
    "3515551234",
    "martina.ferreyra@example.com",
    "Ituzaingó 455",
    "Córdoba",
    "Córdoba",
    "5000",
    "contado",
    ["Minorista"],
  ],
  [
    "Almacén Don Tito",
    "Don Tito",
    "CUIT",
    "20-28765432-5",
    "mono",
    "3416543210",
    "dontito@example.com",
    "San Martín 890",
    "Rosario",
    "Santa Fe",
    "2000",
    "contado",
    ["Minorista"],
  ],
  [
    "Ferretería El Tornillo Feliz S.A.",
    "El Tornillo Feliz",
    "CUIT",
    "30-70987654-3",
    "ri",
    "1145678901",
    "compras@tornillofeliz.example.com",
    "Av. Corrientes 3456",
    "Ciudad Autónoma de Buenos Aires",
    "Ciudad Autónoma de Buenos Aires",
    "1193",
    "30-60-90",
    ["Mayorista"],
  ],
  [
    "Lucía Benítez",
    "Lu Deco",
    "CUIT",
    "27-33445566-8",
    "mono",
    "2615554321",
    "lu.deco@example.com",
    "Belgrano 120",
    "Godoy Cruz",
    "Mendoza",
    "5501",
    "30",
    ["Revendedor", "Online"],
  ],
  [
    "Cooperativa Agrícola Valle Verde",
    "Valle Verde",
    "CUIT",
    "30-69876543-2",
    "exento",
    "3584123456",
    "administracion@valleverde.example.com",
    "Ruta 8 km 601",
    "Río Cuarto",
    "Córdoba",
    "5800",
    "custom",
    ["Mayorista"],
  ],
  [
    "Joaquín Sosa",
    "",
    "DNI",
    "40123987",
    "cf",
    "3815559876",
    "joaco.sosa@example.com",
    "24 de Septiembre 77",
    "San Miguel de Tucumán",
    "Tucumán",
    "4000",
    "contado",
    [],
  ],
  [
    "Panadería La Espiga Dorada",
    "La Espiga",
    "CUIT",
    "20-25678901-4",
    "mono",
    "2235553344",
    "laespiga@example.com",
    "Güemes 2310",
    "Mar del Plata",
    "Buenos Aires",
    "7600",
    "contado",
    ["Minorista"],
  ],
  [
    "Transportes Patagonia Sur S.R.L.",
    "Patagonia Sur",
    "CUIT",
    "30-71555666-9",
    "ri",
    "2995557788",
    "facturas@patagoniasur.example.com",
    "Av. Argentina 1500",
    "Neuquén",
    "Neuquén",
    "8300",
    "30-60-90",
    ["Distribuidor"],
  ],
  [
    "Camila Rodríguez",
    "",
    "CUIL",
    "27-38999111-6",
    "cf",
    "3425556677",
    "cami.rodriguez@example.com",
    "Bv. Pellegrini 2550",
    "Santa Fe",
    "Santa Fe",
    "3000",
    "contado",
    ["Online"],
  ],
  [
    "Estudio Contable Paz & Asociados",
    "Paz & Asociados",
    "CUIT",
    "30-71888999-0",
    "ri",
    "3875551122",
    "estudio@pazasociados.example.com",
    "España 560",
    "Salta",
    "Salta",
    "4400",
    "30",
    [],
  ],
  [
    "Kiosco El Rápido",
    "",
    "CUIT",
    "20-30111222-7",
    "mono",
    "3795552233",
    "",
    "Junín 1020",
    "Corrientes",
    "Corrientes",
    "3400",
    "contado",
    ["Minorista", "Moroso"],
  ],
  [
    "Fundación Manos Unidas",
    "",
    "CUIT",
    "30-70333444-1",
    "no-alcanzado",
    "2215553311",
    "contacto@manosunidas.example.org",
    "Calle 7 n.° 845",
    "La Plata",
    "Buenos Aires",
    "1900",
    "contado",
    [],
  ],
  [
    "Supermercados Del Centro S.A.",
    "Del Centro",
    "CUIT",
    "30-71222333-5",
    "ri",
    "3534445566",
    "proveedores@delcentro.example.com",
    "Bv. España 300",
    "Villa María",
    "Córdoba",
    "5900",
    "custom",
    ["Mayorista", "Distribuidor"],
  ],
  [
    "Tomás Gutiérrez",
    "",
    "Pasaporte",
    "AAB123456",
    "cf",
    "",
    "tomas.gutierrez@example.com",
    "Mitre 50",
    "San Carlos de Bariloche",
    "Río Negro",
    "8400",
    "contado",
    [],
  ],
  [
    "Vinoteca Uva Rosa",
    "Uva Rosa",
    "CUIT",
    "27-29888777-3",
    "mono",
    "2645558899",
    "uvarosa@example.com",
    "Av. Libertador 980",
    "San Juan",
    "San Juan",
    "5400",
    "30",
    ["Revendedor"],
  ],
  [
    "Taller Mecánico Los Hermanos",
    "Los Hermanos",
    "CUIT",
    "20-27444555-1",
    "ri",
    "3765557711",
    "loshermanos@example.com",
    "Av. Uruguay 2400",
    "Posadas",
    "Misiones",
    "3300",
    "30",
    [],
    false,
  ],
  [
    "Sofía Medina",
    "",
    "DNI",
    "35777888",
    "cf",
    "3855554433",
    "sofi.medina@example.com",
    "Belgrano Sur 310",
    "Santiago del Estero",
    "Santiago del Estero",
    "4200",
    "contado",
    ["Online"],
  ],
  [
    "Librería Papel y Tinta",
    "Papel y Tinta",
    "CUIT",
    "20-31222444-9",
    "mono",
    "3434556677",
    "papelytinta@example.com",
    "Urquiza 1140",
    "Paraná",
    "Entre Ríos",
    "3100",
    "contado",
    ["Minorista"],
  ],
  [
    "Constructora Horizonte S.A.",
    "Horizonte",
    "CUIT",
    "30-71444555-6",
    "ri",
    "3516668899",
    "obras@horizonte.example.com",
    "Av. Rafael Núñez 4500",
    "Córdoba",
    "Córdoba",
    "5009",
    "30-60-90",
    ["Mayorista"],
    false,
  ],
  [
    "Gimnasio Fuerza Norte",
    "Fuerza Norte",
    "CUIT",
    "20-33666777-2",
    "exento",
    "3886551234",
    "fuerzanorte@example.com",
    "Belgrano 650",
    "San Salvador de Jujuy",
    "Jujuy",
    "4600",
    "30",
    [],
  ],
  [
    "Mateo Álvarez",
    "",
    "DNI",
    "42555666",
    "cf",
    "2804556677",
    "",
    "25 de Mayo 300",
    "Rawson",
    "Chubut",
    "9103",
    "contado",
    [],
  ],
  [
    "Indumentaria Cielo Azul",
    "Cielo Azul",
    "CUIT",
    "27-34555666-0",
    "mono",
    "1156781234",
    "hola@cieloazul.example.com",
    "Av. Santa Fe 2100",
    "Ciudad Autónoma de Buenos Aires",
    "Ciudad Autónoma de Buenos Aires",
    "1123",
    "30",
    ["Online", "Revendedor"],
  ],
  [
    "Lácteos La Pampita S.R.L.",
    "La Pampita",
    "CUIT",
    "30-71777888-4",
    "ri",
    "2954553322",
    "ventas@lapampita.example.com",
    "Ruta 35 km 330",
    "Santa Rosa",
    "La Pampa",
    "6300",
    "custom",
    ["Distribuidor"],
  ],
];

const customDaysById: Record<string, string> = {
  "7": "30, 45, 60",
  "15": "15, 30",
  "25": "45, 75",
};

const seededClients: Client[] = [
  {
    ...emptyClientValues,
    id: "1",
    docType: "DNI",
    name: "Consumidor Final",
    taxCategory: "cf",
    description: "Las ventas sin un cliente identificado.",
    active: true,
    system: true,
  },
  ...seeds.map((seed, index): Client => {
    const [
      name,
      companyName,
      docType,
      docNumber,
      taxCategory,
      phone,
      email,
      address,
      city,
      province,
      postalCode,
      paymentTerm,
      tags,
      active = true,
    ] = seed;
    const id = String(index + 2);
    return {
      ...emptyClientValues,
      id,
      name,
      companyName,
      docType,
      docNumber,
      taxCategory,
      phone: { country: "AR", number: phone },
      email,
      address,
      city,
      province,
      postalCode,
      paymentTerm,
      customDays: customDaysById[id] ?? "",
      priceList: tags.includes("Mayorista") ? "predeterminado" : "base",
      tags,
      active,
      system: false,
    };
  }),
];

export const clientStore = createPrototypeStore(seededClients);

export const useClients = clientStore.useRows;

export function addClient(values: ClientValues): Client {
  const client: Client = { ...values, id: String(Date.now()), active: true, system: false };
  clientStore.set([client, ...clientStore.get()]);
  return client;
}

export function updateClient(id: string, values: ClientValues) {
  clientStore.set(clientStore.get().map((one) => (one.id === id ? { ...one, ...values } : one)));
}

/** Archives or restores; the protected client stays as it is. */
export function setClientsActive(ids: string[], active: boolean) {
  clientStore.set(
    clientStore
      .get()
      .map((one) => (ids.includes(one.id) && !one.system ? { ...one, active } : one)),
  );
}

export const labelOf = (options: { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? "";

const digitsOf = (text: string) => text.replace(/[^\dA-Za-z]/g, "");

/** Another client with the same document, ignoring dashes and dots. */
export function sameDocument(clients: Client[], docNumber: string, exceptId?: string) {
  const digits = digitsOf(docNumber);
  if (digits === "") {
    return undefined;
  }
  return clients.find((one) => one.id !== exceptId && digitsOf(one.docNumber) === digits);
}

/** The last due day of a payment term: 0 for `Contado`. */
export function lastDueDay(client: ClientValues): number {
  if (client.paymentTerm === "custom") {
    return Math.max(0, ...client.customDays.split(",").map((day) => Number(day.trim()) || 0));
  }
  if (client.paymentTerm === "30-60-90") {
    return 90;
  }
  return client.paymentTerm === "30" ? 30 : 0;
}

export function paymentBucket(client: ClientValues): string {
  const day = lastDueDay(client);
  if (day === 0) {
    return "contado";
  }
  if (day <= 15) {
    return "1-15";
  }
  if (day <= 30) {
    return "16-30";
  }
  return day <= 60 ? "31-60" : "mas-60";
}

export function paymentTermLabel(client: ClientValues): string {
  return client.paymentTerm === "custom"
    ? `${client.customDays} días`
    : labelOf(paymentTermOptions, client.paymentTerm);
}

/** What the search box matches, with dashes and dots dropped so a CUIT matches typed either way. */
export const clientSearchText = (client: Client) =>
  [
    client.name,
    client.companyName,
    client.docNumber,
    client.email,
    client.phone.number,
    client.city,
  ]
    .join(" ")
    .replace(/[-.]/g, "");

export const clientSearchQuery = (query: string) => query.replace(/[-.]/g, "");

export interface ClientFilters {
  archived?: boolean;
  taxCategory?: string | null;
  province?: string | null;
  paymentBucket?: string | null;
  tag?: string | null;
}

export function filterClients(clients: Client[], filters: ClientFilters) {
  return clients.filter(
    (client) =>
      (filters.archived || client.active) &&
      (!filters.taxCategory || client.taxCategory === filters.taxCategory) &&
      (!filters.province || client.province === filters.province) &&
      (!filters.paymentBucket || paymentBucket(client) === filters.paymentBucket) &&
      (!filters.tag || client.tags.includes(filters.tag)),
  );
}
