// src/app/(app)/(admin)/admin/courses/page.tsx
"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Plus,
  Edit3,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Archive,
  Clock,
  XCircle,
} from "lucide-react";
import { CourseStatus, CourseType } from "@prisma/client";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { AdminModalWrapper } from "~/_components/ui/AdminModalWrapper";
import { PaginationControls } from "~/_components/features/shared/PaginationControls";

export default function AdminCoursesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | undefined>(
    undefined,
  );
  const [typeFilter, setTypeFilter] = useState<CourseType | undefined>(
    undefined,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    course: any | null;
  }>({ isOpen: false, course: null });
  const [archiveModalState, setArchiveModalState] = useState<{
    isOpen: boolean;
    course: any | null;
  }>({ isOpen: false, course: null });

  const [courseForm, setCourseForm] = useState<{
    title: string;
    description: string;
    price: number;
    type: CourseType;
    status: CourseStatus;
    coverImageUrl: string;
    teacherId: string;
  }>({
    title: "",
    description: "",
    price: 0,
    type: CourseType.VIDEO,
    status: CourseStatus.DRAFT,
    coverImageUrl: "",
    teacherId: "",
  });

  const {
    data: coursesData,
    isLoading,
    error,
  } = api.admin.course.listAllCourses.useQuery({
    page: currentPage,
    limit: 6,
    search: searchTerm || undefined,
    status: statusFilter,
    type: typeFilter,
  });

  const { data: teachers } = api.admin.user.getAllTeachers.useQuery();
  const utils = api.useUtils();

  const createCourseMutation = api.admin.course.createCourse.useMutation({
    onSuccess: () => {
      utils.admin.course.listAllCourses.invalidate();
      setIsCreateModalOpen(false);
      setCourseForm({
        title: "",
        description: "",
        price: 0,
        type: CourseType.VIDEO,
        status: CourseStatus.DRAFT,
        coverImageUrl: "",
        teacherId: "",
      });
      alert("Course created successfully!");
    },
    onError: (error) => alert(`Error creating course: ${error.message}`),
  });

  const updateCourseMutation = api.admin.course.updateCourse.useMutation({
    onSuccess: () => {
      utils.admin.course.listAllCourses.invalidate();
      setEditModalState({ isOpen: false, course: null });
      alert("Course updated successfully!");
    },
    onError: (error) => alert(`Error updating course: ${error.message}`),
  });

  const archiveCourseMutation = api.admin.course.archiveCourse.useMutation({
    onSuccess: () => {
      utils.admin.course.listAllCourses.invalidate();
      setArchiveModalState({ isOpen: false, course: null });
      alert("Course archived successfully!");
    },
    onError: (error) => alert(`Error archiving course: ${error.message}`),
  });

  const handleCreateCourse = () => {
    if (courseForm.title && courseForm.type) {
      createCourseMutation.mutate({
        title: courseForm.title,
        description: courseForm.description,
        price: courseForm.price,
        type: courseForm.type,
        status: courseForm.status,
        teacherId: courseForm.teacherId,
      });
    }
  };

  const handleUpdateCourse = () => {
    if (editModalState.course && courseForm.title) {
      updateCourseMutation.mutate({
        courseId: editModalState.course.id,
        title: courseForm.title,
        description: courseForm.description,
        price: courseForm.price,
        type: courseForm.type,
        status: courseForm.status,
        teacherId: courseForm.teacherId || undefined,
      });
    }
  };

  const handleArchiveCourse = () => {
    if (archiveModalState.course) {
      archiveCourseMutation.mutate({ courseId: archiveModalState.course.id });
    }
  };

  const openEditModal = (course: any) => {
    setCourseForm({
      title: course.title,
      description: course.description || "",
      price: course.price,
      type: course.type,
      status: course.status,
      coverImageUrl: course.coverImageUrl || "",
      teacherId: course.teacher?.id || "",
    });
    setEditModalState({ isOpen: true, course });
  };

  const getStatusBadgeClass = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLISHED:
        return "bg-green-100 text-green-800";
      case CourseStatus.DRAFT:
        return "bg-yellow-100 text-yellow-800";
      case CourseStatus.ARCHIVED:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeBadgeClass = (type: CourseType) => {
    switch (type) {
      case CourseType.VIDEO:
        return "bg-blue-100 text-blue-800";
      case CourseType.LIVE:
        return "bg-purple-100 text-purple-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Clock className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading courses: {error.message}
      </div>
    );
  }

  const courses = coursesData?.courses ?? [];
  const pagination = {
    page: coursesData?.pagination?.page ?? 1,
    pages: coursesData?.pagination?.pages ?? 1,
    total: coursesData?.pagination?.total ?? 0,
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Admin", path: "/admin/dashboard" }]}
        currentPath="Course Management"
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Course Management
          </h1>
          <p className="text-gray-600">Manage all courses on the platform</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              setCourseForm({
                title: "",
                description: "",
                price: 0,
                type: CourseType.VIDEO,
                status: CourseStatus.DRAFT,
                coverImageUrl: "",
                teacherId: "",
              });
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create New Course
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border-gray-300 py-2 pr-4 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:w-80"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter || ""}
            onChange={(e) => {
              setStatusFilter(
                e.target.value ? (e.target.value as CourseStatus) : undefined,
              );
              setCurrentPage(1);
            }}
            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value={CourseStatus.PUBLISHED}>Published</option>
            <option value={CourseStatus.DRAFT}>Draft</option>
            <option value={CourseStatus.ARCHIVED}>Archived</option>
          </select>
          <select
            value={typeFilter || ""}
            onChange={(e) => {
              setTypeFilter(
                e.target.value ? (e.target.value as CourseType) : undefined,
              );
              setCurrentPage(1);
            }}
            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value={CourseType.VIDEO}>Video</option>
            <option value={CourseType.LIVE}>Live</option>
          </select>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm || statusFilter || typeFilter
              ? "No courses found"
              : "No courses yet"}
          </h3>
          <p className="mt-2 text-gray-600">
            {searchTerm || statusFilter || typeFilter
              ? "Try adjusting your search or filters."
              : "Get started by creating your first course."}
          </p>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    {course.title}
                  </h3>
                  <p className="mb-2 text-sm text-gray-600">
                    Teacher: {course.teacher?.name || "Unassigned"}
                  </p>
                  <div className="mb-3 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{course._count.enrollments} students</span>
                    <span>•</span>
                    <span>${course.price}</span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(course.status)}`}
                    >
                      {course.status}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeClass(course.type)}`}
                    >
                      {course.type}
                    </span>
                  </div>
                </div>
              </div>
                             <div className="flex space-x-2">
                 <button
                   onClick={() => openEditModal(course)}
                   className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
                 >
                   <Edit3 className="h-3 w-3" />
                   Edit
                 </button>
                 <a
                   href={`/admin/courses/${course.id}`}
                   className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                 >
                   <BookOpen className="h-3 w-3" />
                   View Details
                 </a>

                 {course.status !== CourseStatus.ARCHIVED && (
                   <button 
                     onClick={() => setArchiveModalState({ isOpen: true, course })}
                     className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-200"
                   >
                     <Archive className="h-3 w-3" />
                     Archive
                   </button>
                 )}
               </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
         <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
           <div>
             <p className="text-sm text-gray-700">
               Showing{" "}
               <span className="font-medium">
                 {(currentPage - 1) * 6 + 1}
               </span>{" "}
               to{" "}
               <span className="font-medium">
                 {Math.min(currentPage * 6, pagination.total)}
               </span>{" "}
               of <span className="font-medium">{pagination.total}</span> results
             </p>
           </div>
           <PaginationControls
             currentPage={currentPage}
             totalPages={pagination.pages}
             onPageChange={setCurrentPage}
           />
         </div>
       )}

      {/* Working Create Course Modal */}
      <AdminModalWrapper
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Course"
      >
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Course Title"
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <textarea
                  placeholder="Course Description"
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Price"
                    value={courseForm.price}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        price: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
          <select
            value={String(courseForm.type)}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                type: (e.target.value === "LIVE" ? CourseType.LIVE : CourseType.VIDEO),
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
            <option value="VIDEO">Video Course</option>
            <option value="LIVE">Live Course</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
          <select
            value={String(courseForm.status)}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                status: (e.target.value === "PUBLISHED" ? CourseStatus.PUBLISHED : CourseStatus.DRAFT),
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
                  </select>
                  <select
                    value={courseForm.teacherId}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        teacherId: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Teacher</option>
                    {teachers?.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="url"
                  placeholder="Cover Image URL (optional)"
                  value={courseForm.coverImageUrl}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      coverImageUrl: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCourse}
                    disabled={
                      !courseForm.title || createCourseMutation.isPending
                    }
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createCourseMutation.isPending
                      ? "Creating..."
                      : "Create Course"}
                  </button>
                </div>
              </div>
            </AdminModalWrapper>

      <AdminModalWrapper
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ isOpen: false, course: null })}
        title="Edit Course"
      >
        <div className="space-y-4">
           {/* Form fields are pre-populated via openEditModal */}
           <input type="text" placeholder="Course Title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
           <textarea placeholder="Course Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
           <div className="grid grid-cols-2 gap-3">
             <input type="number" placeholder="Price" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} min="0" step="0.01" className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
             <select value={courseForm.type} onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value as CourseType })} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
               <option value={CourseType.VIDEO}>Video Course</option>
               <option value={CourseType.LIVE}>Live Course</option>
             </select>
           </div>
           <div className="grid grid-cols-2 gap-3">
             <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as CourseStatus })} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
               <option value={CourseStatus.DRAFT}>Draft</option>
               <option value={CourseStatus.PUBLISHED}>Published</option>
               <option value={CourseStatus.ARCHIVED}>Archived</option>
             </select>
             <select value={courseForm.teacherId} onChange={(e) => setCourseForm({ ...courseForm, teacherId: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
               <option value="">Select Teacher</option>
               {teachers?.map((teacher) => (<option key={teacher.id} value={teacher.id}>{teacher.name}</option>))}
             </select>
           </div>
           <div className="flex justify-end gap-2 pt-4">
             <button type="button" onClick={() => setEditModalState({ isOpen: false, course: null })} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
             <button type="button" onClick={handleUpdateCourse} disabled={!courseForm.title || updateCourseMutation.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
               {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
             </button>
           </div>
         </div>
       </AdminModalWrapper>

      <AdminModalWrapper
        isOpen={archiveModalState.isOpen}
        onClose={() => setArchiveModalState({ isOpen: false, course: null })}
        title="Archive Course"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to archive the course "<strong>{archiveModalState.course?.title}</strong>"? Students will no longer be able to enroll.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setArchiveModalState({ isOpen: false, course: null })} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleArchiveCourse} disabled={archiveCourseMutation.isPending} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {archiveCourseMutation.isPending ? "Archiving..." : "Archive Course"}
            </button>
          </div>
        </div>
      </AdminModalWrapper>
    </div>
  );
}


