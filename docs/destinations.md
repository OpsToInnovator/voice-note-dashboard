# Destinations and tiers

Every captured thought is assigned exactly one destination. Not every thought becomes a project.

| Destination | When |
| --- | --- |
| **DELETE** | No meaningful value. Close the loop. |
| **STORE** | Useful knowledge; no current action. |
| **EXPLORE** | Insufficient understanding. Investigate before deciding. |
| **DECIDE** | Enough information exists; a choice is required — the **human** decides. Also used when Goal Coach maths **stop** (change the model). |
| **EXECUTE** | The decision is already made. The action sequence begins. Never used for Tier 3. |

## Decision tiers

The system may carry work out only when the consequence is small and reversible.

| Tier | Label in the UI | Who acts |
| --- | --- | --- |
| 1 | System may execute | Low-risk, reversible mechanics |
| 2 | System recommends | Moderate consequence; human confirms |
| 3 | Human decides | Money, legal, relational, strategy, irreversible |

Code in `shared/thoughtOs.ts` classifies family, agency, substance, and tier from the text. A model may fill interpretation and reconstructed meanings. It does not override a Tier 3 gate.

## Goal Coach stop → DECIDE

`shared/goalCoach.ts` runs feasibility maths (services, SaaS, product, investment, generic). If the maths **stop**, destination is **DECIDE**, not EXECUTE. Example: a `$1M` services income in 12 months that fails delivery capacity. The next action is to change the model, not to send more outreach.

## Next-action contract

Wherever a plan or EXECUTE path exists, the leaf is:

- a **verb + object**
- completable in **5–60 minutes** (action frame often 10–30)
- verifiable by another person
- not “write a plan”, “research more”, or “think about it”

Implemented in `shared/actionFrame.ts` (`lintActionName`) and applied to every framework in `shared/frameworks.ts`.
