import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import {
  uploadImageToHostingerFtp,
  type ImageUploadFolder,
} from "@/lib/hostinger/ftp-upload";
import { isHostingerFtpConfigured } from "@/lib/hostinger/env";

const FOLDERS = new Set<ImageUploadFolder>(["articles", "ads", "inline"]);

export async function POST(request: NextRequest) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isHostingerFtpConfigured()) {
    return NextResponse.json(
      {
        error:
          "Hostinger FTP is not configured. Add FTP_HOST, FTP_USER, FTP_PASSWORD, and FTP_PUBLIC_BASE_URL to .env.",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  const folderRaw = String(formData.get("folder") ?? "articles");
  const folder: ImageUploadFolder = FOLDERS.has(folderRaw as ImageUploadFolder)
    ? (folderRaw as ImageUploadFolder)
    : "articles";

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, remotePath } = await uploadImageToHostingerFtp(buffer, {
      mimeType: file.type || "application/octet-stream",
      originalName: file.name || "upload",
      folder,
    });

    return NextResponse.json({ url, remotePath });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload image to Hostinger.";
    console.error("[upload-image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
