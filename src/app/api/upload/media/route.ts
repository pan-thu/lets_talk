import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { auth } from "~/server/auth";

// Generic media upload endpoint (video/audio/pdf/file). Returns a URL. No DB writes.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mediaType = (formData.get("type") as string | null)?.toLowerCase() || "file"; // video | audio | pdf | file

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file types based on mediaType
    const allowedByType: Record<string, string[]> = {
      video: ["video/mp4", "video/webm", "video/ogg"],
      audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"],
      pdf: ["application/pdf"],
      file: [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/x-zip-compressed",
      ],
    };

    const isAllowed = Object.prototype.hasOwnProperty.call(allowedByType, mediaType)
      ? allowedByType[mediaType].includes(file.type)
      : true; // default permissive for unknown type

    if (!isAllowed) {
      return NextResponse.json({ error: "File type not allowed for this media type" }, { status: 400 });
    }

    // Validate file size (50MB default)
    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "File size must be less than 50MB" }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const safeType = ["video", "audio", "pdf", "file"].includes(mediaType) ? mediaType : "file";
    const filename = `${safeType}-${session.user.id}-${timestamp}.${extension}`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, fileUrl });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


