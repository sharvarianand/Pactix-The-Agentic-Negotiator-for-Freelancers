import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, voiceStyleSamples, floorRateHourly } = await req.json();

    const freelancer = await prisma.freelancer.update({
      where: { id: user.id },
      data: {
        name,
        email,
        voiceStyleSamples: voiceStyleSamples ? JSON.stringify(voiceStyleSamples) : undefined,
        floorRateHourly,
      },
    });

    // Also update Supabase metadata to keep sidebar in sync
    await supabase.auth.updateUser({
      data: { full_name: name }
    });

    return NextResponse.json({ ok: true, freelancer });
  } catch (error: any) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
