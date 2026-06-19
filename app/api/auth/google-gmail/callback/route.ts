import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const dashboardSettingsUrl = new URL("/dashboard/settings/email", req.url);

  if (error) {
    console.error("[Google OAuth Callback Error]", error);
    dashboardSettingsUrl.searchParams.set("error", error);
    return NextResponse.redirect(dashboardSettingsUrl);
  }

  if (!code) {
    dashboardSettingsUrl.searchParams.set("error", "no_code");
    return NextResponse.redirect(dashboardSettingsUrl);
  }

  let email = "";
  let refreshToken = "";

  if (code === "mock-auth-code") {
    // Local dev mock fallback
    email = "coordinator.pr@gmail.com";
    refreshToken = "mock-google-refresh-token-value-12345";
  } else {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const redirectUri = `${nextAuthUrl}/api/auth/google-gmail/callback`;

      if (!clientId || !clientSecret) {
        dashboardSettingsUrl.searchParams.set("error", "missing_env_vars");
        return NextResponse.redirect(dashboardSettingsUrl);
      }

      // Exchange authorization code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("[Google OAuth Token Exchange Failed]", errBody);
        dashboardSettingsUrl.searchParams.set("error", "token_exchange_failed");
        return NextResponse.redirect(dashboardSettingsUrl);
      }

      const tokens = await tokenRes.json();
      refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        console.warn("[Google OAuth] No refresh token returned. User may need to re-consent.");
        // Try to continue anyway, but save access token if no refresh token
        // Usually access token is short lived, so we really need prompt=consent and access_type=offline
        refreshToken = tokens.access_token || "";
      }

      // Get user email
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userRes.ok) {
        dashboardSettingsUrl.searchParams.set("error", "failed_fetching_userinfo");
        return NextResponse.redirect(dashboardSettingsUrl);
      }

      const userInfo = await userRes.json();
      email = userInfo.email;
    } catch (err) {
      console.error("[Google OAuth Callback Processing Error]", err);
      dashboardSettingsUrl.searchParams.set("error", "processing_failed");
      return NextResponse.redirect(dashboardSettingsUrl);
    }
  }

  if (!email || !refreshToken) {
    dashboardSettingsUrl.searchParams.set("error", "invalid_credentials");
    return NextResponse.redirect(dashboardSettingsUrl);
  }

  try {
    const encryptedToken = encrypt(refreshToken);

    // Check if EmailAccount already exists for this email address and user
    const existingAccount = await db.emailAccount.findFirst({
      where: {
        userId: session.user.id,
        emailAddress: email,
      },
    });

    if (existingAccount) {
      await db.emailAccount.update({
        where: { id: existingAccount.id },
        data: {
          gmailAppPassword: encryptedToken, // store encrypted oauth token/refresh token here
          status: "CONNECTED",
          isActive: true,
          lastError: null,
        },
      });
    } else {
      await db.emailAccount.create({
        data: {
          userId: session.user.id,
          emailAddress: email,
          displayName: email.split("@")[0],
          provider: "GMAIL",
          gmailAppPassword: encryptedToken,
          dailyLimit: 50,
          sentToday: 0,
          status: "CONNECTED",
          isActive: true,
        },
      });
    }

    dashboardSettingsUrl.searchParams.set("success", "true");
    return NextResponse.redirect(dashboardSettingsUrl);
  } catch (err) {
    console.error("[Google OAuth DB Save Error]", err);
    dashboardSettingsUrl.searchParams.set("error", "database_save_failed");
    return NextResponse.redirect(dashboardSettingsUrl);
  }
}
