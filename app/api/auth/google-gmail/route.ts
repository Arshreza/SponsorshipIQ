import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${nextAuthUrl}/api/auth/google-gmail/callback`;

  // Fallback to mock authorization if client ID is not configured
  if (!clientId) {
    console.warn("GOOGLE_CLIENT_ID is not set. Redirecting to mock Gmail auth callback.");
    return NextResponse.redirect(`${redirectUri}?code=mock-auth-code`);
  }

  // Construct Google OAuth URL
  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email"
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}
