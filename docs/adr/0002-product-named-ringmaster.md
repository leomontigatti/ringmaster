# ADR-0002: The product is named ringmaster

**Status**: accepted

Date: 2026-11-25.

ringmaster starts as a scaffold copied from rubens (whose product was named
underthing): the stack, tooling, checks and the organization, member and sign-in code,
without that product's domain. Its own domain, a catalog for Argentine small
businesses (clients and products), is not built yet.

The name is carried by the Worker (and so its `workers.dev` URL), the package name,
the page titles, the docs, the dev sign-in cookie and the session-change storage key.
The repository is `leomontigatti/ringmaster`. The Durable Object class,
`Organization`, carries no product name.

## Consequences

- ringmaster is a new Worker with no secrets and no objects; nothing migrates from
  rubens.
- The ADRs kept from rubens (0001, 0008, 0009) are rewritten to state the decisions
  as they apply here; rubens' git history keeps the originals.

Governs: `wrangler.jsonc`, `package.json`, `ringmaster-session-changed`
