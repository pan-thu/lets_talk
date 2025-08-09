"use client";

import { useState, useRef, useEffect } from "react";
import { MicIcon, SquareIcon, PlayIcon, RefreshCwIcon } from "lucide-react";
import { api } from "~/trpc/react";

type RecordingState = "idle" | "recording" | "recorded" | "submitted";

interface StudentAudioRecorderProps {
  exerciseId?: number;
  enrollmentId?: number;
  onSubmissionSuccess?: () => void;
}

export function StudentAudioRecorder({
  exerciseId,
  enrollmentId,
  onSubmissionSuccess,
}: StudentAudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // tRPC mutation for submitting audio
  const submitAudioMutation =
    api.student.submission.createAudioSubmission.useMutation({
      onSuccess: (data) => {
        console.log("Submission successful:", data);
        setRecordingState("submitted");
        if (onSubmissionSuccess) {
          onSubmissionSuccess();
        }
      },
      onError: (error) => {
        console.error("Submission failed:", error);
        setError(`Submission failed: ${error.message}`);
      },
    });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const requestMicrophonePermission = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      return stream;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError("Unable to access microphone. Please check permissions.");
      return null;
    }
  };

  const startRecording = async () => {
    setError(null);
    const stream = await requestMicrophonePermission();
    if (!stream) return;

    streamRef.current = stream;

    try {
      // Use webm format with opus codec for better compatibility
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm;codecs=opus" });
        setAudioBlob(blob);

        // Create URL for playback
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setRecordingState("recording");
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError(
        "Failed to start recording. Your browser may not support audio recording.",
      );
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setRecordingState("recorded");
  };

  const handleRecordClick = () => {
    if (recordingState === "idle") {
      startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  const handleReRecordClick = () => {
    // Don't allow re-recording after submission
    if (recordingState === "submitted") return;

    setRecordingState("idle");
    setRecordingTime(0);
    setAudioBlob(null);
    setError(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
  };

  const handlePlaybackClick = () => {
    if (audioUrl && audioPlayerRef.current) {
      if (audioPlayerRef.current.paused) {
        audioPlayerRef.current.play();
      } else {
        audioPlayerRef.current.pause();
      }
    }
  };

  const handleSubmitClick = async () => {
    if (
      !audioBlob ||
      !exerciseId ||
      !enrollmentId ||
      recordingState === "submitted"
    ) {
      setError("Missing required data for submission or already submitted");
      return;
    }

    setError(null);

    try {
      // For Phase 2, we'll simulate the upload process
      // In Phase 3, this would upload to Cloudflare R2

      // Create a placeholder URL for the audio submission
      const timestamp = Date.now();
      const placeholderAudioUrl = `https://example.com/audio-submissions/${exerciseId}-${enrollmentId}-${timestamp}.webm`;

      // Call the tRPC mutation
      submitAudioMutation.mutate({
        exerciseId,
        enrollmentId,
        audioFileUrl: placeholderAudioUrl,
      });
    } catch (error) {
      console.error("Submission error:", error);
      setError("Failed to submit recording. Please try again.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isSubmitting = submitAudioMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {recordingState === "submitted" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-sm text-green-600">
            ✅ Recording submitted successfully! Exercise completed.
          </p>
        </div>
      )}

      {/* Recording State Display */}
      <div className="text-center">
        {recordingState === "recording" && (
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"></div>
            <p className="text-sm font-medium text-red-600">
              Recording... {formatTime(recordingTime)}
            </p>
          </div>
        )}

        {recordingState === "recorded" && (
          <p className="text-sm font-medium text-green-600">
            Recording complete! You can listen to your recording or submit it
            below.
          </p>
        )}
      </div>

      {/* Hidden Audio Player for Playback */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          style={{ display: "none" }}
        />
      )}

      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-3">
        {/* Primary Recording Button - Only show if not submitted */}
        {recordingState !== "submitted" &&
          (recordingState === "idle" || recordingState === "recording") && (
            <button
              onClick={handleRecordClick}
              disabled={isSubmitting}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-all duration-200 ${
                recordingState === "idle"
                  ? "bg-red-500 hover:scale-105 hover:bg-red-600 disabled:opacity-50"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {recordingState === "idle" ? (
                <MicIcon className="h-5 w-5" />
              ) : (
                <SquareIcon className="h-5 w-5" />
              )}
            </button>
          )}

        {/* Button Label */}
        {recordingState !== "submitted" && (
          <p className="text-custom-dark-text text-xs font-medium">
            {recordingState === "idle" && "Start Recording"}
            {recordingState === "recording" && "Stop Recording"}
          </p>
        )}

        {/* Post-Recording Controls */}
        {(recordingState === "recorded" || recordingState === "submitted") && (
          <div className="flex w-full flex-col items-center space-y-3">
            {/* Playback and Re-record buttons - only show re-record if not submitted */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={handlePlaybackClick}
                disabled={!audioUrl || isSubmitting}
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <PlayIcon className="h-3 w-3" />
                <span>Listen</span>
              </button>

              {recordingState !== "submitted" && (
                <button
                  onClick={handleReRecordClick}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 rounded-lg bg-gray-600 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                >
                  <RefreshCwIcon className="h-3 w-3" />
                  <span>Re-record</span>
                </button>
              )}
            </div>

            {/* Submit Button - only show if not submitted */}
            {recordingState !== "submitted" && (
              <button
                onClick={handleSubmitClick}
                disabled={isSubmitting || !audioBlob}
                className="w-full max-w-xs rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Exercise"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recording Tips for mobile/tablet (visible on smaller screens) */}
      <div className="border-t border-gray-200 pt-3 lg:hidden">
        <h4 className="text-custom-dark-text mb-2 text-xs font-medium">
          Recording Tips:
        </h4>
        <ul className="text-custom-light-text space-y-0.5 text-xs">
          <li>• Make sure you're in a quiet environment</li>
          <li>• Speak clearly and at a normal pace</li>
          <li>• Hold your device at a comfortable distance</li>
          <li>• You can re-record as many times as needed</li>
        </ul>
      </div>
    </div>
  );
}
