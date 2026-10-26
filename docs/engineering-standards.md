# Engineering standards

How quality is controlled in this repository, and how people get better while working in it.

This document exists because the project already had good rules and no way to enforce them. Read
it once, then treat the gate ladder in §4 as the contract.

---

## 1. Where this codebase actually stands

Measured on 2026-10-26 against `main` plus the working tree.

| Signal | Value | Read |
| --- | --- | --- |
| TypeScript files | 239 | small units, 10,683 lines total |
| Largest file | 152 lines (`app/router.tsx`) | no god files |
| `any` / `@ts-ignore` | 1 / 0 | type discipline is real, not aspirational |
| `TODO` / `FIXME` / `HACK` | 0 | debt is not hidden in comments |
| Compiler flags | `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride` | above default |
| Test suites | 6 in `npm test`, all green | logic coverage is genuine |
| Structural violations | 0, baseline empty | every ceiling holds |
| Error handling | `ErrorBoundary` at the app root | crashes are contained |

Two things here are better than most production teams manage:

**The CSP parity test.** `check-csp-parity.mjs` asserts that `vercel.json`, `netlify.toml` and
`serve-with-csp.mjs` carry a byte-identical policy, that the inline boot script's hash matches,
and that `unsafe-eval` appears nowhere. That is a test written by someone who understood that
config drift is a security bug, not a formatting bug. Keep it.

**The audit trail.** `reports/audit/` records findings with IDs, measurements before and after
(`1309 ms → 4.9 ms`, `sanitize calls 1200 → 1`), and an explicit "limitations, honest" section.
Most teams write a retro that says "we improved performance." This one has numbers.

So the problem is not craft. The problem is that the craft is **local and voluntary**.

---

## 2. The one structural problem, and how it was closed

Every rule in this project lived in prose. The README said pages stay "under 100 lines." The audit
prompt listed nine hard invariants. Nothing executed them.

The cost, measured on 2026-10-26:

```
src/components/splash/CelestialStars.tsx   226 lines   over absolute 200
src/components/splash/SplashScreen.tsx     179 lines   over components 150
src/pages/Stats/StatsGrid.tsx              174 lines   over pages 100
src/services/entryQuery.ts                 121 lines   over services 120
src/pages/Dashboard/Dashboard.tsx          111 lines   over pages 100
```

The previous audit verdict reported "0 violations, largest file `syncStore.ts` 197/200." That was
true when written. `syncStore.ts` was later deleted, and five new violations appeared in the files
that replaced it — because nothing was watching. The README still claimed every page was under 100
lines. It was not.

This is the whole lesson: **a rule with no exit code is a suggestion.**

All five were split the same day, and none of the splits were cosmetic — each one found a real
seam that had been buried in a long file:

| File | Split into | The seam it revealed |
| --- | --- | --- |
| `StatsGrid.tsx` | `ledgerRows.tsx` + `ledgerNotes.tsx` + five value components in `components/stats/` | the page was doing three jobs: ordering, copy, and ten bodies of markup |
| `Dashboard.tsx` | `DashboardComposer.tsx` | lazy-loading the composer is a component, not a page concern |
| `SplashScreen.tsx` | `SplashGreeting.tsx`, `SplashSkipButton.tsx`, `splashSession.ts` | timing constants and session flags are not view code |
| `CelestialStars.tsx` | `starGeometry.ts`, `Stardust.tsx` | SVG geometry is data; the component only renders it |
| `entryQuery.ts` | `deletedIds.ts` | the deleted-id log outlives the collection it describes |

The baseline is now empty. The ratchet stays armed, with nothing left to grandfather.

---

## 3. What now enforces it

`scripts/check-invariants.mjs` turns the prose rules into a pass/fail:

- line ceilings per folder (`pages` 100, `hooks` 80, `services` 120, `utils` 50, `components` 150)
  and an absolute 200 for everything
- no explicit `any`, no `@ts-ignore`, no `@ts-expect-error`
- no Unicode emoji
- no stray `console.*` outside an explicit allowlist

Existing debt is frozen in `scripts/.invariants-baseline.json` — currently empty, because all five
entries were paid off. The ratchet works in one direction:

| Situation | Result |
| --- | --- |
| New file breaks a ceiling | **fails** |
| Frozen file grows by one line | **fails** (`grew from 121 to 123`) |
| Frozen file shrinks or is fixed | passes, and is reported as *shrinkable* |
| `--update` run to silence a regression | forbidden — see §10 |

Why a baseline at all, rather than "fix everything before turning the gate on": a gate that fails
on day one gets disabled on day two. Freezing debt and blocking growth buys the same protection
immediately, without asking anyone to stop shipping. It worked exactly as intended — the five
entries were a to-do list with a tripwire, not an amnesty, and all five are gone.

