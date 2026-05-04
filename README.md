# Pactix — The Agentic Negotiator for Freelancers

> A council of AI agents that reads your client's email, argues about what to charge, negotiates in your voice, and sends the contract and Stripe invoice. Autonomously.

Submitted to the Baidu MeDo Global Hackathon (Business & E-commerce track).

## What It Does

When a client emails a freelancer, Pactix convenes a **council of six specialist agents**:

1. **Orchestrator** — classifies the message (new lead, counter-offer, scope change, etc.)
2. **Scout** — researches the client company for spend signals and leverage
3. **Prosecutor** — red-flags scope, timeline, and pricing risks
4. **Defense** — builds the case for the freelancer's floor rate and anchor
5. **Judge** — weighs both sides and issues a ruling with a win probability
6. **Negotiator** — drafts the reply in the freelancer's authentic voice (few-shot style transfer from past sent emails)

The freelancer approves at two gates: the reply, and the final contract + Stripe invoice. Everything else is autonomous.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind v4** + custom dark theme
- **Zustand** for client state
- **Prisma** + SQLite (migrate to Postgres later — schema is already portable)
- **Gemini 2.0 Flash** via `@google/generative-ai` (primary LLM)
- **OpenAI / ERNIE / mock** swappable via `LLM_PROVIDER` env var
- **Stripe** native SDK for payment links
- **pdf-lib** for SOW generation
- **Server-Sent Events** for streaming agent reasoning to the UI

## Architecture

```
           ┌──────────────┐
Client     │  Orchestrator│  — classify message
  email  → └──────┬───────┘
                  │
         ┌────────┼────────┐
         ▼        ▼        ▼
      Scout  Prosecutor  Defense       (parallel)
         │        │        │
         └────────┼────────┘
                  ▼
              ┌───────┐
              │ Judge │  — weighs all three, issues ruling
              └───┬───┘
                  ▼
           ┌────────────┐
           │ Negotiator │  — drafts reply in freelancer's voice
           └─────┬──────┘
                 │
                 ▼
    ┌────────────────────────┐
    │ Human approval gate    │  ← edit inline, send
    └────────┬───────────────┘
             │  (on Judge.decision === "accept")
             ▼
    ┌────────────────────────┐
    │ Contract (PDF) + Stripe│  — autonomous closing
    └────────────────────────┘
```

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure (copy and fill in keys)
cp .env.example .env
# Edit .env — at minimum set:
#   LLM_PROVIDER=gemini    (or 'mock' for no-API-key dev)
#   GEMINI_API_KEY=...     (https://aistudio.google.com/apikey)
#   STRIPE_SECRET_KEY=sk_test_...  (https://dashboard.stripe.com/test/apikeys)

# 3. Database
npm run db:push    # create schema
npm run db:seed    # load hero demo data

# 4. Run
npm run dev
# → http://localhost:3000
```

## Demo Flow (3 minutes)

1. Open `http://localhost:3000`. The hero deal "Lumen Analytics" is preselected.
2. Click **Send to Pactix**. Watch six agents deliberate live in the right pane.
3. The **Approve Reply** modal opens with a voice-cloned counter-offer at $550.
4. Click **Approve & Send**.
5. Click **Simulate client reply** in the header — injects a $400 counter.
6. Click **Send to Pactix** again. The council re-convenes; Judge flips to `accept`.
7. Click **Generate contract & invoice**. A real SOW PDF renders, and a live Stripe payment link is created.
8. Click **Simulate payment** — the Stripe dashboard mini-panel flips to `PAID`.

## LLM Provider Modes

Set `LLM_PROVIDER` in `.env`:

| Value      | Behavior                                                               |
| ---------- | ---------------------------------------------------------------------- |
| `mock`     | Deterministic scripted responses. Works with **no API key** for dev.    |
| `gemini`   | Google Gemini 2.0 Flash. Requires `GEMINI_API_KEY`.                    |
| `openai`   | OpenAI GPT-4o-mini. Requires `OPENAI_API_KEY`.                         |
| `ernie`    | Baidu ERNIE via Qianfan. Stubbed; swap to live for hackathon submit.    |

