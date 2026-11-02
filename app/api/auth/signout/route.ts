import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${siteUrl()}/`, { status: 303 });
}
