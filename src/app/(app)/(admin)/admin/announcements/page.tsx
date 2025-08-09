"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Globe,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";

export default function AdminAnnouncementsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    announcement: any | null;
  }>({ isOpen: false, announcement: null });
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    announcement: any | null;
  }>({ isOpen: false, announcement: null });

  // Form states
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    isGlobal: true,
    courseId: "",
  });

  // Queries and mutations
  const {
    data: announcementsData,
    isLoading: announcementsLoading,
    error: announcementsError,
  } = api.admin.management.listAllAnnouncements.useQuery({
    page: currentPage,
    limit: 12,
    search: searchTerm || undefined,
  });

  const { data: courses } = api.admin.management.listAllCourses.useQuery({
    page: 1,
    limit: 100,
  });

  const utils = api.useUtils();

  const createAnnouncementMutation =
    api.admin.management.createAnnouncement.useMutation({
      onSuccess: () => {
        utils.admin.management.listAllAnnouncements.invalidate();
        setIsCreateModalOpen(false);
        setAnnouncementForm({
          title: "",
          content: "",
          isGlobal: true,
          courseId: "",
        });
        alert("Announcement created successfully!");
      },
      onError: (error) => {
        alert(`Error creating announcement: ${error.message}`);
      },
    });

  const updateAnnouncementMutation =
    api.admin.management.updateAnnouncement.useMutation({
      onSuccess: () => {
        utils.admin.management.listAllAnnouncements.invalidate();
        setEditModalState({ isOpen: false, announcement: null });
        alert("Announcement updated successfully!");
      },
      onError: (error) => {
        alert(`Error updating announcement: ${error.message}`);
      },
    });

  const deleteAnnouncementMutation =
    api.admin.management.deleteAnnouncement.useMutation({
      onSuccess: () => {
        utils.admin.management.listAllAnnouncements.invalidate();
        setDeleteModalState({ isOpen: false, announcement: null });
        alert("Announcement deleted successfully!");
      },
      onError: (error) => {
        alert(`Error deleting announcement: ${error.message}`);
      },
    });

  // Handlers
  const handleCreateAnnouncement = () => {
    if (announcementForm.title && announcementForm.content) {
      createAnnouncementMutation.mutate({
        ...announcementForm,
        courseId: announcementForm.isGlobal
          ? undefined
          : announcementForm.courseId,
      });
    }
  };

  const handleUpdateAnnouncement = () => {
    if (
      editModalState.announcement &&
      announcementForm.title &&
      announcementForm.content
    ) {
      updateAnnouncementMutation.mutate({
        announcementId: editModalState.announcement.id,
        ...announcementForm,
        courseId: announcementForm.isGlobal
          ? undefined
          : announcementForm.courseId,
      });
    }
  };

  const handleDeleteAnnouncement = () => {
    if (deleteModalState.announcement) {
      deleteAnnouncementMutation.mutate({
        announcementId: deleteModalState.announcement.id,
      });
    }
  };

  const openEditModal = (announcement: any) => {
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      isGlobal: !announcement.course,
      courseId: announcement.course?.id || "",
    });
    setEditModalState({ isOpen: true, announcement });
  };

  const getScopeBadgeClass = (isGlobal: boolean) => {
    return isGlobal
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  const getScopeIcon = (isGlobal: boolean) => {
    return isGlobal ? (
      <Globe className="h-4 w-4" />
    ) : (
      <BookOpen className="h-4 w-4" />
    );
  };

  if (announcementsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Megaphone className="mx-auto h-8 w-8 animate-pulse text-blue-600" />
          <p className="mt-2 text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (announcementsError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-2 text-red-600">
            Error loading announcements: {announcementsError.message}
          </p>
        </div>
      </div>
    );
  }

  const { announcements, pagination } = announcementsData || {
    announcements: [],
    pagination: { page: 1, pages: 1, total: 0 },
  };

  const stats = {
    total: pagination.total,
    global: announcements.filter((a) => !a.course).length,
    course: announcements.filter((a) => a.course).length,
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Admin", path: "/admin/dashboard" }]}
        currentPath="Announcement Management"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Announcement Management
          </h1>
          <p className="text-gray-600">
            Create and manage platform announcements
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Announcement
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Announcements
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Global</p>
              <p className="text-2xl font-bold text-gray-900">{stats.global}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Course-Specific
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.course}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border-gray-300 py-2 pr-4 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:w-80"
          />
        </div>
      </div>

      {/* Announcements Grid */}
      {announcements.length === 0 ? (
        <div className="py-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm ? "No announcements found" : "No announcements yet"}
          </h3>
          <p className="mt-2 text-gray-600">
            {searchTerm
              ? "Try adjusting your search."
              : "Get started by creating your first announcement."}
          </p>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <p className="mb-3 line-clamp-3 text-sm text-gray-600">
                    {announcement.content}
                  </p>
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getScopeBadgeClass(
                        !announcement.course,
                      )}`}
                    >
                      {getScopeIcon(!announcement.course)}
                      {announcement.course ? "Course-Specific" : "Global"}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>
                      Created{" "}
                      {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                    </span>
                    {announcement.course && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{announcement.course.title}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(announcement)}
                  className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() =>
                    setDeleteModalState({ isOpen: true, announcement })
                  }
                  className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.pages, currentPage + 1))
              }
              disabled={currentPage === pagination.pages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * 12 + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * 12, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === page
                            ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            : "text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                  }
                  disabled={currentPage === pagination.pages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Create Announcement
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>✕
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Announcement Title"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Announcement Content"
                  value={announcementForm.content}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      content: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="global"
                      name="scope"
                      checked={announcementForm.isGlobal}
                      onChange={() =>
                        setAnnouncementForm({
                          ...announcementForm,
                          isGlobal: true,
                          courseId: "",
                        })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="global"
                      className="text-sm font-medium text-gray-700"
                    >
                      Global (visible to all users)
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="course"
                      name="scope"
                      checked={!announcementForm.isGlobal}
                      onChange={() =>
                        setAnnouncementForm({
                          ...announcementForm,
                          isGlobal: false,
                        })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="course"
                      className="text-sm font-medium text-gray-700"
                    >
                      Course-specific
                    </label>
                  </div>
                </div>
                {!announcementForm.isGlobal && (
                  <select
                    value={announcementForm.courseId}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        courseId: e.target.value,
                      })
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a course</option>
                    {courses?.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={createAnnouncementMutation.isPending}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAnnouncement}
                    disabled={
                      !announcementForm.title ||
                      !announcementForm.content ||
                      (!announcementForm.isGlobal &&
                        !announcementForm.courseId) ||
                      createAnnouncementMutation.isPending
                    }
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createAnnouncementMutation.isPending
                      ? "Creating..."
                      : "Create Announcement"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {editModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Announcement</h3>
              <button
                onClick={() => setEditModalState({ isOpen: false, announcement: null })}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <div className="px-6 py-4">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Announcement Title"
            value={announcementForm.title}
            onChange={(e) =>
              setAnnouncementForm({
                ...announcementForm,
                title: e.target.value,
              })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <textarea
            placeholder="Announcement Content"
            value={announcementForm.content}
            onChange={(e) =>
              setAnnouncementForm({
                ...announcementForm,
                content: e.target.value,
              })
            }
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="edit-global"
                name="edit-scope"
                checked={announcementForm.isGlobal}
                onChange={() =>
                  setAnnouncementForm({
                    ...announcementForm,
                    isGlobal: true,
                    courseId: "",
                  })
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="edit-global"
                className="text-sm font-medium text-gray-700"
              >
                Global (visible to all users)
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="edit-course"
                name="edit-scope"
                checked={!announcementForm.isGlobal}
                onChange={() =>
                  setAnnouncementForm({
                    ...announcementForm,
                    isGlobal: false,
                  })
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="edit-course"
                className="text-sm font-medium text-gray-700"
              >
                Course-specific
              </label>
            </div>
          </div>
          {!announcementForm.isGlobal && (
            <select
              value={announcementForm.courseId}
              onChange={(e) =>
                setAnnouncementForm({
                  ...announcementForm,
                  courseId: e.target.value,
                })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a course</option>
              {courses?.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setEditModalState({ isOpen: false, announcement: null })
              }
              disabled={updateAnnouncementMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateAnnouncement}
              disabled={
                !announcementForm.title ||
                !announcementForm.content ||
                (!announcementForm.isGlobal && !announcementForm.courseId) ||
                updateAnnouncementMutation.isPending
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateAnnouncementMutation.isPending
                ? "Updating..."
                : "Update Announcement"}
            </button>
          </div>
        </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Announcement Modal */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="max-h-screen w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Announcement</h3>
              <button
                onClick={() => setDeleteModalState({ isOpen: false, announcement: null })}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <div className="px-6 py-4">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete "
            {deleteModalState.announcement?.title}"? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setDeleteModalState({ isOpen: false, announcement: null })
              }
              disabled={deleteAnnouncementMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAnnouncement}
              disabled={deleteAnnouncementMutation.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteAnnouncementMutation.isPending
                ? "Deleting..."
                : "Delete Announcement"}
            </button>
          </div>
        </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


