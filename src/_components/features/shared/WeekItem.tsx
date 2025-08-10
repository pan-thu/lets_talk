"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { LessonItem } from "./LessonItem";

// Using a simple cube icon since lucide-react doesn't have CubeIcon
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

interface Lesson {
  id: number;
  title: string;
  type: string;
  isCompleted: boolean;
}

interface WeekItemProps {
  weekTitle: string;
  lessons: Lesson[];
  initiallyExpanded?: boolean;
  courseId: string;
  onLessonCompletionChange?: (lessonId: number, isCompleted: boolean) => void;
}

export function WeekItem({
  weekTitle,
  lessons,
  initiallyExpanded = false,
  courseId,
  onLessonCompletionChange,
}: WeekItemProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [lessons]);

  return (
    <div className="rounded-md border border-gray-200 bg-[#FFF7F7] shadow-sm transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left text-gray-700 transition-all duration-200 ease-out hover:translate-x-1 hover:bg-gray-50/70 active:scale-[0.99]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center">
          <CubeIcon className="mr-3 h-5 w-5 text-gray-500 transition-colors duration-200" />
          <span className="font-medium transition-colors duration-200 hover:text-gray-900">
            {weekTitle}
          </span>
        </div>
        <div className="transition-transform duration-300 ease-out">
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-colors duration-200 hover:text-gray-700" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500 transition-colors duration-200 hover:text-gray-700" />
          )}
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div
          ref={contentRef}
          className="border-t border-gray-200 py-3 pr-4 pl-6"
        >
          <ul className="space-y-2">
            {lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lessonId={lesson.id}
                lessonTitle={lesson.title}
                lessonType={lesson.type}
                isCompleted={lesson.isCompleted}
                courseId={courseId}
                onCompletionChange={onLessonCompletionChange}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
