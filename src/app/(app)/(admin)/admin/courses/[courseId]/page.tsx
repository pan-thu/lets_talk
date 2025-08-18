"use client";

import { use, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Video,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Mic,
  Users,
  DollarSign,
  FileText,
  Calendar,
  Clock,
  User,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { api } from "~/trpc/react";
import { ResourceType } from "@prisma/client";

// Group resources by week
function groupResourcesByWeek(resources: any[]) {
  return resources.reduce((acc, resource) => {
    const week = resource.week ?? 1;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(resource);
    return acc;
  }, {} as Record<number, any[]>);
}

// Resource item inside a week
function AdminResourceItem({ resource }: { resource: any }) {
  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "VIDEO": return <Video className="h-4 w-4 text-blue-600" />;
      case "AUDIO_EXERCISE": return <Mic className="h-4 w-4 text-purple-600" />;
      default: return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex items-center justify-between rounded-md border bg-gray-50 p-3">
      <div className="flex items-center gap-3">
        {getResourceTypeIcon(resource.type)}
        <span className="font-medium text-gray-800">{resource.title}</span>
      </div>
      <div className="text-sm text-gray-500">
        {resource.type.replace("_", " ")}
      </div>
    </div>
  );
}

// Week accordion item
function AdminWeekItem({ weekNumber, resources }: { weekNumber: number; resources: any[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
      >
        <h3 className="text-lg font-semibold">Week {weekNumber}</h3>
        {isExpanded ? <ChevronDown /> : <ChevronRight />}
      </button>
      {isExpanded && (
        <div className="space-y-3 border-t p-4">
          {resources.length > 0 ? (
            resources.map(resource => (
              <AdminResourceItem
                key={resource.id}
                resource={resource}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No resources in this week</p>
          )}
        </div>
      )}
    </div>
  );
}

// Student enrollment item
function StudentEnrollmentItem({ enrollment }: { enrollment: any }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{enrollment.user.name}</h4>
          <p className="text-sm text-gray-500">{enrollment.user.email}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          enrollment.status === "ACTIVE" 
            ? "bg-green-100 text-green-800" 
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {enrollment.status}
        </span>
        <p className="text-xs text-gray-500 mt-1">
          Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// Error report item
function ErrorReportItem({ errorReport, onStatusUpdate }: { errorReport: any; onStatusUpdate: (id: number, status: string) => void }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "IN_PROGRESS": return <Loader className="h-4 w-4 text-yellow-600" />;
      case "RESOLVED": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "CLOSED": return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-red-100 text-red-800";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "RESOLVED": return "bg-green-100 text-green-800";
      case "CLOSED": return "bg-gray-100 text-gray-800";
      default: return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon(errorReport.status)}
          <div>
            <h4 className="font-medium text-gray-900">Error Report #{errorReport.id}</h4>
            <p className="text-sm text-gray-500">
              Lesson: {errorReport.lesson.title} (Week {errorReport.lesson.week})
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(errorReport.status)}`}>
            {errorReport.status.replace("_", " ")}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(errorReport.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="mb-3">
        <h5 className="text-sm font-medium text-gray-900 mb-1">Reported by:</h5>
        <p className="text-sm text-gray-600">{errorReport.user.name} ({errorReport.user.email})</p>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-900 mb-1">Description:</h5>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
          {errorReport.description}
        </p>
      </div>

      <div className="flex justify-end">
        <select
          value={errorReport.status}
          onChange={(e) => onStatusUpdate(errorReport.id, e.target.value)}
          className="rounded-md border-gray-300 text-xs focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
    </div>
  );
}

// The main page component
export default function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);

  const { data, isLoading, error } =
    api.admin.course.getCourseDetails.useQuery(
      { courseId },
      { enabled: !isNaN(courseId) },
    );

  const utils = api.useUtils();

  const updateErrorReportStatusMutation = api.admin.course.updateErrorReportStatus.useMutation({
    onSuccess: () => {
      utils.admin.course.getCourseDetails.invalidate({ courseId });
    },
    onError: (error) => {
      alert(`Error updating status: ${error.message}`);
    },
  });

  const handleErrorReportStatusUpdate = (errorReportId: number, status: string) => {
    updateErrorReportStatusMutation.mutate({
      errorReportId,
      status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
    });
  };

  if (isNaN(courseId)) {
    return (
      <div className="flex h-full flex-col">
        <BreadcrumbsWithAnimation
          parentPaths={[
            { name: "Admin", path: "/admin/dashboard" },
            { name: "Courses", path: "/admin/courses" }
          ]}
          currentPath="Invalid Course"
        />
        <h1 className="section-title mb-6 text-2xl font-semibold">Error</h1>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-red-500">Invalid course ID provided.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <BreadcrumbsWithAnimation
          parentPaths={[
            { name: "Admin", path: "/admin/dashboard" },
            { name: "Courses", path: "/admin/courses" }
          ]}
          currentPath="Loading..."
        />
        <div className="flex items-center justify-center p-6">
          <Clock className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Loading course details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <BreadcrumbsWithAnimation
          parentPaths={[
            { name: "Admin", path: "/admin/dashboard" },
            { name: "Courses", path: "/admin/courses" }
          ]}
          currentPath="Error"
        />
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-red-500">Error loading course: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col">
        <BreadcrumbsWithAnimation
          parentPaths={[
            { name: "Admin", path: "/admin/dashboard" },
            { name: "Courses", path: "/admin/courses" }
          ]}
          currentPath="Not Found"
        />
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-gray-500">Course not found.</p>
        </div>
      </div>
    );
  }

  const resourcesByWeek = groupResourcesByWeek(data.resources);
  const weekNumbers = Object.keys(resourcesByWeek).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[
          { name: "Admin", path: "/admin/dashboard" },
          { name: "Courses", path: "/admin/courses" }
        ]}
        currentPath={data.course.title}
      />

      <h1 className="section-title mb-6 text-2xl font-semibold">
        {data.course.title}
      </h1>

      {/* Course Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Course Details */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Course Details</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Description</h3>
              <p className="text-gray-600">{data.course.description || "No description available"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Price</h3>
                <p className="text-gray-600">${data.course.price}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Type</h3>
                <p className="text-gray-600">{data.course.type}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Status</h3>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  data.course.status === "PUBLISHED" 
                    ? "bg-green-100 text-green-800"
                    : data.course.status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {data.course.status}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Created</h3>
                <p className="text-gray-600">{new Date(data.course.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {data.course.teacher && (
              <div>
                <h3 className="font-medium text-gray-900">Teacher</h3>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{data.course.teacher.name}</p>
                    <p className="text-sm text-gray-500">{data.course.teacher.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

                 {/* Course Statistics */}
         <div className="rounded-lg border bg-white p-6 shadow-sm">
           <h2 className="mb-4 text-xl font-semibold">Statistics</h2>
           <div className="grid grid-cols-2 gap-4">
             <div className="rounded-lg bg-blue-50 p-4">
               <div className="flex items-center gap-2">
                 <Users className="h-5 w-5 text-blue-600" />
                 <span className="text-sm font-medium text-blue-900">Total Enrollments</span>
               </div>
               <p className="mt-2 text-2xl font-bold text-blue-900">{data.stats.totalEnrollments}</p>
             </div>
             <div className="rounded-lg bg-green-50 p-4">
               <div className="flex items-center gap-2">
                 <Users className="h-5 w-5 text-green-600" />
                 <span className="text-sm font-medium text-green-900">Active Students</span>
               </div>
               <p className="mt-2 text-2xl font-bold text-green-900">{data.stats.activeEnrollments}</p>
             </div>
             <div className="rounded-lg bg-purple-50 p-4">
               <div className="flex items-center gap-2">
                 <FileText className="h-5 w-5 text-purple-600" />
                 <span className="text-sm font-medium text-purple-900">Total Resources</span>
               </div>
               <p className="mt-2 text-2xl font-bold text-purple-900">{data.stats.totalResources}</p>
             </div>
             <div className="rounded-lg bg-yellow-50 p-4">
               <div className="flex items-center gap-2">
                 <DollarSign className="h-5 w-5 text-yellow-600" />
                 <span className="text-sm font-medium text-yellow-900">Total Revenue</span>
               </div>
               <p className="mt-2 text-2xl font-bold text-yellow-900">${data.stats.totalRevenue}</p>
             </div>
             <div className="rounded-lg bg-red-50 p-4">
               <div className="flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-red-600" />
                 <span className="text-sm font-medium text-red-900">Error Reports</span>
               </div>
               <p className="mt-2 text-2xl font-bold text-red-900">{data.stats.totalErrorReports}</p>
               <p className="text-xs text-red-700">{data.stats.openErrorReports} open</p>
             </div>
           </div>
         </div>
      </div>

      {/* Course Content */}
      <div className="mb-8">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Course Content</h2>
          <div className="space-y-4">
            {weekNumbers.length > 0 ? (
              weekNumbers.map((weekNum) => (
                <AdminWeekItem
                  key={weekNum}
                  weekNumber={weekNum}
                  resources={resourcesByWeek[weekNum] ?? []}
                />
              ))
            ) : (
              <p className="py-4 text-center text-gray-500">No content has been added to this course yet.</p>
            )}
          </div>
        </div>
      </div>

             {/* Enrolled Students */}
       <div className="mb-8">
         <div className="rounded-lg border bg-white p-6 shadow-sm">
           <h2 className="mb-4 text-xl font-semibold">Enrolled Students</h2>
           <div className="space-y-4">
             {data.enrollments.length > 0 ? (
               data.enrollments.map((enrollment) => (
                 <StudentEnrollmentItem
                   key={enrollment.id}
                   enrollment={enrollment}
                 />
               ))
             ) : (
               <p className="py-4 text-center text-gray-500">No students have enrolled in this course yet.</p>
             )}
           </div>
         </div>
       </div>

       {/* Error Reports */}
       <div className="mb-8">
         <div className="rounded-lg border bg-white p-6 shadow-sm">
           <h2 className="mb-4 text-xl font-semibold">Error Reports</h2>
           <div className="space-y-4">
             {data.errorReports.length > 0 ? (
               data.errorReports.map((errorReport) => (
                 <ErrorReportItem
                   key={errorReport.id}
                   errorReport={errorReport}
                   onStatusUpdate={handleErrorReportStatusUpdate}
                 />
               ))
             ) : (
               <p className="py-4 text-center text-gray-500">No error reports have been submitted for this course.</p>
             )}
           </div>
         </div>
       </div>
    </div>
  );
}
