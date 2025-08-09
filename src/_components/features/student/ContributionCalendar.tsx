// src/app/_components/dashboard/ContributionCalendar.tsx
"use client";

import React from "react";
import ActivityCalendar, { type Activity } from "react-activity-calendar";
import { api } from "~/trpc/react";

export function ContributionCalendar() {
  const {
    data: contributions,
    isLoading,
    error,
  } = api.user.getContributionData.useQuery();

  // Theme to match the green shades from the initial target UI
  // and a light default for empty cells.
  const colorTheme = {
    light: ["#F0F0F0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"],
    dark: ["#333333", "#0e4429", "#006d32", "#26a641", "#39d353"],
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-lg bg-white p-3 shadow-md sm:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <div className="flex w-full flex-grow items-center sm:w-auto">
            <div className="mr-4 h-6 w-48 animate-pulse rounded bg-gray-200"></div>
            <div className="section-line h-px w-full flex-grow"></div>
          </div>
          <div className="mt-2 h-4 w-12 animate-pulse rounded bg-gray-200 sm:mt-0 sm:ml-4"></div>
        </div>

        <div className="w-full overflow-x-auto pb-1">
          <div className="min-h-[160px] min-w-[700px] pl-12 md:min-w-[850px]">
            {/* Skeleton calendar grid */}
            <div className="space-y-2">
              {/* Month labels skeleton */}
              <div className="flex justify-between px-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-3 w-6 animate-pulse rounded bg-gray-200"
                  ></div>
                ))}
              </div>

              {/* Calendar grid skeleton */}
              <div className="flex">
                {/* Day labels */}
                <div className="mr-4 space-y-2">
                  {["Mon", "Wed", "Fri"].map((day, i) => (
                    <div
                      key={day}
                      className="h-4 w-6 animate-pulse rounded bg-gray-200"
                    ></div>
                  ))}
                </div>

                {/* Calendar blocks */}
                <div className="grid grid-cols-53 gap-1">
                  {Array.from({ length: 371 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-4 w-4 animate-pulse rounded bg-gray-200"
                      style={{ animationDelay: `${(i % 10) * 50}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-lg bg-white p-3 shadow-md sm:p-4">
        <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
          <p>Could not load your contribution data at this time.</p>
        </div>
      </div>
    );
  }

  // Backend now provides complete year data, but ensure type safety
  const validatedData =
    contributions?.filter(
      (
        item,
      ): item is { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 } =>
        typeof item.date === "string" && typeof item.count === "number",
    ) || [];

  return (
    // This div now acts as the card
    <div className="w-full rounded-lg bg-white p-3 pb-6 shadow-md sm:p-4 sm:pb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between">
        <div className="flex w-full flex-grow items-center sm:w-auto">
          <h3 className="mr-4 text-lg font-semibold whitespace-nowrap text-[var(--color-dark-text)]">
            Your Contribution Activity
          </h3>
          <div className="section-line h-px w-full flex-grow"></div>
        </div>
        <span className="mt-2 text-xs text-[var(--color-light-text)] sm:mt-0 sm:ml-4 sm:text-sm">
          {new Date().getFullYear()}
        </span>
      </div>

      {/* Wrapper for the calendar to manage overflow and give it a specific context for styling */}
      <div
        className="w-full overflow-x-auto pb-1"
        style={{
          // For hiding scrollbar if it appears
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
      >
        {/* Added pl-12 to add padding to the left side */}
        <div className="min-h-[160px] min-w-[700px] pl-12 md:min-w-[850px]">
          <ActivityCalendar
            data={validatedData}
            theme={{
              light: colorTheme.light,
              dark: colorTheme.dark,
            }}
            colorScheme="light"
            fontSize={12}
            blockSize={16}
            blockMargin={8}
            blockRadius={10}
            showWeekdayLabels={true}
            hideTotalCount={true}
            hideColorLegend={true}
            style={{
              width: "100%",
              color: "var(--color-dark-text)",
            }}
            labels={{
              months: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ],
              weekdays: [
                "", // Sun - empty to push Mon down
                "Mon",
                "", // Tue
                "Wed",
                "", // Thu
                "Fri",
                "", // Sat
              ],
              totalCount: "{{count}} contributions in the last year",
            }}
          />
        </div>
      </div>
    </div>
  );
}
