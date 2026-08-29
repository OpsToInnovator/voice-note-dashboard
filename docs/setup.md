# Setup

## One-command try (no accounts)

```bash
git clone https://github.com/OpsToInnovator/voice-note-dashboard.git
cd voice-note-dashboard
npm install
RESURFACE_FIXTURE=overflow PORT=5000 npm run dev
```

Open [http://127.0.0.1:5000/#/think](http://127.0.0.1:5000/#/think)

| `RESURFACE_FIXTURE` | What you see |
| --- | --- |
| `overflow` | Inbox above the cap of 15 — graveyard behaviour |
| `healthy` | Calm standup; same Think/Goals samples |

Node **22.x**. `npm test` runs the gate suite. `npm run check` is `tsc` (one known regex-flag diagnostic in `server/notion.ts` on default `target` — tests are the contract).

## Environment

Copy [`.env.example`](../.env.example) to `.env`. Never commit `.env`.

| Variable | Required when |
| --- | --- |
| `RESURFACE_FIXTURE` | Exploring without Notion |
| `PORT` | Always on PaaS; optional locally (5000) |
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

Daily resurface (example 07:00 Australia/Perth): `npm run resurface` in development, `npm run resurface:prod` after build.

Community hosts: keep the ApexForm Life credit and a link to [apexformlife.com](https://apexformlife.com). Do not present a self-host as AFOS™ or Paradigm. [TRADEMARKS.md](../TRADEMARKS.md).
