import { getGoogleOAuthClient, GMAIL_SCOPES } from "@/lib/google";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oauth2Client = getGoogleOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent", // Force consent to ensure we get a refresh token
    state: user.id,   // Pass user ID to verify in callback
  });

  return NextResponse.redirect(url);
}
