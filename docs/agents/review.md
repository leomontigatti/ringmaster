# Review

What the shared `implement` skill's step 5 and the `code-review` skill need to know about ringmaster.
ringmaster holds each organization's business data and its members' accounts, personal data under
Ley 25.326, so the areas below are where a wrong change exposes a person's data or another
organization's.

## Full review

A diff that touches any of these goes to the full review, beside the migrations, `GLOSSARY.md`
terms and destructive scripts the shared skill always sends there:

- **Personal data**: anything that stores, reads, shows or sends a member's name, email or
  account, or the audit log of who changed what; as the catalog lands, its clients' data too.
- **Tenancy**: the step that picks the organization's object from the verified session, the
  object's authorization from its member table, its storage and schema (ADR-0008).
- **Auth**: the session token check and the dev sign-in, Clerk's accounts, the setup and seed
  endpoints behind their secrets, and who may call a server function (ADR-0009).
- **The Worker's deploy config**: `wrangler.jsonc`, its bindings and object migrations, which
  apply at every deploy.

The paths, for `review.py`:

```review-paths
full personal data: ^src/organization/(staff|audit)\.ts$
full personal data: (^|/)(clients?|clientes?)[^/]*(/|\.)
full tenancy: ^src/server/(caller|with-organization)\.ts$
full tenancy: ^src/organization/(organization|members|database|schema)\.ts$
full auth: ^src/organization/accounts\.ts$
full auth: ^src/server/(sign-in\.functions|organization-setup)\.ts$
full auth: ^src/routes/api/
full migration: ^src/organization/migrations/
full migration: ^drizzle\.organization\.config\.ts$
full deploy config: ^wrangler\.jsonc$
full glossary: ^GLOSSARY\.md$
quiet: ^\.fallowrc\.json$
quiet: ^\.vite-hooks/
quiet: ^\.github/(dependabot\.yml|pull_request_template\.md)$
quiet: ^t3\.json$
quiet: ^components\.json$
quiet: ^assets/
quiet: ^\.env\.example$
```

## Always ask

A finding in one of these areas is the user's call unless the issue already settles it:

- personal data;
- tenancy: which organization's object a call reaches, and the object's authorization;
- auth.

## Hotspots

Where this codebase gets hurt, for the correctness brief:

an instant stored or shown in the wrong time zone, or formatted without the zone the caller
passes (`src/lib/dates.ts`); an organization id taken from the request instead of the verified
session, or an object reached by another organization's name; an object method that skips `as()`
or states a weaker requirement than the server function it replaced; an `await` between a check
and the write it guards inside the object, which lets another event in; a server function
reachable by a user who should be refused (a `staff` member reaching `/personal`'s functions, an
archived member, one who must still change their password); an organization left with no active
`admin`; a member's data (names, emails, phones) that reaches a log, an error message, an alert or
a Worker log line.

**Who acts concurrently**, for weighing a race (the `implement` skill, step 2). ringmaster is not
deployed, so these actors are expected, not measured. Inside one `organization`: `admin`s
creating, editing and archiving `member`s, while those members sign in and change their
passwords. Creating a member awaits Clerk, so a second create with the same email can arrive
mid-call; the object holds the email as in flight until the first one ends
(`src/organization/staff.ts`). Two admins each removing the other's `admin` role is the
everyday race, and the object turns it into a refusal the second one sees: it runs one event at a
time and checks for the last admin and writes in one synchronous transaction
([ADR-0008](../adr/0008-cloudflare-workers-one-object-per-organization.md)). Organizations share
no rows, so organizations never race each other. Once deployed, measure writes per minute per
organization.

## Breadth

- **Entry points.** A behaviour reachable from one page is usually reachable from another too,
  such as a list and its record's page, or a page and a dialog over it. Name the paths you
  checked and the ones deliberately different.
- **Tenancy.** Every server function reaches data through `withOrganization()`, the organization
  comes from the verified session and never from the request body, and every object method
  authorizes through `as()` with its requirement
  ([ADR-0008](../adr/0008-cloudflare-workers-one-object-per-organization.md)).
- **Interface.** A new component, variant or token is checked against what `src/components/`
  already has: lint catches a restyle or an off-theme class, not a second component doing the
  job of an existing one ([style-guide.md](./style-guide.md)).
- **Docs.** The documentation rules are [workflows.md](./workflows.md#documentation).

## One-way doors

Always one-way on ringmaster, beside the shared list:

- Any change that widens who can read a member's data, or later a client's: an object method's
  `as()` requirement and the roles behind it.
- Any change to what the audit log keeps or how long.
- Production infrastructure, as [infrastructure.md](../operations/infrastructure.md) describes it.
