"use client";

import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { DashboardMetricCard } from "~/_components/features/student/DashboardMetricCard";
import { TodayTaskList } from "~/_components/features/student/TodayTaskList";
import { ContributionCalendar } from "~/_components/features/student/ContributionCalendar";
import { RecentlyAccessedCourseCard } from "~/_components/shared/RecentlyAccessedCourseCard";
import { api } from "~/trpc/react";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center">
      <h2 className="section-title mr-4 text-xl font-semibold whitespace-nowrap sm:text-2xl">
        {title}
      </h2>
      <div className="section-line h-px w-full flex-grow"></div>
    </div>
  );
}

function DashboardContent() {
  const {
    data: todayTasks,
    isLoading: isLoadingTasks,
    error: tasksError,
  } = api.student.dashboard.getTodaysTasks.useQuery();

  const {
    data: recentlyAccessedCourses,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = api.student.dashboard.getRecentlyAccessedCourses.useQuery();

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation currentPath="Dashboard" />

      {/* Upper sections row */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row">
        {/* Left Column: Previous Actions + Contribution Calendar */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Previous Actions Section */}
          <div>
            <SectionTitle title="Learning Statistics" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
              <DashboardMetricCard title="Learning Hour" value="69" />
              <DashboardMetricCard title="Grade" value="A" />
            </div>
          </div>

          {/* Contribution Calendar Section Wrapper */}
          <div className="flex flex-grow flex-col">
            <ContributionCalendar />
          </div>
        </div>
        {/* Right Column: Today Task */}
        <div className="flex w-full flex-col lg:w-auto lg:max-w-xs lg:min-w-[300px] xl:max-w-sm">
          {/* Card for Today Task with grey background */}
          <div className="flex h-full flex-col rounded-lg bg-[#e7e2e2] p-4 shadow-md">
            <div className="mb-4 flex items-center">
              <h2 className="section-title mr-4 text-lg font-semibold whitespace-nowrap">
                Today Task
              </h2>
              <div className="section-line h-px w-full flex-grow"></div>
            </div>
            {isLoadingTasks && <p>Loading tasks...</p>}
            {tasksError && <p>Could not load tasks.</p>}
            {todayTasks && <TodayTaskList tasks={todayTasks} />}
          </div>
        </div>
      </div>

      {/* New Recently Accessed Courses Section */}
      <div className="mt-8 w-full">
        <SectionTitle title="Recently Accessed Courses" />
        {isLoadingCourses && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Skeleton Loaders */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-lg bg-gray-200"
              ></div>
            ))}
          </div>
        )}
        {coursesError && (
          <p className="text-center text-red-500">
            Could not load recently accessed courses.
          </p>
        )}
        {recentlyAccessedCourses?.length === 0 && (
          <div className="text-center text-gray-500">
            <p>You haven't accessed any courses recently.</p>
            <p className="text-sm">Visit a course to see it here!</p>
          </div>
        )}
        {recentlyAccessedCourses && recentlyAccessedCourses.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyAccessedCourses.map((course) => (
              <RecentlyAccessedCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}


