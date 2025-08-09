interface ProgressBarDisplayProps {
  progressPercentage: number;
  currentMarks: number;
  totalMarks: number;
}

export function ProgressBarDisplay({
  progressPercentage,
  currentMarks,
  totalMarks,
}: ProgressBarDisplayProps) {
  return (
    <div className="relative rounded-lg bg-white p-6 shadow-md">
      <div className="relative mb-3">
        {/* Percentage label above the progress bar */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <span className="inline-block rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
            {progressPercentage}%
          </span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 text-xs text-gray-600">
            Progress
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-3 w-full rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-purple-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Marks display */}
      <div className="text-right">
        <span className="text-sm text-gray-600">
          Marks-{currentMarks}/{totalMarks}
        </span>
      </div>
    </div>
  );
}
