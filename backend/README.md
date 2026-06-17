# SponsorIQ — Backend Layer ⚙️

This directory represents the database schema, queue processing engine, AI modules, and server-side utilities of **SponsorIQ**.

### Key Backend Locations:
- **API Endpoints**: [app/api/](file:///../app/api) (Next.js REST API routes for authentication, LLM config, CSV import, queue generation, and mail sending)
- **Database Schema**: [prisma/](file:///../prisma) (PostgreSQL models and Prisma config)
- **Email Dispatcher**: [lib/email/](file:///../lib/email) (Nodemailer setup)
- **AI Prompt Engine**: [lib/llm/](file:///../lib/llm) (Claude API integration)
- **BullMQ Background Worker**: [lib/queue/](file:///../lib/queue) & [scripts/](file:///../scripts) (Redis workers and connection pooling)
