import { getGoogleOAuthClient } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_code`);
  }

  try {
    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user info to store their email
    oauth2Client.setCredentials(tokens);
    const oauth2 = await import("googleapis").then(g => g.google.oauth2("v2"));
    const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });

    await prisma.connectedAccount.upsert({
      where: {
        freelancerId_provider: {
          freelancerId: userId,
          provider: "google",
        },
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        email: userInfo.data.email,
      },
      create: {
        freelancerId: userId,
        provider: "google",
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        email: userInfo.data.email,
      },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=google_connected`);
  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_failed`);
  }
}
