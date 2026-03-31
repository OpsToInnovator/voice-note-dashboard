# Voice Note Dashboard

A live dashboard that visualises your Notion voice notes with charts, KPI cards, task breakdowns, and insight analysis. Connects directly to your Notion workspace via the official API.

## Setup

### 1. Create a Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Name it "Voice Note Dashboard"
4. Select your workspace
5. Copy the **Internal Integration Secret** (starts with `ntn_`)

### 2. Share Your Databases

In Notion, open each database and share it with your integration:

1. Open your **Notes** database
2. Click **...** → **Connections** → find "Voice Note Dashboard" → **Confirm**
3. Repeat for your **Tasks** database

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and paste your integration token:

```
NOTION_API_KEY=ntn_your_token_here
```

If your database IDs differ from the defaults, add those too (you can find them in the database URL).

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

## Production Deployment

### Build

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

### Deploy to Railway (recommended)

1. Push to a GitHub repo
2. Connect the repo to [Railway](https://railway.app)
3. Add `NOTION_API_KEY` as an environment variable
4. Railway auto-detects Node.js and deploys

### Deploy to Vercel

Since this has a backend, use Vercel's serverless functions or deploy as a standalone Node.js app.

### Deploy to any VPS

```bash
git clone <your-repo>
cd voice-notes-app
npm install
npm run build
NOTION_API_KEY=ntn_xxx NODE_ENV=production node dist/index.cjs
```

Use PM2 or systemd to keep it running:

```bash
npm install -g pm2
pm2 start dist/index.cjs --name voice-dashboard
```

## Architecture

- **Backend**: Express.js server that queries Notion API
- **Frontend**: React + Recharts + Tailwind CSS + shadcn/ui
- **Data**: All data lives in your Notion workspace — nothing is stored locally
- **Caching**: 60-second in-memory cache to avoid hitting Notion rate limits

## Notion Database Requirements

The dashboard expects two databases:

### Notes Database
- Must have a **Type** property (Select) with a "Voice Note" option
- Voice notes should have content in either:
  - **Thomas Frank format**: `# Summary`, `# Main Points`, `# Action Items`, `# Cleaned Transcription Text`
  - **Structured format**: `## Summary`, `## Key Threads`, `## Notable Insights`, etc.
- Optional: **Tasks** relation property linking to a Tasks database

### Tasks Database
- **Name** (Title)
- **Status** (Status): To Do, Doing, Done
- **P/I** (Select): Process, Immersive
- **Location** (Select): Home, Office, Errand
- **Priority** (Status): Low, Medium, High
- **Completed** (Date)
- **Notes** (Relation to Notes database)

These match the [Ultimate Brain](https://thomasjfrank.com/brain/) template by Thomas Frank.
