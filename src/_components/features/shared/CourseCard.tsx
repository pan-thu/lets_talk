"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type RouterOutputs } from "~/trpc/react";

const PlaceholderCardIcon = ({ type = "book" }: { type?: "book" | "gate" }) => {
  const iconPath =
    type === "gate"
      ? "M22 6h-5V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H2v15h20V6zm-5 13H7v-6h10v6zm-3-16h-4v2h4V3zm-2 7l-3 3-3-3h2V8h2v2h2z" // Gate icon path
      : "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"; // Book icon path

  return (
    <div className="icon-bg flex h-full w-full items-center justify-center rounded-t-lg">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={iconPath} fill="#A87575" />
      </svg>
    </div>
  );
};

type CourseWithTeacher =
  RouterOutputs["student"]["course"]["listPublished"][number];

interface CourseCardProps {
  course: CourseWithTeacher;
  isEnrolled: boolean;
  enrollmentStatus: string | null;
  isLoggedIn: boolean;
  onEnrollmentSuccess?: () => void;
}

export function CourseCard({
  course,
  isEnrolled: initialIsEnrolled,
  enrollmentStatus,
  isLoggedIn,
  onEnrollmentSuccess,
}: CourseCardProps) {
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(initialIsEnrolled);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const utils = api.useUtils();

  const enrollFreeCourseMutation = api.student.course.enroll.useMutation({
    onSuccess: (data) => {
      setIsEnrolled(true);
      setActionError(null);
      void utils.student.course.getMyEnrollments.invalidate();
      onEnrollmentSuccess?.();
      setIsProcessing(false);
    },
    onError: (error) => {
      setActionError(error.message ?? "Enrollment failed.");
      setIsProcessing(false);
    },
  });

  const handleActionClick = () => {
    if (!isLoggedIn) {
      router.push("/auth/signin?callbackUrl=/courses");
      return;
    }

    // Don't allow any action if enrollment is pending
    if (enrollmentStatus === "PENDING_PAYMENT_CONFIRMATION") {
      return;
    }

    setActionError(null);
    setIsProcessing(true);

    if (course.price > 0) {
      // For paid courses, redirect to the manual payment page
      router.push(`/courses/${course.id}/enroll-pay`);
      // No need to set processing to false, as navigation will unmount the component
    } else {
      // For free courses, enroll directly
      enrollFreeCourseMutation.mutate({ courseId: course.id });
    }
  };

  const getButtonText = () => {
    if (isProcessing) return "Processing...";
    if (isEnrolled) return "View Course";
    if (enrollmentStatus === "PENDING_PAYMENT_CONFIRMATION")
      return "Pending Approval";
    return "Enroll";
  };

  const getButtonStyle = () => {
    if (enrollmentStatus === "PENDING_PAYMENT_CONFIRMATION") {
      return "enroll-button bg-orange-500 hover:bg-orange-600 text-white cursor-default";
    }
    return "enroll-button hover:bg-opacity-80";
  };

  const handleButtonClick = () => {
    if (isEnrolled) {
      router.push(`/courses/${course.id}`);
    } else if (enrollmentStatus !== "PENDING_PAYMENT_CONFIRMATION") {
      handleActionClick();
    }
    // Do nothing if pending approval
  };

  const isButtonDisabled =
    isProcessing ||
    (isLoggedIn && enrollFreeCourseMutation.isPending) ||
    enrollmentStatus === "PENDING_PAYMENT_CONFIRMATION";

  const isLanguageCourse =
    course.title.toLowerCase().includes("japanese") ||
    course.title.toLowerCase().includes("korean") ||
    course.title.toLowerCase().includes("language");

  return (
    <div className="course-card flex h-[340px] w-[280px] flex-col overflow-hidden rounded-lg p-0 text-center shadow-lg transition-transform duration-200 hover:translate-y-[-4px]">
      <div className="h-32 w-full">
        <PlaceholderCardIcon type={isLanguageCourse ? "gate" : "book"} />
      </div>
      <div className="flex flex-grow flex-col p-4">
        <h3 className="section-title mb-1 line-clamp-2 text-base font-semibold md:text-lg">
          {course.title}
        </h3>
        <p className="card-description mb-2 line-clamp-3 flex-grow text-xs sm:text-sm">
          {course.description ?? "Beginner to advanced"}
        </p>
        <p className="mb-3 text-xs text-gray-500">
          By {course.teacher?.name ?? "Unknown Instructor"}
        </p>
        {!isEnrolled && course.price > 0 && (
          <p className="mb-3 text-sm font-medium text-gray-700">
            Price: ${course.price.toFixed(2)}
          </p>
        )}
        {actionError && (
          <p className="mb-2 text-xs text-red-500">{actionError}</p>
        )}
        {/* Button */}
        <div className="mt-auto">
          <button
            onClick={handleButtonClick}
            disabled={isButtonDisabled}
            className={`${getButtonStyle()} w-full px-4 py-2 text-xs font-medium shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-sm sm:text-sm`}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
