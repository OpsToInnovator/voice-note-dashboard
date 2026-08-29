# Noticing Lens

**An [ApexForm Life](https://apexformlife.com) project.** Apache-2.0.

[![License](https://img.shields.io/badge/license-Apache%202.0-8A7CFF.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22.x-4FE3FF.svg)](package.json)

Noticing Lens is the **open thought operating system** from [ApexForm Life](https://apexformlife.com) — the **full app**, not a stripped SDK. Think, Goals, Standup, Notion, Goal Coach, and the chrome are in this repository, Apache-2.0, so operators can run it, fork it, and stress-test the gates. What stays closed is what people **buy**: AFOS™, Paradigm, and services.

> The system doesn’t tell you what to think. It determines what should happen next to what you’re thinking.

Trust: *I trust the system to govern the process by which I decide — not to decide for me.*

This is **not** a notes app, task manager, journal, or chatbot. Every captured thought gets a destination: **DELETE · STORE · EXPLORE · DECIDE · EXECUTE**.

**This is the full Noticing Lens app.** [ApexForm Life](https://apexformlife.com) sells and operates a different layer of the same discipline:

| Product | Who | Status |
| --- | --- | --- |
| [AFOS™](https://apexformlife.com) | Organisations — decisions, evidence, organisational memory | Commercial beta |
| [Paradigm](https://apexformlife.com) | Individuals — longitudinal behavioural intelligence | iOS, launch list |
| [Consulting & coaching](https://apexformlife.com) | Teams and leaders | Live |

If you write about, fork, or demo this app, name ApexForm Life and link [apexformlife.com](https://apexformlife.com). That credit is how the open work funds the products. See [TRADEMARKS.md](TRADEMARKS.md).

## Try the app in one command

No Notion, no OpenAI:

```bash
git clone https://github.com/OpsToInnovator/voice-note-dashboard.git
cd voice-note-dashboard
npm install
RESURFACE_FIXTURE=overflow PORT=5000 npm run dev
```

Open [http://127.0.0.1:5000/#/think](http://127.0.0.1:5000/#/think)

The chrome is ApexForm Life’s on purpose. Sample chips include pricing confusion, invoice send, outreach avoidance, and the `$1M income` Goal Coach case (capacity stop → DECIDE, not more outreach).

## Surfaces

| Route | Role |
| --- | --- |
| `/#/think` | Capture → interpretation → destination |
| `/#/goals` | Framework catalog; every plan ends in a verified next action |
| `/#/standup` | Daily resurface (inbox / today / stale, cap 15) |
| `/#/` | Voice notes from Notion |
| `/#/projects` | Project health |
| `/#/intelligence` | Patterns across work |

## How the engine is split

Code owns gates, routing, lint, and maths. Models fill interpretation and canvas text.

- `shared/thoughtOs.ts` — agency, substance, decision rights (Tier 1 execute / Tier 2 recommend / Tier 3 human)
- `shared/goalCoach.ts` — goal type, outcome lint, services/SaaS/product/investment maths, named if–then obstacles
- `shared/frameworks.ts` — seven frameworks; planning without a physical first action is rejected
- `shared/actionFrame.ts` — thought → next action
- `shared/resurface.ts` — daily resurface composition

```bash
npm test
```

## Why the full app is open

ApexForm Life’s commercial work (AFOS™, Paradigm, consulting) depends on trust in *how* a thought is routed — not on a louder chatbot. Publishing the whole personal app — screens, fixtures, tests — lets operators, researchers, and builders run it themselves, then buy the hosted products when they need organisation-scale memory (AFOS™) or longitudinal iOS (Paradigm).

Forks, papers, and talks should say **ApexForm Life**. Community copies should keep the preferred credit. Competing hosted products should pick their own product name and still link back. Details: [TRADEMARKS.md](TRADEMARKS.md).

## License and brand

**Code** is [Apache License 2.0](LICENSE): use, modify, and ship, including commercially, with attribution and the patent grant.

**Names and marks** stay with ApexForm Life. Credit is encouraged; impersonation of AFOS™, Paradigm, or the company is not. Preserve [NOTICE](NOTICE) when you redistribute.

Contributions are accepted under Apache-2.0. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Connect your own Notion (optional)

1. Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) and copy the token.
2. Share your Notes, Tasks, and Projects databases with that integration.
3. Copy environment and fill **your** IDs (from the database URL):

```bash
cp .env.example .env
```

```
NOTION_API_KEY=ntn_your_token
NOTION_NOTES_DB_ID=
NOTION_TASKS_DB_ID=
NOTION_PROJECTS_DB_ID=
OPENAI_API_KEY=          # optional; Think/Goals use fixtures when RESURFACE_FIXTURE is set
```

4. `npm run dev` (omit `RESURFACE_FIXTURE` to hit live Notion).

Notes database: Type includes “Voice Note”. Tasks: Name, Status, P/I, Priority, Due, relations to Notes/Projects. Compatible with [Ultimate Brain](https://thomasjfrank.com/brain/) layouts.

## Production

Bind HTTP to `0.0.0.0:$PORT`. The filesystem is ephemeral on typical PaaS hosts — do not rely on local writes.

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

Live Notion requires `NOTION_API_KEY` plus `NOTION_NOTES_DB_ID`, `NOTION_TASKS_DB_ID`, and `NOTION_PROJECTS_DB_ID`. There are no workspace IDs in the source — each fork (and each deploy) brings its own. Daily resurface: `npm run resurface` / `resurface:prod` (e.g. 7:00 Australia/Perth).

Community hosts: keep the ApexForm Life credit and a link to [apexformlife.com](https://apexformlife.com). Do not present a self-host as AFOS™ or Paradigm.

## Expand it

Good first expansions:

- New named obstacles or goal types in `shared/goalCoach.ts` (with tests)
- Another destination-family kit in `shared/thoughtOs.ts`
- A framework that still ends in a lint-clean first action
- Fixture coverage for a thought you keep mis-routing

Open an issue or a pull request. Make the process stricter, not the chatbot louder — and keep ApexForm Life on the work.
