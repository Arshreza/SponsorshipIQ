# SponsorshipIQ — Implementation Plan

## Overview

**SponsorshipIQ** is an intelligent sponsorship outreach platform for college fest committees. It mirrors the ColdPegion (mailpilot-ai) architecture — same stack, same patterns — but domain-shifted: instead of general B2B cold email, it's purpose-built for the fest → brand sponsorship workflow.

**Core Workflow:**
1. Committee creates a **Fest Profile** (theme, footfall, packages/deliverables, deck)
2. Uploads a **brand/sponsor list** (CSV with company name, contact email, website, industry)
3. **Claude AI** generates a personalized pitch per sponsor — contextualizing the fest's value prop to each brand's marketing angle
4. Emails sent via **Gmail OAuth2** with validation
5. **Pipeline dashboard** tracks every lead (Drafted → Sent → Replied → Converted)
6. Pipeline persists across committee generations (year-over-year CRM)

---

## Tech Stack (mirrors ColdPegion exactly)

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS v4 + shadcn-style components |
| AI/LLM | Claude API via Anthropic SDK (pitch generation + reply classification) |
| Auth | NextAuth v5 (credentials + Google OAuth) |
| Database | PostgreSQL via Prisma ORM (Neon.tech for cloud) |
| Email | Gmail API (OAuth2 token-based sending) + Nodemailer fallback |
| Background Jobs | BullMQ + Redis (Upstash) for async pitch generation & email queue |
| Hosting | Vercel (frontend) + Render (worker) |

---

## Open Questions

> [!IMPORTANT]
> **Gmail OAuth2 vs App Password**: The ideation specifies Gmail OAuth2. ColdPegion uses Gmail App Passwords (SMTP). For MVP, should we use **App Password** (simpler, matches ColdPegion) or full **OAuth2 token flow** (requires Google Cloud Console setup)?
>
> *Recommendation: Start with App Password for MVP (identical to ColdPegion), then upgrade to OAuth2 in v2.*

> [!IMPORTANT]
> **Claude API Key**: The ideation specifies Claude as the AI. Unlike ColdPegion (which supports configurable LLM providers), should SponsorshipIQ hardcode Claude, or keep the LLM configurable via settings like ColdPegion does?
>
> *Recommendation: Keep LLM configurable so you can use Groq/OpenAI during dev and Claude in prod.*

> [!NOTE]
> **Multi-fest support**: Should one user account support multiple fests (e.g., Synapse, I-Fest, Concours), or is one account = one fest? This impacts the data schema.
>
> *Recommendation: One account supports multiple Fest Profiles, selectable per campaign.*

---

## Proposed Changes

### 1. Project Bootstrap

#### [NEW] `package.json`, `tsconfig.json`, `next.config.ts`, etc.
Initialize a new Next.js 15 project in `c:\Users\SSD\OneDrive\Desktop\SponsorshipIQ` using `npx create-next-app@latest`. Configure identical tooling to ColdPegion: TypeScript, Tailwind v4, ESLint, App Router.

---

### 2. Database Schema (Prisma)

#### [NEW] `prisma/schema.prisma`

New models replacing ColdPegion's generic B2B concepts with fest-sponsorship domain concepts:

| ColdPegion Model | SponsorshipIQ Equivalent | Notes |
|---|---|---|
| `CompanyProfile` | `FestProfile` | Festival name, theme, footfall, college, deliverables/packages JSON, deck URL |
| `Product` | *(removed)* | Replaced by FestProfile deliverables |
| `Prospect` | `Sponsor` | Company name, contact email, website, industry, sponsorship tier interest |
| `ProspectList` | `SponsorList` | Named list of brands for a campaign |
| `Agent` | `Campaign` | Links a FestProfile + SponsorList, tracks pitch generation + sending |
| `Email` | `Outreach` | Individual email sent to a sponsor contact |
| `SequenceEnrollment` | `OutreachStatus` | Pipeline state: DRAFT → SENT → REPLIED → INTERESTED → CONVERTED |
| `LlmConfig` | `LlmConfig` | Kept identical — configurable LLM API key + base URL |
| `EmailAccount` | `EmailAccount` | Kept identical — Gmail App Password or SMTP |

**New models:**
- `FestProfile` — fest name, edition/year, college, theme, expected footfall, event dates, deliverable packages (JSON), deck URL/file, social handles
- `SponsorList` — named list, CSV import, linked to a campaign
- `Sponsor` — contact email, company name, website, industry, custom notes, AI research summary
- `Campaign` — links FestProfile + SponsorList + EmailAccount, status, pitch guidelines
- `Outreach` — per-sponsor email sent, status enum (DRAFTED/SENT/REPLIED/INTERESTED/CONVERTED/REJECTED), reply notes
- `HandoverExport` — snapshot of pipeline for year-over-year knowledge transfer

---

### 3. Authentication

#### [MODIFY] `src/lib/auth.ts`
Identical to ColdPegion: NextAuth v5 with credentials provider + Google OAuth. Branding updated.

