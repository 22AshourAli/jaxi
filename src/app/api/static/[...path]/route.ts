import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PUBLIC = path.join(process.cwd(), "public");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".html": "text/html",
  ".txt": "text/plain",
  ".json": "application/json",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const filePath = path.join(PUBLIC, ...segments);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME[ext] || "application/octet-stream";
    const content = fs.readFileSync(filePath);

    return new NextResponse(content, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(stat.size),
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
