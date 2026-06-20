import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCampaignPitch } from "@/lib/llm/pitch-generator";
import { sendEmail } from "@/lib/email/sender";
import { decrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  // Allow manual invocation in dev, otherwise verify CRON token if set in prod
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (process.env.NODE_ENV === "production" && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Find ACTIVE campaigns
    const activeCampaigns = await db.campaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        emailAccount: true,
        festProfile: true,
      } as any,
    });

    if (activeCampaigns.length === 0) {
      return NextResponse.json({ message: "No active campaigns found." });
    }

    const processed = [];

    // 2. Process pending outreaches for active campaigns
    for (const campaign of activeCampaigns) {
      // Find pending outreaches for this campaign
      const pendingOutreaches = await db.outreach.findMany({
        where: {
          campaignId: campaign.id,
          status: "PENDING",
        },
        include: {
          sponsor: true,
        } as any,
        take: 3, // process in small batches of 3 per cron trigger
      });

      for (const outreach of pendingOutreaches) {
        try {
          const sponsor = outreach.sponsor;
          const festProfile = campaign.festProfile;
          
          // Setup LLM config fallback to Groq if user config is mock
          const llmConfig = await db.llmConfig.findUnique({
            where: { userId: campaign.userId },
          });

          let apiKey = llmConfig?.apiKey ? (llmConfig.apiKey === "mock" ? "mock" : decrypt(llmConfig.apiKey)) : "mock";
          let apiBaseUrl = llmConfig?.apiBaseUrl || "https://api.anthropic.com/v1";
          let modelName = llmConfig?.modelName || "claude-3-5-sonnet-20241022";

          // Groq fallback if mock or missing
          if ((apiKey === "mock" || !apiKey) && process.env.GROQ_API_KEY) {
            apiKey = process.env.GROQ_API_KEY;
            apiBaseUrl = "https://api.groq.com/openai/v1";
            modelName = "llama3-8b-8192";
          }

          // 3. Generate safe campaign pitch (No financial amounts)
          const pitch = await generateCampaignPitch(
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
              packages: null, // explicitly omit to prevent LLM mock fallback using default packages
              pitchHighlights: festProfile.pitchHighlights,
              companyName: sponsor.companyName,
              industry: sponsor.industry,
              website: sponsor.website,
              contactName: sponsor.contactName,
              aiResearch: sponsor.aiResearch,
              senderName: campaign.emailAccount?.displayName || "Sponsorship Committee",
              senderEmail: campaign.emailAccount?.emailAddress || "coordinator@sponsorshipiq.com",
              guidelines: campaign.guidelines,
              toneOfVoice: campaign.toneOfVoice,
              emailWordLimit: campaign.emailWordLimit,
              subjectTemplate: campaign.subjectTemplate,
            },
            {
              apiBaseUrl,
              apiKey,
              modelName,
            }
          );

          // 4. Send email if account connected, otherwise save draft
          if (campaign.emailAccount && (campaign.emailAccount.gmailAppPassword || campaign.emailAccount.smtpPassword)) {
            const info = await sendEmail({
              account: campaign.emailAccount,
              to: sponsor.contactEmail,
              subject: pitch.subject,
              html: pitch.body,
            });
            const messageId = (info as any)?.messageId || `msg-${Date.now()}`;

            // Update outreach to SENT
            await db.outreach.update({
              where: { id: outreach.id },
              data: {
                subject: pitch.subject,
                body: pitch.body,
                status: "SENT",
                sentAt: new Date(),
                messageId,
                generatedAt: new Date(),
              },
            });

            // Increment campaign stats
            await db.campaign.update({
              where: { id: campaign.id },
              data: {
                sent: { increment: 1 } as any,
              },
            });

            // Update sender email account stats
            await db.emailAccount.update({
              where: { id: campaign.emailAccount.id },
              data: {
                sentToday: { increment: 1 } as any,
              },
            });

            processed.push({ id: outreach.id, sponsor: sponsor.companyName, status: "SENT" });
          } else {
            // Save as DRAFTED if no email account is linked to campaign
            await db.outreach.update({
              where: { id: outreach.id },
              data: {
                subject: pitch.subject,
                body: pitch.body,
                status: "DRAFTED",
                generatedAt: new Date(),
              },
            });

            // Increment campaign stats
            await db.campaign.update({
              where: { id: campaign.id },
              data: {
                drafted: { increment: 1 } as any,
              },
            });

            processed.push({ id: outreach.id, sponsor: sponsor.companyName, status: "DRAFTED" });
          }
        } catch (outreachErr: any) {
          console.error(`Failed to process outreach ${outreach.id}:`, outreachErr);
          await db.outreach.update({
            where: { id: outreach.id },
            data: {
              status: "FAILED",
              generationError: outreachErr.message || "Failed during autonomous processing",
            },
          });
          processed.push({ id: outreach.id, sponsor: outreach.sponsor.companyName, status: "FAILED" });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed.length} outreaches.`,
      details: processed,
    });
  } catch (err: any) {
    console.error("[Outreach Cron Job Failed]", err);
    return NextResponse.json({ error: "Cron job failed", details: err.message }, { status: 500 });
  }
}
