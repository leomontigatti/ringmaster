# Style guide

The judgement calls of the interface, written with the first screens, one decision at a time,
each with the reason and a component that gets it right.

The mechanical rules live in `pnpm lint`, each message carrying its reason: `@shadcn/lint`'s
rules and the repo's `ui` plugin (`scripts/oxlint-ui-plugin.mjs`), configured in
`vite.config.ts` and tested in `tests/lint/ui-rules.test.ts`. Where they disagree with this
page, they are current.

`/dev/patrones`, served only by `pnpm dev`, draws each pattern once. A pattern added here gets an
entry there in the same PR.

What is settled already:

- The base is shadcn/ui on Tailwind 4, in the `base-nova` style, on Base UI (see [shadcn.md](./shadcn.md)).
- The UI is Spanish; the copy is written with the user's terms from `GLOSSARY.md`
  (the `ui:` values), not with code identifiers.
- **Tokens and variants before classes.** A colour, radius or state comes from a token or a
  component variant, and `className` is for layout. A component in `src/components/ui` keeps
  its look: pick a `variant` or `size`, never restyle it from a screen. A case with no token
  gets a one-off class; a second case gets a variant or a component. A new token, variant or
  typeface is a product decision: ask before adding one.
- **A badge only shows a state out of the ordinary**: an archived record (`ArchivedBadge`), and
  as the catalog lands its own, such as a product out of stock (an example, not built). The regular state has none: no `Activo`
  badge, no `Estado` filter, since a list already shows only active records. A state is a `Badge`
  beside the name, never ` · Archivado` in the text, and a table has no `Estado` column. Every list looks alike unless a screen says otherwise: its first cell is
  `RowName` (`data-table.tsx`), the only way a list links a row: its name or link and its states
  beside the name. An avatar with up to two initials (`avatar`) and a `detail` line under the name
  (a line that tells two records apart) are each a deliberate choice, off by default. A badge's
  colour means what an alert's and a toast's does: `warning` and `destructive` for what changes
  what someone does next, and neutral (`secondary` or `outline`) for the rest. A new state adds
  its row here.

  | State                                         | Variant |
  | --------------------------------------------- | ------- |
  | `Archivado`, `Archivada`, as its page's alert | `info`  |

- **A record is archived, never deactivated**: `Archivar` takes it out of use and `Restaurar`
  brings it back; its badge says `Archivado` or `Archivada`, and a message about it `está
  archivado` (GLOSSARY.md, `inactive`). A list shows only active records; its `Archivados` (or
  `Archivadas`) filter, off by default, adds the archived ones (`archivedFilter`,
  `src/components/filter-groups.ts`). An archived record's page says so in an `info` alert
  above the form (`Persona archivada`, `ArchivedAlert`), with `Restaurar` as its action for whoever may restore
  it, a `link` button in the alert's colour, centred on its right edge, and what someone else can do instead
  for the rest. Every record page has it, through `activeRecord`'s `archived` (its title and what
  archiving it changes); a form dialog's record shows `Restaurar` in its footer instead.

