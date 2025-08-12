import { WeekItem } from "~/_components/features/shared/WeekItem";

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

interface CourseContentAccordionProps {
  weeks: Week[];
  courseId: string;
  onLessonCompletionChange?: (lessonId: number, isCompleted: boolean) => void;
}

export function CourseContentAccordion({
  weeks,
  courseId,
  onLessonCompletionChange,
}: CourseContentAccordionProps) {
  return (
    <div>
      <h2 className="section-title mb-4 text-xl font-semibold">
        Course Content
      </h2>
      {weeks.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="rounded-full bg-gray-100 p-3">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              No Content Available Yet
            </h3>
            <p className="max-w-md text-sm text-gray-500">
              The course instructor is still preparing the content for this
              course. Lessons and materials will appear here once they become
              available.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {weeks.map((week, index) => (
            <WeekItem
              key={week.id}
              weekTitle={week.title}
              lessons={week.lessons}
              initiallyExpanded={index === 0} // Expand first week by default
              courseId={courseId}
              onLessonCompletionChange={onLessonCompletionChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
