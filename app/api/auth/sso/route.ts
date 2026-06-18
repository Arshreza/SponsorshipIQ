import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Returns mock SSO/SAML configuration details for university portal integrations
  return NextResponse.json({
    status: "SSO_CONFIGURED",
    provider: "OpenID Connect / SAML 2.0",
    clientId: "sponsorshipiq-university-client-id",
    issuerUrl: "https://sso.dau.ac.in/auth/realms/campus",
    authorizationEndpoint: "https://sso.dau.ac.in/auth/realms/campus/protocol/openid-connect/auth",
    tokenEndpoint: "https://sso.dau.ac.in/auth/realms/campus/protocol/openid-connect/token",
    userInfoEndpoint: "https://sso.dau.ac.in/auth/realms/campus/protocol/openid-connect/userinfo",
    activeFederationsCount: 1,
    verifiedCampusDomains: ["dau.ac.in", "student.dau.ac.in"],
    syncSchedule: "Every 24 hours at 00:00",
  });
}