- **An existing component before new markup.** Look in `src/components/ui` and the shared
  components in `src/components/` ([codebase-map.md](./codebase-map.md#layout)) before writing
  one; extend one with a variant rather than copy its markup. A shadcn component the screen
  needs is added with the CLI ([shadcn.md](./shadcn.md)), never written by hand.
- **Stop and ask when the guide has no answer.** A screen that needs a component, a pattern or
  a layout this page and the shared components do not cover is a design decision, not an
  implementation detail: stop and ask the user before building it, with what you would do and
  why. Once decided, it goes in the same PR as a component, a lint rule where a machine can judge
  it, and a line here, so the next screen finds it.

## Copy

A screen is used, not read: its words are the ones a person needs to act. What an agent tends to
add beyond them reads as generated and buries the rest.

- **A line under a heading says what the heading does not.** A page's or a dialog's
  `description` says what Page shell and Form pages give it to say, never the title again or an
  order to manage it: `Personal` /
  `Las personas de la organización, con sus roles y su acceso.`, never `Administrá el personal
  de la organización.` A section, a card or a menu item gets no line of its own unless it carries a
  fact.
- **No text narrates the screen or how it was built**: no `Hacé clic en el botón para empezar`,
  `Esta tabla muestra las personas`, `(se actualiza en tiempo real)`. An instruction earns its place
  only where the user would otherwise get it wrong: a field's rule (`Código de área sin 0 y
  número sin 15.`), an empty state's way to start.
- **Only the label names a field.** A placeholder shows an example of the
  format (`Av. Colón 1234, Córdoba`) and a hint states a rule (Forms); neither repeats the label.
- **Say what happens, not how it feels.** Name the mechanism, the person or the number:
  an archived member's `No puede ingresar a ringmaster.`, never `Archivá personas fácilmente.`
  No adverb that a number or a stronger verb
  could replace (`fácilmente`, `rápidamente`, `simplemente`), and no sentence that would fit
  another product unchanged.
- **Name who acts when it changes what the user expects**: ringmaster, the member, a client or
  `vos`. `La persona tiene que cambiarla la próxima vez que ingrese.` says who changes the
  password; a bare `se cambia` leaves the reader asking who does. An impersonal `se` stays where
  the actor does not matter (`no se cambian desde acá`).
- **No em dash in a sentence**: a period or a comma instead. A lone `—` stands for an empty value
  (`Detail`, `src/components/record-section.tsx`).

## Page shell

Every signed-in screen sits in one shell, `_app.tsx`, for every role: the sidebar, and the page
beside it.

- **Every role opens on `Inicio`**: `/` is the home page (`_app/index.tsx`), an `EmptyState`
  until the first areas land.
- **A new screen gets one link in the sidebar**, in `src/components/app-nav.ts`, in the group that
  fits: `General` for what every member uses, `Administración` for the organization's own setup
  (`Personal`). The catalog's areas (such as `Clientes` or `Productos`, not built yet) get their
  group when they land. A detail page gets no link: its parent
  stays current. A new group is a product decision: ask.
- **An area of several pages is a folder in its group**: a link with a chevron that opens its
  entries (`SidebarMenuSub`, in a `Collapsible`), never a page of its own, and open while the
  current page is one of them (`NavFolder`, `src/components/app-nav.ts`; none yet, and a
  `Productos` folder with `Lista` and `Rubros` would be one, as an example). Its entries have
  no icon: with the sidebar collapsed, the folder's icon stands for them, and a click on it opens
  the menu.
- **A link is hidden only when the screen has nothing for that role.** The menu spares a click and
  guards nothing: the screen's server functions decide what a member may do.
- **Every link has a `lucide` icon**, the only thing left when the sidebar is collapsed.
- **Every page opens with `PageHeader`**, never its own `<h1>` (`pnpm lint` enforces it): `title`,
  `status` for its `Badge`, `description` for a line of detail, and `actions` for the buttons
  that act on the whole page. The way up is the top bar's breadcrumbs, not a link in the header. A page in the sidebar has a one-line
  `description` saying what it is for; a detail or form page uses it for the record (an address,
  an email, a name). A page that is one card holding one form,
  `/ingresar` and `/cambiar-contrasena`, is titled by its `CardTitle` instead.
- **A refused detail page keeps its header**, above the refusal's `ErrorAlert`, and its
  breadcrumbs keep the way back to its list (a rule for the record pages to come, such as a
  client's; `/personal/$memberId` still shows its refusal alone).
- **The top bar holds the breadcrumbs and the member's own things.** After the sidebar's toggle,
  `AppBreadcrumbs` names the section as the sidebar does, then the steps a page under it declares
  in its route's `staticData.crumbs` (`fixedCrumbs` for fixed labels, a `Crumbs` component with
  `PageCrumbs` when a step names a record, as `/personal/$memberId`). At its end, the account
  menu (`UserMenu`).

## Filters

- **What narrows a list is `FilterBar`** (`src/components/filter-bar.tsx`), never a row of
  selects. A form that asks and answers stays a form.
- **An applied filter is a button group**: its name, its value as a menu, a trash button; the
  rest come from `Agregar filtro`. A filter that always holds a value is `required`: always shown,
  with no trash button. `/dev/patrones` shows them (`Filtros`).
- **A filter's icon is the one the sidebar gives its concept.** A value's menu has no search; the
  picker gets one past seven values.

## Empty states

- **A page or a list with nothing to show is `EmptyState`** (`src/components/empty-state.tsx`;
  `pnpm lint` rejects the ui `Empty` anywhere else, `ui/no-raw-empty`), with the icon the sidebar
  gives its concept, in a dashed outline centred in the space the page leaves. Inside a form, a
  dialog, a menu or a section of a page, a sentence is enough.
- **Its title is short, `Sin personal`; its description says there are none yet, then how to
  start**: `Todavía no hay personas. Empezá creando la primera.` Without the permission to start, the first
  sentence stands alone. What the page is for goes in the page's subtitle, not here.
- **What to do next is a button in it**, as shadcn's `Empty` shows: `CreateButton` for a create,
  `EmptyStateLink` for a way elsewhere, the main action first and the rest `outline`, even when the
  page header has the same button. Pass only the buttons the viewer may use.
- **A list with no records has no search, filters or footer** (`DataTable`'s `noRecords`): the
  empty state's buttons are all there is to do. A search that finds nothing keeps them, and says
  so with `NoMatches`.
- **A list that hides archived records says none exist only when that is true.** When the
  default list is empty because every record is archived, the empty state says so (`Sin personal
  activo`, `No hay personas activas.`) and offers the whole list. `/dev/patrones` shows each case.

## Tables

- **A list of records is `DataTable`** (`src/components/data-table.tsx`): `useClientDataTable` when
  the loader sends the whole list, `useServerDataTable` when a list can grow without limit, so the
  server searches and pages it. The `ui/no-raw-table` lint rule rejects any other table.
- **Rows are 40 px, with no actions column.** The cell that names the record holds its `RowLink`,
  and only that link opens it, so the rest of a row can be selected and copied. Every action lives
  on the record.
- **One toolbar, above the table:** `SearchInput`, then `FilterBar`. A list's show-or-hide choices
  are filters, not buttons in the header.
- **A server search waits 300 ms for typing to pause**, shows a spinner in the box, and shows only
  the answer to the text in the box: earlier rows never stand in for it.
- **The footer counts:** `25 de 36 registros`, on the left, with the pager on the right when there
  is more than one page. A server search that stops at its best matches has no count: when more
  records match, a muted line under the results says so and asks for more text.
- **A list page takes the full width.** Search text stays out of the URL, as on `/personal`.
- **A short fixed list has no search or filters**, only the table and its count: `DataTable`
  with no `search`, as `/dev/patrones`' `Lista fija, sin búsqueda`.

## Form pages

- **By default, a create or an edit is a page of its own**, `FormPage`
  (`src/components/form-page.tsx`), never in a list, a card or a side panel. The exceptions are
  [Form dialogs](#form-dialogs), each named there. `pnpm lint` rejects any other `<form>`
  (`ui/no-raw-form`). `CreateButton` opens a create, with a leading plus: in the `PageHeader`'s
  `actions`, on the title's line, and again in the list's `EmptyState`.
- **A form that holds a form of its own goes in `lead`**, above the form element: such as a
  client picker whose quick create submits apart (an example, not built). Its problems still show under its field.
- **A create's submit button names the thing**: `Crear cuenta` on `/personal/nueva`, never a
  bare `Crear` (`ui/create-names-thing`).
- **A form is one `Card`** (`FormPage` draws it): the fields in rows by their size in its
  content ([Forms](#forms)), and the actions in its footer, which sticks to the bottom of the window
  so a long form never hides them. The actions sit in one row: `Volver` on the left,
  `Descartar cambios` and the submit button on the right. The right-hand buttons wrap under
  `Volver` only when they do not fit, as the three with a long label at 390px.
- **`Volver` goes where the browser's back goes**, so a list comes back with its filters and page.
- **On an edit, `Descartar cambios` shows once something differs from what the form opened with.**
  A create has none (`FormPage`'s `creates`): with no saved values to go back to, it would only
  empty the form, which `Volver` already does.
- **While saving, the submit button is disabled and shows a spinner, and the other buttons are
  disabled with it.** The spinner is the visible reason a disabled button needs. With nothing
  changed, the submit button stays enabled: nothing would say why it is not.
- **Leaving with unsaved changes asks**, by any way out: `Volver`, the sidebar, the browser's back,
  a closed tab, on a create as on an edit. `Descartar cambios` asks the same question, because it
  cannot be undone.
- **A successful save goes back**, unless what comes next is on the new record, which then opens
  its page. A one-off action the page does not show confirms with a `success` toast: the starting
  password's `Contraseña asignada`.
- **A record has one form for its own fields**: its page shows values in `RecordSection`s
  (`src/components/record-section.tsx`), and one `Editar` opens them all, saved together in one
  transaction, until the record's page becomes its form (below). A record of its own keeps its
  own page unless it is a form dialog's; a one-off action, such as a starting
  password, opens a dialog.
- **A page of settings is `RecordSection`s**, one per setting, each showing its values; its
  `Editar` opens that setting's own form page, saved apart from the rest, and a section that
  leads elsewhere has that link as its action: `/dev/patrones`, `Página de configuración`.
- **A record's page is its edit form**, the model being a member's (`/personal/$memberId`). The
  list's name opens it: no detail page, no `Editar`. Its fields are
  the create's, in the same order, so a create and an edit look alike.
- **Its title is the record's name, with its state badge beside it** when there is one
  (`ArchivedBadge`, which shows none on an active record),
  and its actions on the right in one `Acciones` menu (`activeRecord`'s `menu`,
  `src/components/admin-form.tsx`): a create for each of its lists first, then a one-off action
  such as a member's `Asignar contraseña inicial`, then, past a separator, `Archivar` in red or
  `Restaurar`, or `Eliminar`. Its items are text only, with no icons (`ui/no-menu-item-icon`).
  One that asks first keeps asking: its dialog sits outside the menu, as the starting password's
  does. The name
  moves from the list row into the title and back (`RecordName`, through the router's view transitions); nothing else on the page animates. The
  subtitle says what the page holds, the same for every record, never one of its fields; a
  create's says what the new record is (`Alguien que entra a la organización, con sus roles y su acceso.`). The browser tab
  names the page as its title does: the record's name on its page (`pageHead`, `src/lib/page-title.ts`).
- **A record with lists of its own gets full-width `Tabs` under its header** (none yet; a
  client's page with its contacts would be one, as an example): `Datos generales`
  first, holding the form, then one tab per list, named by it with a count of its active rows in an
  `outline` `Badge` (the tab list's background hides a `secondary` one). A list in a tab has no
  heading or button of its own: its create is in `Acciones`, and again in its empty state. A form
  split over several tabs is still one form, and a refusal opens the tab of the field it names. A
  list page of its own keeps its create button visible in its header (`Nueva persona`).
  The form's tab stays mounted, so an edit survives a look at another tab, and a tab switch is no
  navigation, which would ask before discarding it. `?seccion=` only picks the tab a page
  opens on; a list row's pages lead back to their tab with it. A list in a tab is a `DataTable`
  like any other, and a row's actions are in its own page's `Acciones`, never buttons in the
  row.
- **Who can't edit the record sees its header and its lists**, with no form and no tabs. Its
  list's name cell links only for someone who may open the page, and is plain text otherwise.
- **A page that is only its form stays as it is**: `/ingresar` and `/cambiar-contrasena`.

## Form dialogs

The exception to a page of its own: a create and an edit in a `FormDialog`
(`src/components/form-dialog.tsx`) over the list the record lives in. Only the records listed
here take one; a new one is a product decision, added to this list first.

- **A record qualifies when it is small and lives only in its parent's list**: a few short fields,
  no list of its own, no history worth a page, nothing that links to it. Anything bigger stays a page:
  a dialog cannot hold tabs, a long form, or a list, and a page can be linked and gone back to.
- **Today: none in the app.** `/dev/patrones` draws one (`Formulario en un diálogo`, `Nuevo
  rubro`), the kind a catalog's product categories would take, as an example.
- **The list opens it**: the row's name is a button (`RowName`'s `onOpen`) that looks like the
  other lists' links, and `CreateButton`'s `onClick` opens an empty one. No URL changes.
- **Its title is the record's name with its state badge**, like a record's page, and a create's
  is the thing (`Nuevo rubro`). The description says what it holds, as a page's subtitle.
- **The fields stack in one column**, in the create's order, as on the page they replace.
- **The footer holds every action**: the record's state action (`Archivar` in red or
  `Restaurar`) on the left; `Cancelar` and the submit, named as on a page, on the right. No
  `Acciones` menu: there is room for the one action a small record has.
- **A question asked from it replaces its content**, never a second dialog over it
  (`FormDialog`'s `question`): `Cancelar` goes back to the form as it was left.
- **Closing drops what it holds**, by `Cancelar`, Escape or the close button, with no question
  first: it holds a few fields, and nothing else is lost. A click outside does not close it.
- **A save or a state change closes it**, and the list reloads behind it. A refusal shows above
  the fields, or under the field it names, with focus on the first problem, as on a page.

## Forms

What a form checks and when, after GOV.UK's
[validation pattern](https://design-system.service.gov.uk/patterns/validation/) and the rules
carried over from en-escena.

- **A form's values live in `useAppForm`** (`src/components/app-form.tsx`, on TanStack Form): each
  field is a `form.AppField` with one of its field components, and a form needing a new kind adds
  one there. `pnpm lint` rejects an uncontrolled input (`ui/no-uncontrolled-input`). The pages
  that are only their form (`/ingresar`, `/cambiar-contrasena`) are the exception: they read the
  form's `FormData` on submit and show one problem in an `ErrorAlert`, with no per-field errors
  or unsaved changes for the form kit to hold. Their inputs stay uncontrolled, so what the
  browser autofills or a user types before hydration is what submits.
- **A field is `Field` with a `FieldLabel`, never a hand-made wrapper** (`pnpm lint` enforces it:
  `ui/no-bare-label`). The label sits above the input. A placeholder shows an example, never the
  label.
- **A value the form shows but cannot change is a read-only field**, `TextField`'s `readOnly`,
  never a disabled input or plain text, as a member's `Nombre` and `Correo`: it keeps the field's place and label, on the sidebar's
  background (`bg-sidebar`), its label and value muted, with a small lock (`size-3`) at its end
  (local edits in `src/components/ui/field.tsx` and `input-group.tsx`). The lock says only that
  it is locked; why, and what unlocks it, is an `Alert` above the form (Alerts), never the
  field's hint.
- **A rule the user needs while typing is a hint under the field**: a `FieldDescription`, with
  the input's `aria-describedby` pointing at it: `PhoneField` (`src/components/phone-field.tsx`).
- **A person's phone is the form kit's `PhoneField`**, never a text field: the country, shown as
  its flag and dial code (`🇦🇷 +54`, Argentina by default), picked from a list searched by name
  or dial code, beside the national number, digits only. For Argentina the number is 10 digits,
  the area code without its `0` and the number without its `15`, with the placeholder
  `3515551234` and the hint `Código de área sin 0 y número sin 15.`; another country's is checked
  for that country. Only the hint and the refusal of a wrong Argentine number name the `0` and the
  `15`; everywhere else, `formatPhone` (`src/lib/phones.ts`) shows the 10 digits (`351 555-1234`). Picking a country
  moves the focus to the number. The form holds the country and the number apart, and `phoneSchema`
  (`src/lib/phones.ts`) reads them into E.164. Every phone a person is reached at takes it, such
  as a client's once there are clients; only a search box reads a phone typed as text.
- **A form's fields sit in rows of up to twelve columns, by the form's own width** (`FormGrid`,
  `src/components/app-form.tsx`, which `FormPage` holds its fields in, a container query rather
  than the window's breakpoints): one column below 448px, as on a phone; six from 448px, where a
  quarter or a third takes half the row and a half the whole row; twelve from 900px, where a
  quarter holds a date and time (213px). Every field of the form kit takes a `size`: `quarter`
  (three columns; four to a row at twelve), `third` (four; three to a row at twelve), `half`
  (six; two to a row at twelve) or `full` (the row). A field is a `quarter` unless what it holds
  needs more, judged by its content and the form's layout, not by its kind. A row's fields share
  its width evenly when the row is a subject of its own: two to a row are `half`, three `third`,
  as in `/dev/patrones`' `Campos por tamaño`. Otherwise:
  - `full`: a text area, a group of checkboxes, a record search, a block such as a text beside
    its preview (the form kit's text area, checkbox group and both comboboxes default to it);
  - `half`: an email, an address, and a select whose longest option does not fit a quarter,
    measured in the browser at 1440 px;
  - `quarter`: the rest, names, a phone, a CUIT, dates, times, durations, a checkbox whose label
    fits.
- **Related fields share a row; a field that starts a new subject starts a new row**
  (`startsRow`). `/dev/patrones`' `Campos por tamaño`, an example client form: `Razón social` ·
  `CUIT` · `Teléfono`, then `Correo electrónico` · `Domicilio` starting a row, then `Condición
  frente al IVA` · `Localidad`, then `Nota`. A
  child that is no field (a section, an alert, a line of text) takes the whole row; a section is a
  `FormGrid` of its own, inside the form's: `/dev/patrones`, `Campos por tamaño`. What a missing
  field means for the record is an `Alert` above the form, not a section's description: such as a
  client with no CUIT (an example, not built).
- **An option that needs a mark, such as a colour's swatch, is a `MarkedSelectField`**, which
  shows the mark beside each option and inside the box (`/dev/patrones`, `Lista con marcas`); any other choice from a list is a
  `SelectField`, shadcn's `Select` (`OptionSelect`, `src/components/option-select.tsx`), its
  options as data, its list opening below the box (never over it, aligned on the picked option).
  A native select is not used: `pnpm lint` rejects a raw `<select>`, and shadcn's `Select`
  outside `OptionSelect` (`ui/use-option-select`), where it would open over the box.
- **A checkbox is a horizontal `Field` with `className="w-fit"`**, the box before its label:
  without `w-fit` the label fills the row, and a click on the empty space ticks the box.
  A group of them is a `FieldSet` with a `FieldLegend variant="label"`, and its boxes in a
  `FieldGroup data-slot="checkbox-group"`.
- **A date is a `DateField` and a time a `TimeField`**, two fields side by side, never
  `type="date"`, `type="time"` or `datetime-local`: the browser draws those in its own language
  and clock. They are typed as `dd/mm/aaaa` and `HH:mm` (`src/components/date-time-input.tsx`).
  A date or a time shown to a person is written by `src/lib/dates.ts`: day first, on a
  24-hour clock, with Spanish names, in the zone the caller passes, never the process's
  or the browser's. `pnpm lint` keeps
  hand-written formats out (`ui/no-raw-date-format`).
- **A required field is said in words when the context needs it**, never by an asterisk alone.
- **Every `<form>` takes `method="post"`.** Submitted before the page hydrates, the browser sends
  the form on its own, and a GET puts every field, a password included, in the URL, the history and
  any access log. `pnpm lint` enforces it (`ui/require-post-method`).
- **Every `<form>` takes `noValidate`.** The browser's own `required` and `type="email"` popups
  speak the browser's language and style, and run before the form's own check. `required` stays
  on the input for what it tells a screen reader. `pnpm lint` enforces it
  (`ui/require-no-validate`).
- **Validate on submit, never as a field loses focus or while typing.** A check on blur
  interrupts someone still filling the form in, and catches people who type slowly the most. The
  form's Zod schema is the check, with `safeParse` on submit and never a thrown `parse`; the
  message is the form's own Spanish copy, never Zod's. The server parses the same schema again.
- **An empty required field and a wrong one get different messages**: `Ingresá el nombre.` for
  the first, what is wrong and an example for the second
  (`Ingresá 10 números: el código de área sin 0 y el número sin 15, por ejemplo 3515551234.`).
- **A refusal keeps everything the user typed**, the fields that passed included.
- **One record picked from a server search is the form kit's `ComboboxField`**
  (`src/components/app-form.tsx`), as `/dev/patrones`' `Buscar cliente`: it searches as [Tables](#tables)
  says, its list opens only on the answer to the text in the box, and the record picked stays in
  the box.
- **A few fixed options are picked in place**, as a group of checkboxes (a member's roles),
  never in a popover that covers what follows.
- **Several records picked from a list are the form kit's `MultiComboboxField`**: each pick a
  chip that removes it, the list searched by name, each option with a line that tells it apart,
  and its own lines for nothing to pick and for a search that finds nothing: `/dev/patrones`'
  `Rubros` and `Sin opciones`.
- **A `Checkbox` for a boolean submitted with the form**; a switch, once there is one, for a
  setting that takes effect on its own and reads as on or off.
- **A long form splits into titled sections**, never cards nested in cards.

**Where the error shows.** Each error sits under its field, the input marked `aria-invalid` and
pointing at it with `aria-describedby`, and focus moves to the first refused field, which brings it
into view. `FormPage` does all of this: a form passes what its schema refused through `fieldProblems`
(`src/components/form-problems.ts`), and `page.showProblems` shows it. An error stays until the next
submit. There is no summary of the fields' errors: on forms this short it only repeats them.

A server refusal about one field shows the same way, under that field: `useFormAction`'s second
argument names them (`emailTaken`). A refusal about no field is the only error above the form, in an
`ErrorAlert`, and takes the focus. A refusal the page must link from keeps its own `Alert` and marks
the field: such as a CUIT already in use, naming and linking the client that holds it (an
example, not built).

The pages that are only their form show one problem in an `ErrorAlert`: `/ingresar` and
`/cambiar-contrasena`.

## Alerts

An `Alert` says what kind of message it is, not how loud: `variant` is required, and `Alert`
draws that variant's one icon itself.

| Variant       | For                                                               | Example                                                 |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `destructive` | An error: something went wrong                                    | `ErrorAlert`                                            |
| `warning`     | Something to fix or regret                                        | None yet                                                |
| `info`        | A state to know about, including a lock and what unlocks it       | A member's `El nombre y el correo son los de su cuenta` |
| `success`     | An outcome that stays on screen, when the screen does not show it | None yet                                                |

- **A title and a description, always**: the title says what is going on in a few words, the
  description the detail and what to do, never repeating the title. `pnpm lint` enforces it
  (`ui/alert-structure`).
- **An alert is for what the screen does not already say.** A tinted box loses its meaning when
  every screen has one.
- **A page's alerts stack under its header, above what it holds** (`AlertStack`,
  `src/components/alert-stack.tsx`), one gap apart, in a fixed order: the server's refusal
  (`ErrorAlert`), then the record's own state (`ArchivedAlert`, `RecordHeader`'s `alert`), then
  the page's own (`FormPage`'s `alerts`: why a field is locked, as on a member's page). An alert is
  never inside the form or between its fields, and a page with none shows no gap.
- **The semantic colours are not the brand's.** `success`, `info` and `warning` are tokens of
  their own; check them against the brand palette when it lands (#37). Their text keeps 4.5:1 on
  their tint, which is why tints are 6%.
- **A toast is an alert's kind of message too.** `toast.add` takes the alert variant as its
  `type` (`type: "destructive"` for an error), and the toast draws in that variant's colours
  and icon, from the same `alertTones` and `alertIcons` the `Alert` uses
  (`src/components/ui/alert.tsx`). A new kind of toast picks one of the variants above, never
  colours of its own.

## After a submit

Which channel carries a message, and where the user lands.

| What happened                                         | Channel                                                                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The form's own check failed                           | The error display above ([Forms](#forms)).                                                                                                                                             |
| The server refused the submit                         | The same display, with copy that says what to fix and names and links what blocks it: an email already in use, under `Correo` on `/personal/nueva`.                                    |
| A likely duplicate, which may be legitimate           | A confirmation that lists the matches and saves only when confirmed (none yet).                                                                                                        |
| Saved, and the change shows on the screen             | No message: the page it goes back to, with the updated row or value, is the answer.                                                                                                    |
| Saved, and nothing on the screen shows it             | A `success` toast: the starting password's `Contraseña asignada` (`src/routes/_app/personal/-starting-password.tsx`).                                                                  |
| A field locked by the record's state                  | An `Alert` above the form listing every reason and what unlocks it, or saying nothing does; a lock icon alone explains nothing.                                                        |
| A condition to know before acting, found by the app   | A `warning` `Alert` on the page.                                                                                                                                                       |
| An action with no form failed, or the network dropped | A toast (`toast.add` from `#/components/ui/toast.tsx`; a submit's thrown call goes through `serverAnswer`); it disappears on its own, so it never carries something the user must fix. |

- **After a save, a form page goes back**, and the screen's data reloads (`useFormAction`). A
  create whose next step is on the new record goes there. Never navigate only to show a message.
- **A message is about one submit or one state.** A refusal of what was just submitted goes
  with the form; a state of the record (archived) is a badge or an `Alert` on
  the page, shown to everyone who sees the record, whatever their role.

## An action that cannot run

What decides the treatment is whether the user can do anything about it. A button is never
disabled with no reason beside it: the user cannot tell why, and a disabled button is skipped by
the keyboard and by screen readers.

| Why it cannot run                                     | Treatment                                                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| The user's role never allows it                       | Hidden.                                                                                                                     |
| A state of the record that never reverts (it started) | Hidden: such as a product's `Eliminar` once it has been sold (an example). Where people look for it, a short note says why. |
| A state the user can clear                            | Enabled; on use, an `Alert` or dialog lists every reason and what unblocks it. The server refuses all the same.             |

## Confirming an action

A confirmation interrupts, so it is kept for what the user cannot undo or would not expect.
It is a `ConfirmDialog` (`src/components/confirm-dialog.tsx`), never `AlertDialog` directly: a
question that names the thing, what is lost in the description, and a destructive button
repeating the action's name. It carries no `destructive` `Alert`: the dialog is already the
warning, and `destructive` means something went wrong. A `warning` `Alert` joins it only when
the loss goes beyond the record being deleted.

| Action                            | Treatment                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `Eliminar`                        | Always confirmed: `¿Eliminar este producto?` (an example). A record that must stay is archived, never deleted.                  |
| `Archivar` with consequences      | Confirmed, saying what happens; from a form dialog, in its place. Archiving a member has none to ask about, so it runs at once. |
| `Archivar` with none, `Restaurar` | At once: it can be reversed the same way.                                                                                       |
| A save with two ways to go on     | Asked with two answers and no destructive button (`ConfirmDialog`'s `alternative`).                                             |
| A step that loses nothing         | Asked once, its button the default one, not destructive (`ConfirmDialog`'s `destructive={false}`).                              |