---

## 4. The gate ladder

Three speeds, each with a different job. Do not collapse them into one.

**Speed 1 — pre-commit (seconds).** `npm run hooks:install` once per clone, then
`.githooks/pre-commit` runs typecheck, lint and invariants. Catches what is embarrassing to push.
It deliberately does *not* run the test suite or the build: a slow hook trains people to use
`--no-verify`, which is worse than no hook.

**Speed 2 — CI (minutes).** `.github/workflows/ci.yml` runs the full chain on every push and PR:
typecheck → lint → invariants → test → build, plus a bundle-size report in the job summary. This is
the only gate that cannot be skipped locally, so it is where the real contract lives.

**Speed 3 — weekly (an hour).** One person, rotating, does three things:
1. Run `node scripts/check-invariants.mjs` and fix or shrink one frozen entry.
2. Check the bundle report trend from the last five CI runs.
3. Pick one `reports/audit/` P2 item and either fix it or close it with a reason.

Weekly rotation matters more than the hour. It is how everyone learns what "healthy" looks like
instead of trusting whoever last touched the pipeline.

---

## 5. Definition of done

A change is done when all of these are true. Not "when it works on my machine."

- [ ] `npm run verify` passes locally (typecheck, lint, invariants, tests)
- [ ] CI is green
- [ ] New pure logic has a `check-*.mjs` suite that imports the real `src/` module — not a copy
- [ ] Any change to a write path (`services/entryWrite.ts`, `lib/storage.ts`, autosave) has a test
      proving no data is lost on the failure path
- [ ] Any perf claim is a measured number, not an adjective
- [ ] Any a11y-affecting change states its contrast ratio or keyboard path
- [ ] No new file enters the baseline without a reviewer asking why

The third and fourth items are the ones that actually protect users of an offline-first app. A
diary that silently loses an entry is worse than a diary that crashes, because the user does not
find out until it is too late to retype.

---

## 6. Review rubric — in priority order

Reviewers waste most of their attention on the last item. Spend it on the first four.

**1. Data loss.** Is there any path where a write can fail, partially apply, or be clipped, and the
user is told it succeeded? Storage quota, JSON parse failure, `contentMaxLength` truncation,
`pagehide` firing mid-write. This project has already had all four.

**2. Correctness under hostile data.** `localStorage` is user-writable and survives deploys. Every
read path must assume the stored value is the wrong shape. `coerceEntry` / `coerceDraft` exist for
this reason; a new field without a coercion branch is a crash waiting for an old backup file.

**3. Hot-path cost.** Typing latency in the editor, list render with 400 entries, `/stats` first
paint. If a change adds work per keystroke or per row, it needs a number.

**4. Accessibility.** Focus visibility, keyboard reachability, contrast. The project has a measured
standard (WCAG 2.1 AA, with recorded ratios). A regression here is a bug, not a nit.

**5. Structure.** Does it respect the folder ceilings and the one-hook-per-file rule? Mostly
automated now — let the gate say it, do not spend review attention on it.

**6. Naming and style.** Last, and lowest value. If this is the only thing you commented on, the
review was not worth the author's time.

### Comment taxonomy

Prefix every comment so the author knows what blocks merge:

| Prefix | Meaning | Author action |
| --- | --- | --- |
| `blocking:` | merge stops here | must fix or explicitly disagree |
| `suggestion:` | better, not required | take it or explain why not |
| `nit:` | taste | ignore freely |
| `question:` | I do not understand this yet | answer, do not change code |

Severity maps to response time: **P0** (data loss, security, broken route) same day; **P1** within
two days; **P2** goes to `reports/audit/` with an ID and a date, not into a comment thread that
gets lost.

---

## 7. Reviewing to grow people, not to police them

The difference between a gatekeeper and a senior reviewer:

- A gatekeeper says "this is wrong." A senior says "this is wrong *because* storage can be
  half-written when the tab closes — here is the line that shows it."
- A gatekeeper fixes it themselves. A senior writes the failing test, then hands back the fix.
- A gatekeeper approves to unblock. A senior blocks once, clearly, and then helps.

Two habits that pay off fastest here:

**Ask for the measurement, not the opinion.** "Is this faster?" is unanswerable. "What did
`measure-perf.mjs` say before and after?" is a thirty-second conversation. The repo already has the
tooling; make citing it the norm.

**One blocking comment at a time.** A review with eleven blocking comments does not get fixed; it
gets abandoned or rubber-stamped. Lead with the most important one, let the author fix it, then
continue. This is slower per round and much faster per PR.

---

## 8. Skill ladder

Concrete expectations, tied to this codebase rather than to years of experience.

