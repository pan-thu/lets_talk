"use client";

import { use } from "react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { api } from "~/trpc/react";

export default function TeacherExerciseReviewPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = use(params);
  const id = Number(exerciseId);

  const { data, isLoading, error } = api.teacher.submission.getForExercise.useQuery({ exerciseId: id }, { enabled: !isNaN(id) });
  const gradeMutation = api.teacher.submission.gradeSubmission.useMutation();

  const utils = api.useUtils();

  const handleGrade = async (submissionId: number, grade: number, feedback?: string) => {
    await gradeMutation.mutateAsync({ submissionId, grade, feedback });
    // Refresh query so grade reflects immediately
    utils.teacher.submission.getForExercise.invalidate({ exerciseId: id });
  };

  if (isLoading) return <div className="p-6">Loading exercise review…</div>;
  if (error || !data) return <div className="p-6 text-red-600">Failed to load exercise.</div>;

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Teacher", path: "/teacher/courses" }]}
        currentPath={`Review: ${data.exercise.title}`}
      />

      <h1 className="mb-4 text-2xl font-semibold">{data.exercise.title}</h1>

      <div className="space-y-6">
        {data.attachments.length === 0 ? (
          <div className="rounded border bg-white p-4">No audio items yet.</div>
        ) : (
          data.attachments.map((a) => (
            <div key={a.id} className="rounded border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-medium">Audio Item: {a.filename}</div>
              </div>
              <audio controls className="mb-3 w-full">
                <source src={a.fileUrl} />
              </audio>
              {a.submissions.length === 0 ? (
                <div className="text-sm text-gray-600">No submissions yet.</div>
              ) : (
                <div className="space-y-3">
                  {a.submissions.map((s) => (
                    <div key={s.id} className="rounded border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{s.student?.name || "Student"}</div>
                          <div className="text-xs text-gray-500">{s.student?.email}</div>
                        </div>
                        <div className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleString()}</div>
                      </div>
                      <audio controls className="w-full">
                        <source src={s.audioUrl || ""} />
                      </audio>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input type="number" min={0} max={100} defaultValue={s.grade ?? ""} className="w-20 rounded border p-1 text-sm" id={`grade-${s.id}`} />
                        <input type="text" placeholder="Feedback" defaultValue={s.feedback ?? ""} className="min-w-[200px] flex-1 rounded border p-1 text-sm" id={`fb-${s.id}`} />
                        <button
                          onClick={() => {
                            const gradeInput = (document.getElementById(`grade-${s.id}`) as HTMLInputElement)?.value;
                            const fbInput = (document.getElementById(`fb-${s.id}`) as HTMLInputElement)?.value;
                            const parsed = Number(gradeInput);
                            if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) return;
                            void handleGrade(s.id, parsed, fbInput || undefined);
                          }}
                          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                        {s.grade != null && <span className="text-sm text-gray-700">Grade: {s.grade}</span>}
                        {s.feedback && <span className="text-xs text-gray-500">Feedback: {s.feedback}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


