import { NextResponse } from "next/server";
import { getApplicationById } from "@/lib/applications-store";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const STORAGE_PREFIX = "/storage/v1/object/public/resumes/";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const application = await getApplicationById(id);
  if (!application?.resumeUrl) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const prefixIndex = application.resumeUrl.indexOf(STORAGE_PREFIX);
  if (prefixIndex === -1) {
    return NextResponse.json({ error: "Invalid resume URL" }, { status: 400 });
  }
  const storagePath = application.resumeUrl.slice(prefixIndex + STORAGE_PREFIX.length);

  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    console.error("[resume] createSignedUrl failed:", error);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
