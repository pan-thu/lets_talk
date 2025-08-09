import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;

    if (!file || !sessionId) {
      return NextResponse.json({ error: "File and session ID required" }, { status: 400 });
    }

    // Validate file type (audio/video)
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "File must be audio or video" }, { status: 400 });
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 100MB" }, { status: 400 });
    }

    // Verify session ownership
    const liveSession = await db.liveSession.findFirst({
      where: {
        id: sessionId,
        teacherId: session.user.id,
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found or access denied" }, { status: 404 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `recording-${sessionId}-${timestamp}.${extension}`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update session with recording URL
    const recordingUrl = `/uploads/${filename}`;
    await db.liveSession.update({
      where: { id: sessionId },
      data: { recordingUrl },
    });

    return NextResponse.json({ success: true, recordingUrl });
  } catch (error) {
    console.error("Recording upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
