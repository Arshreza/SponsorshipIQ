# SponsorIQ — Database Models 📊

SponsorIQ uses **Prisma ORM** with **PostgreSQL**. All database models and validation mappings are defined in the schema file.

### Core Data Models:
- **User**: Authentication, credentials, and relationship pointers.
- **FestProfile**: Festival themes, expected footfalls, event dates, packages, and USPs.
- **Sponsor**: Brand database storing company details, contact emails, and AI-enriched research.
- **SponsorList**: Custom groupings of sponsors for targeted campaigns.
- **Campaign**: Links a profile, sponsor list, and SMTP account, containing custom instructions for Claude.
- **Outreach**: Individual outbound email history, pipeline stages (Drafted, Sent, Replied, Converted), and negotiator notes.

### References:
- **Schema File**: [prisma/schema.prisma](file:///../prisma/schema.prisma)
- **Database Connection Client**: [lib/db.ts](file:///../lib/db.ts)
