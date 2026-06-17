import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  festType: z.string().optional(),
  college: z.string().optional(),
  city: z.string().optional(),
  theme: z.string().optional(),
  edition: z.string().optional(),
  eventDates: z.string().optional(),
  expectedFootfall: z.number().nullable().optional(),
  socialMediaReach: z.number().nullable().optional(),
  websiteUrl: z.string().optional(),
  instagramHandle: z.string().optional(),
  pitchHighlights: z.string().optional(),
  packages: z.string().optional(), // JSON string
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await db.festProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(profiles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const profile = await db.festProfile.create({
      data: { ...data, userId: session.user.id },
    });
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[FestProfiles POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
