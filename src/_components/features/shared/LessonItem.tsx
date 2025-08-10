"use client";

import Link from "next/link";
import { CheckCircle2Icon, MicIcon } from "lucide-react";

// Using the same cube icon as WeekItem for consistency
const CubeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" />
    <path d="M12 2v20" />
    <path d="M4 6.5l8 4.5 8-4.5" />
  </svg>
);

interface LessonItemProps {
  lessonId: number;
  lessonTitle: string;
  lessonType: string;
  isCompleted: boolean;
  courseId: string;
  onCompletionChange?: (lessonId: number, isCompleted: boolean) => void;
}

export function LessonItem({
  lessonId,
  lessonTitle,
  lessonType,
  isCompleted,
  courseId,
  onCompletionChange,
}: LessonItemProps) {
  const isExercise = lessonType === "AUDIO_EXERCISE";

  // Choose colors based on exercise type
  const bgColor = isCompleted
    ? "bg-green-100 hover:bg-green-200 border-green-300 hover:border-green-400"
    : isExercise
      ? "bg-purple-100 hover:bg-purple-200 border-purple-300 hover:border-purple-400"
      : "bg-blue-100 hover:bg-blue-200 border-blue-300 hover:border-blue-400";

  const textColor = isCompleted
    ? "text-green-700"
    : isExercise
      ? "text-purple-700"
      : "text-blue-700";

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent the link from triggering
    onCompletionChange?.(lessonId, e.target.checked);
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent hover effects from interfering
  };

  // Determine the link destination based on type
  const linkHref = isExercise
    ? `/courses/${courseId}/exercises/${lessonId}`
    : `/courses/${courseId}/lessons/${lessonId}`;

  return (
    <li>
      <div
        className={`flex items-center justify-between rounded-md p-3 transition-all duration-200 ease-out ${bgColor} border-l-4 hover:translate-x-1 hover:shadow-md`}
      >
        <div className="flex flex-1 items-center">
          {isExercise ? (
            <MicIcon
              className={`mr-3 h-5 w-5 transition-colors duration-200 ${textColor}`}
            />
          ) : (
            <CubeIcon
              className={`mr-3 h-5 w-5 transition-colors duration-200 ${textColor}`}
            />
          )}
          <Link
            href={linkHref}
            className={`flex-1 text-sm transition-all duration-200 hover:font-medium ${isCompleted ? "text-gray-700" : "text-gray-700"}`}
          >
            {lessonTitle}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Completion Checkbox */}
          <label
            className="group relative z-10 -m-1 flex cursor-pointer items-center p-1"
            onClick={handleLabelClick}
          >
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={handleCheckboxChange}
              className="sr-only"
            />
            <div
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 group-hover:scale-110 ${
                isCompleted
                  ? "border-green-500 bg-green-500 hover:border-green-600 hover:bg-green-600"
                  : "border-gray-300 bg-white hover:border-green-400 hover:shadow-sm"
              }`}
            >
              {isCompleted && (
                <CheckCircle2Icon className="h-3.5 w-3.5 text-white transition-transform duration-200" />
              )}
            </div>
          </label>
        </div>
      </div>
    </li>
  );
}
