# Setup

Noticing Lens runs as **two Railway services** in the **same project**. They share this repo and [railway.json](../railway.json). They do **not** share variables.

| | **Operator** — “my version” | **Demo** — other people |
| --- | --- | --- |
| Railway service | Existing **Noticing Lens** service (keep it) | New service named **`noticing-lens-demo`** |
| Who | Jake / ApexForm Life operator | Anyone you send the URL |
| Data | Live **Notion Apex Hub** (Tasks Inbox, Projects, Goals) | Fixture only. No real inbox |
| Fixture | **`RESURFACE_FIXTURE` unset** | **`RESURFACE_FIXTURE=overflow` only** |
| Notion / OpenAI | Set on this service | **All unset** |
| Bookmark | `/#/standup` (Apex Hub inbox) | `/#/think` (forty-second door) |

Neither host is **AFOS**. Never set Lens variables on [app.apexformlife.com](https://app.apexformlife.com).

The app binds `0.0.0.0:$PORT`. Railway sets `PORT`. [railway.json](../railway.json) `startCommand` stays `node dist/index.cjs`. Do **not** bake the fixture into the start command.

There are **no** Apex Hub database IDs in this repository. Env only.

---

## Operator variables (existing Lens service)

Apex Hub. Paste IDs from Notion into Railway **Variables** on this service only.

| Variable | Set? | Value |
| --- | --- | --- |
| `NOTION_API_KEY` | Required | Integration token (`ntn_…`) |
| `NOTION_TASKS_DB_ID` | Required | Tasks / Inbox database — 32 hex from the URL |
| `NOTION_PROJECTS_DB_ID` | Required | Projects database — 32 hex |
| `NOTION_GOALS_DB_ID` | Optional | Goals database — Intelligence and inbox audit skip goals if unset |
| `NOTION_NOTES_DB_ID` | Optional | Notes / Voice Notes database |
| View / data-source IDs | Optional | Inbox or other views — see [`.env.example`](../.env.example) |
| `OPENAI_API_KEY` | Optional | Think / Goals / Intelligence canvas fill |
| `RESURFACE_FIXTURE` | **Unset** | If this is set, you are no longer on Apex Hub |
| `PORT` | Leave Railway’s | Do not override |
| `PUBLIC_APP_URL` | Optional | This service’s public origin (OG tags) |
| `INBOX_AUDIT_JSON` | Optional | Print JSON after `npm run inbox-audit` |

If this service already has Notion keys, **leave them**. Do not add `RESURFACE_FIXTURE` here.

Weekly assign / remove / recalibrate of Apex Hub Inbox is a separate operator pass. It is not required to stand these two hosts up.

---

## Demo variables (`noticing-lens-demo`)

Public Think door. Forty seconds. No clone. No Notion.

| Variable | Set? | Value |
| --- | --- | --- |
| `RESURFACE_FIXTURE` | **Only this** | `overflow` |
| `NOTION_API_KEY` | Unset | — |
| `NOTION_*` (every ID) | Unset | — |
| `OPENAI_API_KEY` | Unset | — |
| `PORT` | Leave Railway’s | Do not override |
| `PUBLIC_APP_URL` | Optional | This demo’s origin (OG tags). Lockup still goes to [apexformlife.com](https://apexformlife.com) |

Optional DNS later: CNAME `lens.apexformlife.com` → this demo service (Railway will also give a `TXT` record — both are required).

---

## Railway dashboard — do this today

This environment cannot set Railway variables for you. Do it in [railway.app](https://railway.app).

### 1. Keep the existing Lens service as operator

1. Open the Railway **project** that already deploys this GitHub repo.
2. Click the existing **Noticing Lens** service (whatever it is named today).
3. Open **Variables**.
4. If you already see `NOTION_API_KEY` and database IDs — stop. That is the operator. **Do not** add `RESURFACE_FIXTURE`.
5. If a key is missing, add it from the tables above. Share each Apex Hub database with the Notion integration first (below).
6. Leave **Settings → Deploy → Custom Start Command** alone (or confirm it is `node dist/index.cjs` / inherited from `railway.json`).

### 2. New service `noticing-lens-demo`

1. Stay in the **same project**. Do not create a new Railway project.
2. Click **New** (top right) → **GitHub Repo**.
3. Choose **`OpsToInnovator/voice-note-dashboard`**. Same repo, same `railway.json`. Branch: `main` (or this branch until it merges).
4. After the service appears, open **Settings**. Rename it **`noticing-lens-demo`**.
5. Open **Variables**. Add **one** variable:
   - Name: `RESURFACE_FIXTURE`
   - Value: `overflow`
6. Do **not** add any `NOTION_*` or `OPENAI_API_KEY`. If Railway copied variables from the other service, delete them here.
7. Open **Settings → Networking → Public Networking** → **Generate Domain**.
8. Wait for the deploy to go green. Copy the `*.up.railway.app` URL.

This demo is **not** live until you generate that domain and the deploy succeeds. Share `https://<that-host>/#/think`.

Empty hash on current `main` also lands on Think (PR #3). `/#/think` is the URL to send so older deploys still open the door.

### 3. Find Apex Hub database IDs (operator only)

IDs are **32 hex characters** in the Notion URL. They are not in this repo. Paste them only into the **operator** service Variables.

1. Open **Notion → Apex Hub**.
2. Open the **Tasks** database. If Inbox is an inline view, open the database as a page (click the database title, or `⋯` → **Open as page**).
3. Copy the browser URL. It looks like:

   `https://www.notion.so/YourWorkspace/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa?v=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`

4. The **database ID** is the 32 hex characters **before** `?v=`. You can also copy it with dashes (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) — both work.
5. `?v=` is a **view ID** (optional). Use it only if you want a specific Inbox view (`NOTION_TASKS_ACTIVE_VIEW_ID` or the matching view variable in [`.env.example`](../.env.example)).
6. Repeat for **Projects** → `NOTION_PROJECTS_DB_ID`.
7. Repeat for **Goals** → `NOTION_GOALS_DB_ID` (optional).
8. Create or reuse an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations). On each database: **Share** → invite that integration. Paste the token into `NOTION_API_KEY` on the **operator** service only.

### 4. Verify

**Demo** (`noticing-lens-demo` public URL):

1. Open `/#/think`.
2. Tap **`$1M this year`**.
3. Tap **Decide what happens next**.
4. Destination is **DECIDE** (capacity stop — change the model, not more volume).
5. Standup / Voice Notes must **not** show your real Apex Hub inbox. Fixture overflow only.

**Operator** (existing Lens URL):

1. Bookmark `/#/standup`.
2. Standup / Voice Notes show **Apex Hub** tasks (Inbox / today / stale).
3. Projects and Goals read the live databases you pasted.
4. Confirm **Variables** still has **no** `RESURFACE_FIXTURE`.

---

## Local try (contributors)

```bash
git clone https://github.com/OpsToInnovator/voice-note-dashboard.git
cd voice-note-dashboard
npm install
RESURFACE_FIXTURE=overflow PORT=5000 npm run dev
```

Same as the demo: empty URL lands on Think (`/#/think`). Voice notes stay at `/#/`.

| `RESURFACE_FIXTURE` | What you see |
| --- | --- |
| `overflow` | Inbox above the cap of 15 — graveyard behaviour |
| `healthy` | Calm standup; same Think/Goals samples |
| unset + Notion IDs | Live workspace (operator) |

Node **22.x**. `npm test` runs the gate suite. `npm run check` is `tsc` (one known regex-flag diagnostic in `server/notion.ts` on default `target` — tests are the contract).

---

## Environment

Copy [`.env.example`](../.env.example) to `.env`. Never commit `.env`.

[`.env.example`](../.env.example) is labelled **operator vs demo**. Use one set per process. Do not run both on the same host. Weekly inbox audit uses the **operator** IDs only.

| Variable | Operator | Demo |
| --- | --- | --- |
| `RESURFACE_FIXTURE` | Unset | `overflow` |
| `NOTION_API_KEY` + task/project IDs | Required | Unset |
| `NOTION_GOALS_DB_ID` / notes / views | Optional | Unset |
| `OPENAI_API_KEY` | Optional | Unset |
| `PORT` | PaaS sets this; locally 5000 | Same |
| `PUBLIC_APP_URL` | Optional (this host) | Optional (this host) |

---

## Notion layout

Compatible with [Ultimate Brain](https://thomasjfrank.com/brain/)-style properties:

- **Notes:** Title, Type (include “Voice Note”), Archived, relations to Tasks / Projects.
- **Tasks:** Name, Status (To Do / Doing / Done), P/I (Process / Immersive), Priority, Due, Completed, relations to Notes / Projects.
- **Projects:** Name, Status, Archived, Target Deadline, relations.

Then locally:

```bash
cp .env.example .env
# fill operator IDs — leave RESURFACE_FIXTURE commented
npm run dev
```

---

## Production

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

Daily resurface (example 07:00 Australia/Perth): `npm run resurface` in development, `npm run resurface:prod` after build. Use on the **operator** if you run the job. Not used on the fixture demo.

Weekly inbox audit (example Sunday 07:00 Australia/Perth = Saturday 23:00 UTC, `0 23 * * 6`): `npm run inbox-audit` in development, `npm run inbox-audit:prod` after build. The job only prints the list. Assign / remove / recalibrate write to Notion only after an explicit confirm on Standup or `POST /api/inbox-audit/apply`. Remove archives the page; it does not hard-delete. Put your own Tasks / Projects / Goals database IDs in `.env` — none are stored in this repo.

Community hosts: keep the ApexForm Life credit and a link to [apexformlife.com](https://apexformlife.com). Do not present a self-host as AFOS™ or Paradigm. [TRADEMARKS.md](../TRADEMARKS.md).
