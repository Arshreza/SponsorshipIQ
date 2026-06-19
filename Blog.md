# SponsorshipIQ: Solving the College-Fest "Contact Reset"

Every student-run festival hits the same wall. The PR lead spends nights copy-pasting company names into a generic "please sponsor us" email, sends a few dozen, watches most land in spam — and then graduates. The spreadsheet of contacts and every reply lives in one person's inbox, and next year's lead starts from absolute zero.

I call this the **annual contact reset**, and it's the problem SponsorshipIQ is built to kill.

---

## Where the idea came from

The approach isn't a blind guess. Before this, I'd built **ColdPegion** — a B2B cold-outreach engine that proved the core thesis: validated contact lists + AI-personalized pitches + authorized mailbox sending outperforms manual mass email. ColdPegion showed the outreach loop works; SponsorshipIQ takes that proven idea and rebuilds it from the ground up for the *fest sponsorship* audience — a committee instead of a sales team, brands instead of B2B prospects, and a CRM that survives the yearly handover.

> Note for any public writeup: frame ColdPegion as the predecessor that *inspired* this build, not as code you reused — SponsorshipIQ is a fresh Next.js stack, so "reused modules" would be inaccurate.

---

## What SponsorshipIQ does

**1. A persistent legacy CRM — never start from zero.**
Coordinators import brands from a CSV with custom column mapping (company, email, website, industry); every sponsor gets a structured profile. An interactive Kanban board moves brands through *Drafted → Sent → Replied → Converted* with negotiator notes attached — and the pipeline survives graduation instead of dying in one person's inbox.

**2. Context-aware AI pitches.**
The generation engine injects the festival's details (theme, footfall, package tiers) and the target sponsor's profile to produce a personalized subject line and email, tailored to that brand's industry — not a generic template.

**3. Secure Gmail authorization.**
Coordinators authorize the `gmail.send` scope via Google OAuth2; the refresh token is encrypted before storage, and outreach is sent from the coordinator's own mailbox.

**4. Target tracking & money ledger.**
Set a sponsorship goal, log paid and pending funds (including GST at 18%), and watch real-time progress toward funding the event.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| Backend / API | Next.js Server Actions & Route Handlers (Node.js) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v5 (Credentials) for app login; Google OAuth2 for Gmail authorization |
| Integrations | Google APIs — Gmail send + OAuth2 |
| AI layer | Groq (LLaMA 3.1) for pitch generation |

> **Confirm before publishing:** (a) If the Anthropic Claude SDK is actually wired in, add it back here *and* add `ANTHROPIC_API_KEY` to `.env.example`; if not, leave it out. (b) State a single email path — Gmail API, or Nodemailer with OAuth2 transport — not both. (c) Verify the exact Next.js / Prisma version labels are real.

---

## Implemented

- User auth (NextAuth credentials, hashed passwords, sessions)
- Fest profiles CRUD with a package-tier builder
- Sponsor CRM with CSV import + column mapping
- Email campaigns (active / paused / draft) with linked sender accounts
- Google OAuth for Gmail (`gmail.send`), encrypted refresh tokens
- Sponsorship target + money tracker with GST ledger
- AI generation engine (dynamic prompt injection)
- Pipeline Kanban with status tracking and notes

---

## What's next

- **Auto-reply parsing** — read incoming replies and sort them onto the board automatically.
- **Smart follow-ups** — schedule a follow-up if a sponsor goes quiet for a few days.
- **Lead suggestions** — surface brands that have sponsored similar fests.

The one-liner: SponsorshipIQ turns the yearly sponsorship grind into a personalized, trackable pipeline that the *next* committee inherits instead of rebuilding.