import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { apiBaseUrl, apiKey, modelName } = await req.json();

    if (!apiBaseUrl || !apiKey) {
      return NextResponse.json(
        { error: "apiBaseUrl and apiKey are required" },
        { status: 400 }
      );
    }

    const encrypted = encrypt(apiKey);

    await db.llmConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        apiBaseUrl,
        apiKey: encrypted,
        modelName: modelName || "claude-3-5-sonnet-20241022",
        isValid: true,
      },
      update: {
        apiBaseUrl,
        apiKey: encrypted,
        modelName: modelName || "claude-3-5-sonnet-20241022",
        isValid: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[LLM Settings POST]", err);
    return NextResponse.json({ error: "Failed to save LLM config" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await db.llmConfig.findUnique({
    where: { userId: session.user.id },
    select: { apiBaseUrl: true, modelName: true, isValid: true },
  });
  return NextResponse.json(config || null);
}
