# Verification

How a session proves a change a user can see: a route, a component, a loader's output, an
action's feedback. The shared `implement` skill runs this at its step 4, and takes the
**before** at step 1, before the first edit. Skip it for what a browser cannot exercise: types,
tests, tooling, docs, and server code with no rendered surface. A browser check is not a
validation command, and CI does not run it.

## Launch

1. `pnpm dev`. On its first run in a worktree it picks the worktree's own port and writes it to
   the gitignored `.env.local` ([local-development.md](../operations/local-development.md#one-port-per-worktree)).
   Miniflare runs the Worker and the organization objects; each object applies the branch's
   migrations when it starts.
2. `pnpm dev:url` prints the URL. Never open `.env.local` for the port: agents are denied it.
   The port is strict: a port another server holds fails loudly instead of moving.
3. Sign in at `/ingresar` through the dev sign-in: it lists the seeded members of the dev
   organization (`src/dev/world.ts`), one per role; pick the role the screen is for.

Data comes from the dev seed (`src/dev/seed.ts`), which fills the dev organization on the
sign-in page's first load, never from a copy of production. It lives in the worktree's
`.wrangler/state/`. Create the other rows the screen needs through the app, with made-up names.

## Doctor

When the launch fails, check in this order:

- **An error on start from a migration**: the branch's to fix. To start from a fresh seed, stop
  the server and delete this worktree's `.wrangler/state/`, never another worktree's.
- **The Clerk sign-in instead of the dev one**: the worktree has a `.env` with Clerk keys, put
  there by hand or, in a worktree made before #124, linked from the main checkout. Leave it; the
  browser suite (`pnpm test:e2e`) always runs on the dev sign-in.
- **Port in use**: `pnpm dev:stop` stops this worktree's own server; a port held by another
  worktree's server is that thread's, so leave it.
- **`node`, `pnpm` or `playwright-cli` not found**: the `SessionStart` warning names it; the fix
  is the user's ([the agent shell's PATH](./agent-configuration.md#the-agent-shells-path)).

## Drive

Drive with the Playwright CLI, `playwright-cli`, in a T3 thread too. It is installed globally with
a headless Chromium. Its scratch files go to `.playwright-cli/`, which is gitignored.

- The design width is 1440 × 900; check the touched screen at 1280 too when it has a table or a
  dense row.
- Done when the touched screens show no console error and no React warning.
- Click once the page has settled: on the dev server, a click before the page finishes loading
  submits a form as a plain request, and no save runs.
- A form with unsaved changes asks before the page unloads, and that prompt holds
  `playwright-cli` until `dialog-accept`. A `run-code` script that leaves such a form works in a
  new tab.

1. `playwright-cli -s=<name> open "http://localhost:<port>/<path>"`, then `resize 1440 900`.
2. Drive with `goto`, `click`, `fill`, `select`, `press`, and confirm with `snapshot` (or
   `find "<text>"`). Assert on the snapshot; it is what the page exposes.
3. Diagnose with `console` for errors, `requests` then `request <n>` for the network.
4. Capture with `screenshot --filename=.playwright-cli/<what>-before.png` (`-reference` for an
   approved prototype variant, and `-after`).

Quote any URL with a query string so the shell does not expand it. If `playwright-cli` is
missing, stop and tell the user.

T3's preview tools are for a quick look at a page, as the shared `implement` skill's `PREVIEW.md`
says; a click made through `preview_evaluate` proves nothing about the path.

## Evidence

A change to what a screen looks like is shown as a reference and an after image, same screen,
account and size; a change to motion or interaction as a short recording instead. The reference
is the approved prototype variant when the change had one (§ Prototype), else a before. Images
come from `playwright-cli` `screenshot`.

- **Approved in the thread, never uploaded.** Show the captures to the user in the reply, each
  embedded by its absolute path under `<worktree>/.playwright-cli/`, for approval before the PR
  opens. The PR carries no images.
- **Made-up data only.** Screenshots show names and emails: never put a real person's data
  on screen for a capture.
- Never commit evidence images to the repo.

## Prototype

How the shared `prototype` skill's UI branch runs here.

- **Gates.** Lint and types run on a `prototype/*` branch as anywhere. The two fallow gates,
  `pnpm check:fallow` and `pnpm check:dupes`, skip it in the agent `Stop` hook and the pre-commit
  hook: variants and the switcher trip complexity and duplication by design, and the branch never
  merges. CI runs only on PRs to `main`, and a prototype branch opens none.
- **Reference capture.** For the implementation's evidence, add a worktree of the prototype
  branch (`git worktree add`), launch it there (it takes its own port), and capture the approved
  variant at the design width with the same seed member as the after. Remove the worktree after.
- **Style overrides.** A rule of [style-guide.md](./style-guide.md) the winner breaks changes in
  the implementation's PR, citing the winner comment.

## Cleanup

- `pnpm dev:stop` stops this worktree's dev server, found by its port and working directory.
  Never `pkill -f`.
- Close every preview tab you opened with `t3_preview_close`, and every `playwright-cli` session
  with `playwright-cli -s=<name> close`, since a session left open holds a Chromium.

## Feature map

Which flow proves which area: one section per area, its paths, then the flow. Add a section when
a screen lands, and read only the section you need: `grep -n '^### ' docs/agents/verification.md`
lists them with their lines.

### Document shell, theme

Paths: `__root.tsx`, `styles.css`.

Open `/`, at 1440 and 1280, light and dark; no console error.

### Sign-in and app shell

Paths: `ingresar.tsx`, `_app.tsx`, `_app/index.tsx`, `src/server/caller.ts`, `src/server/sign-in.functions.ts`, `src/components/sign-in-provider.tsx`, `src/hooks/use-session-guard.ts`.

Signed out, `/` lands on `/ingresar`, and another page (`/personal/nueva`) on `/ingresar?volver=…`, where signing in opens the page asked for; a `volver` naming another site (`/ingresar?volver=%2F%09%2Fevil.example`) lands on `/` instead. With Clerk, a page loaded after a minute idle (its session token expired) passes through Clerk's handshake and stays on its page, and an account Clerk signs in but ringmaster refuses (an archived member) gets `Sin acceso a ringmaster` with `Cerrar sesión` on `/ingresar`, not a redirect loop; an empty `Ingresar` shows `Ingresá tu correo y tu contraseña.`, with no browser popup. Sign in as an admin from `setup:organization`: held on `/cambiar-contrasena` until the starting password is replaced, then `/` opens `Inicio`, an empty state greeting the member by name, with the organization name atop the sidebar. The sidebar links group as `General` and `Administración`, the current page marked, with `Personal` for admins only; the trigger collapses it to icons with tooltips, and at 390 wide it opens over the page and closes on a link. The top bar shows the breadcrumbs beside the trigger (`Administración › Personal › <member>` on a member's page: the sidebar group is text, every other step but the last a link), and at its end the account menu, which changes the password and signs out: every other open tab of the app reloads onto `/ingresar`, and Back shows no signed-in page. `curl` `POST /api/auth/sign-up/email` is refused.

### Staff

Paths: `_app/personal/`, `src/organization/staff.ts`, `src/organization/members.ts`, `src/organization/accounts.ts`, `src/server/staff.functions.ts`, `src/components/admin-form.tsx`.

As an admin, `/personal` lists the staff with their roles and `Archivado` on an archived member (no badge on the rest), and its search finds a member by name or email as you type. Create a member as `Administrador`, `Empleado` or both, then sign in as them with the starting password (held on `/cambiar-contrasena`). A row's name opens the member's page, their edit form, titled by their name: `Nombre` and `Correo` read-only under the info alert that they are the account's, and `Roles` as checkboxes. Its `Acciones` menu holds `Asignar contraseña inicial`, a dialog that closes on the toast `Contraseña asignada`, then `Archivar` (their open session ends, sign-in refused, and the page shows the `Persona archivada` alert with `Restaurar`) or `Restaurar`. Removing the last admin's role or archiving them shows the refusal. A non-admin sees no `Personal` link and `/personal` refuses.

### Fields

Paths: `src/components/ui/field.tsx`, `src/components/form-fields.tsx`, `src/components/phone-field.tsx`, `src/components/date-time-input.tsx`, `src/components/date-time-text.ts`, `src/lib/dates.ts`, `_app/dev/patrones.tsx`.

`/dev/patrones` shows every field pattern, and with a production build the route is not found. Its `Campos por tamaño` keeps each row's fields on one line at 1440 and stacks them at 390.

### Empty states

Paths: `src/components/empty-state.tsx`.

`/` shows `EmptyState` greeting the member. `/dev/patrones` shows the cases: `Sin datos` with its button, `Sin datos activos`, `Sin datos, sin permiso para agregar` with the description alone, and `Búsqueda sin resultados`. On `/personal`, a search that matches nobody suggests another search.

### Tables

Paths: `src/components/data-table.tsx`.

As an admin, `/personal` searches in the browser and keeps the text out of the URL; the name opens the record. `/dev/patrones` shows `Tabla` and `Lista fija, sin búsqueda`.

### Form pages

Paths: `src/components/form-page.tsx`.

As an admin, change a field in `/personal/nueva` or a member's page: on the member's page `Descartar cambios` shows and asks before discarding. `Volver`, the sidebar and the browser's back ask too. While saving, the submit button shows a spinner and every button is disabled; a save goes back. With the save held slow (`playwright-cli run-code` delaying `**/_serverFn/**`), click a sidebar link while it runs, coming from the list and from a fresh load: the link's page opens once loaded, never the form or the list again, and no spinner stays. For the save that ends on another record: load member B's page, reach member A's page from it by clicking (sidebar `Personal`, then A's name), hold A's save the same way, and jump back by history to B's (`history.go(-2)`, `Descartar cambios` when asked): B's page stays once the save ends. Reach A by clicking: with both pages opened by URL, the history jump is a full page load, which passes without the fix. Submit `/personal/nueva` empty: each error sits under its field, focus lands on the first one, and nothing shows above the form; an email already in use shows under `Correo`. A form's `Volver` and submit share one row at any width that fits them (a member's `Volver` and `Guardar` at 390 wide); at 390 an edited member's `Descartar cambios` and `Guardar` wrap under `Volver` only if they do not fit, with no sideways scroll; at 1440 the three share one row.

### A UI component

Paths: `src/components/ui/`.

Every screen that uses it, in each state the change touches.
