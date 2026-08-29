# Contributing

Thank you for helping expand **Noticing Lens**, the open thought operating system from [ApexForm Life](https://apexformlife.com). You are contributing to the public engine. Hosted products (AFOS™, Paradigm) and services stay ApexForm Life’s.

The product decides what happens to a thought once it appears. It is not a notes app, task manager, journal, or chatbot.

Trust line: *govern the process by which I decide — not decide for me.*

## Ground rules (code owns the gates)

- **Destinations** are DELETE, STORE, EXPLORE, DECIDE, EXECUTE. Not every thought becomes a project.
- **Tier 3** (money, legal, strategy, irreversible) is recommend-only. Never EXECUTE Tier 3.
- If goal maths **stop**, destination is **DECIDE** (“change the model”), not EXECUTE.
- Every plan ends in a next action another person could verify (verb + object, 5–60 minutes). “Write a plan” is avoidance.
- Prefer a lint, router, or test in `shared/` over a prompt tweak when the rule is structural.
- Do not dump whole canvases into Notion. One first action. Human confirms reconstructed meanings (A/B/C).

## How to run without anyone’s cloud

```bash
npm install
RESURFACE_FIXTURE=overflow PORT=5000 npm run dev
```

Open http://127.0.0.1:5000/#/think

Fixture mode does not need Notion or OpenAI. Use it for UI and engine work.

```bash
npm test
```

## Project map

| Path | What lives there |
| --- | --- |
| `shared/thoughtOs.ts` | Capture → destination, decision rights |
| `shared/goalCoach.ts` | Type, outcome lint, feasibility maths, named obstacles |
| `shared/frameworks.ts` | Seven canvases; every plan has a linted leaf |
| `shared/actionFrame.ts` | Thought → next action |
| `shared/resurface.ts` | Daily inbox / today / stale, cap 15 |
| `client/src` | React UI (hash routes) |
| `server` | Express, Notion, OpenAI adapters |

## Pull requests

1. Branch from `main` (or the current working branch on a fork).
2. Keep the change one idea. Tests for engine changes live next to the module (`*.test.ts`).
3. Do not commit `.env`, tokens, or personal Notion database IDs.
4. By opening a PR you license your contribution under Apache-2.0 (see LICENSE §5).

## License and brand

Code: [Apache License 2.0](LICENSE). Names and marks: [TRADEMARKS.md](TRADEMARKS.md).

Keep the preferred credit when you write about the work: *Noticing Lens is the open thought operating system from ApexForm Life.* Link [apexformlife.com](https://apexformlife.com). Do not strip house branding from this repository’s chrome to “genericise” a PR; that credit is intentional.
