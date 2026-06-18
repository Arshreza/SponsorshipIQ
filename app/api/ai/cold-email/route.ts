import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    companyName, industry, contactName,
    festName, festTheme, festDate, expectedFootfall,
    sponsorTier, tierAmount, highlights, tone
  } = body;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  const prompt = `You are an expert sponsorship outreach writer for Indian college fests. Write a ${tone} cold email to secure sponsorship.

SPONSOR DETAILS:
- Company: ${companyName}
- Industry: ${industry || "General"}
- Contact Person: ${contactName}
- Sponsorship Tier Being Pitched: ${sponsorTier} (₹${tierAmount})

FEST DETAILS:
- Festival Name: ${festName}
- Theme: ${festTheme || "Innovation & Excellence"}
- Dates: ${festDate}
- Expected Footfall: ${expectedFootfall}+
- Key Highlights: ${highlights}

Write a complete cold email including:
1. A compelling subject line (on the first line, prefixed with "Subject: ")
2. A blank line
3. The full email body with proper greeting, pitch, value proposition, clear ask, and professional sign-off

The email should:
- Be personalized to ${companyName}'s industry (${industry})
- Highlight tangible ROI and brand exposure benefits
- Mention the specific tier (${sponsorTier}) and amount (₹${tierAmount})
- Be concise but compelling (200-300 words)
- End with a clear call to action

Write the email now:`;

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
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq API error:", err);
      return NextResponse.json({ error: "Groq API error: " + groqRes.statusText }, { status: 500 });
    }

    const data = await groqRes.json();
    const email = data.choices?.[0]?.message?.content?.trim();

    if (!email) {
      return NextResponse.json({ error: "No response from Groq" }, { status: 500 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Cold email generation error:", error);
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 });
  }
}
