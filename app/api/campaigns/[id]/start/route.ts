import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action } = await req.json();

    if (action !== "start" && action !== "pause") {
      return NextResponse.json({ error: "Invalid action. Must be 'start' or 'pause'." }, { status: 400 });
    }

    const campaign = await db.campaign.findUnique({
      where: { id, userId: session.user.id } as any,
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (action === "start") {
      if (!campaign.emailAccountId) {
        return NextResponse.json({ error: "No email sender account linked to this campaign. Please connect and select an email account first." }, { status: 400 });
      }
      
      const emailAcc = await db.emailAccount.findUnique({
        where: { id: campaign.emailAccountId } as any,
      });

      if (!emailAcc || emailAcc.status !== "CONNECTED") {
        return NextResponse.json({ error: "The linked email account is disconnected or invalid. Please verify it in Email Settings." }, { status: 400 });
      }
    }

    const newStatus = action === "start" ? "ACTIVE" : "PAUSED";

    const updatedCampaign = await db.campaign.update({
      where: { id },
      data: {
        status: newStatus,
        launchedAt: action === "start" && !campaign.launchedAt ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, status: updatedCampaign.status });
  } catch (err) {
    console.error("[Campaign Action Failed]", err);
    return NextResponse.json({ error: "Failed to perform action on campaign" }, { status: 500 });
  }
}
