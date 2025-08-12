"use client";

import { Suspense, useState, useEffect } from "react";
import { CourseCard } from "~/_components/features/shared/CourseCard";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center">
      <h2 className="text-custom-dark-text mr-4 text-xl font-semibold whitespace-nowrap sm:text-2xl">
        {title}
      </h2>
      <div className="h-px w-full flex-grow bg-gray-300"></div>
    </div>
  );
}

function CourseLists() {
  const { data: session, status } = useSession();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(
    new Set(),
  );
  const [enrollmentStatusMap, setEnrollmentStatusMap] = useState<
    Map<number, string>
  >(new Map());

  const { data: courses = [], isLoading: coursesLoading } =
    api.student.course.listPublished.useQuery();
  const { data: enrollments, isLoading: enrollmentsLoading } =
    api.student.course.getMyEnrollments.useQuery(undefined, {
      enabled: !!session?.user,
    });
  const { data: enrollmentStatus, isLoading: statusLoading } =
    api.student.course.getMyEnrollmentStatus.useQuery(undefined, {
      enabled: !!session?.user,
    });

  // Update enrolled course IDs when enrollments data changes
  useEffect(() => {
    if (enrollments) {
      setEnrolledCourseIds(enrollments);
    }
  }, [enrollments]);

  // Update enrollment status map when data changes
  useEffect(() => {
    if (enrollmentStatus) {
      setEnrollmentStatusMap(enrollmentStatus);
    }
  }, [enrollmentStatus]);

  const isLoggedIn = !!session?.user;
  const isLoading =
    status === "loading" ||
    coursesLoading ||
    (isLoggedIn && (enrollmentsLoading || statusLoading));

  // Handle enrollment success - move course to enrolled section
  const handleEnrollmentSuccess = (courseId: number) => {
    setEnrolledCourseIds((prev) => new Set(prev).add(courseId));
    setEnrollmentStatusMap((prev) => new Map(prev).set(courseId, "ACTIVE"));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const enrolledCourses = courses.filter((course) =>
    enrolledCourseIds.has(course.id),
  );
  const pendingCourses = courses.filter(
    (course) =>
      enrollmentStatusMap.get(course.id) === "PENDING_PAYMENT_CONFIRMATION",
  );
  const availableCourses = courses.filter(
    (course) => !enrollmentStatusMap.has(course.id),
  );

  return (
    <>
      {/* Enrolled Courses Section */}
      <section className="mb-8 px-4 md:mb-12">
        <SectionTitle title="Enrolled Course" />
        {enrolledCourses.length > 0 ? (
          <div className="flex max-w-[1800px] flex-wrap justify-center gap-10 sm:justify-start">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="mb-4 w-[280px]">
                <CourseCard
                  course={course}
                  isEnrolled={true}
                  enrollmentStatus="ACTIVE"
                  isLoggedIn={isLoggedIn}
                  onEnrollmentSuccess={() => handleEnrollmentSuccess(course.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-gray-500">
              You are not enrolled in any courses yet.
            </p>
          </div>
        )}
      </section>

      {/* Pending Approval Courses Section */}
      {pendingCourses.length > 0 && (
        <section className="mb-8 px-4 md:mb-12">
          <SectionTitle title="Pending Approval" />
          <div className="flex max-w-[1800px] flex-wrap justify-center gap-10 sm:justify-start">
            {pendingCourses.map((course) => (
              <div key={course.id} className="mb-4 w-[280px]">
                <CourseCard
                  course={course}
                  isEnrolled={false}
                  enrollmentStatus="PENDING_PAYMENT_CONFIRMATION"
                  isLoggedIn={isLoggedIn}
                  onEnrollmentSuccess={() => handleEnrollmentSuccess(course.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Courses Section */}
      <section className="px-4">
        <SectionTitle title="Available Course" />
        {availableCourses.length > 0 ? (
          <div className="flex max-w-[1800px] flex-wrap justify-center gap-10 sm:justify-start">
            {availableCourses.map((course) => (
              <div key={course.id} className="mb-4 w-[280px]">
                <CourseCard
                  course={course}
                  isEnrolled={false}
                  enrollmentStatus={null}
                  isLoggedIn={isLoggedIn}
                  onEnrollmentSuccess={() => handleEnrollmentSuccess(course.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-gray-500">
              No other courses are available at this time.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

export default function CoursesPage() {
  return (
    <div>
      {/* Animated Breadcrumb */}
      <BreadcrumbsWithAnimation currentPath="Course" />

      <CourseLists />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      {/* Use custom color for spinner */}
      <div className="border-custom-pink h-12 w-12 animate-spin rounded-full border-4 border-solid border-t-transparent"></div>
    </div>
  );
}


