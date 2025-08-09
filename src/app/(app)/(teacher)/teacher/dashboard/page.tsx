"use client";

import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";

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

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
        {title}
      </h3>
      <div className="mt-2">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );
}

function CourseCard({
  title,
  students,
  status,
}: {
  title: string;
  students: number;
  status: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mb-4 text-gray-600">{students} students enrolled</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "Active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {status}
          </span>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700">
          Manage
        </button>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation currentPath="Teacher Dashboard" />

      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Teacher Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your courses and track student progress
        </p>
      </div>

      {/* Teaching Metrics */}
      <div className="mb-8">
        <SectionTitle title="Teaching Overview" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="My Courses"
            value="3"
            subtitle="2 active, 1 draft"
          />
          <MetricCard
            title="Total Students"
            value="45"
            subtitle="Across all courses"
          />
          <MetricCard
            title="This Week"
            value="12"
            subtitle="Student submissions"
          />
          <MetricCard
            title="Completion Rate"
            value="87%"
            subtitle="Average across courses"
          />
        </div>
      </div>

      {/* My Courses */}
      <div className="mb-8">
        <SectionTitle title="My Courses" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CourseCard
            title="Advanced English Grammar"
            students={18}
            status="Active"
          />
          <CourseCard title="Business Writing" students={15} status="Active" />
          <CourseCard
            title="Conversation Practice"
            students={12}
            status="Active"
          />
        </div>
      </div>

      {/* Recent Student Activity */}
      <div className="mb-8">
        <SectionTitle title="Recent Student Activity" />
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
              <div className="flex items-center space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-sm font-medium text-blue-600">JS</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">John Smith</p>
                  <p className="text-sm text-gray-500">
                    Submitted exercise in Advanced English Grammar
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-400">30 min ago</span>
                <p className="text-xs text-green-600">New submission</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
              <div className="flex items-center space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                  <span className="text-sm font-medium text-green-600">MW</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Maria Wilson</p>
                  <p className="text-sm text-gray-500">
                    Completed lesson 3 in Business Writing
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-400">2 hours ago</span>
                <p className="text-xs text-blue-600">Lesson completed</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
              <div className="flex items-center space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <span className="text-sm font-medium text-purple-600">
                    AD
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Alice Davis</p>
                  <p className="text-sm text-gray-500">
                    Started new course: Conversation Practice
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-400">1 day ago</span>
                <p className="text-xs text-purple-600">New enrollment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <SectionTitle title="Quick Actions" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button className="rounded-lg bg-blue-600 p-4 text-left text-white transition-colors hover:bg-blue-700">
            <h3 className="mb-1 font-semibold">Review Submissions</h3>
            <p className="text-sm opacity-90">Check new student submissions</p>
          </button>
          <button className="rounded-lg bg-green-600 p-4 text-left text-white transition-colors hover:bg-green-700">
            <h3 className="mb-1 font-semibold">Create Lesson</h3>
            <p className="text-sm opacity-90">Add new content to courses</p>
          </button>
          <button className="rounded-lg bg-purple-600 p-4 text-left text-white transition-colors hover:bg-purple-700">
            <h3 className="mb-1 font-semibold">Manage Courses</h3>
            <p className="text-sm opacity-90">Edit course settings</p>
          </button>
        </div>
      </div>
    </div>
  );
}


