"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  GraduationCap,
  DollarSign,
  MessageSquare,
  BookOpen,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  XCircle,
} from "lucide-react";
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
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: any;
  trend?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
            {title}
          </h3>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
            {trend && <p className="mt-1 text-sm text-green-600">{trend}</p>}
          </div>
        </div>
        {Icon && (
          <div className="rounded-full bg-blue-100 p-3">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  action,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  action: string;
  href?: string;
  icon?: any;
}) {
  const content = (
    <>
      <div className="mb-3 flex items-center gap-3">
        {Icon && (
          <div className="rounded-full bg-blue-100 p-2">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="mb-4 text-gray-600">{description}</p>
      <button className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
        {action}
      </button>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">{content}</div>
  );
}

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading,
    error,
  } = api.admin.dashboard.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-2 text-red-600">
            Error loading dashboard: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Combine and sort recent activities
  // Adapt to current stats shape: recentPayments and recentTickets only
  const payments = (stats as any).recentPayments?.map((p: any) => ({
    id: p.id,
    type: "payment",
    description: `Payment ${p.provider ?? ""} - $${p.amount} for ${p.course?.title ?? "course"}`,
    timestamp: p.createdAt,
  })) ?? [];
  const tickets = (stats as any).recentTickets?.map((t: any) => ({
    id: t.id,
    type: "ticket",
    description: `Ticket: ${t.subject}`,
    timestamp: t.createdAt,
  })) ?? [];
  const allActivities = [...payments, ...tickets].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case "ticket":
        return <MessageSquare className="h-4 w-4 text-yellow-600" />;
      case "course":
        return <BookOpen className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation currentPath="Admin Dashboard" />

      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome to the administrative control panel
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="mb-8">
        <SectionTitle title="Platform Overview" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={stats.users.total}
            subtitle="All registered users"
            icon={Users}
          />
          <MetricCard
            title="Total Courses"
            value={stats.courses.total}
            subtitle="All courses"
            icon={GraduationCap}
          />
          <MetricCard
            title="Total Tickets"
            value={stats.tickets.total}
            subtitle="Support tickets overall"
            icon={MessageSquare}
          />
          <MetricCard
            title="Total Payments"
            value={stats.payments.completed}
            subtitle="All time"
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mb-8">
        <SectionTitle title="Performance Metrics" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Placeholder: enrollments not in current API */}
          <MetricCard
            title="Total Enrollments"
            value={0}
            subtitle="Across all courses"
            icon={TrendingUp}
          />
          {/* Placeholder: revenue breakdown not in current API */}
          <MetricCard
            title="Total Revenue"
            value={0}
            subtitle={`0 completed payments`}
            icon={DollarSign}
          />
          <MetricCard
            title="Support Tickets"
            value={stats.tickets.total}
            subtitle={`Latest ${((stats as any).recentTickets ?? []).length} tickets`}
            icon={MessageSquare}
          />
          <MetricCard
            title="Total Courses"
            value={stats.courses.total}
            subtitle={`Latest ${((stats as any).recentPayments ?? []).length} payments`}
            icon={BookOpen}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <SectionTitle title="Quick Actions" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Review Payments"
            description="Review and approve pending payment submissions"
            action="Review Payments"
            href="/admin/payments"
            icon={DollarSign}
          />
          <QuickActionCard
            title="Manage Users"
            description="Create teachers and manage user accounts"
            action="Manage Users"
            href="/admin/users"
            icon={Users}
          />
          <QuickActionCard
            title="Manage Courses"
            description="View and manage all courses on the platform"
            action="View Courses"
            href="/admin/courses"
            icon={GraduationCap}
          />
          <QuickActionCard
            title="Support Tickets"
            description="View and respond to user support requests"
            action="View Tickets"
            href="/admin/support"
            icon={MessageSquare}
          />
          <QuickActionCard
            title="Content Management"
            description="Manage announcements and blog posts"
            action="Manage Content"
            href="/admin/announcements"
            icon={BookOpen}
          />
          <QuickActionCard
            title="Blog Posts"
            description="Create and manage platform blog content"
            action="Manage Blog"
            href="/admin/blog"
            icon={BookOpen}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <SectionTitle title="Recent Activity" />
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          {allActivities.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allActivities.slice(0, 8).map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.id}-${index}`}
                  className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {activity.type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Health Summary */}
      <div className="mb-8">
        <SectionTitle title="System Health" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">User Activity</h3>
                <p className="text-sm text-green-600">{stats.users.total} total users</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Content Status</h3>
                <p className="text-sm text-blue-600">{stats.courses.total} total courses</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${stats.tickets.total > 0 ? "bg-yellow-100" : "bg-green-100"}`}>
                <MessageSquare className={`h-5 w-5 ${stats.tickets.total > 0 ? "text-yellow-600" : "text-green-600"}`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Support Status</h3>
                <p className="text-sm text-blue-600">{stats.tickets.total} tickets total</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


