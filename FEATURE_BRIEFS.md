# FEATURE_BRIEFS.md
> Read this at the start of every session. Act on it without being asked.

---

## What This Is

The **NS Feature Briefs** database is the living record of every feature across all Notion State projects. You have Notion MCP connected. Use it to keep this database accurate after every session.

Three-layer documentation system:
- **ENG Registry** — one row per project (stack, env vars, URLs, local path)
- **Eng Docs** — PRDs and narrative documentation per project  
- **Feature Briefs** — one row per feature, what's actually built ← you maintain this

**Feature Briefs database:** `https://www.notion.so/e326e4e4360a4fc8a0912348458a40ec`  
**Data source ID:** `fc421516-4eb1-4992-b062-8db0101d0e15`

---

## Project Registry

| Project | ENG Registry URL | Local Directory | Live URL |
|---|---|---|---|
| Discovery Packet Builder | https://www.notion.so/319d3984d5b881b39db8f0cc1ee43fa5 | ~/discovery-packet-builder | https://discovery-packet-3eg3a57d4-bryans-projects-62fe3c4a.vercel.app |
| Discovery Packet App | https://www.notion.so/319d3984d5b881f3a954f6aeb496c5a5 | ~/Downloads/hac-pathways/discovery-packet-app | https://discovery-packet-app.vercel.app |
| DocuSign-Notion Sync | https://www.notion.so/300d3984d5b881ec9739e5454f3878a3 | ~/Documents/docusign-notion-sync | https://docusign-notion-sync.vercel.app |
| Fireflies-Notion Sync | https://www.notion.so/300d3984d5b881dcb4c2d110129d0936 | ~/fireflies-notion-sync | https://fireflies-notion-sync.vercel.app |
| Luma-Notion Sync | https://www.notion.so/30bd3984d5b8810f9804d7871b5fdeab | ~/luma-notion-sync | — |
| Notion Workspace Pulse | https://www.notion.so/307d3984d5b881109304ce43f9d974cd | ~/workspace-pulse | — |
| NS Financial Model | https://www.notion.so/300d3984d5b881878078d63594337787 | ~/finmodel | https://finmodel-swart.vercel.app |
| Fight2Breathe Website | https://www.notion.so/300d3984d5b881798126fc843934ff04 | ~/fight2breathe | https://fight2breathewebsite.vercel.app |
| Sentinel | https://www.notion.so/300d3984d5b8815ebf9bf03b4413048a | ~/atnewsletter | https://atnewsletter.vercel.app |
| TMB Planner | https://www.notion.so/300d3984d5b881469b60cba4b93cec1a | ~/Desktop/tmb-planner | https://tmb-planner.vercel.app |
| Bank P&L Analyzer | https://www.notion.so/300d3984d5b88144ace8f40001db9e54 | TBD | — |

---

## Your Rules

### Rule 1 — Check before you write
Before creating or updating any Feature Brief, query the database first to avoid duplicates:
```sql
SELECT url, "Feature Name", "Status" 
FROM "collection://fc421516-4eb1-4992-b062-8db0101d0e15"
WHERE "Project" = '[current project name]'
```

### Rule 2 — Status must reflect the actual code
Look at what's in the codebase — not the PRD. Routes, components, endpoints tell you what's real.

| Status | Meaning |
|---|---|
| Shipped | Code is live and functional |
| In Progress | Actively being built this session |
| Backlog | Planned but not started |
| Deprecated | Removed or replaced |

### Rule 3 — Always link relations
Every Feature Brief must relate to:
- **ENG Registry** → this project's registry row URL
- **Eng Docs** → this project's PRD page URL(s)

Use the Project Registry table above to get the correct ENG Registry URL per project.

### Rule 4 — Change Log is append-only
Never overwrite. Always append:
```
YYYY-MM-DD — [what changed and why]
```
For cascading changes from a dependency:
```
YYYY-MM-DD — [CASCADE from Feature X] [what changed and impact]
```
When unsure if a cascade is needed:
```
YYYY-MM-DD — [REVIEW NEEDED] [Feature X] changed. Potential impact: [description]
```

### Rule 5 — End-of-session sweep
Before closing every session:
1. Review what you built or changed
2. Create or update the relevant Feature Briefs
3. Check if any changes affect other features (cascade)
4. Update `Last Updated` on every brief you touched

---

## Feature Brief Schema

```
Feature Name    — clear, functional name
Status          — Backlog | In Progress | Shipped | Deprecated
Project         — which app (must match select options exactly)
ENG Registry    — relation → project's ENG Registry row
Eng Docs        — relation → project's PRD page(s)
Dependencies    — plain text: what this depends on and why
Last Updated    — today's date
Change Log      — append-only log
```

Required page body sections on every brief:
```
## What This Feature Does
## Why We Built This
## Current State
## Decisions & Constraints
```

---

## When to Create vs Update

**Create a new brief** when:
- A new feature, integration, or major UI section is built
- A new API endpoint or background job is added
- Something is deprecated and needs a record

**Update an existing brief** when:
- A feature's behavior changes
- Status changes (Backlog → In Progress → Shipped)
- A dependency is added or removed
- An open question gets resolved

**Skip** when:
- It's a bug fix with no behavior change
- It's a style/copy tweak
- It's internal refactoring with no user-facing impact

---

## When You're Unsure

> "Would someone need to know this exists to understand the system?"

If yes — write the brief.
