# Kelvor Outreach — Agent Instructions

## Quick Start
```bash
cp .env.example .env
# Edit .env with LLM_API_KEY, RESEND_API_KEY, FROM_EMAIL
npm install
npm run dev:backend   # Terminal 1: API on :3001
npm run dev:frontend  # Terminal 2: UI on :5173
```

## Project Structure
```
backend/
  src/
    config.ts           # Env + paths
    db/index.ts         # SQLite schema + connection
    db/repositories/    # campaigns.ts, prospects.ts
    services/
      rag/              # chunker.ts, bm25.ts, embeddings.ts, retriever.ts, types.ts
      llm/              # LLMProvider.ts, OpenAIProvider.ts (fetch for OpenRouter)
      email/            # EmailProvider.ts, ResendProvider.ts
      outreach/         # importService.ts, generation.ts, sendService.ts
    routes/             # health.ts, campaigns.ts, prospects.ts, knowledge.ts
    server.ts           # Express + CORS
frontend/
  src/
    api/client.ts       # Typed fetch wrapper
    components/         # Header, CampaignCard, StatsBar, ImportPanel, GeneratePanel, SendPanel, ProspectCard, ui.tsx
    pages/              # Dashboard.tsx, Campaign.tsx
    types.ts
```

## Key Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Both servers via concurrently |
| `npm run dev:backend` | Backend only (tsx watch) |
| `npm run dev:frontend` | Frontend only (vite) |
| `npm run build` | Production build |
| `npm run typecheck` | TS strict check |

## Environment Variables
```
LLM_API_KEY          # OpenRouter/OpenAI key
LLM_MODEL            # e.g. openrouter/free, gpt-4o-mini
LLM_BASE_URL         # https://openrouter.ai/api/v1 (or omit for OpenAI)
RAG_PROVIDER         # bm25 (default) | embeddings
RESEND_API_KEY       # For real sends
FROM_EMAIL           # Verified domain in Resend
SEND_DELAY_MS        # Delay between sends (default 5000)
```

## Provider Interfaces (swappable)
- `LLMProvider` → `OpenAIProvider` (OpenAI SDK for official, fetch for OpenRouter)
- `EmailProvider` → `ResendProvider` / `NoopEmailProvider`
- `Retriever` → `Bm25Retriever` / `EmbeddingRetriever`

## Knowledge Base
Drop `.md` files in `knowledge/`. Auto-indexed on backend start. Reload via `POST /api/knowledge/reload`.

The KB is grounded in Kelvor's real work only: Totemood (totemood.com), CafeMitra (café ERP), Medio (meetup planner), BoostAI (AI edtech, in development, concept at boostai.study), and kelvor.co.in itself. No invented clients or metrics — the generation prompt forbids claims not present in these files. Keep it that way when editing.

## API Endpoints
- `GET /api/health` — config status
- `GET/POST /api/campaigns` — list/create
- `GET /api/campaigns/:id` — detail + prospects + progress
- `POST /api/campaigns/:id/prospects/import` — CSV file or text paste
- `POST /api/campaigns/:id/prospects` — single add
- `POST /api/campaigns/:id/generate` — async, polls via GET campaign. `runGeneration` is async — the route MUST `await` it or the response serializes the Promise as `{}` and the UI instantly fakes completion
- `PATCH /api/prospects/:id` — edit fields, approve/reject (`approved` accepts boolean, `1`, or `"1"`; frontend sends boolean)
- `POST /api/prospects/:id/resend` — synchronous re-send of one prospect (requires approved + generated content; used by the per-prospect "Retry send" button)
- `POST /api/campaigns/:id/send` — requires `{confirm:true}`; add `retryFailed:true` to re-send only previously failed prospects ("Retry Failed" button)

## Frontend Data Flow
- Routing is hash-based (`App.tsx`): dashboard at `#/`, campaign at `#/campaign/:id` — reload, back/forward, and refresh stay on the same page. Use `navigate()` for all route changes.
- `Campaign.tsx` loads campaign detail once per navigation; each panel owns its own polling:
  - `GeneratePanel` polls `GET /api/campaigns/:id` every 1.5s while generating. On completion it resets its button, shows a summary, and calls `onComplete` → full campaign reload so generated subjects/bodies appear under each prospect without a manual page refresh.
  - `SendPanel` follows the same pattern and calls `onSent` → reload when the send run finishes.
- Generation/send run in the background on the backend; progress lives in in-memory state maps exposed as `generationState`/`sendState` on `GET /api/campaigns/:id`. When adding new async panels, follow the same poll-then-onComplete pattern.
- Panels only trust a progress state whose `running` field is a real boolean — a malformed/empty state object must never trigger the completion path.

## Deliverability (avoiding Gmail Promotions)
- Emails are sent **text-only** (`ResendProvider` skips HTML unless a caller passes it) — HTML formatting is a strong Promotions-tab signal.
- `SYSTEM_PROMPT` in `services/outreach/generation.ts` enforces personal 1:1 style: no links, emojis, bullet lists, sales vocabulary, or salesy subject lines. Keep those rules when editing the prompt — they exist for inbox placement, not just tone.
- Non-code levers that matter more than anything in this repo: verified domain with SPF/DKIM/DMARC (via resend.com/domains), a real mailbox behind FROM_EMAIL, low-volume warm-up, and getting replies (a reply almost always moves future emails to Primary).

## Common Issues
- **OpenRouter 401** → Use fetch provider (auto-detected via LLM_BASE_URL)
- **Resend 403 "domain is not verified"** → The FROM_EMAIL domain must be verified at resend.com/domains. For testing set `FROM_EMAIL=onboarding@resend.dev` — Resend's test sender can only deliver to your own Resend account's email address, not arbitrary prospects. The backend rewrites this error into a readable hint (see `ResendProvider`).
- **Resend send fails** → Verify domain at resend.com/domains, or use test email
- **Port 3001 in use** → `pkill -f "tsx watch"` then restart
- **Generation stuck** → Invalid LLM_API_KEY; check backend logs
- **"Generated undefined email(s)" summary / UI finishes instantly** → A progress state with missing fields reached the panel; caused by an un-`await`ed async service in a route (see generate endpoint note). Panels now ignore states without a boolean `running`.
- **Reload kicks back to homepage** → Fixed via hash routing in `App.tsx`; if adding pages, extend `parseHash`/`hashFor` so every view has a URL
- **Approve button appears to do nothing** → Backend normalizes `approved` to `true`/`1`/`"1"` (`routes/prospects.ts`); keep that normalization when refactoring
- **Approve button missing on a prospect** → By design: Approve/Reject only renders once the prospect has generated subject AND body
- **Prospect list stale after generating** → UI refreshes on completion via `GeneratePanel.onComplete`; generation progress is in-memory only and resets on backend restart