"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Calendar, Clock, Video, Zap } from "lucide-react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { ProgressBarDisplay } from "~/_components/features/student/ProgressBarDisplay";
import { CourseContentAccordion } from "~/_components/features/student/CourseContentAccordion";
import { api } from "~/trpc/react";

interface Lesson {
  id: number;
  title: string;
  type: string;
  isCompleted: boolean;
}

interface Week {
  id: string;
  title: string;
  lessons: Lesson[];
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  // Unwrap params Promise using React.use()
  const { courseId } = use(params);
  const router = useRouter();
  const utils = api.useUtils();

  // Fetch course details for enrolled user
  const {
    data: courseData,
    isLoading,
    error,
  } = api.student.course.getDetailsForEnrolledUser.useQuery({
    courseId: Number(courseId),
  });

  // Toggle lesson completion mutation
  const toggleCompletionMutation =
    api.student.course.toggleLessonCompletion.useMutation({
      onSuccess: () => {
        // Invalidate and refetch course data
        utils.student.course.getDetailsForEnrolledUser.invalidate({
          courseId: Number(courseId),
        });
      },
      onError: (error) => {
        console.error("Error toggling lesson completion:", error);
      },
    });

  // Handle lesson completion changes
  const handleLessonCompletionChange = (
    lessonId: number,
    isCompleted: boolean,
  ) => {
    if (!courseData) return;

    toggleCompletionMutation.mutate({
      lessonId: lessonId,
      courseId: Number(courseId),
      enrollmentId: courseData.enrollmentId,
      isCompleted,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="text-lg">Loading course details...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isNotEnrolled =
      error.message === "You are not enrolled in this course.";
    const isPendingPayment =
      error.message ===
      "Your enrollment is pending payment confirmation. Please complete the payment process first.";

    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          {isNotEnrolled && (
            <>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                Not Enrolled
              </h2>
              <p className="mb-4 text-gray-600">
                You are not enrolled in this course. Please enroll first to
                access the content.
              </p>
              <button
                onClick={() => router.push("/courses")}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                Browse Courses
              </button>
            </>
          )}
          {isPendingPayment && (
            <>
              <h2 className="mb-4 text-xl font-semibold text-orange-800">
                Payment Pending
              </h2>
              <p className="mb-4 text-gray-600">
                Your enrollment is being processed. Please wait for admin
                approval of your payment.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/courses")}
                  className="block w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                >
                  Browse Other Courses
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="block w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  Go to Dashboard
                </button>
              </div>
            </>
          )}
          {!isNotEnrolled && !isPendingPayment && (
            <>
              <h2 className="mb-4 text-xl font-semibold text-red-800">
                Error Loading Course
              </h2>
              <p className="mb-4 text-gray-600">
                {error.message ||
                  "Error loading course details. Please try again."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // No data state
  if (!courseData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="text-lg">Course not found.</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Course", path: "/courses" }]}
        currentPath={courseData.courseTitle}
      />

      {/* Progress Bar Section */}
      <section className="mb-8">
        <h2 className="section-title mb-4 text-xl font-semibold">Progress</h2>
        <ProgressBarDisplay
          progressPercentage={courseData.progressPercentage}
          currentMarks={courseData.currentMarks}
          totalMarks={courseData.totalMarks}
        />
        <hr className="mt-6 border-gray-300" />
      </section>

      {/* Live Sessions Section */}
      <LiveSessionsSection courseId={Number(courseId)} />

      {/* Course Content Section */}
      <section>
        <CourseContentAccordion
          weeks={courseData.weeks}
          courseId={courseId}
          onLessonCompletionChange={handleLessonCompletionChange}
        />
      </section>
    </div>
  );
}

// Live Sessions component for students
function LiveSessionsSection({ courseId }: { courseId: number }) {
  const {
    data: sessions,
    isLoading,
    error,
  } = api.student.course.getLiveSessions.useQuery({ courseId });

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="section-title mb-4 text-xl font-semibold">
          Live Sessions
        </h2>
        <p className="text-gray-500">Loading live sessions...</p>
        <hr className="mt-6 border-gray-300" />
      </section>
    );
  }

  if (error) {
    // Silently fail for live sessions if there are permission issues
    return null;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="section-title mb-4 text-xl font-semibold">
          Live Sessions
        </h2>
        <p className="text-gray-500">
          No live sessions scheduled for this course.
        </p>
        <hr className="mt-6 border-gray-300" />
      </section>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-gray-100 text-gray-700";
      case "joinable":
        return "bg-yellow-100 text-yellow-700";
      case "live":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "missed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();

    if (diffMs <= 0) return null;

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `Starts in ${diffHours}h ${diffMinutes}m`;
    } else {
      return `Starts in ${diffMinutes}m`;
    }
  };

  return (
    <section className="mb-8">
      <h2 className="section-title mb-4 text-xl font-semibold">
        Live Sessions
      </h2>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{session.title}</h3>
                  <span
                    className={`rounded px-2 py-1 text-xs ${getStatusBadge(session.status)}`}
                  >
                    {session.status === "joinable"
                      ? "READY TO JOIN"
                      : session.status.toUpperCase()}
                  </span>
                  {session.status === "live" && (
                    <span className="flex items-center space-x-1 text-red-500">
                      <Zap size={14} />
                      <span className="text-xs font-medium">LIVE NOW</span>
                    </span>
                  )}
                </div>

                {session.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {session.description}
                  </p>
                )}

                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(session.startTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>
                      {new Date(session.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {session.endTime &&
                        ` - ${new Date(session.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                    </span>
                  </div>
                  {session.week && <div>Week {session.week}</div>}
                </div>

                {/* Countdown for upcoming joinable sessions */}
                {session.status === "upcoming" && (
                  <div className="mt-2 text-sm text-gray-600">
                    {getTimeUntilStart(session.startTime.toISOString())}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="ml-4 flex flex-col space-y-2">
                {session.canJoin && session.meetingLink && (
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  >
                    <ExternalLink size={16} />
                    <span>
                      {session.status === "live" ? "Join Live" : "Join Session"}
                    </span>
                  </a>
                )}

                {session.status === "completed" && session.recordingUrl && (
                  <a
                    href={session.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    <Video size={16} />
                    <span>View Recording</span>
                  </a>
                )}

                {session.status === "upcoming" && (
                  <div className="rounded-md bg-gray-100 px-4 py-2 text-center text-sm text-gray-600">
                    Not yet available
                  </div>
                )}

                {session.status === "missed" && (
                  <div className="rounded-md bg-red-100 px-4 py-2 text-center text-sm text-red-600">
                    Session ended
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <hr className="mt-6 border-gray-300" />
    </section>
  );
}


