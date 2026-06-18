import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { SponsorDetailClient } from "@/components/sponsors/sponsor-detail-client";

export default async function SponsorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const sponsor = await db.sponsor.findFirst({
    where: { id, userId: session.user.id },
    include: {
      outreaches: {
        include: {
          campaign: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!sponsor) notFound();

  // Convert dates to string so they serialize correctly to client components
  const serializedOutreaches = sponsor.outreaches.map((o) => ({
    ...o,
    sentAt: o.sentAt ? o.sentAt.toISOString() : null,
    repliedAt: o.repliedAt ? o.repliedAt.toISOString() : null,
  }));

  const serializedSponsor = {
    ...sponsor,
    outreaches: serializedOutreaches,
  };

  return <SponsorDetailClient sponsor={serializedSponsor as any} />;
}
