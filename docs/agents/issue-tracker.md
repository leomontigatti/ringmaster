# Issue tracker: GitHub issues

Issues, PRDs and wayfinding maps live in GitHub issues on
[`leomontigatti/ringmaster`](https://github.com/leomontigatti/ringmaster/issues), reached with
`gh`. `#N` is an issue or a pull request of that repo.

## Conventions

- **Bodies and comments go through `--body-file`**, so the text never reaches the shell, and a
  comment opens with the agent note of the `pr` skill.
- **Infer nothing from the title alone.** Reading the description and its comments is the first
  step of any issue work.

The operations:

- **Create**: `gh issue create --title "..." --body-file <file> --label "..."`, with
  `--parent <PRD>` for a native sub-issue.
- **Read**: `gh issue view <n>`, then `gh issue view <n> --comments`. For a closed issue also
  read `stateReason`: `gh issue view <n> --json number,title,state,stateReason,closedAt,comments`.
- **Find**: `gh issue list --search "<words>" --state all`.
- **Comment**: `gh issue comment <n> --body-file <file>`.
- **Labels**: `gh issue edit <n> --add-label "..."` and `--remove-label "..."`.
- **Start**: `gh issue edit <n> --add-assignee @me`; an issue already assigned to someone else
  is theirs.
- **Open the PR**: its body's closing line is `Closes #N`, one line per issue
  ([pull-requests.md](./pull-requests.md)).
- **Close**: see [Closing an issue](#closing-an-issue).

## Labels

The label list is [`.github/labels.json`](../../.github/labels.json), pushed with
`pnpm labels:sync` and held to by `pnpm check:labels` ([scripts.md](../operations/scripts.md)).
A new label is added there first, with its description, then synced.

The shared skills speak of a few triage roles. Each maps to a label or an assignee:

| Role                      | On GitHub                                           | Meaning                                                                                |
| ------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| needs triage              | label `needs-triage`                                | Maintainer needs to evaluate this issue                                                |
| needs information         | label `question`, assigned to the maintainer        | Not specified enough to act on; a person has to decide first                           |
| work an agent may pick up | label `ready-for-agent`                             | Says what to build and how to tell it is built: a triage state, **not** a trigger      |
| work for a human          | label `ready-for-human`, assigned to the maintainer | Needs a human: a decision to settle or work an agent cannot do                         |
| will not be done          | none: close it                                      | Close as not planned with a `Closure:` comment ([Closing an issue](#closing-an-issue)) |

There is no `needs-info` or `wontfix` label. With one maintainer there is no reporter to wait
on, so "needs more information" is a decision the maintainer owes, which is what `question`
already says. And a decision not to do something is made by closing: an open issue marked
"will not be actioned" is a closure that did not happen.

`source:architecture-review` marks a PRD the weekly architecture review filed. The review lists
its earlier proposals by this label, so it stays on the issue after triage and after closing.

### Priority and type

The roles above say whether an issue can be picked up. They do not say how much it matters.
Triage also sets one `priority:*` label and at least one type label, and removes
`needs-triage` on the way out. An issue with no `priority:*` label has not been triaged.

| Priority          | Meaning                                                                            | Test                                   |
| ----------------- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| `priority:urgent` | Breaks sign-in, a business's data or its day, or a business cannot work without it | Would I drop what I am doing for this? |
| `priority:next`   | The short list to pull from next. Keep it to about 15                              | Will I start this within two weeks?    |
| `priority:later`  | Worth doing, no blocker, not scheduled                                             | Would I be sad to close it?            |
| `priority:parked` | Parked: deliberately not now, and the issue names what wakes it                    | Is there a condition that reopens it?  |

`priority:urgent` is usually empty: it is for data that is lost or wrong, data that leaks
across organizations or reaches someone it should not, and anything that stops a business from
running its day. A parked issue carries a comment stating its wake-up trigger ("the first
business asks for price lists by client"); without one it is `priority:later`. Deciding against
is a different thing: parked will be done when the trigger fires, a rejected issue is closed.

A race is weighed as the `implement` skill's step 2 says, with the actors from
[review.md](review.md#hotspots). The usual recommendations here, which a measured frequency
or the fix's cost overrides:

- silent: a write lost, or data reaching another organization: `priority:next`, and
  `priority:urgent` once a business is live;
- loud (a refusal or an error the user retries) with nothing lost: `priority:later` at most;
- a window that needs one person in two places at once, or opens a few times a year:
  `priority:parked` with what would widen it, or closed as not planned when the fix costs more
  than the hits.

| Type label    | Meaning                                       |
| ------------- | --------------------------------------------- |
| `bug`         | Wrong behaviour today                         |
| `enhancement` | New capability or UX                          |
| `refactor`    | Internal structure, no behaviour change       |
| `chore`       | Dependencies, tooling, CI, docs or operations |
| `question`    | A decision to settle rather than work to do   |

### The dispatch queue

The queue is the unassigned, unblocked `priority:next` issues that carry `ready-for-agent`:
`gh issue list --label priority:next --label ready-for-agent --search "no:assignee"`, skipping
an issue whose
`gh issue view <n> --json blockedBy --jq '[.blockedBy.nodes[] | select(.state == "OPEN") | .number]'`
lists an open blocker. `blockedBy` and `subIssues` are objects, `{nodes, totalCount}`, so a
query reads `.nodes[]`. Add `no:parent-issue` to the search for the PRD-level view.

Blocking is GitHub's native relation: `gh issue edit <ticket> --add-blocked-by <other>`, and
no label tracks it. GitHub counts a closed blocker as cleared.

Sub-issues are not triaged on their own: each takes its PRD's priority and type
([Ticket operations](#ticket-operations)).

`ready-for-agent` triggers nothing: a session picks the issue up from the queue above,
and no label starts a run.

### Wayfinding labels

`wayfinder:map`, `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling` and
`wayfinder:task` are the [wayfinding](#wayfinding-operations) labels. They are the only labels
a map or its tickets carry: a map is not triaged, and the PRD it ends in is.

## Closing an issue

Closing means a decision was made. It does not mean code changed.

| Outcome             | How to close                                                     | Closing comment                                    |
| ------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| **Built**           | a merged PR whose body says `Closes #N`, or `--reason completed` | none needed: the linked, merged PR is the evidence |
| **Deferred**        | `gh issue close <n> --reason "not planned"`                      | **required**: `Closure: deferred to #<number>`     |
| **Decided against** | `gh issue close <n> --reason "not planned"`                      | **required**: `Closure: decided against — <why>`   |
| **Out of scope**    | `gh issue close <n> --reason "not planned"`                      | **required**: `Closure: out of scope — <why>`      |
| **Duplicate**       | `gh issue close <n> --duplicate-of <number>`                     | none needed                                        |

"Built" means the change is on `main`. A deferral names its follow-up issue, which must exist
before the close, and re-points anything blocked on this issue at the follow-up.

Do not infer from a completed close that anything was built. Check the code or the closing
discussion before repeating the claim anywhere durable.

## Ticket operations

The `to-spec` and `to-tickets` skills use this section.

- **The PRD** is an issue labelled `ready-for-agent` and its type, with the description from
  the `to-spec` template.
- **Tickets** are native sub-issues of the PRD, one level deep, created in the order they will be
  implemented with `gh issue create ... --parent <PRD>`, each with the PRD's priority and type
  plus `ready-for-agent` ([Labels](#labels)). Check first that the PRD has none yet
  (`gh issue view <PRD> --json subIssues --jq '.subIssues.totalCount'` is `0`), and publish no
  slice before the user approves the slicing. Its open ones are
  `gh issue view <PRD> --json subIssues --jq '.subIssues.nodes[] | select(.state == "OPEN") | .number'`.
- **Blocking** is GitHub's native relation, as above. A "Blocked by #N" line in the
  description is for the reader; it does not block anything.
- **Two slices that each add a migration** get a blocking edge between them. Run in
  parallel, they would take the same migration number.
- **Test seams**: each ticket has a `## Test seams` section after its acceptance
  criteria, taken from the PRD's Testing Decisions ([Test seams](#test-seams)).
- **Do not close or edit the PRD** from a ticket session; the PRD PR's thread closes it after
  the merge.

## PRD workflow

- The PRD is filed per [Ticket operations](#ticket-operations).
- **Testing Decisions names the test seams**: the public interfaces the behaviour is
  tested through (a server function, a route's loader or action, a pure module). The
  `tdd` skill tests only at seams agreed up front, and this is the point where a
  human agrees them.
- Triage: `ready-for-agent`, a priority and at least one type label
  ([Priority and type](#priority-and-type)). Ask the priority together with the seams when
  the conversation has not settled it. No other triage state is needed.

## Wayfinding operations

The `wayfinder` skill uses this section.

- **The map** is an issue labelled `wayfinder:map`. **Tickets** are native sub-issues of it,
  each labelled `wayfinder:<type>`.
- **Blocking** is GitHub's native relation, as above.
- **The frontier** is the open, unassigned, unblocked children of the map.
- **Claiming** is `gh issue edit <ticket> --add-assignee @me`, before any work.
- **Exit shapes.** A map ends in one PRD with flat sub-issues when the slices touch
  the same files or are merged together, which is the default. Independent issues
  are only for slices that merge and revert alone. A chain of blocked standalone
  issues is the shape to avoid.

## Research tickets

A research ticket is resolved by the shared `research` agent: spawn it with the
ticket's question, in parallel for each research ticket, as
[agent-configuration.md](./agent-configuration.md#delegating-to-subagents) says. The
agent reports as text and leaves git and the tracker alone, so the session posts the
findings as a comment on the ticket, which is its resolution. A durable primary
source may be committed under `docs/research/<kebab-name>.md` on the session's own branch.

### Test seams

A ticket that settles how something is built records its test seams (the public
interfaces the behaviour is tested through) in its resolution. They land in the
PRD's Testing Decisions, which is where `to-tickets` and the implementing session
read them.