**Junior — owns a leaf.**
Can add a component under `components/` or a pure function under `utils/`, with a test. Runs
`npm run verify` before asking for review, and reads the failure instead of pasting it into chat.
First real task: write the first DOM test for `EditorToolbar` or `useAutosave` (see §9). Reading
`services/entryWrite.ts` end to end is the fastest way to understand the app.

**Mid — owns a slice.**
Owns a page and its service functions. Writes a `check-*.mjs` suite for any pure logic they add,
importing the real module. Reviews others' PRs for correctness (rubric items 1–2) and says "I do
not know" when they do not. Can explain why `localStorage` is authoritative and what `pagehide`
does to an `await`.

**Senior — owns a boundary.**
Owns the store/services seam and the invariants themselves. Measures before optimizing and can
show the before/after. Decides trade-offs and writes them down as an ADR. Reviews for design, not
lines. Mentors by pairing on the hardest bug rather than by rewriting the diff.

The promotion signal in all three cases is the same: **does the person leave the system easier to
change than they found it, with evidence?**

---

## 9. The biggest real gap: no DOM tests

The suite is strong on pure logic and absent on components. `jsdom` is not installed; there is no
Testing Library. That means the highest-risk surface — the Tiptap editor, autosave timing, the
reader's page flip, the calendar's day panel — has zero automated behavioural coverage. Every
regression there is found by a human clicking around.

Recommended first three, in this order, because each one guards a real past bug:

1. **Autosave** — does a debounced save fire exactly once, and does it survive a fast
   mount/unmount? (Guards the duplicate-draft class of bug.)
2. **Draft restore** — a draft with a non-array `tags` field must render, not crash. (This exact
   bug shipped once; `coerceDraft` fixed it and nothing tests it.)
3. **Editor toolbar** — bold/italic toggles reach the document, and keyboard shortcuts still work
   after the toolbar re-renders.

Add `jsdom` + `@testing-library/react` + `@testing-library/user-event` as dev dependencies and
wire one `check-*.mjs` in the existing harness style. Do not migrate to Vitest in the same change;
one variable at a time.

---

## 10. Anti-patterns to refuse

**Gate theatre.** Adding checks nobody reads, or a coverage badge that measures nothing. Every gate
must be able to fail for a reason someone would actually care about.

**Baseline laundering.** Running `--update` after a regression so the build goes green. The baseline
may only be regenerated when a file has **shrunk** or a finding was genuinely fixed. If the diff
shows an entry growing, the PR is wrong. Treat this like editing a test to match broken output.

**Coverage worship.** A percentage is not a risk model. `utils/date.ts` at 100% matters less than
`entryWrite.ts` at 40%. Test the paths where failure is silent.

**"Tests later."** For the write path, later never comes. The test is part of the change or the
change is not done.

**Reviewing style while data loss ships.** See §6. Order matters more than thoroughness.

**Heroic fixes.** A 400-line PR that fixes six things cannot be reviewed, cannot be reverted, and
teaches nobody. Six small PRs can do all three.

---

## 11. Decisions get written down

Any choice that a future contributor would reasonably question gets a short ADR in
`docs/adr/NNNN-title.md`. Five minutes, five sections:

```markdown
# 0007 — Keep localStorage authoritative, sync is opportunistic

## Status
Accepted, 2026-10-26

## Context
The diary must work offline and survive a closed tab. A remote store cannot be the source of truth
because writes during `pagehide` cannot await a network round trip.

## Decision
Writes land in localStorage synchronously. Any remote copy is best-effort and reconciled later.

## Consequences
Reads are instant and offline-safe. Multi-device conflict resolution becomes our problem, not the
platform's. Deleting the local store deletes the diary, so export must stay prominent.

## Alternatives rejected
Server-authoritative writes: rejected, breaks the closed-tab case.
```

Write the ADR when the decision is made, not when someone asks six months later why. The
`reports/audit/` trail is already good at this; ADRs extend it from "what we found" to "what we
chose."

---

## 12. Rollout

**Done already.** The gate, CI, the pre-commit hook and the empty baseline are in place. The five
line-ceiling violations are split. The README no longer claims something the code does not do.

**Week 1.** Everyone runs `npm run hooks:install` in their clone. First CI run on a real PR — check
that it fails when it should, not just that it passes.

**Week 2–3.** Everyone runs `npm run verify` before review. First DOM test lands (autosave). First
weekly rotation happens; put a name and a date in the team calendar, not in someone's head.

**Week 4.** First ADR. Pick the Vite advisory that was consciously deferred — the reasoning already
exists in the audit trail, it just needs a home that outlives the report.

**Ongoing.** Two ADRs per month, minimum. If the team cannot find two decisions worth recording,
the work is too small to be teaching anyone anything.
