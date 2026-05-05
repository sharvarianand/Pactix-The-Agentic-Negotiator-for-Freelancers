import { NextResponse } from "next/server";
import { ensureFreelancerProfile } from "@/lib/auth/sync";

export async function POST(req: Request) {
  try {
    const { userId, email, name } = await req.json();
    
    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const freelancer = await ensureFreelancerProfile(userId, email, name);

    return NextResponse.json({ ok: true, freelancer });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
