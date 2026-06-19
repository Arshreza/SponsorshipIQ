# The Story of SponsorshipIQ: Solving the College Festival "Contact Reset" Problem 🎪🚀

It’s 2:00 AM on a Tuesday. Aarav, the Public Relations lead for a major university tech fest, is staring at a monitor illuminated by three windows: a chaotic Excel spreadsheet of 180 "potential sponsors," a generic Gmail template asking for "sponsorship support," and a PDF of the festival's pitch deck. 

He’s already sent 45 emails tonight, manually copy-pasting the company names, names of the marketing managers, and event dates. He knows that 90% of these will end up in spam, and by next semester when he graduates, this entire spreadsheet and the replies he receives will be lost in his personal inbox. The next year's PR lead will start from absolute zero.

This is the **"annual contact reset"**—a painful cycle that plagues every student-run event in the world. And it’s exactly why we built **SponsorshipIQ**.

---

## 💡 The Spark of the Idea

College festival committees raise millions in sponsorship funding globally, yet their tools are stuck in the early 2000s. We realized that solving this required three core pillars:
1. **A Persistent Legacy Database**: A CRM that doesn't delete itself when the current coordinators graduate.
2. **Personalized, Safe AI Outreach**: AI that doesn't just spam, but actually *researches* the sponsor and writes a highly personalized pitch tailored to that brand's industry, without sounding like a generic template.
3. **Strict Outreach Guardrails**: In college sponsorships, cold emails should never mention financial numbers or pitch packages upfront—that's a quick way to get rejected. The email must strictly be designed to **book a meeting**, leaving negotiations for when the brand replies.

---

## 🛠️ The Technical Journey: How We Built It

During this hackathon, we set out to build SponsorshipIQ from scratch using **Next.js 15 (App Router)**, **Tailwind CSS v4**, and **Prisma with PostgreSQL**.

Here is how the architecture came together:

### 1. The Unified CRM & Legacy Board
We designed a pipeline board where student coordinators can import contacts from a CSV file. The columns auto-map to the database, instantly creating a structured profile for every brand. The status board lets the team drag sponsors from *Contacted* to *Interested* to *Converted*, and log negotiator notes.

### 2. Direct Google OAuth & Gmail Integration
Using standard SMTP credentials or API keys in production can be complex and insecure. We wanted students to be able to sign in securely with their Google Workspace account and authorize Gmail sending. 
We built a custom OAuth flow requesting the Google `gmail.send` scope. Using Node's cryptographic libraries, the app encrypts the refresh token using an `ENCRYPTION_MASTER_KEY` and securely saves it. When the outreach engine runs, it uses the authorized tokens to send the email directly from the coordinator's mailbox.

### 3. The Autonomous LLaMA 3.1 Outreach Engine
For a background worker, running Redis locally can sometimes be a hurdle for developers. To solve this, we implemented a simple Next.js Cron endpoint `/api/cron/process-outreach`.
When triggered, it grabs active campaigns, fetches the sponsor details and fest profile, and makes an API call to **Groq AI (LLaMA 3.1)**. 
We engineered a strict prompt constraint system: the LLM is hardcoded to *never* mention tiers or prices, strictly focusing on the festival's value proposition (e.g. developer reach, footfall) and requesting a short calendar booking.

### 4. Live Money & Target Tracker
We added a target configuration feature. In the **Money Tracker** dashboard, coordinators can edit the fest's target sponsorship goal, log GST (18%) collections, and track exactly how close they are to funding their dream event.

---

## 🚧 Overcoming the Final Hurdles

No hackathon project is complete without late-night debugging. During deployment on **Vercel**, we hit a critical security advisory blocker: the system flagged a vulnerability in our Next.js version (`15.3.3`). 
We immediately updated our dependencies to the patched, secure version **`15.4.8`**, resolved compiling warnings by optimizing our CSS `@import` ordering, set up a serverless **Neon PostgreSQL** database in a single click, and successfully pushed the schema migrations. 

The build compiled successfully, and SponsorshipIQ went live.

---

## 🔮 What’s Next?

SponsorshipIQ is just getting started. Our vision is to build:
* **AI Auto-Reply Parsing**: Automatically read incoming emails and sort them on the Kanban board.
* **Smart Follow-ups**: Schedule automated follow-up sequences if a sponsor doesn’t reply in 3 days.

By replacing the manual grind with autonomous, personalized AI workflows, SponsorshipIQ ensures student organizers can spend less time typing emails, and more time creating unforgettable experiences. 🎪🚀
