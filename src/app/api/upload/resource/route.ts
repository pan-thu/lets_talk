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
    const courseId = formData.get("courseId") as string;
    const resourceType = formData.get("resourceType") as string; // 'lesson' or 'exercise'

    if (!file || !courseId || !resourceType) {
      return NextResponse.json({ error: "File, course ID, and resource type required" }, { status: 400 });
    }

    // Validate file types
    const allowedTypes = [
      "video/mp4", "video/webm", "video/ogg",
      "audio/mpeg", "audio/wav", "audio/ogg",
      "application/pdf", "text/plain", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 50MB" }, { status: 400 });
    }

    // Verify course ownership
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        teacherId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `resource-${courseId}-${resourceType}-${timestamp}.${extension}`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const resourceUrl = `/uploads/${filename}`;

    // Create resource record in database
    const resource = await db.resource.create({
      data: {
        title: file.name,
        type: resourceType as "lesson" | "exercise",
        url: resourceUrl,
        courseId: courseId,
      },
    });

    return NextResponse.json({ success: true, resourceUrl, resourceId: resource.id });
  } catch (error) {
    console.error("Resource upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
