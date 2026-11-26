# ADR-0008: ringmaster runs on Cloudflare Workers, one Durable Object per organization

**Status**: accepted

Date: 2026-11-25. Inherited from rubens, where it was decided from a prototype and
measured in production.

ringmaster runs on Cloudflare Workers Paid (US$5/month). An organization's data (its
members, the audit log, and the domain tables still to come) lives in one Durable Object
of its own, with SQLite storage. Staff sign in through Clerk
([ADR-0009](./0009-staff-sign-in-through-clerk.md)). The point is to run no servers for
the app.

## The organization's object is the tenant boundary

The Worker takes the organization and the roles from the verified session token and
calls that organization's object, and only it. No query can reach another
organization's data, because no other organization's data is in that object. The
object checks the roles on every call.

## Rules a database would enforce live in the object

SQLite has no row-level security or grants.

- **The audit log is append-only**, and role checks are code in the object. Every write
  goes through the object's methods, so they are the one place to test them.
- A check and the write it guards run in one synchronous storage transaction, with no
  `await` in between. An object runs one event at a time, so there is no
  check-then-insert race.
- Instants are integers (Unix milliseconds, UTC); a span is `[start, end)`.

## Considered options

- **A VPS with Postgres**: a server to run and patch.
- **D1 for all the data**, with `organization_id` on every row: one database, but the
  tenant boundary back in every query.
- **The Workers free plan**: in rubens a signed-in page took about 20–30 ms of CPU to
  render on the server, over the free plan's 10 ms, so Paid is the plan.

## Consequences

- **Data lives where Cloudflare places the object**, in practice US East for
  objects hinted to South America.
- Dev needs no keys and no account: Miniflare runs the Worker and the objects locally,
  and with no Clerk key the app uses a dev sign-in.

Governs: `wrangler.jsonc`, `src/organization/organization.ts`, `src/organization/organization-runtime.ts`
