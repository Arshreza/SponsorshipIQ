import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePitch, generateFollowupPitch } from "@/lib/llm/pitch-generator";
import { decrypt } from "@/lib/encryption";
import { syncCampaignStats } from "../route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const bodyData = await req.json();
    const { promptFeedback } = bodyData;

    // Fetch details
    const outreach = await db.outreach.findUnique({
      where: { id },
      include: {
        sponsor: true,
        campaign: {
          include: {
            festProfile: true,
            emailAccount: true,
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

    // Incorporate custom feedback prompt into guidelines
    const feedbackGuidelines = [
      campaign.guidelines,
      promptFeedback ? `CRITICAL USER INSTRUCTION FOR ADJUSTMENT:\n${promptFeedback}` : null
    ].filter(Boolean).join("\n\n");

    const result = await generatePitch(
      {
        festName: festProfile.name,
        festType: festProfile.festType,
        college: festProfile.college,
        city: festProfile.city,
        theme: festProfile.theme,
        edition: festProfile.edition,
        eventDates: festProfile.eventDates,
        expectedFootfall: festProfile.expectedFootfall,
        socialMediaReach: festProfile.socialMediaReach,
        packages: festProfile.packages,
        pitchHighlights: festProfile.pitchHighlights,
        companyName: sponsor.companyName,
        industry: sponsor.industry,
        website: sponsor.website,
        contactName: sponsor.contactName,
        aiResearch: sponsor.aiResearch,
        senderName: campaign.emailAccount?.displayName,
        senderEmail: campaign.emailAccount?.emailAddress || "",
        guidelines: feedbackGuidelines,
        toneOfVoice: campaign.toneOfVoice,
        emailWordLimit: campaign.emailWordLimit,
        subjectTemplate: campaign.subjectTemplate,
      },
      {
        apiBaseUrl: llmConfig?.apiBaseUrl || "https://api.anthropic.com/v1",
        apiKey: apiKey,
        modelName: llmConfig?.modelName,
      }
    );

    const followupResult = await generateFollowupPitch(
      result,
      {
        festName: festProfile.name,
        festType: festProfile.festType,
        college: festProfile.college,
        city: festProfile.city,
        theme: festProfile.theme,
        edition: festProfile.edition,
        eventDates: festProfile.eventDates,
        expectedFootfall: festProfile.expectedFootfall,
        socialMediaReach: festProfile.socialMediaReach,
        packages: festProfile.packages,
        pitchHighlights: festProfile.pitchHighlights,
        companyName: sponsor.companyName,
        industry: sponsor.industry,
        website: sponsor.website,
        contactName: sponsor.contactName,
        aiResearch: sponsor.aiResearch,
        senderName: campaign.emailAccount?.displayName,
        senderEmail: campaign.emailAccount?.emailAddress || "",
        guidelines: feedbackGuidelines,
        toneOfVoice: campaign.toneOfVoice,
        emailWordLimit: campaign.emailWordLimit,
        subjectTemplate: campaign.subjectTemplate,
      },
      {
        apiBaseUrl: llmConfig?.apiBaseUrl || "https://api.anthropic.com/v1",
        apiKey: apiKey,
        modelName: llmConfig?.modelName,
      }
    );

    const mergedSubject = `${result.subject}\n\n--- FOLLOW-UP SUBJECT ---\n\n${followupResult.subject}`;
    const mergedBody = `${result.body}\n\n--- FOLLOW-UP BODY ---\n\n${followupResult.body}`;

    const updated = await db.outreach.update({
      where: { id },
      data: {
        subject: mergedSubject,
        body: mergedBody,
        status: "DRAFTED",
        generatedAt: new Date(),
        generationError: null,
      },
    });

    // Sync stats
    await syncCampaignStats(campaign.id);

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Outreach REGENERATE API]", err);
    return NextResponse.json({ error: "Failed to regenerate AI pitch" }, { status: 500 });
  }
}
