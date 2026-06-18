import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const sponsor = await db.sponsor.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const llmConfig = await db.llmConfig.findUnique({
      where: { userId: session.user.id },
    });

    let researchResult = "";

    // If active API config exists, fetch research via LLM
    if (
      llmConfig &&
      llmConfig.apiKey &&
      !llmConfig.apiKey.includes("change_in_production") &&
      llmConfig.apiKey !== "mock"
    ) {
      try {
        const decryptedKey = decrypt(llmConfig.apiKey);
        const systemPrompt = `You are a corporate intelligence analyst helping college fest organizers research potential brand sponsors.
You write highly insightful, actionable, and structured summaries of a company's target audience, recent marketing campaigns, and what deliverables (e.g. tech hackathons, cultural stages, stalls) they would value most. Keep it concise, structured in markdown, and under 150 words.`;

        const userPrompt = `Research the brand:
- Company: ${sponsor.companyName}
- Industry: ${sponsor.industry || "Technology/Consumer Goods"}
- Website: ${sponsor.website || "Not specified"}

Provide a markdown outline covering:
1. **Target Demographics**: Who they target.
2. **Current Marketing Angle**: What campaigns/products they focus on.
3. **Outreach Angle**: 1-2 specific suggestions on how a college fest can pitch them (e.g. hackathon title sponsor, gaming zones, offline activation stalls).`;

        const response = await fetch(`${llmConfig.apiBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decryptedKey}`,
          },
          body: JSON.stringify({
            model: llmConfig.modelName || "claude-3-5-sonnet-20241022",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 512,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          researchResult = data.choices?.[0]?.message?.content || "";
        } else {
          console.warn("[Research Route] LLM request failed, falling back to mock");
        }
      } catch (err) {
        console.error("[Research Route] LLM call error, using mock fallback", err);
      }
    }

    // Fallback Mock research if LLM failed or isn't configured
    if (!researchResult) {
      researchResult = getMockResearch(sponsor.companyName, sponsor.industry);
    }

    const updatedSponsor = await db.sponsor.update({
      where: { id },
      data: {
        aiResearch: researchResult,
      },
    });

    return NextResponse.json(updatedSponsor);
  } catch (err) {
    console.error("[Sponsors Research POST]", err);
    return NextResponse.json({ error: "Failed to perform AI research" }, { status: 500 });
  }
}

function getMockResearch(companyName: string, industry: string | null): string {
  const ind = industry || "innovative products";
  return `### 🔍 AI Brand Dossier: ${companyName}

1. **Target Demographics**: 
   - Primary: Gen Z, college students, and young working professionals (aged 18-28).
   - Tech-centric, active on social media (Instagram, YouTube), and values peer recommendations.

2. **Current Marketing Angle**:
   - Experiential campaigns focused on high-engagement offline touchpoints.
   - Actively pushing campus ambassador networks and micro-influencer content in the **${ind}** market.

3. **Suggested Outreach Angles**:
   - **Offline Activation Zone**: Sponsor a dedicated experience booth (e.g., product trials or gaming zones) in the main courtyard.
   - **Event Title Branding**: Pitch them to sponsor the flagship competitive event that matches their target persona (e.g. Coding competition, Fashion show).`;
}
