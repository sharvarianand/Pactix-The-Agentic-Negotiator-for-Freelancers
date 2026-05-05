<p align="center">
  <img src="./public/logo.png" width="120" height="120" alt="Pactix Logo" style="border-radius: 20%" />
</p>

<h1 align="center">Pactix</h1>

<p align="center">
  <strong>The Autonomous Agentic Negotiator for Modern Freelancers and Agencies.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live_Production-black?style=for-the-badge" alt="Production Ready" />
  <img src="https://img.shields.io/badge/Framework-Next.js_16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Auth-Supabase-black?style=for-the-badge&logo=supabase" alt="Supabase Auth" />
  <img src="https://img.shields.io/badge/Integration-Gmail-black?style=for-the-badge&logo=gmail" alt="Gmail Integration" />
</p>

---

## 🚀 What is Pactix?

Freelancers lose thousands of dollars every year under-pricing themselves, accepting bad terms, and spending unbillable hours going back-and-forth negotiating scopes. 

**Pactix** is a powerful SaaS that acts as your AI legal and negotiation team. When a client emails you, Pactix convenes a **Council of Six Specialist AI Agents** that deliberate in real-time. They research the client, identify scope creep, calculate optimal anchor pricing, and draft a response perfectly cloned in your authentic voice.

**It doesn't just draft emails — it closes deals.** Once the terms are agreed upon, Pactix automatically generates a bulletproof PDF contract and a Stripe payment link, sending it to the client to sign and pay.

---

## ✨ Features

### 1. 🤖 The Council of Agents
Pactix doesn't rely on a single LLM prompt. It uses a multi-agent orchestration architecture:
1. **Orchestrator** — classifies the message (new lead, counter-offer, scope change, etc.)
2. **Scout** — researches the client company for spend signals and leverage
3. **Prosecutor** — red-flags scope, timeline, and pricing risks
4. **Defense** — builds the case for the freelancer's floor rate and anchor
5. **Judge** — weighs both sides and issues a ruling with a win probability
6. **Negotiator** — drafts the reply in the freelancer's authentic voice (few-shot style transfer from past sent emails)

### 2. 📧 Gmail Autonomous Bridge (New)
No more manual copy-pasting. Pactix now integrates directly with your inbox.
*   **OAuth Connectivity**: Securely link your Google account via the Settings page.
*   **Intelligent Sync**: Pactix scans your inbox for project briefs, budgets, and proposal requests.
*   **Instant Council**: When a potential deal is detected, the AI Council starts its deliberation before you even open the app.
*   **Manual Sync**: Hit the "Sync" button in your dashboard sidebar to instantly pull in the latest inquiries.

### 3. 🔐 Production-Grade Auth
Pactix now uses **Supabase Auth** for secure, multi-tenant session management.
*   **Auto-Seeding**: New users are automatically provisioned with a "Maya Chen" demo environment, allowing them to experience the power of the AI Council immediately upon signup.
*   **Data Isolation**: Every deal, message, and agent trace is cryptographically tied to your unique user ID.

### 4. 🌍 Multi-Language Auto-Detect
Working globally? The Orchestrator automatically detects the language of an inbound lead (e.g., French, Japanese). The Council deliberates in English, but the Negotiator translates and drafts the final email perfectly in the client's language while maintaining your voice.

### 5. 🎙️ Voice I/O Dictation
No more typing. When Pactix drafts an email, open the Approve Reply modal, hit **Dictate**, and use the Web Speech API to verbally inject new context or modifications into the draft before sending.

### 6. 🔍 Redline Agent
Clients sent their own scope terms? The Redline Agent adversarially scans the contract scope to flag **Critical, Major, and Minor** risks—such as unlimited revisions, low deposits, or missing kill fees.

### 7. 🎲 Monte Carlo What-If Simulator
Curious what happens if you push for more money? Run the Monte Carlo Simulator to execute 200 parallel realities of the negotiation. View beautiful distribution histograms charting your **Expected Value (EV)** versus **Win Probability**.

---

## 🏗️ Architecture & Tech Stack

Pactix is built for scale, speed, and real-time streaming.

```text
           ┌──────────────┐
Client     │  Orchestrator│  — classify message
  email  → └──────┬───────┘
  (Gmail)         │
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

- **Frontend**: Next.js 16 (Turbopack), React 19, Tailwind CSS, Framer Motion.
- **Backend**: Next.js App Router (Proxy Middleware), Server-Sent Events (SSE).
- **Auth**: Supabase Auth (`@supabase/ssr`).
- **Database**: PostgreSQL (Supabase) + Prisma ORM.
- **Integrations**: Gmail API (`googleapis`), Stripe SDK.
- **AI Core**: Google Gemini 2.0 Flash (Optimized for low latency).

---

## 🛠️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/pactix.git
cd pactix
npm install
```

### 2. Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Key variables:
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Google OAuth**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- **Gemini**: `GEMINI_API_KEY`.
- **Stripe**: `STRIPE_SECRET_KEY`.

### 3. Database Sync
```bash
npx prisma db push
```

### 4. Run Locally
```bash
npm run dev
```

---

## 🚀 Deployment

Pactix is optimized for Vercel. 
1. Ensure your **Google OAuth Redirect URI** is set to `https://your-domain.com/api/auth/google/callback`.
2. Configure all environment variables in Vercel settings.
3. Deploy!


## ⚖️ License
[MIT License](https://opensource.org/licenses/MIT) - See [LICENSE](LICENSE) for details.
