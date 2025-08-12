"use client";

import { useState } from "react";
import { Download, AlertTriangle, X } from "lucide-react";
import { api } from "~/trpc/react";
import ConfirmationToast from "~/_components/ui/ConfirmationToast";

interface LessonActionPanelProps {
  lessonId: number;
  videoUrl: string;
}

export default function LessonActionPanel({
  lessonId,
  videoUrl,
}: LessonActionPanelProps) {
  const [reportText, setReportText] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const utils = api.useUtils();
  const submitReport = api.student.errorReport.submit.useMutation({
    onSuccess: () => {
      setReportText("");
      setShowSuccessToast(true);
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setShowErrorToast(true);
    },
  });

  const handleReportTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setReportText(e.target.value);
  };

  const handleReportSubmit = () => {
    if (reportText.trim().length < 10) {
      setErrorMessage(
        "Please provide a more detailed description (at least 10 characters)",
      );
      setShowErrorToast(true);
      return;
    }

    submitReport.mutate({
      lessonId,
      description: reportText.trim(),
    });
  };

  const handleDownload = () => {
    // Create a temporary link to download the video
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `lesson-${lessonId}-video.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeErrorToast = () => {
    setShowErrorToast(false);
    setErrorMessage("");
  };

  return (
    <>
      <div className="relative w-full flex-shrink-0 rounded-lg bg-white p-4 shadow-md md:w-72 lg:w-80">
        {/* Continuous vertical line extending to card bottom */}
        <div className="absolute top-4 bottom-4 left-6 w-0.5 bg-gray-400"></div>

        {/* Download Section */}
        <div className="relative flex items-start space-x-3 pb-25">
          <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
            <Download className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-dark-text)]">
              Download this lesson video
            </h3>
            <button
              onClick={handleDownload}
              className="w-full rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              Download the video
            </button>
          </div>
        </div>

        {/* Report Issue Section */}
        <div className="relative flex items-start space-x-3">
          <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
            <AlertTriangle className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-dark-text)]">
              Report an issue with the video
            </h3>
            <textarea
              placeholder="Describe the issue..."
              className="w-full resize-none rounded border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
              rows={3}
              value={reportText}
              onChange={handleReportTextChange}
              disabled={submitReport.isPending}
            />
            <button
              onClick={handleReportSubmit}
              disabled={
                !reportText.trim() ||
                reportText.trim().length < 10 ||
                submitReport.isPending
              }
              className={`w-full rounded px-4 py-2 text-sm font-medium transition-colors ${
                reportText.trim() &&
                reportText.trim().length >= 10 &&
                !submitReport.isPending
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "cursor-not-allowed bg-gray-300 text-gray-500"
              }`}
            >
              {submitReport.isPending ? "Reporting..." : "Report Issue"}
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      <ConfirmationToast
        message="Issue reported successfully! We'll review it shortly."
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        duration={5000}
      />

      {/* Error Toast */}
      {showErrorToast && (
        <div className="toast-enter fixed bottom-4 left-4 z-50">
          <div className="flex items-center space-x-3 rounded-lg bg-red-500 px-4 py-3 text-white shadow-lg">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
            <button
              onClick={closeErrorToast}
              className="ml-2 rounded-full p-1 transition-colors hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
