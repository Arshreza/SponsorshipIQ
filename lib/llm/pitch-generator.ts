interface PitchContext {
  // Fest info
  festName: string;
  festType?: string | null;
  college?: string | null;
  city?: string | null;
  theme?: string | null;
  edition?: string | null;
  eventDates?: string | null;
  expectedFootfall?: number | null;
  socialMediaReach?: number | null;
  packages?: string | null; // JSON string
  pitchHighlights?: string | null;

  // Sponsor/Brand info
  companyName: string;
  industry?: string | null;
  website?: string | null;
  contactName?: string | null;
  aiResearch?: string | null;

  // Sender info
  senderName?: string | null;
  senderEmail: string;

  // Campaign settings
  guidelines?: string | null;
  toneOfVoice?: string | null;
  emailWordLimit?: number;
  subjectTemplate?: string | null;
}

export function buildPitchPrompt(ctx: PitchContext): {
  system: string;
  user: string;
} {
  let packagesText = "";
  if (ctx.packages) {
    try {
      const pkgs = JSON.parse(ctx.packages);
      packagesText = pkgs
        .map(
          (p: { tier: string; amount: string; benefits: string[] }) =>
            `• ${p.tier} (₹${p.amount}): ${p.benefits.join(", ")}`
        )
        .join("\n");
    } catch {
      packagesText = ctx.packages;
    }
  }

  const system = `You are a senior sponsorship outreach specialist for college festivals in India. 
You write concise, compelling, highly personalized cold sponsorship pitch emails that get replies.

RULES:
1. Open with a genuine, specific hook — reference something real about the brand (recent campaign, product launch, CSR initiative, or known marketing focus for their industry)
2. Connect the brand's audience/goals to the fest's demographics (college students aged 18-22)
3. Mention 1-2 specific sponsorship packages that fit the brand's scale
4. Keep the email under ${ctx.emailWordLimit || 200} words
5. Tone: ${ctx.toneOfVoice || "Professional yet energetic, peer-to-peer, not corporate"}
6. End with a clear, easy CTA — a 15-minute call or a deck link
7. NO generic openings like "I hope this email finds you well"
8. NO mention of other competing brands
9. Use INR currency (₹) for amounts
10. Sign off with the sender's name and fest

${ctx.guidelines ? `ADDITIONAL GUIDELINES:\n${ctx.guidelines}` : ""}`;

  const user = `Write a sponsorship pitch email for:

FEST PROFILE:
- Name: ${ctx.festName}${ctx.edition ? ` (${ctx.edition})` : ""}
- Type: ${ctx.festType || "College Festival"}
- College: ${ctx.college || "Premier engineering college"}
- City: ${ctx.city || "India"}
- Theme: ${ctx.theme || "Innovation & Culture"}
- Dates: ${ctx.eventDates || "Coming soon"}
- Expected Footfall: ${ctx.expectedFootfall ? `${ctx.expectedFootfall.toLocaleString()} attendees` : "3,000+ students"}
- Social Media Reach: ${ctx.socialMediaReach ? `${ctx.socialMediaReach.toLocaleString()} followers` : "10,000+ across platforms"}
${ctx.pitchHighlights ? `- Highlights: ${ctx.pitchHighlights}` : ""}

SPONSORSHIP PACKAGES:
${packagesText || "• Title Sponsor (₹2,00,000): Logo on all banners, stage time, social media spotlight\n• Co-Sponsor (₹1,00,000): Logo placement, stall space, social mention\n• Associate (₹50,000): Logo on website and event materials"}

TARGET BRAND:
- Company: ${ctx.companyName}
- Industry: ${ctx.industry || "Not specified"}
- Website: ${ctx.website || "Not available"}
${ctx.contactName ? `- Contact: ${ctx.contactName}` : ""}
${ctx.aiResearch ? `- Brand Research: ${ctx.aiResearch}` : ""}

SENDER:
- Name: ${ctx.senderName || "Sponsorship Team"}
- Email: ${ctx.senderEmail}
- Role: Sponsorship Committee, ${ctx.festName}

${ctx.subjectTemplate ? `SUBJECT LINE TEMPLATE: ${ctx.subjectTemplate}` : ""}

Output JSON with exactly these fields:
{
  "subject": "email subject line",
  "body": "full email body as plain text with \\n for line breaks"
}`;

  return { system, user };
}

export interface LlmConfig {
  apiBaseUrl: string;
  apiKey: string;
  modelName?: string | null;
}