Empty API keys auto-fall-back to mock, so the demo always runs.

### Gemini 403 `SERVICE_DISABLED`

If Google returns **403** and the message says the API *has not been used* or *is disabled*, the **Generative Language API** is turned off for the Google Cloud project tied to your key. Open the enable link shown in the app error (or [API Library](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)), click **Enable**, wait a minute or two, and retry. Keys created from [Google AI Studio](https://aistudio.google.com/apikey) usually work without this step.

### Gemini 403 while the API shows “Enabled”

That usually means the **API key is not for that project**, or **key restrictions** block **server-side** use:

1. **Same project:** In Google Cloud, open **IAM & Admin → Settings** and check **Project number**. The key in `.env` must be created under **APIs & Services → Credentials** for that same project (or use an [AI Studio](https://aistudio.google.com/apikey) key, which is often simplest).
2. **Application restrictions:** If the key is limited to **HTTP referrers**, requests from the Next.js **API route (Node)** will fail. For local development set application restrictions to **None**; for production use **IP addresses** (your server), not website referrers.
3. **API restrictions:** Ensure **Generative Language API** is allowed for that key.

## Project Layout

```
pactix/
├── prisma/
│   ├── schema.prisma          # SQLite schema: 7 models
│   ├── seed.ts                # Hero demo dataset
│   └── dev.db                 # (gitignored) SQLite file
├── src/
│   ├── app/
│   │   ├── page.tsx           # Three-pane layout
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── deals/
│   │       │   ├── route.ts                          # GET list
│   │       │   └── [id]/
│   │       │       ├── dispatch/route.ts             # POST — SSE stream
│   │       │       ├── approve-reply/route.ts        # POST
│   │       │       ├── simulate-reply/route.ts       # POST
│   │       │       └── close/route.ts                # POST
│   │       └── invoices/[id]/status/route.ts         # GET/POST
│   ├── agents/
│   │   └── council.ts         # Orchestrator → runs all sub-agents, emits SSE
│   ├── prompts/
│   │   └── index.ts           # System + user prompts per agent
│   ├── components/
│   │   ├── Inbox.tsx
│   │   ├── EmailDetail.tsx
│   │   ├── AgentCouncil.tsx
│   │   ├── ApproveReplyModal.tsx
│   │   └── ApproveClosingModal.tsx
│   ├── store/
│   │   └── deal-store.ts      # Zustand + SSE consumer
│   └── lib/
│       ├── llm.ts             # Provider-agnostic streaming LLM client
│       ├── llm-mock.ts        # Deterministic mock responses
│       ├── contract.ts        # pdf-lib SOW generator
│       ├── payment.ts         # Stripe payment links
│       ├── prisma.ts
│       ├── types.ts
│       └── utils.ts
└── public/contracts/          # Generated SOW PDFs
```

## Scripts

```bash
npm run dev         # Next dev server
npm run build       # Production build
npm run start       # Production server
npm run db:generate # Regenerate Prisma client
npm run db:push     # Sync schema to SQLite
npm run db:seed     # Reset + seed demo data
npm run db:studio   # Visual DB browser
```

## Notes on Hackathon Submission

- The **Stripe integration uses test mode** — `sk_test_` keys. No real money moves.
- The **Scout agent uses cached research** for the demo client. Real web search is a post-hackathon extension.
- The **Gmail integration is mocked** via seeded inbox + simulate-reply. Real Gmail OAuth is a polish item.
- **Migrating to Postgres**: change `provider = "postgresql"` in `prisma/schema.prisma` and update `DATABASE_URL`. All model definitions are portable.
- **Swapping to ERNIE**: the `ernie` branch in `src/lib/llm.ts` is stubbed. When Qianfan credentials arrive, implement the OAuth + streaming flow there — no other file changes required.

## License

Built for the Baidu MeDo Global Hackathon 2026. MIT for everything written here.
