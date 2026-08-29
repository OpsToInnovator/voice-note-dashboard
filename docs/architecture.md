# Architecture

Code owns **gates, routing, lint, and maths**. A model may fill **interpretation and canvas prose**. The human retains **judgment**.

```
Capture
  → Interpret (kinds: observation, assumption, emotion, …)
  → Agency (can the operator influence this?)
  → Substance (develop / defer / delete / reconstruct)
  → Meaning (A / B / C if reconstructed — human confirms)
  → Stress-test (which kit earns this thought)
  → Decision gate (destination + tier)
  → Container (objective, sequence, cadence, exit)
  → Execution (only if EXECUTE and not Tier 3)
  → Learning (expected vs actual)
```

## Repository map

| Path | Role |
| --- | --- |
| `shared/thoughtOs.ts` | Operating sequence, destinations, tiers, agency, substance, fixtures, tests |
| `shared/goalCoach.ts` | Goal type, outcome lint, feasibility maths, named if–then obstacles |
| `shared/frameworks.ts` | Seven canvases; every plan linted to a first action |
| `shared/actionFrame.ts` | Thought → next action; lint; Notion block shape |
| `shared/resurface.ts` | Daily inbox / today / stale; cap 15 |
| `shared/schema.ts` | Shared types for Notion-backed surfaces |
| `server/thoughtOs.ts` | HTTP adapter: fixture or interpretation fill, then `normalizeThought` |
| `server/frameworks.ts` | Same for Goals |
| `server/actionFrame.ts` | Clarify inbox; write one first action to Notion |
| `server/resurface.ts` | Compose standup from Notion or fixtures |
| `server/notion.ts` | Notion API; **no workspace IDs in source** — env only |
| `server/intelligence.ts` | Weekly report schema fill; proof panel; note titles |
| `server/routes.ts` | Express routes |
| `client/src/pages/think.tsx` | Think |
| `client/src/pages/frameworks.tsx` | Goals |
| `client/src/pages/standup.tsx` | Standup |
| `client/src/pages/dashboard.tsx` | Voice notes |
| `client/src/pages/projects.tsx` | Projects |
| `client/src/pages/intelligence.tsx` | Intelligence |
| `client/src/components/brand-mark.tsx` | ApexForm Life lockup → apexformlife.com |

Tests live next to the module they prove: `shared/*.test.ts`. Run `npm test`.

## What must not leak into a prompt

If a rule is structural (tier, destination, lint, capacity stop), it belongs in `shared/` with a test — not in a longer instruction string. Instruction strings only fill canvas fields after the gate has already run.

## Data

- **Fixture:** `RESURFACE_FIXTURE=overflow` or `healthy`. No Notion, no model key. Deterministic samples.
- **Live Notion:** `NOTION_API_KEY` + database IDs. See [setup.md](setup.md).
- **Interpretation fill:** optional `OPENAI_API_KEY` when fixture is unset. Think/Goals still **normalize** through `shared/` after the JSON returns.

Nothing is stored on the app server as a database. Notion is the system of record when connected. The filesystem is ephemeral on typical PaaS hosts.

## HTTP

The server binds `0.0.0.0:$PORT` (default 5000 in development). API and client are the same origin. Hash routing is client-side (`wouter` + `useHashLocation`).
