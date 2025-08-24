"use client";

import { use, useState, type ReactNode, useMemo, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Video,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Mic
} from "lucide-react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { api } from "~/trpc/react";
import { ResourceType } from "@prisma/client";
import { useEffect } from "react";
import { z } from "zod";

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

// --- Submissions Section ---
function TeacherSubmissionsSection({ courseId }: { courseId: number }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_REVIEW" | "GRADED">("ALL");

  const { data, isLoading, error } = api.teacher.submission.getSubmissionsForCourse.useQuery({
    courseId,
    page,
    limit: 10,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const gradeMutation = api.teacher.submission.gradeSubmission.useMutation();

  const [grading, setGrading] = useState<{ id: number; grade: string; feedback: string } | null>(null);
  const submissions = data?.submissions ?? [];
  const pages = data?.pagination.pages ?? 1;

  const handleOpenGrade = (submission: any) => {
    setGrading({ id: submission.id, grade: submission.grade?.toString() ?? "", feedback: submission.feedback ?? "" });
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grading) return;
    const parsed = z
      .object({ grade: z.coerce.number().min(0).max(100), feedback: z.string().optional() })
      .safeParse({ grade: grading.grade, feedback: grading.feedback });
    if (!parsed.success) return;

    await gradeMutation.mutateAsync({ submissionId: grading.id, grade: parsed.data.grade, feedback: parsed.data.feedback });
    setGrading(null);
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Student Submissions</h2>
        <div className="flex items-center gap-2">
          <select
            className="rounded border p-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="GRADED">Graded</option>
          </select>
        </div>
      </div>

      {isLoading && <p className="text-gray-500">Loading submissions...</p>}
      {error && <p className="text-red-500">Failed to load submissions.</p>}

      {submissions.length === 0 && !isLoading ? (
        <p className="text-gray-500">No submissions found.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s: any) => (
            <div key={s.id} className="rounded border p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{s.student?.name || "Student"}</span> · {s.student?.email}
                  </p>
                  <p className="text-sm text-gray-600">Exercise: {s.resource?.title}</p>
                  <p className="text-xs text-gray-500">Submitted {new Date(s.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.audioUrl && (
                    <audio controls className="w-64">
                      <source src={s.audioUrl} />
                    </audio>
                  )}
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs">{s.status}</span>
                </div>
              </div>

              {s.feedback && (
                <div className="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-700">
                  <p className="font-medium">Feedback:</p>
                  <p>{s.feedback}</p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  onClick={() => handleOpenGrade(s)}
                >
                  {s.status === "GRADED" ? "Update Grade" : "Grade"}
                </button>
                {s.grade != null && (
                  <span className="text-sm text-gray-700">Grade: {s.grade}</span>
                )}
                {s.grader?.name && (
                  <span className="text-xs text-gray-500">Graded by {s.grader.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded border px-2 py-1 text-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button
            className="rounded border px-2 py-1 text-sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {grading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Grade Submission</h3>
              <button onClick={() => setGrading(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleGradeSubmit} className="space-y-3">
              <input
                type="number"
                className="w-full rounded border p-2"
                placeholder="Grade (0-100)"
                value={grading.grade}
                onChange={(e) => setGrading({ ...grading, grade: e.target.value })}
                min={0}
                max={100}
                step={1}
                required
              />
              <textarea
                className="w-full rounded border p-2"
                rows={4}
                placeholder="Feedback (optional)"
                value={grading.feedback}
                onChange={(e) => setGrading({ ...grading, feedback: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded border px-3 py-1.5" onClick={() => setGrading(null)}>Cancel</button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-1.5 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Resource item inside a week
function TeacherResourceItem({ resource, onEdit, onDelete }: { resource: any; onEdit: () => void; onDelete: () => void; }) {
  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "VIDEO": return <Video className="h-4 w-4 text-blue-600" />;
      case "AUDIO_EXERCISE": return <Mic className="h-4 w-4 text-purple-600" />;
      default: return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex items-center justify-between rounded-md border bg-gray-50 p-3 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-3">
        {getResourceTypeIcon(resource.type)}
        <span className="font-medium text-gray-800">{resource.title}</span>
      </div>
      <div className="flex items-center gap-2">
        {resource.type === "AUDIO_EXERCISE" && (
          <a
            href={`/teacher/exercises/${resource.id}`}
            className="rounded p-1.5 text-purple-600 hover:bg-purple-50"
            title="Review Submissions"
          >
            Review
          </a>
        )}
        <button onClick={onEdit} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" title="Edit Resource"><Edit size={16} /></button>
        <button onClick={onDelete} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Delete Resource"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

// Week accordion item
function TeacherWeekItem({ weekNumber, resources, onAddResource, onEditResource, onDeleteResource, isLastWeek }: { weekNumber: number; resources: any[]; onAddResource: (week: number) => void; onEditResource: (resource: any) => void; onDeleteResource: (resource: any) => void; isLastWeek: boolean; }) {
  const [isExpanded, setIsExpanded] = useState(isLastWeek ? true : false);

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
          {resources.map(resource => (
            <TeacherResourceItem
              key={resource.id}
              resource={resource}
              onEdit={() => onEditResource(resource)}
              onDelete={() => onDeleteResource(resource)}
            />
          ))}
            <button
            onClick={() => onAddResource(weekNumber)}
            className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 py-3 text-gray-600 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
            >
            <Plus size={16} />
            <span>Add Resource to Week {weekNumber}</span>
            </button>
          </div>
      )}
    </div>
  );
}

// The main page component
export default function TeacherCourseManagementPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [newResourceWeek, setNewResourceWeek] = useState<number | null>(null);

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
    onError: (err) => alert(`Deletion failed: ${err.message}`)
  });
  
  const handleAddResource = (week: number) => {
    setEditingResource(null);
    setNewResourceWeek(week);
    setShowResourceForm(true);
  };
  
  const handleAddNewWeek = () => {
    const highestWeek = data?.resources.reduce((max, r) => Math.max(max, r.week ?? 0), 0) ?? 0;
    setEditingResource(null);
    setNewResourceWeek(highestWeek + 1);
    setShowResourceForm(true);
  };

  const handleEditResource = (resource: any) => {
    setEditingResource(resource);
    setNewResourceWeek(null);
    setShowResourceForm(true);
  };

  const handleDeleteResource = (resource: any) => {
    if (
      window.confirm(`Are you sure you want to delete "${resource.title}"?`)
    ) {
      deleteMutation.mutate({ resourceId: resource.id });
    }
  };

  const handleFormClose = () => {
    setShowResourceForm(false);
    setEditingResource(null);
    setNewResourceWeek(null);
  };

  const handleFormSuccess = () => {
    setShowResourceForm(false);
    setEditingResource(null);
    setNewResourceWeek(null);
  };
  
  const resourcesByWeek = data ? groupResourcesByWeek(data.resources) : {};
  const weekNumbers = Object.keys(resourcesByWeek).map(Number).sort((a, b) => a - b);

  if (isNaN(courseId)) {
    return (
      <div className="flex h-full flex-col">
        <BreadcrumbsWithAnimation
          parentPaths={[{ name: "Teacher", path: "/teacher/courses" }, { name: "My Courses", path: "/teacher/courses" }]}
          currentPath="Invalid Course"
        />
        <h1 className="section-title mb-6 text-2xl font-semibold">Error</h1>
        <div className="rounded-lg border bg-white p-6 shadow-sm"><p className="text-red-500">Invalid course ID provided.</p></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Teacher", path: "/teacher/courses" }, { name: "My Courses", path: "/teacher/courses" }]}
        currentPath={data?.course.title || `Course #${courseId}`}
      />

      <h1 className="section-title mb-6 text-2xl font-semibold">
        {data?.course.title || `Manage Course: #${courseId}`}
      </h1>

      {isLoading && <div className="rounded-lg border bg-white p-6 shadow-sm"><p className="text-gray-500">Loading course details...</p></div>}
      {error && <div className="rounded-lg border bg-white p-6 shadow-sm"><p className="text-red-500">Error loading course: {error.message}</p></div>}

      {data && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Course Content</h2>
            <div className="space-y-4">
              {weekNumbers.length > 0 ? (
                weekNumbers.map((weekNum, index) => (
                  <TeacherWeekItem
                    key={weekNum}
                    weekNumber={weekNum}
                    resources={resourcesByWeek[weekNum] ?? []}
                    onAddResource={handleAddResource}
                    onEditResource={handleEditResource}
                    onDeleteResource={handleDeleteResource}
                    isLastWeek={index === weekNumbers.length - 1}
                  />
                ))
              ) : (
                <p className="py-4 text-center text-gray-500">No content has been added to this course yet.</p>
              )}
              <button
                onClick={handleAddNewWeek}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-gray-600 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
              >
                <Plus size={20} />
                <span>Add New Week</span>
              </button>
            </div>
          </div>

          {/* Student Submissions Section */}
          <TeacherSubmissionsSection courseId={courseId} />

          {/* Other sections like Live Sessions, Students etc. can go here */}
        </div>
      )}
      
      {showResourceForm && (
        <ResourceForm
          courseId={courseId}
          editingResource={editingResource}
          initialWeek={newResourceWeek}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}


function ResourceForm({ courseId, editingResource, initialWeek, onClose, onSuccess }: { courseId: number; editingResource?: any; initialWeek?: number | null; onClose: () => void; onSuccess: () => void; }) {
  const [formData, setFormData] = useState({
    title: editingResource?.title || "",
    type: editingResource?.type || ResourceType.VIDEO,
    url: editingResource?.url || "",
    content: editingResource?.content || "",
    week: editingResource?.week || initialWeek || 1,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const audioPickerRef = useRef<HTMLInputElement | null>(null);

  const utils = api.useUtils();

  const createMutation = api.teacher.resource.create.useMutation({
    onSuccess: () => { onSuccess(); utils.teacher.course.getCourseManagementDetails.invalidate(); },
    onError: (err) => alert(err.message)
  });

  const updateMutation = api.teacher.resource.update.useMutation({
    onSuccess: () => { onSuccess(); utils.teacher.course.getCourseManagementDetails.invalidate(); },
    onError: (err) => alert(err.message)
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUploadError(null);

      // Only VIDEO or AUDIO_EXERCISE allowed
      const mediaTypesRequiringFile: ResourceType[] = [
        ResourceType.VIDEO,
        ResourceType.AUDIO_EXERCISE,
      ];

      let finalUrl = formData.url;
      // Collects any uploaded attachments from primary input (overflow) and the attachments input
      const attachmentsPayload: { fileUrl: string; mimeType: string; filename: string }[] = [];

      if (mediaTypesRequiringFile.includes(formData.type as ResourceType)) {
        if (selectedFiles.length === 0 && !editingResource) {
          setUploadError("Please select at least one file to upload for this resource type.");
          return;
        }

        // For AUDIO_EXERCISE: all selected files are attachments (exercise items). main url stays empty
        // For VIDEO: first selected becomes main url if video; rest go to attachments
        if (selectedFiles.length > 0) {
          const uploadedFileUrls: { fileUrl: string; mimeType: string; filename: string }[] = [];

          for (let i = 0; i < selectedFiles.length; i++) {
            const f = selectedFiles[i]!;
            const fd = new FormData();
            const inferredType = formData.type === ResourceType.VIDEO ? "video" : "audio";
            fd.append("file", f);
            fd.append("type", inferredType);
            const res = await fetch("/api/upload/media", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data?.error || "Upload failed");
            }
            uploadedFileUrls.push({ fileUrl: data.fileUrl as string, mimeType: f.type || "application/octet-stream", filename: f.name });
          }

          if (formData.type === ResourceType.VIDEO) {
            // Main video url is the first uploaded; others go to attachments
            finalUrl = uploadedFileUrls[0]?.fileUrl || "";
            attachmentsPayload.push(...uploadedFileUrls.slice(1));
          } else {
            // AUDIO_EXERCISE: treat all as attachments (exercise items)
            attachmentsPayload.push(...uploadedFileUrls);
            finalUrl = "";
          }
        }
      }

      // Upload attachments (optional)
      if (attachmentFiles.length > 0) {
        for (const f of attachmentFiles) {
          const afd = new FormData();
          afd.append("file", f);
          afd.append("type", "file");
          const ar = await fetch("/api/upload/media", { method: "POST", body: afd });
          const ad = await ar.json();
          if (!ar.ok) {
            throw new Error(ad?.error || "Attachment upload failed");
          }
          attachmentsPayload.push({ fileUrl: ad.fileUrl as string, mimeType: f.type || "application/octet-stream", filename: f.name });
        }
      }

      const payload = { ...formData, url: finalUrl, attachments: attachmentsPayload };

      if (editingResource) {
        const { week, ...updateData } = payload;
        updateMutation.mutate({ resourceId: editingResource.id, ...updateData });
      } else {
        createMutation.mutate({ courseId, ...payload });
      }
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload file");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{editingResource ? "Edit Resource" : `Add Resource to Week ${formData.week}`}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
          <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="Title" required className="w-full rounded border p-2" />
          <select value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value as ResourceType }))} className="w-full rounded border p-2">
            {Object.values(ResourceType).map(type => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
          </select>
          {/* Primary media input */}
          {formData.type === ResourceType.VIDEO ? (
            <div className="space-y-2">
              <input
                type="file"
                className="w-full rounded border p-2"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setSelectedFiles(f ? [f] : []);
                }}
                accept="video/*"
              />
              {selectedFiles.length > 0 && (
                <p className="text-xs text-gray-600">Selected: {selectedFiles[0]?.name}</p>
              )}
              {editingResource && selectedFiles.length === 0 && (
                <p className="text-xs text-gray-500">Current video: {formData.url || "(none)"}</p>
              )}
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>
          ) : formData.type === ResourceType.AUDIO_EXERCISE ? (
            <div className="space-y-2">
              {/* Chips list */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((f, idx) => (
                    <span key={`${f.name}-${idx}`} className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs text-gray-700">
                      <span className="max-w-[180px] truncate" title={f.name}>{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded bg-red-100 px-1.5 py-0.5 text-red-600 hover:bg-red-200"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => audioPickerRef.current?.click()}
                  className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Add audio
                </button>
                <span className="text-xs text-gray-500">You can add multiple audio items</span>
              </div>
              <input
                ref={audioPickerRef}
                type="file"
                className="hidden"
                multiple
                accept="audio/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setSelectedFiles((prev) => [...prev, ...files]);
                  // reset value so selecting same file again re-triggers change
                  e.currentTarget.value = "";
                }}
              />
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>
          ) : (
            <div className="rounded border bg-yellow-50 p-2 text-sm text-yellow-800">Unsupported type. Only Video or Audio.</div>
          )}

          {/* Attachment uploader (multiple) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Attachments (optional{formData.type === ResourceType.AUDIO_EXERCISE ? ", add more audio files here" : ""})
            </label>
            <input
              type="file"
              multiple
              className="w-full rounded border p-2"
              accept={".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,text/plain"}
              onChange={(e) => setAttachmentFiles(Array.from(e.target.files || []))}
            />
            {attachmentFiles.length > 0 && (
              <p className="text-xs text-gray-600">{attachmentFiles.length} file(s) selected</p>
            )}
          </div>
          <textarea value={formData.content} onChange={e => setFormData(f => ({ ...f, content: e.target.value }))} placeholder="Content/Description" className="w-full rounded border p-2" rows={3}></textarea>
          
          

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded border px-4 py-2">Cancel</button>
            <button type="submit" disabled={isPending} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


