import { PlayIcon } from "lucide-react";

interface TeacherPromptDisplayProps {
  textInstructions?: string | null;
  audioUrl?: string | null;
}

export function TeacherPromptDisplay({
  textInstructions,
  audioUrl,
}: TeacherPromptDisplayProps) {
  return (
    <div className="space-y-3">
      {/* Text Instructions */}
      {textInstructions && (
        <p className="text-custom-light-text text-sm leading-relaxed">
          {textInstructions}
        </p>
      )}

      {/* Audio Player - Compact */}
      {audioUrl && (
        <div className="flex items-center space-x-3 rounded-md bg-gray-50 p-2">
          {/* Play Button */}
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700">
            <PlayIcon className="ml-0.5 h-3 w-3" />
          </button>

          {/* Progress Bar */}
          <div className="flex-1">
            <div className="h-1 rounded-full bg-gray-300">
              <div
                className="h-1 rounded-full bg-blue-600"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>

          {/* Duration */}
          <div className="font-mono text-xs text-gray-500">0:45</div>
        </div>
      )}
    </div>
  );
}
