// src/app/_components/dashboard/RecentlyAccessedCourseCard.tsx
import Image from "next/image";
import Link from "next/link";

const PlaceholderIcon = ({ type = "book" }: { type?: "book" | "gate" }) => {
  const iconPath =
    type === "gate"
      ? "M22 6h-5V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H2v15h20V6zm-5 13H7v-6h10v6zm-3-16h-4v2h4V3zm-2 7l-3 3-3-3h2V8h2v2h2z"
      : "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z";

  return (
    <div className="icon-bg flex h-full w-full items-center justify-center rounded-t-lg">
      <svg
        width="28" // Slightly smaller icon for a wider card
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={iconPath} fill="#A87575" />
      </svg>
    </div>
  );
};

interface RecentlyAccessedCourseCardProps {
  // Define with actual course data type later, from tRPC output
  course: {
    id: string | number;
    title: string;
    description?: string | null;
    coverImageUrl?: string | null; // For actual image
    teacherName?: string | null;
  };
}

export function RecentlyAccessedCourseCard({
  course,
}: RecentlyAccessedCourseCardProps) {
  return (
    <div className="course-card flex h-full flex-col overflow-hidden rounded-lg bg-white p-0 text-left shadow-lg transition-transform duration-200 hover:translate-y-[-2px]">
      <div className="h-24 w-full md:h-28">
        {course.coverImageUrl ? (
          <Image
            src={course.coverImageUrl}
            alt={course.title}
            width={400}
            height={112}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderIcon />
        )}
      </div>
      <div className="flex flex-grow flex-col p-6">
        <h3 className="section-title mb-1 line-clamp-1 text.base font-semibold">
          {course.title}
        </h3>
        <p className="card-description mb-1 line-clamp-2 flex-grow text-xs text-gray-600 sm:text-sm">
          {course.description ?? "Continue your learning journey."}
        </p>
        <p className="mb-2 text-xs text-gray-500">
          By {course.teacherName ?? "Unknown Instructor"}
        </p>
        <div className="mt-auto">
          <Link href={`/courses/${course.id}`}>
            <button className="enroll-button hover:bg-opacity-80 w-full px-4 py-1 text-xs font-medium shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 sm:text-sm">
              View Course
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
