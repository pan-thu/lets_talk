"use client";

import { use, useState, type ReactNode } from "react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

      // For media types that should use file upload, prefer uploading the selected file
      const mediaTypesRequiringFile: ResourceType[] = [
        ResourceType.VIDEO,
        ResourceType.AUDIO_EXERCISE,
        ResourceType.FILE,
        ResourceType.PDF,
      ].filter((t) => (ResourceType as any)[t] !== undefined) as ResourceType[];

      let finalUrl = formData.url;

      if (mediaTypesRequiringFile.includes(formData.type as ResourceType)) {
        if (!selectedFile && !editingResource) {
          setUploadError("Please select a file to upload for this resource type.");
          return;
        }

        if (selectedFile) {
          const fd = new FormData();
          const inferredType = formData.type === ResourceType.VIDEO ? "video" : formData.type === ResourceType.AUDIO_EXERCISE ? "audio" : formData.type === ResourceType.PDF ? "pdf" : "file";
          fd.append("file", selectedFile);
          fd.append("type", inferredType);

          const res = await fetch("/api/upload/media", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || "Upload failed");
          }
          finalUrl = data.fileUrl as string;
        }
      }

      const payload = { ...formData, url: finalUrl };

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
          {/* File input for media types; keep URL for LINK/TEXT or when editing without new file */}
          {(formData.type === ResourceType.VIDEO || formData.type === ResourceType.AUDIO_EXERCISE || formData.type === ResourceType.PDF || formData.type === ResourceType.FILE) ? (
            <div className="space-y-2">
              <input
                type="file"
                className="w-full rounded border p-2"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept={formData.type === ResourceType.VIDEO ? "video/*" : formData.type === ResourceType.AUDIO_EXERCISE ? "audio/*" : formData.type === ResourceType.PDF ? "application/pdf" : undefined}
              />
              {editingResource && !selectedFile && (
                <p className="text-xs text-gray-500">Current file: {formData.url || "(none)"}</p>
              )}
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>
          ) : (
            <input type="text" value={formData.url} onChange={e => setFormData(f => ({ ...f, url: e.target.value }))} placeholder="URL (e.g., link)" className="w-full rounded border p-2" />
          )}
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


