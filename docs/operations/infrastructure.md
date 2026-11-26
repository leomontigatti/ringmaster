# Production infrastructure

What production needs, how to deploy it, and what is still open. Items marked **TBD**
have no value and must not be guessed at.

## Shape

One Cloudflare Worker, `ringmaster` (`wrangler.jsonc`), on Workers Paid, US$5/month
([ADR-0008](../adr/0008-cloudflare-workers-one-object-per-organization.md)). It serves
the app and holds one SQLite-backed Durable Object per organization (`ORGANIZATION`,
class `Organization`), which keeps all of that organization's data and applies its own
migrations when it starts. Staff sign in through Clerk
([ADR-0009](../adr/0009-staff-sign-in-through-clerk.md)); the Worker only verifies
Clerk's session token. There is no server, database or container to run.

Deploys are manual: a person runs them from a checkout of `main`. Pushing to `main`
deploys nothing.

## Status

Not deployed. Still TBD:

- The Cloudflare account that owns production, the domain and the DNS record for the app.
- Whether the data may be stored in the United States, where Cloudflare creates the
  objects today (ADR-0008), and whether the database must be registered with the AAIP
  (Argentina's data protection agency) before real customer data goes in.
- Backups of the objects' storage beyond Cloudflare's own (below).
- Alerting channel and who receives it.

## The Clerk application

One Clerk application per environment, created in Clerk's dashboard:

- **Sign-in**: email and password. No public sign-up: members are created by the app
  (the setup script, then the staff screens).
- **Session token claims** (Configure → Sessions → Customize session token):

  ```json
  {
    "org": "{{user.public_metadata.organizationId}}",
    "roles": "{{user.public_metadata.roles}}"
  }
  ```

  Without `org` every signed-in user is refused. The app writes both fields of the public
  metadata when it creates a member.

- **Passwords** (the password settings in Clerk's dashboard):
  - minimum length 8 (Clerk recommends 15; Clerk's maximum is 72 bytes, so a letter with an accent takes two and an emoji four);
  - reject compromised passwords: on;
  - enforce minimum password strength: off.

  The app's own length check (`src/lib/password-change.ts`) uses the same 8 and 72: change
  them together.

- **Keys**: the publishable key (`pk_…`) and the secret key (`sk_…`), from API keys.

## Worker secrets

Set with `pnpm exec wrangler secret put <NAME>`, which prompts for the value and
deploys a new version with it. Never in `wrangler.jsonc`, the repository or a `.env`
that is committed.

| Secret                  | What it does                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `CLERK_SECRET_KEY`      | Verifies session tokens and calls Clerk's Backend API. Without it a deployed Worker refuses every request (`src/server/caller.ts`). |
| `CLERK_PUBLISHABLE_KEY` | Served to the browser for Clerk's sign-in. Required beside the secret key.                                                          |
| `SETUP_SECRET`          | Lets `pnpm setup:organization` create an organization. Without it `/api/setup` answers 404. Remove it when no setup is pending.     |

`DEV_SIGN_IN` is never set on a deployed Worker: it would let anyone sign in as any
member.

## Deploy

From a clean checkout of the commit to deploy, with `pnpm install` done:

1. **Sign in to Cloudflare**: `pnpm exec wrangler login`, as the account that owns the
   Worker.
2. **Build and deploy**: `pnpm build`, then `pnpm exec wrangler deploy`. The build writes
   the deploy config wrangler picks up. The first deploy creates the Worker, the
   `ORGANIZATION` binding and the object class (the `v1` migration in `wrangler.jsonc`),
   and prints the Worker's URL.
3. **Set the secrets** (above): `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` on the
   first deploy, and `SETUP_SECRET` when an organization is to be created.
4. **Create the organization** and its first admin:

   ```sh
   SETUP_SECRET=<the value set above> pnpm setup:organization --url https://<worker url> \
     --organization "<name>" --name "<admin name>" --email <admin email> \
     --password <starting password>
   ```

   The admin is created in Clerk and in the organization's member table, and must
   replace the starting password at first sign-in. A second run for the same
   organization changes nothing and says so. Then
   `pnpm exec wrangler secret delete SETUP_SECRET`.

5. **Check it**: sign in at `https://<worker url>/ingresar` as the admin.

A later deploy is steps 2 and 5. A schema change ships with its migration, which each
object applies on its next start; a migration on `main` is never edited.

Rollback: `pnpm exec wrangler rollback` returns to the previous version. An object
that already ran a newer migration keeps its schema, so a rollback is only safe when
the migration was additive.

To remove a deployed copy (a test or measurement deploy):
`pnpm exec wrangler delete`. Check in Cloudflare's dashboard that the Worker and its
Durable Object namespace are gone, and delete that copy's Clerk application if it had its own.

## CPU

Workers Paid allows 30 s of CPU per request by default, configurable up to 5 minutes,
and includes 10 million requests and 30 million CPU ms a month; beyond that, US$0.30 per
million requests and US$0.02 per million CPU ms (ADR-0008). Watch a deploy's CPU in the
Worker's metrics on Cloudflare's dashboard (`observability` is on in `wrangler.jsonc`).

This app's CPU per request has not been measured yet. Measure a signed-in page and a
server-function call on the first deploy: a page over the free plan's 10 ms is why the
Worker is on Paid.

## Backups

Cloudflare keeps a SQLite-backed object's storage with point-in-time recovery for the
last 30 days. Whether that is enough, or the objects also export to storage of our own,
and the restore drill, are **TBD**, as is how long a business's records must be kept,
which is a legal question, not only an operational one. A backup
nobody has restored is a hope, not a backup.

## Logs, errors and alerts

No personal data in logs, error messages or alerts. That covers names, emails, phone
numbers, free text a person typed and anything else identifying. Concretely:

- do not log request or response bodies on the server path;
- thrown error messages name the failure, never the record;
- Workers logs (`observability` in `wrangler.jsonc`) are kept by Cloudflare: treat them
  as containing no personal data by construction, not by filtering.

Staff identities (names, emails, passwords) live in Clerk; only members have accounts,
so nobody else's data is in Clerk.