function getMockPitch(ctx: PitchContext): { subject: string; body: string } {
  const fest = ctx.festName;
  const company = ctx.companyName;
  const industry = ctx.industry || "marketing and engagement";
  const amount = ctx.packages ? "₹1,00,000" : "₹1,50,000";

  const subject = ctx.subjectTemplate 
    ? ctx.subjectTemplate.replace(/{festName}/g, fest).replace(/{companyName}/g, company)
    : `🚀 Sponsorship Outreach: ${fest} x ${company}`;

  const body = `Dear ${ctx.contactName || "Marketing Team"},\n\n` +
    `I am writing on behalf of the organizing committee of ${fest}, the premier ${ctx.festType || "cultural and technical"} festival of ${ctx.college || "our university"}.\n\n` +
    `We have been following ${company}'s active footprints in the ${industry} space and admire your brand's focus on connecting with the youth. ${fest} attracts over ${ctx.expectedFootfall?.toLocaleString() || "5,00,000"} students, offering an unparalleled platform for ${company} to launch brand campaigns and acquire campus brand advocates.\n\n` +
    `We believe our Title Sponsor or Co-Sponsor tier (${amount}) aligns perfectly with your marketing goals, providing high-visibility stall space, social media spotlights to our reach of ${ctx.socialMediaReach?.toLocaleString() || "15,000"} followers, and direct student interaction.\n\n` +
    `I would love to share our sponsorship deck with you. Would you be available for a brief 5-minute call this week?\n\n` +
    `Best regards,\n` +
    `${ctx.senderName || "Sponsorship Committee"}\n` +
    `${ctx.senderEmail}`;

  return { subject, body };
}

export async function generatePitch(
  ctx: PitchContext,
  llmConfig: LlmConfig
): Promise<{ subject: string; body: string }> {
  // Check if mock key is configured
  const apiKey = llmConfig.apiKey;
  const isMock = !apiKey || apiKey === "mock" || apiKey.includes("mock") || apiKey.includes("change_in_production");
  if (isMock) {
    return getMockPitch(ctx);
  }

  try {
    const { system, user } = buildPitchPrompt(ctx);

    const response = await fetch(`${llmConfig.apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.modelName || "claude-3-5-sonnet-20241022",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("LLM did not return valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.subject || !parsed.body) {
      throw new Error("LLM response missing subject or body");
    }

    return { subject: parsed.subject, body: parsed.body };
  } catch (err) {
    console.error("[generatePitch] LLM generation failed, using mock fallback:", err);
    return getMockPitch(ctx);
  }
}

export function buildFollowupPrompt(
  initial: { subject: string; body: string },
  ctx: PitchContext
): { system: string; user: string } {
  const system = `You are a senior sponsorship outreach specialist for college festivals in India.
You write polite, extremely concise, and warm follow-up reminder emails (drip campaigns).

RULES:
1. Be extremely brief (under 80 words).
2. Reference the previous email politely without duplicating the context or packages.
3. Focus on a soft reminder (e.g. locking in branding layout designs or stall spaces this week).
4. Keep the subject line as "Re: " followed by the original subject.
5. Provide a simple, low-friction call to action (a quick call or referral to the right department).
6. Tone: Friendly, professional, and confident.`;

  const user = `Write a follow-up email for:
ORIGINAL SUBJECT: ${initial.subject}
ORIGINAL EMAIL BODY:
${initial.body}

FESTIVAL: ${ctx.festName}
SPONSOR COMPANY: ${ctx.companyName}
SENDER NAME: ${ctx.senderName || "Sponsorship Committee"}

Output JSON with exactly these fields:
{
  "subject": "Re: original subject line",
  "body": "full follow-up email body as plain text with \\n for line breaks"
}`;

  return { system, user };
}

function getMockFollowup(initial: { subject: string; body: string }, ctx: PitchContext): { subject: string; body: string } {
  const subject = initial.subject.startsWith("Re:") ? initial.subject : `Re: ${initial.subject}`;
  const body = `Hi ${ctx.contactName || "Team"},\n\nI wanted to send a quick follow-up to see if you had a chance to review my previous email about ${ctx.festName}.\n\nWe are currently finalizing the stall placements and concert partner branding layouts. We'd love to explore how we can support ${ctx.companyName}'s youth engagement goals here.\n\nWould you have 5 minutes for a quick touch-base this week, or is there a better person to connect with?\n\nBest regards,\n${ctx.senderName || "Sponsorship Committee"}`;
  return { subject, body };
}

export async function generateFollowupPitch(
  initial: { subject: string; body: string },
  ctx: PitchContext,
  llmConfig: LlmConfig
): Promise<{ subject: string; body: string }> {
  const apiKey = llmConfig.apiKey;
  const isMock = !apiKey || apiKey === "mock" || apiKey.includes("mock") || apiKey.includes("change_in_production");
  if (isMock) {
    return getMockFollowup(initial, ctx);
  }

  try {
    const { system, user } = buildFollowupPrompt(initial, ctx);

    const response = await fetch(`${llmConfig.apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.modelName || "claude-3-5-sonnet-20241022",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("LLM did not return valid JSON for follow-up");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.subject || !parsed.body) {
      throw new Error("LLM response missing subject or body for follow-up");
    }

    return { subject: parsed.subject, body: parsed.body };
  } catch (err) {
    console.error("[generateFollowupPitch] LLM generation failed, using mock fallback:", err);
    return getMockFollowup(initial, ctx);
  }
}

