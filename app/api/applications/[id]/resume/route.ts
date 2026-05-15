import { NextResponse } from "next/server";
import { getApplicationById } from "@/lib/applications-store";

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
  const storagePath = application.resumeUrl
    .slice(prefixIndex + STORAGE_PREFIX.length)
    .split("?")[0];

  const fileRes = await fetch(application.resumeUrl);
  if (!fileRes.ok) {
    return NextResponse.json({ error: "Resume file not found in storage" }, { status: 404 });
  }

  const ext = storagePath.split(".").pop() ?? "pdf";
  const contentType = fileRes.headers.get("content-type") ?? "application/octet-stream";

  return new Response(fileRes.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="resume.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}
