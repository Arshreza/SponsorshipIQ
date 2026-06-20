import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#030f0e] text-white overflow-hidden">
      {/* ── Aurora Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="aurora-blob w-[700px] h-[700px] bg-brand-500 -top-60 -left-40"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="aurora-blob w-[500px] h-[500px] bg-accent-500 top-40 right-0"
          style={{ animationDelay: "-6s", animationDuration: "22s" }}
        />
        <div
          className="aurora-blob w-[400px] h-[400px] bg-brand-700 bottom-0 left-1/3"
          style={{ animationDelay: "-12s", animationDuration: "26s" }}
        />
        <div className="absolute inset-0 bg-grid bg-grid-fade" />
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-lg text-white">SponsorshipIQ</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#tech-stack" className="hover:text-white transition-colors">Tech</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm btn-shine gradient-brand text-white px-5 py-2.5 rounded-full font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all hover:scale-105"
          >
            Get Started →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 text-center px-6 pt-24 pb-32 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border-gradient-subtle rounded-full px-4 py-1.5 mb-8 text-xs font-semibold text-brand-300 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
          AI-Powered · College Fest Sponsorship
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
          Sponsor outreach
          <br />
          <span className="gradient-text-animated">reimagined for</span>
          <br />
          college fests
        </h1>

        <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop copy-pasting cold emails. SponsorshipIQ uses AI to write
          hyper-personalized pitches for each brand — and tracks every response in
          a pipeline that survives committee handovers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="btn-shine gradient-brand text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 transition-all hover:scale-105 glow-brand-sm"
          >
            Start your campaign →
          </Link>
          <Link
            href="/login"
            className="glass-dark border border-white/10 text-white/80 hover:text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:border-white/25"
          >
            Sign in
          </Link>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { value: "3×", label: "Higher reply rates" },
            { value: "90%", label: "Time saved" },
            { value: "∞", label: "Year-over-year CRM" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-dark border border-white/10 rounded-2xl p-4 spotlight-card"
            >
              <div className="text-2xl font-extrabold gradient-brand-text">{stat.value}</div>
              <div className="text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Workflow</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 text-white">
            Four steps to your first sponsorship
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              icon: "🎪",
              title: "Build your Fest Profile",
              desc: "Add your fest's theme, expected footfall, sponsorship packages, and deliverable tiers.",
            },
            {
              step: "02",
              icon: "🏢",
              title: "Upload brand list",
              desc: "Import a CSV of target companies — name, contact email, website, industry.",
            },
            {
              step: "03",
              icon: "🤖",
              title: "AI generates pitches",
              desc: "AI researches each brand and writes a pitch that speaks to their specific marketing goals.",
            },
            {
              step: "04",
              icon: "📊",
              title: "Track & follow up",
              desc: "Dashboard shows every lead's status. Mark replies, add notes, export for next year's committee.",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="relative glass-dark border border-white/10 rounded-2xl p-6 spotlight-card"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl mb-4">{s.icon}</div>
              <div className="text-xs font-mono text-brand-500 mb-2">{s.step}</div>
              <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              {i < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-2 text-white/20 text-xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-accent-400 uppercase tracking-widest">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 text-white">
            Built for the fest sponsorship workflow
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              emoji: "✨",
              title: "AI Pitch Generation",
              desc: "AI writes context-aware pitches per brand — referencing their real marketing campaigns, products, and CSR initiatives.",
              tag: "Powered by AI",
            },
            {
              emoji: "📬",
              title: "Gmail Integration",
              desc: "Connect your Gmail account and send directly from the dashboard — no copy-paste, no tab switching.",
              tag: "Gmail SMTP",
            },
            {
              emoji: "🗂️",
              title: "Pipeline Dashboard",
              desc: "Kanban board tracking every sponsor from DRAFTED → SENT → REPLIED → CONVERTED. Add reply notes in one click.",
              tag: "Visual CRM",
            },
            {
              emoji: "📋",
              title: "CSV Brand Import",
              desc: "Upload your list of brands in seconds. The system handles deduplication, validation, and list management.",
              tag: "Bulk import",
            },
            {
              emoji: "🎪",
              title: "Fest Profile Templates",
              desc: "Create profiles for Synapse, I-Fest, Concours — each with their own packages, theme, and footfall data.",
              tag: "Multi-fest",
            },
            {
              emoji: "🔄",
              title: "Handover Export",
              desc: "Export the full pipeline as CSV at end of season. Next year's committee picks up exactly where you left off.",
              tag: "Year-over-year CRM",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="glass-dark border border-white/10 rounded-2xl p-6 spotlight-card hover:border-brand-700 transition-all duration-300"
            >
              <div className="text-2xl mb-3">{f.emoji}</div>
              <div className="inline-block text-xs font-semibold text-brand-400 bg-brand-900/40 px-2.5 py-0.5 rounded-full mb-3">
                {f.tag}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="tech-stack" className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="border-gradient rounded-3xl p-8 md:p-12 glass-dark text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Enterprise-grade stack, student-friendly setup
          </h2>
          <p className="text-white/50 text-sm mb-8 max-w-xl mx-auto">
            Built on the same architecture as ColdPegion — battle-tested, scalable, and deployable in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Next.js 15", "TypeScript", "Groq AI",
              "PostgreSQL", "Prisma ORM", "BullMQ",
              "Redis", "Gmail API", "Tailwind CSS v4",
              "NextAuth v5", "Vercel", "Neon DB",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white/5 border border-white/10 text-white/70"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 text-center py-24 px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5">
          Ready to land your first sponsor?
        </h2>
        <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
          Set up in 5 minutes. No credit card. No corporate tools. Just a smarter way to do sponsorship outreach.
        </p>
        <Link
          href="/register"
          className="btn-shine gradient-brand text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/40 hover:shadow-brand-500/60 transition-all hover:scale-105 inline-block"
        >
          Get Started — It&apos;s Free
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center text-white/25 text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md gradient-brand flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-semibold text-white/40">SponsorshipIQ</span>
        </div>
        <p>Built by Team Exclusive · Arshreza Rajani · DAU</p>
        <p className="mt-1">Synapse · I-Fest · Concours — and every fest after</p>
      </footer>
    </div>
  );
}
