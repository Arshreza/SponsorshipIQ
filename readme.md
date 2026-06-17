# SponsorIQ 🎪🚀
> Intelligent AI-Powered Sponsorship Outreach for College Festivals

SponsorIQ is a next-generation sponsorship CRM and automated outreach platform designed specifically for college festival committees. It solves the annual "contact reset" problem by retaining sponsorship history year-over-year, and leverages AI to write personalized, context-aware pitch emails to corporate brands.

---

## 📌 Problem Statement

College fest committees depend on corporate sponsorships to fund their events, but outreach is almost entirely manual. A small sponsorship team spends weeks finding relevant companies, digging up contacts, writing near-identical proposals, and sending cold emails that mostly go ignored and untracked. Every year, the committee graduates, and the entire contact network resets to zero.

### The SponsorIQ Solution:
1. **Never Start From Zero**: A unified CRM dashboard keeps track of every contact, response, and conversion year-over-year.
2. **Context-Aware AI Pitches**: Rather than generic templates, our LLM engine analyzes the festival's unique USPs (theme, footfall, packages) and tailors the pitch to align with the target brand's industry and marketing angle.
3. **Queue-Based Pipeline**: Integrated status board (Kanban) and BullMQ background worker to schedule, test, and send cold emails reliably.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| **Backend / API** | Next.js Server Actions & Route Handlers (Node.js) |
| **Database** | PostgreSQL via Prisma ORM (Prisma 7 compatible) |
| **Authentication** | NextAuth.js v5 (Google OAuth & Credentials) |
| **Async Tasks & Queues** | BullMQ + Redis (for handling AI generation & SMTP sending) |
| **AI Integration** | Anthropic Claude SDK / Vercel AI SDK (Configurable LLM provider) |

---

## 📈 Current Progress

We have completed the core functional components and background processing engine:
*   [x] **User Authentication**: NextAuth credential provider registration, secure password hashing, and session management.
*   [x] **Fest Profiles CRUD**: Form to capture theme, footfall, dates, and interactive package tier builder.
*   [x] **Sponsor CRM & CSV Import**: Contact importer featuring custom CSV column mapping (Company name, email, website, industry).
*   [x] **Campaign Wizard**: 3-step wizard linking a Fest Profile, Sponsor List, and custom pitch parameters (tone, word count, prompts).
*   [x] **Queue System**: BullMQ queues with a background worker running in a parallel process for robust rate-limited processing.
*   [x] **AI Generation Engine**: Dynamic prompt injection using the festival details and sponsor profile to output highly personalized subject lines and emails.
*   [x] **Pipeline Kanban Board**: Interactive board to track email statuses (Drafted, Sent, Replied, Converted) and save negotiator notes.

---

## 📂 Repository Structure

The project follows a unified **Next.js App Router** structure, optimizing developer workflow and simplifying deployment:

```text
SponsorshipIQ/
├── app/                      # Next.js App Router Page & API routes
│   ├── (auth)/               # Authentication pages (login/register)
│   ├── api/                  # Backend REST API endpoints (Prisma handlers, queues)
│   ├── dashboard/            # Core dashboard layout, CRM, and pipelines
│   ├── globals.css           # Tailwind CSS v4 design system
│   └── page.tsx              # Marketing landing page
├── components/               # Reusable UI React Components
│   ├── campaigns/            # Campaign wizards and details
│   ├── fest-profiles/        # Fest profile forms and tier editor
│   ├── pipeline/             # Kanban board view
│   ├── settings/             # LLM configurations
│   └── shared/               # Navigation, Sidebars
├── lib/                      # Core backend utilities
│   ├── email/                # Nodemailer SMTP sending handlers
│   ├── llm/                  # Claude pitch generation logic
│   ├── queue/                # Redis connection, BullMQ queue and Worker setup
│   └── db.ts                 # PrismaClient initialization
├── prisma/                   # Prisma database schemas
│   └── schema.prisma         # PostgreSQL models
├── types/                    # NextAuth type definitions & declarations
├── scripts/                  # Executable worker start scripts
├── prisma.config.ts          # Prisma 7 configuration file
└── tailwind.config.js        # CSS configurations
```

---

## ⚙️ Setup & Installation Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Redis Server (local or Upstash)

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd SponsorshipIQ
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in the configuration options:
```bash
cp .env.example .env
```
Key values required:
- `DATABASE_URL`: Connection string to your PostgreSQL instance.
- `REDIS_URL`: Connection string to your Redis server.
- `NEXTAUTH_SECRET`: Secret key for session encryption.
- `ENCRYPTION_MASTER_KEY`: 32-byte hex key for encrypting SMTP passwords.

### 3. Push Database Schema
```bash
npx prisma db push
```

### 4. Start the Application
Run both the Next.js dev server and the background BullMQ worker concurrently:
```bash
npm run dev:full
```

*Alternatively, run them separately:*
```bash
# Terminal 1: Starts Next.js frontend & API
npm run dev

# Terminal 2: Starts async outreach worker
npm run worker
```

---

## 🚀 Planned Features (Roadmap)

1.  **AI Auto-Reply Categorization**: Automatically classify incoming emails (e.g. Interested, Needs deck, Refused) using LLM classifiers.
2.  **Automated Follow-up Sequences**: Define multi-stage sequence templates to nudge sponsors automatically if they don't reply within 3 days.
3.  **PDF Sponsor Deck Handover**: Export a comprehensive history of contacts, deals, packages, and notes to the next festival team to prevent knowledge loss.
4.  **Google OAuth2 Sending**: Connect Google Workspace accounts via native OAuth2 tokens rather than SMTP app passwords.
