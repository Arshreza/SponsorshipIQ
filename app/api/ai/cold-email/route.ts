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

  const prompt = `You are a student from a college fest committee writing a genuine, warm outreach email to a potential sponsor. Your goal is NOT to close a deal — your only goal is to spark interest and get a reply.

ABOUT THE COMPANY:
- Company: ${companyName}
- Industry: ${industry || "General"}
- Person you're writing to: ${contactName}

ABOUT YOUR FEST:
- Festival: ${festName}
- Theme: ${festTheme || "Innovation & Excellence"}
- Dates: ${festDate}
- Expected Audience: ${expectedFootfall}+ attendees
- What makes it special: ${highlights}

TONE: ${tone}

STRICT RULES — follow all of these exactly:
1. Do NOT mention any sponsorship amount, money, pricing, or tiers anywhere in the email. Not even as "investment" or "contribution". Leave all money talk for later conversations.
2. Do NOT use phrases like "cold email", "outreach email", "I hope this email finds you well", "I am writing to you", "My name is X and I am from Y".
3. Do NOT open with the fest name or your name. Open with something that feels specific to ${companyName} or their industry — a genuine observation, a shared value, or a compliment that feels human.
4. Keep it SHORT — max 150 words in the body. Busy people don't read long emails.
5. The email should sound like it was written by a real student, not a template or AI. No corporate jargon.
6. End with ONE simple, low-pressure ask — like "Would you be open to a 10-minute call?" or "Can I send you more details?" — not "please sponsor us".
7. Write a clever, curiosity-inducing subject line that does NOT say "Sponsorship" or "Partnership".

FORMAT:
Subject: [subject line here]

[email body here]

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
