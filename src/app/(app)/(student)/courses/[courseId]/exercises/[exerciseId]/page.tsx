"use client";

import { use } from "react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { TeacherPromptDisplay } from "~/_components/features/shared/TeacherPromptDisplay";
import { StudentAudioRecorder } from "~/_components/features/student/StudentAudioRecorder";
import { api } from "~/trpc/react";

export default function ExercisePage({
  params,
}: {
  params: Promise<{ courseId: string; exerciseId: string }>;
}) {
  // Unwrap params Promise using React.use()
  const { courseId, exerciseId } = use(params);

  // Fetch exercise details using tRPC
  const {
    data: exerciseData,
    isLoading,
    error,
  } = api.student.resource.getExerciseDetails.useQuery({
    exerciseId: Number(exerciseId),
    courseId: Number(courseId),
  });

  // Mutation for invalidating queries after submission
  const utils = api.useUtils();

  const handleSubmissionSuccess = () => {
    // Invalidate the student submission query to refresh submission status
    utils.student.submission.getSubmissionsForExercise.invalidate({
      exerciseId: Number(exerciseId),
      enrollmentId: exerciseData?.enrollmentId!,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 md:p-6">
        <div className="text-lg">Loading exercise details...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 md:p-6">
        <div className="text-lg text-red-600">
          {error.message ===
          "You must be enrolled in this course to view exercises"
            ? "You are not enrolled in this course. Please enroll first."
            : error.message ===
                "Audio exercise not found or does not belong to this course"
              ? "Exercise not found or you don't have permission to view it."
              : "Error loading exercise details. Please try again."}
        </div>
      </div>
    );
  }

  // No data state
  if (!exerciseData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 md:p-6">
        <div className="text-lg">Exercise not found.</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <BreadcrumbsWithAnimation
        parentPaths={[
          { name: "Course", path: `/courses/${courseId}` },
          { name: "Week 1", path: `/courses/${courseId}` },
        ]}
        currentPath={exerciseData.title}
      />

      {/* Exercise Header */}
      <section className="relative mb-6">
        <h1 className="text-custom-dark-text mb-2 text-xl font-bold md:text-2xl">
          {exerciseData.title}
        </h1>
        <p className="text-custom-light-text text-sm md:text-base">
          Complete this pronunciation exercise by listening to the teacher's
          prompt and recording your response.
        </p>
      </section>

      {/* Combined Exercise Card */}
      <section className="relative flex-1">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm md:p-6">
          {/* Teacher Prompt Section */}
          <div className="mb-6">
            <TeacherPromptDisplay
              textInstructions={exerciseData.textInstructions}
              audioUrl={exerciseData.teacherAudioUrl}
            />
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Student Recording Section */}
          <div>
            <StudentAudioRecorder
              exerciseId={exerciseData.id}
              enrollmentId={exerciseData.enrollmentId}
              onSubmissionSuccess={handleSubmissionSuccess}
            />
          </div>
        </div>

        {/* Recording Tips Card - Bottom Right */}
        <div className="absolute right-4 bottom-4 z-10 hidden lg:block">
          <div
            className="w-72 rounded-lg border border-gray-200 p-3 shadow-sm"
            style={{ backgroundColor: "var(--color-pink)" }}
          >
            <h4 className="text-custom-dark-text mb-2 text-xs font-medium">
              Recording Tips:
            </h4>
            <ul className="text-custom-light-text space-y-0.5 text-xs">
              <li>• Make sure you're in a quiet environment</li>
              <li>• Speak clearly and at a normal pace</li>
              <li>• Hold your device at a comfortable distance</li>
              <li>• You can re-record as many times as needed</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}


