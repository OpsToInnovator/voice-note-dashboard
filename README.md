# Noticing Lens

**An [ApexForm Life](https://apexformlife.com) project.** Apache-2.0.

[![License](https://img.shields.io/badge/license-Apache%202.0-8A7CFF.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22.x-4FE3FF.svg)](package.json)

The **full thought operating system** — not an SDK extract, not a notes app, not a conversation. Capture a thought. The system assigns a destination: **DELETE · STORE · EXPLORE · DECIDE · EXECUTE**.

> The system doesn’t tell you what to think. It determines what should happen next to what you’re thinking.

Trust: *I trust the system to govern the process by which I decide — not to decide for me.*

<p align="center">
  <img src="docs/images/think.png" alt="Think surface: capture, destination, ApexForm Life lockup" width="920" />
</p>

**Code owns the gates.** A model may fill interpretation and canvas prose. The human retains judgment. Goal Coach maths that **stop** become **DECIDE** (change the model), never more volume.

What people **buy** stays on [apexformlife.com](https://apexformlife.com):

| Product | Who |
| --- | --- |
| [AFOS™](https://apexformlife.com) | Organisations — decisions, evidence, memory |
| [Paradigm](https://apexformlife.com) | Individuals — longitudinal behavioural intelligence (iOS) |
| [Consulting & coaching](https://apexformlife.com) | Teams and leaders |

Credit ApexForm Life when you fork, write, or demo. [TRADEMARKS.md](TRADEMARKS.md).

---

## Try it

No Notion. No model key.

```bash
git clone https://github.com/OpsToInnovator/voice-note-dashboard.git
cd voice-note-dashboard
npm install
RESURFACE_FIXTURE=overflow PORT=5000 npm run dev
```

Open **[http://127.0.0.1:5000/#/think](http://127.0.0.1:5000/#/think)**

| Surface | Route | Role |
| --- | --- | --- |
| Think | `/#/think` | Capture → destination |
| Goals | `/#/goals` | Frameworks; every plan ends in a verified next action |
| Standup | `/#/standup` | Inbox / today / stale, cap 15 |
| Voice notes | `/#/` | Notion captures |
| Projects | `/#/projects` | Health |
| Intelligence | `/#/intelligence` | Weekly patterns |

Sample chips on Think: pricing confusion, invoice send, outreach avoidance, `$1M income` (capacity stop → DECIDE).

```bash
npm test
```

---

## Documentation

| Guide | Contents |
| --- | --- |
| **[Using the app](docs/using.md)** | Every surface, as an operator |
| **[Destinations](docs/destinations.md)** | Five destinations, three tiers, next-action contract |
| **[Architecture](docs/architecture.md)** | What code owns vs what a model may fill |
| **[Setup](docs/setup.md)** | Fixture, Notion, production, resurface job |
| **[Contributing](CONTRIBUTING.md)** | Ground rules for PRs |
| **[Security](SECURITY.md)** | How to report a vulnerability |

---

## License

**Code:** [Apache License 2.0](LICENSE). Use, modify, ship — including commercially — with attribution and the patent grant.

**Names and marks** (ApexForm Life, AFOS™, Paradigm, Noticing Lens, rising-line) stay with ApexForm Life. Preserve [NOTICE](NOTICE). Prefer: *Noticing Lens is the open thought operating system from ApexForm Life.*
