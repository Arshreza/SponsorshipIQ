import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    festName, festType, college, city, edition, theme, dates,
    footfall, socialReach, instagramHandle, website,
    highlights, pastSponsors, packages,
    contactName, contactEmail, contactPhone
  } = body;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  let parsedPackages: Array<{ tier: string; amount: string; benefits: string[] }> = [];
  try {
    parsedPackages = JSON.parse(packages || "[]");
  } catch {
    parsedPackages = [];
  }

  const packagesText = parsedPackages.map(p =>
    `• ${p.tier} — ${p.amount}\n  Benefits: ${p.benefits.join(", ")}`
  ).join("\n\n");

  const prompt = `You are an expert at writing professional Indian college fest sponsorship brochures and proposals. Write a complete, detailed, impressive sponsorship proposal document.

FESTIVAL INFORMATION:
- Name: ${festName} (${edition || ""})
- Type: ${festType} Fest
- College: ${college}
- City: ${city}
- Dates: ${dates}
- Theme: ${theme}
- Expected Footfall: ${footfall}+
- Social Media Reach: ${socialReach}+ followers
- Instagram: ${instagramHandle}
- Website: ${website}
- Highlights: ${highlights}
- Notable Past Sponsors: ${pastSponsors}

SPONSORSHIP PACKAGES:
${packagesText}

CONTACT:
- Name: ${contactName}
- Email: ${contactEmail}
- Phone: ${contactPhone}

Write a COMPLETE sponsorship proposal document with these sections:
1. EXECUTIVE SUMMARY (compelling opening about the fest)
2. ABOUT THE FESTIVAL (background, legacy, what makes it special)
3. WHY SPONSOR US? (audience demographics, reach, brand benefits)
4. SPONSORSHIP PACKAGES (format as a clear table with all tiers, amounts, benefits)
5. WHAT YOU GET - BRAND EXPOSURE BREAKDOWN (detailed list of benefits per tier)
6. PAST SPONSORS & SUCCESS STORIES (mention how past sponsors benefited)
7. AUDIENCE DEMOGRAPHICS (age group, interests, purchasing power of college students)
8. SOCIAL MEDIA AMPLIFICATION (detail the social media plan)
9. TERMS & TIMELINE (payment terms, deadlines, deliverable schedule)
10. CONTACT US (sign-off with contact details)

Make it professional, enthusiastic, and compelling. Use headings clearly with ===, --- separators. Total length: 600-900 words.`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.65,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq API error:", err);
      return NextResponse.json({ error: "Groq API error: " + groqRes.statusText }, { status: 500 });
    }

    const data = await groqRes.json();
    const proposal = data.choices?.[0]?.message?.content?.trim();

    if (!proposal) {
      return NextResponse.json({ error: "No response from Groq" }, { status: 500 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Proposal generation error:", error);
    return NextResponse.json({ error: "Failed to generate proposal" }, { status: 500 });
  }
}
