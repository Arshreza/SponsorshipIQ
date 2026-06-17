import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CampaignDetail } from "@/components/campaigns/campaign-detail";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;

  const campaign = await db.campaign.findFirst({
    where: { id, userId: session.user.id },
    include: {
      festProfile: true,
      sponsorList: { include: { entries: { include: { sponsor: true } } } },
      emailAccount: { select: { id: true, emailAddress: true, displayName: true } },
      outreaches: {
        include: {
          sponsor: { select: { companyName: true, contactEmail: true, contactName: true, industry: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!campaign) notFound();

  return <CampaignDetail campaign={campaign} />;
}
