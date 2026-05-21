import { createClient } from "@/utils/supabase/server";
import { syncGmailForUser } from "@/lib/sync/gmail";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncGmailForUser(user.id);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Manual Sync Error:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
