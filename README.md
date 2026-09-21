# Kelvor Outreach

Internal AI-powered email outreach tool for Kelvor. Built to run locally with a single command.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your keys
npm run dev
```

This starts:
- Backend API on http://localhost:3001
- Frontend on http://localhost:5173 (proxies `/api` to backend)

## Prerequisites

- Node.js 20+
- npm 10+

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_API_KEY` | Yes | OpenAI API key (or compatible provider) |
| `LLM_MODEL` | No | Model to use (default: `gpt-4o-mini`) |
| `LLM_BASE_URL` | No | Override base URL for OpenAI-compatible endpoints (e.g. Ollama, OpenRouter) |
| `RAG_PROVIDER` | No | `bm25` (default, free/local) or `embeddings` (uses OpenAI embeddings) |
| `EMBEDDING_MODEL` | No | Embedding model if using embeddings provider (default: `text-embedding-3-small`) |
| `RESEND_API_KEY` | For sending | Resend API key |
| `FROM_EMAIL` | For sending | Verified sender email in Resend |
| `FROM_NAME` | No | Sender name (default: `Kelvor`) |
| `PORT` | No | Backend port (default: `3001`) |
| `SEND_DELAY_MS` | No | Delay between sends (default: `5000` ms) |

## Knowledge Base

Add Markdown files to the `knowledge/` directory. The tool indexes them on startup.

Default files (included):
- `company.md` — Company overview
- `services.md` — Services offered
- `portfolio.md` — Portfolio highlights
- `case-studies.md` — Detailed case studies
- `technologies.md` — Tech stack & capabilities
- `previous-projects.md` — Project summary for retrieval
- `email-style.md` — Email writing guidelines (critical for generation quality)

**To add your own:** Drop `.md` files in `knowledge/` and restart the backend, or click "Reload Knowledge" in the UI.

The RAG system chunks documents and retrieves relevant context for each prospect. Two providers:
- **BM25 (default)** — Keyword-based, completely local, no API costs. Good for small KBs.
- **Embeddings** — Semantic search via OpenAI embeddings. Set `RAG_PROVIDER=embeddings` and ensure `LLM_API_KEY` is set.

## LLM Configuration

The LLM integration uses the OpenAI SDK and works with any OpenAI-compatible API:
- **OpenAI** — Set `LLM_API_KEY` from platform.openai.com
- **OpenRouter** — Set `LLM_API_KEY` and `LLM_BASE_URL=https://openrouter.ai/api/v1`
- **Ollama (local)** — Run `ollama serve`, set `LLM_BASE_URL=http://localhost:11434/v1`, `LLM_API_KEY=ollama` (any non-empty string)
- **Azure OpenAI** — Set `LLM_BASE_URL` to your Azure endpoint

Model defaults to `gpt-4o-mini` (fast, cheap, capable). Override with `LLM_MODEL`.

## Email (Resend)

1. Create a Resend account at resend.com
2. Verify a domain or single sender email
3. Create an API key
4. Set `RESEND_API_KEY`, `FROM_EMAIL`, and optionally `FROM_NAME` in `.env`

Without these, the tool works for import/generate/review but sending will fail gracefully (logged to console).

## Usage Workflow

### 1. Create a Campaign
- Click "New campaign" on the dashboard
- Enter a name and **project description** (this is the primary context for generation)

### 2. Import Prospects
Three ways:
- **Paste text** — One per line: `name,email,company,project` or just emails
- **Upload CSV** — Columns: `name,email,company,project` (headers optional)
- **Add single** — Fill the form

Duplicates (same email in same campaign) are skipped automatically.

### 3. Generate Emails
- Click "Generate Emails" — processes all `pending` prospects
- Uses: prospect info + campaign description + retrieved knowledge + email style guide
- Progress shown in real-time
- Generated emails appear in the list with status `generated`

### 4. Review & Edit
- Click a prospect card to expand
- Edit recipient, subject, body, name, company, project
- Click **Save changes** to persist
- Click **Approve** to mark for sending (badge turns green)
- **Reject** removes approval

### 5. Send Approved Emails
- Click "Send Approved Emails"
- Confirm in the modal (shows count)
- Emails send sequentially with a configurable delay (default 5s)
- Progress tracked in real-time
- Results: `sent` / `failed` / `skipped` with error details
- Final summary shown on completion

### 6. Revisit Campaigns
- Dashboard shows all campaigns with counts
- Click "Open" to resume any campaign
- Previously sent/failed emails are preserved

## Project Structure

```
kelvor-outreach/
├── backend/
│   ├── src/
│   │   ├── routes/           # Express routes
│   │   ├── services/
│   │   │   ├── rag/          # Chunking, BM25, embeddings, retriever interface
│   │   │   ├── llm/          # LLMProvider interface + OpenAI implementation
│   │   │   ├── email/        # EmailProvider interface + Resend + Noop
│   │   │   └── outreach/     # Import, generation, sending services
│   │   ├── db/               # SQLite schema, repositories
│   │   └── utils/
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI
│   │   ├── pages/            # Dashboard, Campaign
│   │   └── api/              # Typed API client
│   └── ...
├── knowledge/                # Markdown files for RAG
├── data/                     # SQLite DB (gitignored)
├── .env.example
└── README.md
```

## Architecture Principles

- **Provider interfaces** — LLM, Email, and Retriever are behind interfaces. Swap implementations without rewriting app logic.
- **Local-first** — SQLite, BM25, no external vector DB required.
- **Simple deployment** — Single `npm run dev` runs everything. No Docker, no separate workers, no queues.
- **Type-safe** — TypeScript throughout (backend ESM, frontend Vite).

## Database Schema

### `campaigns`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| name | TEXT | Campaign name |
| project_description | TEXT | Primary generation context |
| status | TEXT | `draft`, `generating`, `ready`, `sending`, `completed`, `partial` |
| created_at | TEXT | ISO datetime |

### `prospects`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| campaign_id | INTEGER FK | References campaigns(id) |
| name | TEXT | Prospect name |
| email | TEXT | Unique per campaign |
| company | TEXT | Company name |
| project_description | TEXT | Per-prospect context (optional) |
| status | TEXT | `pending`, `generated`, `approved`, `sent`, `failed` |
| generated_subject | TEXT | LLM-generated |
| generated_body | TEXT | LLM-generated |
| approved | INTEGER | 0/1 |
| sent_at | TEXT | ISO datetime when sent |
| error | TEXT | Error message if failed |
| created_at | TEXT | ISO datetime |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend & backend |
| `npm run dev:backend` | Backend only |
| `npm run dev:frontend` | Frontend only |
| `npm run build` | Build both workspaces |
| `npm run typecheck` | TypeScript check both |
| `npm run start` | Run built backend (after `npm run build`) |

## Troubleshooting

**"LLM_API_KEY is not set"**
- Add your key to `.env` and restart backend

**"RESEND_API_KEY not configured"**
- Sending will log to console instead. Add key to enable real sends.

**Generation fails / empty emails**
- Check backend logs for LLM errors
- Ensure knowledge files exist in `knowledge/`
- Try `RAG_PROVIDER=bm25` (default) if embeddings fail

**CSV import errors**
- Ensure CSV has an `email` column
- Check encoding (UTF-8 recommended)

**Port already in use**
- Change `PORT` in `.env` or kill existing process

## License

Internal tool — not for external distribution.