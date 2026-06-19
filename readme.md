# SponsorshipIQ 🎪🚀
> Intelligent AI-Powered Sponsorship Outreach & CRM for College Festivals

SponsorshipIQ is a next-generation sponsorship CRM and automated outreach platform designed specifically for college festival committees. It solves the annual "contact reset" problem by retaining sponsorship history year-over-year, and leverages AI to write personalized, context-aware pitch emails to corporate brands.

---

## 📌 Problem Statement

College fest committees depend on corporate sponsorships to fund their events, but outreach is almost entirely manual. A small sponsorship team spends weeks finding relevant companies, digging up contacts, writing near-identical proposals, and sending cold emails that mostly go ignored and untracked. Every year, the committee graduates, and the entire contact network resets to zero.

### The SponsorshipIQ Solution:
1. **Never Start From Zero**: A unified CRM dashboard keeps track of every contact, response, and conversion year-over-year.
2. **Context-Aware AI Pitches**: Rather than generic templates, our LLM engine analyzes the festival's unique USPs (theme, footfall, packages) and tailors the pitch to align with the target brand's industry and marketing angle.
3. **Google OAuth & Gmail Integration**: Authenticate directly with your Google Account to authorize secure, offline email sending permissions.
4. **Autonomous Cold Outreach**: Setup target sponsor lists, click Launch, and the background engine autonomously writes and sends personalized emails directly via your linked Gmail.
5. **Target Tracking & Money Ledger**: Define sponsorship goals, track paid and pending funds, and view real-time goal progress on the dashboard.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15.4.8 (App Router), React 19, Tailwind CSS v4 |
| **Backend / API** | Next.js Server Actions & Route Handlers (Node.js) |
| **Database** | PostgreSQL via Prisma ORM (Prisma 7 compatible) |
| **Authentication** | NextAuth.js v5 (Credentials) |
| **Integrations** | Google APIs (Gmail API & Google OAuth2 wrapper) |
| **AI Integration** | Groq AI LLaMA 3.1 & Anthropic Claude SDK (Vercel AI SDK compatible) |

---

## 📈 Implemented Features

We have completed the core functional components and background processing engine:
*   [x] **User Authentication**: NextAuth credential provider registration, secure password hashing, and session management.
*   [x] **Fest Profiles CRUD**: Form to capture theme, footfall, dates, and interactive package tier builder.
*   [x] **Sponsor CRM & CSV Import**: Contact importer featuring custom CSV column mapping (Company name, email, website, industry).
*   [x] **Email Campaigns**: Dashboard listing active, paused, draft campaigns. Select target sponsor lists and linked sender accounts.
*   [x] **Google OAuth for Gmail**: Custom secure Google authorization setup to request the `gmail.send` scope. Saves encrypted refresh tokens in the database.
*   [x] **Sponsorship Target & Money Tracker**: Modal to set custom goals, track GST (18%) collections, and log/delete payments in a ledger.
*   [x] **AI Generation Engine**: Dynamic prompt injection using the festival details and sponsor profile to output highly personalized subject lines and emails.
*   [x] **Pipeline Kanban Board**: Interactive board to track email statuses (Drafted, Sent, Replied, Converted) and save negotiator notes.

---

## 📂 Repository Structure

The project follows a unified **Next.js App Router** structure, optimizing developer workflow and simplifying deployment:

```text
SponsorshipIQ/
├── app/                      # Next.js App Router Page & API routes
│   ├── (auth)/               # Authentication pages (login/register)
│   ├── api/                  # Backend REST API endpoints (Prisma handlers)
│   │   ├── auth/             # Custom next-auth and Google OAuth/callback routes
│   │   ├── campaigns/        # Campaign creation and launch handlers
│   │   ├── cron/             # Autonomous outreach processing endpoint
│   │   ├── settings/         # Target and LLM config API settings
│   │   └── sponsors/         # CRM data handlers
│   ├── dashboard/            # Core dashboard layouts (CRM, money, followups, settings)
│   ├── globals.css           # Tailwind CSS v4 design system
│   └── page.tsx              # Marketing landing page
├── components/               # Reusable UI React Components
├── lib/                      # Core backend utilities
│   ├── email/                # Nodemailer SMTP sending handlers
│   ├── llm/                  # LLaMA / Claude pitch generation logic
│   ├── db.ts                 # PrismaClient initialization & Mock fallback
│   ├── encryption.ts         # Secure cryptographic utilities
│   └── gmail.ts              # Gmail API client wrapper
├── prisma/                   # Prisma database schemas
│   └── schema.prisma         # PostgreSQL models
├── types/                    # NextAuth type definitions & declarations
├── prisma.config.ts          # Prisma 7 configuration file
└── tailwind.config.js        # CSS configurations
```

---

## ⚙️ Setup & Installation Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (e.g. Neon.tech or local)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Arshreza/SponsorshipIQ.git
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
- `NEXTAUTH_SECRET`: Secret key for session encryption.
- `ENCRYPTION_MASTER_KEY`: 32-byte hex key for encrypting refresh tokens.
- `GROQ_API_KEY`: Groq API key for AI generation.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Credentials from Google Cloud Console.

### 3. Push Database Schema
```bash
npx prisma db push
```

### 4. Start the Application
Run the Next.js development server:
```bash
npm run dev
```
Open `http://localhost:3000` to access the application.
