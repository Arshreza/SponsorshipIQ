import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { syncCampaignStats } from "../route";

// Mock reply generator if LLM is not configured
function getMockReplyDraft(festName: string, companyName: string, incomingEmail: string, packagesText: string) {
  const lowercase = incomingEmail.toLowerCase();
  
  let category = "NEEDS_MORE_INFO";
  let draft = "";

  if (lowercase.includes("not interested") || lowercase.includes("no budget") || lowercase.includes("decline")) {
    category = "NOT_INTERESTED";
    draft = `Dear Marketing Team at ${companyName},\n\nThank you for letting us know. We completely understand and respect your decision. We hope to connect with ${companyName} for future editions of ${festName}.\n\nBest regards,\nSponsorship Committee\n${festName}`;
  } else if (lowercase.includes("send deck") || lowercase.includes("interested") || lowercase.includes("packages") || lowercase.includes("details")) {
    category = "INTERESTED";
    const firstPackage = packagesText.includes("₹") ? packagesText.split("\n")[0] : "Co-Sponsor tier (₹1,00,000)";
    draft = `Dear Marketing Team,\n\nWe are absolutely thrilled by your interest in collaborating with ${festName} 2025!\n\nAs requested, I have attached our complete sponsorship deck outlining deliverables. Based on your brand focus, we recommend the ${firstPackage}, which provides high-visibility stall spaces in our primary food court and logo branding across all main stage backdrops.\n\nAre you available for a brief 5-minute call this Thursday at 4 PM to discuss custom activations?\n\nBest regards,\nSponsorship Committee\n${festName}`;
  } else {
    draft = `Dear Marketing Team,\n\nThank you for reaching out regarding ${festName} 2025. We appreciate your response.\n\nCould you please let us know if you would like us to share our packages brochure (packages details:\n${packagesText}) or schedule a brief phone call with our sponsorship head?\n\nBest regards,\nSponsorship Committee\n${festName}`;
  }

  return { category, replyDraft: draft };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { incomingEmail } = await req.json();

    if (!incomingEmail) {
      return NextResponse.json({ error: "Incoming email content is required" }, { status: 400 });
    }

    const outreach = await db.outreach.findUnique({
      where: { id },
      include: {
        sponsor: true,
        campaign: {
          include: {
            festProfile: true,
          },
        },
      },
    });

    if (!outreach || outreach.campaign.userId !== session.user.id) {
      return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
    }

    const { campaign, sponsor } = outreach;
    const { festProfile } = campaign;

    // Load configuration
    const llmConfig = await db.llmConfig.findUnique({ where: { userId: session.user.id } });
    const apiKey = llmConfig?.apiKey ? (llmConfig.apiKey === "mock" ? "mock" : decrypt(llmConfig.apiKey)) : "mock";

    const isMock = !apiKey || apiKey === "mock" || apiKey.includes("mock") || apiKey.includes("change_in_production");

    // Format packages text
    let packagesText = "";
    if (festProfile.packages) {
      try {
        const pkgs = JSON.parse(festProfile.packages);
        packagesText = pkgs.map((p: any) => `• ${p.tier} (₹${p.amount}): ${p.benefits.join(", ")}`).join("\n");
      } catch {
        packagesText = festProfile.packages;
      }
    }

    let resultCategory = "NEEDS_MORE_INFO";
    let resultReplyDraft = "";

    if (isMock) {
      const mockResult = getMockReplyDraft(festProfile.name, sponsor.companyName, incomingEmail, packagesText);
      resultCategory = mockResult.category;
      resultReplyDraft = mockResult.replyDraft;
    } else {
      try {
        const systemPrompt = `You are a professional sponsorship outreach manager for the college festival ${festProfile.name}.
Given an incoming email from a target sponsor brand (${sponsor.companyName}), your job is to:
1. Classify the sentiment category into exactly one of: "INTERESTED", "NEEDS_MORE_INFO", "NOT_INTERESTED".
2. Write a highly personalized, polite, and persuasive follow-up email that answers their questions. Negotiate or suggest tiers using these festival packages:\n${packagesText}.
3. Keep the draft under 150 words, tone should be professional and direct. Do not say "Dear Brand Team" if you have a contact name (${sponsor.contactName || "Marketing Team"}).

Output JSON format exactly:
{
  "category": "INTERESTED" | "NEEDS_MORE_INFO" | "NOT_INTERESTED",
  "replyDraft": "follow up email body"
}`;

        const userPrompt = `INCOMING EMAIL FROM SPONSOR (${sponsor.companyName}):
"${incomingEmail}"

FESTIVAL DELIVERABLE PACKAGES:
${packagesText}

Output the response in JSON format.`;

        const response = await fetch(`${llmConfig?.apiBaseUrl || "https://api.anthropic.com/v1"}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: llmConfig?.modelName || "claude-3-5-sonnet-20241022",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 1024,
            temperature: 0.5,
          }),
        });

        if (!response.ok) {
          throw new Error(`API Status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          resultCategory = parsed.category || "NEEDS_MORE_INFO";
          resultReplyDraft = parsed.replyDraft || "";
        } else {
          throw new Error("No JSON found");
        }
      } catch (err) {
        console.warn("[Reply Analyzer API] LLM failed, running mock responder fallback:", err);
        const mockResult = getMockReplyDraft(festProfile.name, sponsor.companyName, incomingEmail, packagesText);
        resultCategory = mockResult.category;
        resultReplyDraft = mockResult.replyDraft;
      }
    }

    // Map reply category to database outreach status
    let statusToUpdate = "REPLIED";
    let dbCategory = "NEEDS_MORE_INFO";

    if (resultCategory === "INTERESTED") {
      statusToUpdate = "INTERESTED";
      dbCategory = "INTERESTED";
    } else if (resultCategory === "NOT_INTERESTED") {
      statusToUpdate = "REJECTED";
      dbCategory = "NOT_INTERESTED";
    }

    // Log the reply in outreach notes and update status
    const updatedNotes = [
      outreach.replyNotes,
      `[INCOMING SPONSOR EMAIL]\n${incomingEmail}`,
      `[AI GENERATED REPLY SUGGESTION]\n${resultReplyDraft}`
    ].filter(Boolean).join("\n\n");

    const updated = await db.outreach.update({
      where: { id },
      data: {
        status: statusToUpdate as any,
        replyNotes: updatedNotes,
        replyCategory: dbCategory as any,
        repliedAt: new Date(),
      },
    });

    // Update campaign stats
    await syncCampaignStats(campaign.id);

    return NextResponse.json({
      success: true,
      category: resultCategory,
      replyDraft: resultReplyDraft,
      outreach: updated,
    });
  } catch (err) {
    console.error("[Outreach DRAFT REPLY API error]", err);
    return NextResponse.json({ error: "Failed to analyze and draft reply" }, { status: 500 });
  }
}
