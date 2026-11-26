# ringmaster

The domain vocabulary of a catalog app for an Argentine small business. Each entry
is the canonical English identifier, the name to use in code, followed by `ui:`,
the Spanish term the user sees. How to read it is in
[docs/agents/coding-standards.md](docs/agents/coding-standards.md#code-language).
The detailed rules live in [docs/domain/](docs/domain/). The catalog's own terms
(clients, products) are added here as their features land.

## Records

**`inactive`** — ui: "Archivado", "Archivada"
A record taken out of use without being deleted: lists hide it until their
`Archivados` filter includes it, and it keeps its history. `deactivate` is
"Archivar" and `reactivate` "Restaurar".
_Avoid_: desactivado, inactivo, desactivar, reactivar, borrado

## People

**`organization`** — ui: "Organización"
The business that owns everything in the app. Each organization's data is its own:
nothing of one organization is read or changed from another.
_Avoid_: tenant, account, company, empresa

**`member`** — ui: "Persona"; the list of them, "Personal"
Someone who signs in to the `organization`, with one or more roles. A member is
archived (`inactive`), never deleted, and signs in for the first time with a
`startingPassword`.
_Avoid_: user, employee, account, staff member

**`admin`** — ui: "Administrador"
A member who configures the `organization`: its staff and, as they land, its
catalog settings. The first admin is the owner; there is no separate owner role.
_Avoid_: owner, manager, superuser

**`staff`** — ui: "Empleado"
A member who works in the `organization` without configuring it.
_Avoid_: employee, user, seller, operator

A member can hold several of these roles at once, such as an admin who is also
staff.

**`startingPassword`** — ui: "Contraseña inicial"
The password an admin gives a new member, or gives them again, which they must
replace the next time they sign in.
_Avoid_: temporary password, default password, reset password
