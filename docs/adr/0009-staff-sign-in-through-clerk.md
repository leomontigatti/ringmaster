# ADR-0009: Staff sign in through Clerk, without Clerk Organizations

**Status**: accepted

Date: 2026-11-25. Inherited from rubens.

The password check runs on Clerk's servers. The Worker only verifies Clerk's session
token, which costs a few milliseconds of CPU; a self-hosted password hash (Better Auth,
scrypt) took a median 90 ms of CPU per sign-in on Workers in rubens.

## Organization and roles live on the user

Clerk's free plan caps an organization at 5 members, and a member belongs to exactly
one organization, so Clerk Organizations are off. Each Clerk user carries, in its public
metadata, the organization id ringmaster issued and the member's roles (`admin`,
`staff`). The session token carries both as claims (`org`, `roles`), and the Worker
passes them to the organization's object.

## Consequences

- ringmaster owns staff management: inviting, removing and changing roles are its own
  screens, calling Clerk's Backend API. Clerk's organization screens are not used.
- A removed member loses access on their next call: the token still verifies until it
  expires, about a minute, but the organization's object authorizes every call from its
  own member table, which no longer lists them as active.
- Staff identities (names, emails, passwords) are held by Clerk, in the United States.
- Dev runs with no Clerk key, through a dev sign-in that picks a seeded member.
- Clerk brings protections ringmaster can turn on without building them: rejecting
  compromised passwords, password strength, two-step verification, passkeys.
- A sign-in or a sign-out loads the app afresh in the tab that made it and in every
  other signed-in tab, so nothing cached for the previous user survives
  (`src/lib/session-change.ts`).

## Considered options

- **Better Auth**: self-hosted and no vendor, at the cost of the ~90 ms password check
  on every sign-in and a user directory shared across organizations, outside the
  per-organization objects, because sign-in has to find a user before it knows their
  organization.
- **WorkOS AuthKit**: a higher free tier; not prototyped.
- **Clerk Organizations**: 5 members per organization on the free plan.

Governs: `src/server/caller.ts`, `src/organization/accounts.ts`, `src/server/sign-in.functions.ts`, `src/lib/session-change.ts`
