"use client";

import Link from "next/link";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { api } from "~/trpc/react";

export default function TeacherCoursesPage() {
  const {
    data: courses,
    isLoading,
    error,
  } = api.teacher.course.getTeacherCourses.useQuery();

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Teacher", path: "/teacher/courses" }]}
        currentPath="My Courses"
      />
      <h1 className="section-title mb-6 text-2xl font-semibold">My Courses</h1>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {isLoading && <p className="text-gray-500">Loading your courses...</p>}

        {error && (
          <p className="text-red-500">Error loading courses: {error.message}</p>
        )}

        {courses && courses.length === 0 && (
          <p className="text-gray-700">
            You don't have any courses assigned yet. Contact your administrator
            to get courses assigned to you.
          </p>
        )}

        {courses && courses.length > 0 && (
          <div className="space-y-4">
            <p className="mb-4 text-gray-700">
              Manage your assigned courses. Click on a course to access its
              management dashboard.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                >
                  <h3 className="mb-2 text-lg font-semibold">{course.title}</h3>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                    {course.description || "No description available"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        course.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : course.status === "DRAFT"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {course.status}
                    </span>
                    <Link
                      href={`/teacher/courses/${course.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