#### [NEW] `src/app/(auth)/login/page.tsx`, `register/page.tsx`
Identical login/register pages with SponsorshipIQ branding (teal/amber color palette vs ColdPegion's blue/purple).

---

### 4. Core Feature Pages (Dashboard)

#### [NEW] `src/app/dashboard/layout.tsx`
Sidebar + topbar layout, identical structure to ColdPegion but with SponsorshipIQ nav links.

**Sidebar nav items:**
- 📊 Dashboard (overview stats)
- 🎪 Fest Profiles
- 🏢 Sponsors (brand contacts)
- 📋 Sponsor Lists
- 🚀 Campaigns
- 📬 Email Accounts
- 📦 Pipeline (kanban/table view of outreach statuses)
- 🔄 Handover Export
- ⚙️ Settings (LLM config)

#### [NEW] `src/app/dashboard/page.tsx`
Overview dashboard — stats cards: total sponsors contacted, reply rate, campaigns active, sponsors converted. Recent activity feed.

#### [NEW] `src/app/dashboard/fest-profiles/page.tsx`
CRUD for fest profiles. Fields: Fest Name, Edition/Year, College, Theme, Expected Footfall, Event Dates, Packages (add/edit deliverable tiers like "Title Sponsor — ₹2L", "Co-Sponsor — ₹1L"), Deck file upload.

#### [NEW] `src/app/dashboard/sponsors/page.tsx`
Sponsor contact management. CSV import (company, contact email, website, industry). AI-enrichable: button to fetch brand context. Status badges.

#### [NEW] `src/app/dashboard/campaigns/page.tsx`
Campaign wizard (3 steps):
1. Select Fest Profile + name the campaign
2. Select Sponsor List + Email Account
3. Set pitch guidelines (tone, word limit, custom instructions for Claude)

Campaign detail: launch pitch generation, track per-sponsor status in table.

#### [NEW] `src/app/dashboard/pipeline/page.tsx`
Kanban-style pipeline board: columns for DRAFTED / SENT / REPLIED / INTERESTED / CONVERTED / REJECTED. Cards show sponsor name, company, campaign. Drag-drop or dropdown to update status. Add reply notes.

#### [NEW] `src/app/dashboard/email-accounts/page.tsx`
Connect Gmail (App Password) or SMTP. Identical to ColdPegion.

#### [NEW] `src/app/dashboard/settings/page.tsx`
LLM config (identical to ColdPegion), global settings.

---

### 5. AI Pitch Generation Engine

#### [NEW] `src/lib/llm/pitch-generator.ts`
Claude prompt engineered for the fest sponsorship use case:

```
System: You are a sponsorship outreach specialist for college festivals in India.
Given a fest's profile and a target brand, write a personalized sponsorship pitch email.

Fest Profile: {festName}, {theme}, {footfall}, {packages}
Brand: {companyName}, {industry}, {website}
Sender: {contactName}, {festName} Sponsorship Team

Rules: 
- Open with a specific hook tied to the brand's current marketing campaigns/products
- Show genuine understanding of the brand's audience and how it aligns with fest demographics  
- Lead with 1-2 specific deliverable packages relevant to the brand
- Keep under 200 words
- Professional but energetic college-fest tone
- End with a clear CTA
```

#### [NEW] `src/lib/queue/worker.ts`
BullMQ worker that processes `generate-pitch` and `send-email` jobs. Identical pattern to ColdPegion worker.

---

### 6. Email Sending

#### [NEW] `src/lib/email/sender.ts`
Gmail SMTP via Nodemailer (identical to ColdPegion). Validates email before sending.

---

### 7. Marketing / Landing Page

#### [NEW] `src/app/(marketing)/page.tsx`
Landing page with:
- Hero: "AI-powered sponsorship outreach for college fests"
- 4-step workflow diagram
- Feature highlights
- CTA to sign up

---

### 8. Design System

#### [NEW] `src/app/globals.css`

**Brand Palette — Teal + Amber** (distinct from ColdPegion's blue/purple):
- Primary: Teal (`#0d9488` / `#14b8a6`)  
- Accent: Amber (`#f59e0b` / `#fbbf24`)
- Dark sidebar: `#0f2027`
- Glassmorphism cards, aurora blobs, shimmer effects (all carried over)

---

### 9. API Routes

| Route | Purpose |
|---|---|
| `POST /api/campaigns/[id]/generate` | Trigger AI pitch generation for all sponsors in campaign |
| `POST /api/campaigns/[id]/send` | Queue email sends |
| `GET /api/campaigns/[id]/status` | Poll job status |
| `POST /api/sponsors/import` | CSV upload + parse |
| `POST /api/sponsors/[id]/research` | AI research a brand's marketing angle |
| `PATCH /api/outreach/[id]/status` | Update pipeline status + add reply notes |
| `GET /api/pipeline/export` | Handover export (CSV/JSON) |
| `POST /api/auth/[...nextauth]` | NextAuth handler |

---

## MVP Scope (7-Day Build)

**Day 1:** Project bootstrap, Prisma schema, auth pages  
**Day 2:** Fest Profiles CRUD, Sponsor CSV import  
**Day 3:** Email Accounts connection, Campaign wizard  
**Day 4:** AI pitch generation (Claude integration, BullMQ)  
**Day 5:** Email sending via Gmail SMTP  
**Day 6:** Pipeline dashboard, status updates  
**Day 7:** Landing page, polish, handover export  

### Must-Have (MVP)
- [x] Fest profile creation
- [x] Sponsor list (manual + CSV import)
- [x] AI pitch generation per sponsor (Claude)
- [x] Gmail sending (App Password)
- [x] Pipeline dashboard (DRAFTED / SENT / REPLIED / CONVERTED)

### Roadmap (Post-MVP)
- [ ] AI reply categorization (interested / not interested / OOO)
- [ ] Automated follow-up sequences
- [ ] Fest profile templates (Synapse / I-Fest / Concours presets)
- [ ] AI brand lead suggestions
- [ ] Multi-year sponsor CRM + handover export PDF
- [ ] Full Gmail OAuth2 (vs App Password)

---

## Verification Plan

### Automated
```bash
npx prisma db push    # Schema validates
npm run build         # TypeScript + Next.js build passes
```

### Manual
1. Register → create Fest Profile → import sample brand CSV
2. Connect Gmail account
3. Create a Campaign → launch pitch generation → verify Claude-generated emails appear
4. Send 1 test email → check inbox
5. Mark sponsor as "Replied" in pipeline → verify status updates
6. Export handover CSV
