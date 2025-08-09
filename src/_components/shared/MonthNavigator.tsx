import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface MonthNavigatorProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function MonthNavigator({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: MonthNavigatorProps) {
  const monthYearString = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="hover:bg-opacity-80 rounded border border-[var(--color-border)] bg-[var(--color-pink)] px-3 py-1.5 text-sm text-[var(--color-dark-text)] shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 active:transform"
          onClick={onToday}
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Previous month"
            onClick={onPreviousMonth}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-[var(--color-dark-text)]">
        {monthYearString}
      </h2>
      {/* Placeholder for potential view toggles if needed later, or remove */}
      <div className="w-20"></div>{" "}
      {/* Spacer to balance the Today button side */}
    </div>
  );
}
