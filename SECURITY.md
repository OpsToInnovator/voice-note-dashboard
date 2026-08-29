# Security

Please **do not** open a public issue for a vulnerability that could expose
someone’s Notion workspace, API keys, or personal captures.

## Report

Use [GitHub Security Advisories](https://github.com/OpsToInnovator/voice-note-dashboard/security/advisories/new)
on this repository.

Include:

- Affected version or commit
- What an attacker would need
- Impact (data read, data write, account)

## Scope

In scope: the Express server, Notion/OpenAI adapters, auth-adjacent env handling,
and anything that could leak `NOTION_API_KEY` or `OPENAI_API_KEY`.

Out of scope: social engineering, denial of service against third-party APIs,
and issues that only appear with a misconfigured `.env`.

## Safe defaults

- Never commit `.env`
- Run locally with `RESURFACE_FIXTURE=overflow` when you do not need live Notion
- Rotate any token that may have been pasted into a ticket or screenshot
