# Setup

High-end visitors open one URL. They do not clone. The public door is a **fixture Railway service**: Think is the landing hash, `$1M` → **DECIDE**, lockup still goes to [apexformlife.com](https://apexformlife.com).

## Public fixture (Railway)

On the existing **Noticing Lens** Railway service that deploys this repo:

| Variable | Value |
| --- | --- |
| `RESURFACE_FIXTURE` | `overflow` |
| `PORT` | Railway-provided (do not override) |
| `NOTION_*` / `OPENAI_API_KEY` | **unset** |
| `PUBLIC_APP_URL` | Optional. This host’s origin for OG tags |

Do **not** bake fixture into `startCommand`. [railway.json](../railway.json) already builds and runs `node dist/index.cjs`.

Do **not** set these variables on [app.apexformlife.com](https://app.apexformlife.com) — that host is **AFOS**.

If the existing Lens service is still the live Notion operator deploy, add a **second** service in the same project (`noticing-lens-demo`) with only `RESURFACE_FIXTURE=overflow`. Share that URL. Optional DNS: CNAME `lens.apexformlife.com` → the demo service.

An empty path opens Think. The forty-second proof: tap **`$1M income`**, then **Decide what happens next**.

## Local try (contributors)

```bash
git clone https://github.com/OpsToInnovator/voice-note-dashboard.git
cd voice-note-dashboard
npm install
RESURFACE_FIXTURE=overflow PORT=5000 npm run dev
```

An empty URL lands on Think (`/#/think`). Voice notes stay at `/#/`.

| `RESURFACE_FIXTURE` | What you see |
| --- | --- |
| `overflow` | Inbox above the cap of 15 — graveyard behaviour |
| `healthy` | Calm standup; same Think/Goals samples |

Node **22.x**. `npm test` runs the gate suite. `npm run check` is `tsc` (one known regex-flag diagnostic in `server/notion.ts` on default `target` — tests are the contract).

## Environment

Copy [`.env.example`](../.env.example) to `.env`. Never commit `.env`.

| Variable | Required when |
| --- | --- |
| `RESURFACE_FIXTURE` | Exploring or hosting without Notion |
| `PORT` | Always on PaaS; optional locally (5000) |
| `PUBLIC_APP_URL` | Optional. Public origin of this host (OG tags). Lockup still goes to apexformlife.com |
| `NOTION_API_KEY` | Live workspace |
| `NOTION_NOTES_DB_ID` | Live notes / voice notes |
| `NOTION_TASKS_DB_ID` | Live tasks / standup / clarify |
| `NOTION_PROJECTS_DB_ID` | Live projects |
| `NOTION_GOALS_DB_ID` | Optional; Intelligence skips goals if unset |
| `OPENAI_API_KEY` | Optional; Think/Goals/Intelligence canvas fill when fixture is unset |
| View / data-source IDs | Optional CLI paths — see `.env.example` |

There are **no** ApexForm Life workspace IDs in source. Each fork brings its own.

## Notion layout

Compatible with [Ultimate Brain](https://thomasjfrank.com/brain/)-style properties:

- **Notes:** Title, Type (include “Voice Note”), Archived, relations to Tasks / Projects.
- **Tasks:** Name, Status (To Do / Doing / Done), P/I (Process / Immersive), Priority, Due, Completed, relations to Notes / Projects.
- **Projects:** Name, Status, Archived, Target Deadline, relations.

Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations). Share each database with it. IDs are the 32 hex characters in the database URL.

Then:

```bash
cp .env.example .env
# fill IDs
npm run dev
```

Omit `RESURFACE_FIXTURE` to hit live Notion.

## Production

Bind HTTP to `0.0.0.0:$PORT`. Do not rely on local disk.

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

Public demo: fixture only (see above). A Notion-connected operator deploy is a different service.

Daily resurface (example 07:00 Australia/Perth): `npm run resurface` in development, `npm run resurface:prod` after build. Not used on the fixture demo.

Community hosts: keep the ApexForm Life credit and a link to [apexformlife.com](https://apexformlife.com). Do not present a self-host as AFOS™ or Paradigm. [TRADEMARKS.md](../TRADEMARKS.md).
