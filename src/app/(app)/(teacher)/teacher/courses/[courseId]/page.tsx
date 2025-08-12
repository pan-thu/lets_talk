"use client";

import { use, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Play,
  Pause,
  Calendar,
  Clock,
  Video,
} from "lucide-react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { api } from "~/trpc/react";

// Resource form data interface
interface ResourceFormData {
  title: string;
  type: "VIDEO" | "AUDIO_EXERCISE" | "PDF" | "TEXT" | "FILE" | "LINK";
  url: string;
  content: string;
  week: number;
  order: number;
}

// Resource form component
function ResourceForm({
  courseId,
  editingResource,
  onClose,
  onSuccess,
}: {
  courseId: number;
  editingResource?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<ResourceFormData>({
    title: editingResource?.title || "",
    type: editingResource?.type || "VIDEO",
    url: editingResource?.url || "",
    content: editingResource?.content || "",
    week: editingResource?.week || 1,
    order: editingResource?.order || 0,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const utils = api.useUtils();

  const createMutation = api.teacher.resource.create.useMutation({
    onSuccess: () => {
      onSuccess();
      void utils.teacher.course.getCourseManagementDetails.invalidate();
    },
  });

  const updateMutation = api.teacher.resource.update.useMutation({
    onSuccess: () => {
      onSuccess();
      void utils.teacher.course.getCourseManagementDetails.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingResource) {
      updateMutation.mutate({
        resourceId: editingResource.id,
        ...formData,
        releaseDate: undefined, // For now, not handling release dates in UI
      });
    } else {
      createMutation.mutate({
        courseId,
        ...formData,
        releaseDate: undefined, // For now, not handling release dates in UI
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId.toString());

      const response = await fetch("/api/upload/resource", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, url: data.url }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingResource ? "Edit Resource" : "Create New Resource"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as any,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="VIDEO">Video</option>
              <option value="AUDIO_EXERCISE">Audio Exercise</option>
              <option value="PDF">PDF</option>
              <option value="TEXT">Text</option>
              <option value="FILE">File</option>
              <option value="LINK">Link</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              File/URL
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="Enter URL or upload file below"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                  id="file-upload"
                  accept="video/*,audio/*,.pdf,.txt,image/*"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex cursor-pointer items-center space-x-2 rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 ${
                    uploadingFile ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <Upload size={16} />
                  <span>{uploadingFile ? "Uploading..." : "Upload File"}</span>
                </label>
              </div>
              {uploadError && (
                <p className="text-sm text-red-500">{uploadError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Content/Description
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter resource description or instructions..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Week
              </label>
              <input
                type="number"
                value={formData.week}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    week: parseInt(e.target.value) || 1,
                  }))
                }
                min="1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    order: parseInt(e.target.value) || 0,
                  }))
                }
                min="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || uploadingFile}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Saving..." : editingResource ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeacherCourseManagementPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const utils = api.useUtils();

  const { data, isLoading, error } =
    api.teacher.course.getCourseManagementDetails.useQuery(
      { courseId },
      { enabled: !isNaN(courseId) },
    );

  const deleteMutation = api.teacher.resource.delete.useMutation({
    onSuccess: () => {
      void utils.teacher.course.getCourseManagementDetails.invalidate();
    },
  });

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setShowResourceForm(true);
  };

  const handleDelete = (resource: any) => {
    if (
      window.confirm(`Are you sure you want to delete "${resource.title}"?`)
    ) {
      deleteMutation.mutate({ resourceId: resource.id });
    }
  };

  const handleFormClose = () => {
    setShowResourceForm(false);
    setEditingResource(null);
  };

  const handleFormSuccess = () => {
    setShowResourceForm(false);
    setEditingResource(null);
  };

  if (isNaN(courseId)) {
    return (
      <div className="flex h-full flex-col">
        <BreadcrumbsWithAnimation
          parentPaths={[
            { name: "Teacher", path: "/teacher/courses" },
            { name: "My Courses", path: "/teacher/courses" },
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

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[
          { name: "Teacher", path: "/teacher/courses" },
          { name: "My Courses", path: "/teacher/courses" },
        ]}
        currentPath={data?.course.title || `Course #${courseId}`}
      />

      <h1 className="section-title mb-6 text-2xl font-semibold">
        {data?.course.title || `Manage Course: #${courseId}`}
      </h1>

      <div className="space-y-6">
        {isLoading && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <p className="text-gray-500">Loading course details...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <p className="text-red-500">
              Error loading course: {error.message}
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Course Information */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Course Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm text-gray-600">Title:</p>
                  <p className="font-medium">{data.course.title}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-600">Status:</p>
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      data.course.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : data.course.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {data.course.status}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-600">Price:</p>
                  <p className="font-medium">${data.course.price}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-600">Created:</p>
                  <p className="font-medium">
                    {new Date(data.course.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {data.course.description && (
                <div className="mt-4">
                  <p className="mb-1 text-sm text-gray-600">Description:</p>
                  <p className="text-gray-700">{data.course.description}</p>
                </div>
              )}
            </div>

            {/* Course Resources (Lessons/Exercises) */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Course Content</h2>
                <button
                  onClick={() => setShowResourceForm(true)}
                  className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  <span>Add Resource</span>
                </button>
              </div>

              {data.resources.length === 0 ? (
                <p className="text-gray-500">
                  No lessons or exercises have been added to this course yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.resources.map((resource) => (
                    <div key={resource.id} className="rounded border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{resource.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {resource.content || "No content"}
                          </p>
                          {resource.url && (
                            <p className="mt-1 text-xs text-blue-600">
                              URL: {resource.url}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <div className="text-right text-sm text-gray-500">
                            <div>Week {resource.week || 1}</div>
                            <div
                              className={`mt-1 inline-block rounded px-2 py-1 text-xs ${
                                resource.type === "VIDEO"
                                  ? "bg-blue-100 text-blue-700"
                                  : resource.type === "AUDIO_EXERCISE"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {resource.type}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEdit(resource)}
                              className="rounded p-2 text-blue-600 hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(resource)}
                              disabled={deleteMutation.isPending}
                              className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enrolled Students */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Enrolled Students</h2>
              {data.enrollments.length === 0 ? (
                <p className="text-gray-500">
                  No students are enrolled in this course yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {enrollment.user.image && (
                            <img
                              src={enrollment.user.image}
                              alt={enrollment.user.name || "Student"}
                              className="h-8 w-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium">
                              {enrollment.user.name || "Unnamed Student"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {enrollment.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div
                            className={`inline-block rounded px-2 py-1 text-xs ${
                              enrollment.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : enrollment.status ===
                                    "PENDING_PAYMENT_CONFIRMATION"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {enrollment.status}
                          </div>
                          <div className="mt-1 text-gray-500">
                            Progress: {Math.round(enrollment.progress)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Sessions */}
            <LiveSessionsSection courseId={courseId} />

            {/* Student Progress */}
            <StudentProgressSection courseId={courseId} />

            {/* Student Submissions (coming soon) */}
            {/* <SubmissionsSection courseId={courseId} /> */}
          </>
        )}
      </div>

      {/* Resource Form Modal */}
      {showResourceForm && (
        <ResourceForm
          courseId={courseId}
          editingResource={editingResource}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

// Live Sessions section component
function LiveSessionsSection({ courseId }: { courseId: number }) {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);

  const utils = api.useUtils();

  const {
    data: sessions,
    isLoading,
    error,
  } = api.teacher.liveSession.getForCourse.useQuery({ courseId });

  const deleteMutation = api.teacher.liveSession.delete.useMutation({
    onSuccess: () => {
      void utils.teacher.liveSession.getForCourse.invalidate();
    },
  });

  const handleEdit = (session: any) => {
    setEditingSession(session);
    setShowSessionForm(true);
  };

  const handleDelete = (session: any) => {
    if (window.confirm(`Are you sure you want to delete "${session.title}"?`)) {
      deleteMutation.mutate({ sessionId: session.id });
    }
  };

  const handleFormClose = () => {
    setShowSessionForm(false);
    setEditingSession(null);
  };

  const handleFormSuccess = () => {
    setShowSessionForm(false);
    setEditingSession(null);
  };

  const getSessionStatus = (session: any) => {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = session.endTime ? new Date(session.endTime) : null;

    if (now < startTime) {
      return { status: "upcoming", color: "bg-gray-100 text-gray-700" };
    } else if (endTime && now > endTime) {
      return session.recordingUrl
        ? { status: "completed", color: "bg-blue-100 text-blue-700" }
        : { status: "missed", color: "bg-red-100 text-red-700" };
    } else {
      return { status: "live", color: "bg-green-100 text-green-700" };
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Live Sessions</h2>
        <p className="text-gray-500">Loading live sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Live Sessions</h2>
        <p className="text-red-500">Error loading sessions: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Live Sessions</h2>
        <button
          onClick={() => setShowSessionForm(true)}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Schedule Session</span>
        </button>
      </div>

      {!sessions || sessions.length === 0 ? (
        <p className="text-gray-500">No live sessions scheduled yet.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const sessionStatus = getSessionStatus(session);
            return (
              <div key={session.id} className="rounded border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{session.title}</h3>
                      <span
                        className={`rounded px-2 py-1 text-xs ${sessionStatus.color}`}
                      >
                        {sessionStatus.status.toUpperCase()}
                      </span>
                    </div>
                    {session.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {session.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>
                          {new Date(session.startTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>
                          {new Date(session.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {session.endTime &&
                            ` - ${new Date(session.endTime).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}`}
                        </span>
                      </div>
                      {session.week && <div>Week {session.week}</div>}
                    </div>
                    {session.recordingUrl && (
                      <div className="mt-2">
                        <a
                          href={session.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Video size={14} />
                          <span>View Recording</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex space-x-1">
                    <button
                      onClick={() => handleEdit(session)}
                      className="rounded p-2 text-blue-600 hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(session)}
                      disabled={deleteMutation.isPending}
                      className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Session Form Modal */}
      {showSessionForm && (
        <LiveSessionForm
          courseId={courseId}
          editingSession={editingSession}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

// Live Session Form component
function LiveSessionForm({
  courseId,
  editingSession,
  onClose,
  onSuccess,
}: {
  courseId: number;
  editingSession?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: editingSession?.title || "",
    description: editingSession?.description || "",
    meetingLink: editingSession?.meetingLink || "",
    startTime: editingSession?.startTime
      ? new Date(editingSession.startTime).toISOString().slice(0, 16)
      : "",
    endTime: editingSession?.endTime
      ? new Date(editingSession.endTime).toISOString().slice(0, 16)
      : "",
    week: editingSession?.week || 1,
  });
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const utils = api.useUtils();

  const createMutation = api.teacher.liveSession.create.useMutation({
    onSuccess: () => {
      onSuccess();
      void utils.teacher.liveSession.getForCourse.invalidate();
    },
  });

  const updateMutation = api.teacher.liveSession.update.useMutation({
    onSuccess: () => {
      onSuccess();
      void utils.teacher.liveSession.getForCourse.invalidate();
    },
  });

  const uploadRecordingMutation =
    api.teacher.liveSession.uploadRecording.useMutation({
      onSuccess: () => {
        void utils.teacher.liveSession.getForCourse.invalidate();
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sessionData = {
      title: formData.title,
      description: formData.description || undefined,
      meetingLink: formData.meetingLink,
      startTime: new Date(formData.startTime),
      endTime: formData.endTime ? new Date(formData.endTime) : undefined,
      week: formData.week,
    };

    if (editingSession) {
      updateMutation.mutate({
        sessionId: editingSession.id,
        ...sessionData,
      });
    } else {
      createMutation.mutate({
        courseId,
        ...sessionData,
      });
    }
  };

  const handleRecordingUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingSession) return;

    setUploadingRecording(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", editingSession.id.toString());

      const response = await fetch("/api/upload/recording", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      uploadRecordingMutation.mutate({
        sessionId: editingSession.id,
        recordingUrl: data.url,
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingRecording(false);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingSession ? "Edit Live Session" : "Schedule New Live Session"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Session Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Zoom Meeting Link *
            </label>
            <input
              type="url"
              value={formData.meetingLink}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  meetingLink: e.target.value,
                }))
              }
              placeholder="https://zoom.us/j/..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Course Week
            </label>
            <input
              type="number"
              min="1"
              value={formData.week}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  week: parseInt(e.target.value) || 1,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Recording Upload for existing sessions */}
          {editingSession && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Upload Recording
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={handleRecordingUpload}
                  disabled={uploadingRecording}
                  className="hidden"
                  id="recording-upload"
                  accept="video/*"
                />
                <label
                  htmlFor="recording-upload"
                  className={`flex cursor-pointer items-center space-x-2 rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 ${
                    uploadingRecording ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <Upload size={16} />
                  <span>
                    {uploadingRecording ? "Uploading..." : "Upload Recording"}
                  </span>
                </label>
                {uploadError && (
                  <p className="text-sm text-red-500">{uploadError}</p>
                )}
                {editingSession.recordingUrl && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <Video size={14} />
                    <span>Recording uploaded</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">Error: {error.message}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : editingSession
                  ? "Update Session"
                  : "Schedule Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Student progress section component
function StudentProgressSection({ courseId }: { courseId: number }) {
  const [filterType, setFilterType] = useState<
    "all" | "at-risk" | "high-performers"
  >("all");
  const [sortBy, setSortBy] = useState<"progress" | "name" | "activity">(
    "progress",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error } =
    api.teacher.course.getStudentProgress.useQuery({
      courseId,
    });

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Student Progress</h2>
        <p className="text-gray-500">Loading student progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Student Progress</h2>
        <p className="text-red-500">Error loading progress: {error.message}</p>
      </div>
    );
  }

  if (!data?.students || data.students.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Student Progress</h2>
        <p className="text-gray-500">No enrolled students found.</p>
      </div>
    );
  }

  // Filter students
  const filteredStudents = data.students.filter((student) => {
    if (filterType === "at-risk") return student.progress.overallProgress < 50;
    if (filterType === "high-performers")
      return student.progress.overallProgress > 80;
    return true;
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue: string | number = 0;
    let bValue: string | number = 0;

    switch (sortBy) {
      case "progress":
        aValue = a.progress.overallProgress;
        bValue = b.progress.overallProgress;
        break;
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "activity":
        aValue = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
        bValue = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
        break;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getProgressColor = (progress: number) => {
    if (progress > 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressTextColor = (progress: number) => {
    if (progress > 80) return "text-green-700";
    if (progress >= 50) return "text-yellow-700";
    return "text-red-700";
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Student Progress</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Students</option>
              <option value="at-risk">At-risk (&lt;50%)</option>
              <option value="high-performers">High Performers (&gt;80%)</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="progress-desc">Progress (High to Low)</option>
              <option value="progress-asc">Progress (Low to High)</option>
              <option value="name-asc">Name (A to Z)</option>
              <option value="name-desc">Name (Z to A)</option>
              <option value="activity-desc">Recent Activity</option>
              <option value="activity-asc">Oldest Activity</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}


