"use client";

import { use } from "react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import VideoPlayerDisplay from "~/_components/features/shared/VideoPlayerDisplay";
import LessonDescription from "~/_components/features/shared/LessonDescription";
import LessonActionPanel from "~/_components/features/shared/LessonActionPanel";
import CommentsSection from "~/_components/features/shared/CommentsSection";
import { api } from "~/trpc/react";

interface LessonDetailPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export default function LessonDetailPage({ params }: LessonDetailPageProps) {
  const resolvedParams = use(params);
  const courseId = Number(resolvedParams.courseId);
  const lessonId = Number(resolvedParams.lessonId);

  // Fetch lesson data
  const {
    data: lessonData,
    isLoading,
    error,
  } = api.student.resource.getById.useQuery(
    { lessonId, courseId },
    {
      enabled: !isNaN(courseId) && !isNaN(lessonId),
    },
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading lesson...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-red-600">
          Error loading lesson: {error.message}
        </div>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Lesson not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[
          { name: "Course", path: "/courses" },
          { name: lessonData.courseTitle, path: `/courses/${courseId}` },
        ]}
        currentPath={lessonData.title}
      />

      <div className="mt-2 flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Main Content: Video and Description */}
        <div className="flex flex-grow flex-col items-center space-y-4 md:space-y-6">
          <h1 className="section-title self-start text-2xl font-bold md:text-3xl">
            {lessonData.title}
          </h1>

          <VideoPlayerDisplay videoUrl={lessonData.url} />

          <LessonDescription
            description={lessonData.content || "No description available"}
          />
        </div>

        {/* Right Side Action Panel */}
        <LessonActionPanel lessonId={lessonId} videoUrl={lessonData.url} />
      </div>

      <CommentsSection lessonId={lessonId} />
    </div>
  );
}


