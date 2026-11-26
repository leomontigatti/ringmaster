# Architecture Decisions

Read ADRs selectively: start with the topic that matches the change. Format and
when to write one: the shared `domain-modeling` skill's `ADR-FORMAT.md`.

`docs/adr/*.md` is decisions in force only. A superseded ADR is deleted in the change
that supersedes it, and git keeps the record. The numbers kept from rubens (0001, 0008, 0009) keep their numbers, so the gaps are expected.

An ADR ends on a `Governs:` line naming the code it shapes, and the skill's
`scripts/anchors.py` lists each one whose anchor has left the code.

## Decisions

- [ADR-0001: Application stack](./0001-stack.md) - TanStack Start on Vite+,
  Drizzle, Clerk, shadcn/ui on Base UI; why each over its alternative.
- [ADR-0002: The product is named ringmaster](./0002-product-named-ringmaster.md) -
  a scaffold from rubens' stack, without its domain.
- [ADR-0008: ringmaster runs on Cloudflare Workers, one Durable Object per organization](./0008-cloudflare-workers-one-object-per-organization.md) -
  each organization's data in its own SQLite object as the tenant boundary; on Workers
  Paid.
- [ADR-0009: Staff sign in through Clerk, without Clerk Organizations](./0009-staff-sign-in-through-clerk.md) -
  organization and roles on the Clerk user; a sign-in or sign-out reloads every tab.
