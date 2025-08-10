"use client";

import { useState, useEffect } from "react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { MonthNavigator } from "~/_components/shared/MonthNavigator";
import { CalendarMonthGrid } from "~/_components/shared/CalendarMonthGrid";
import { MobileEventList } from "~/_components/shared/MobileEventList";
import { api } from "~/trpc/react";

// Define the StaticEvent type to match the one in CalendarMonthGrid
interface StaticEvent {
  day: number;
  title: string;
  time?: string;
  type?: "today-event" | "event" | "today-event-highlight";
  color?: string;
}

export default function StudentCalendarPage() {
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date());
  const [today, setToday] = useState(new Date());
  const [isMobileView, setIsMobileView] = useState(false);

  const {
    data: eventsData,
    isLoading,
    error,
  } = api.student.dashboard.getCalendarEvents.useQuery();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    setToday(new Date());
    setCurrentDisplayDate(new Date());
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const goToPreviousMonth = () => {
    setCurrentDisplayDate(
      (prevDate) =>
        new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDisplayDate(
      (prevDate) =>
        new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    const now = new Date();
    setToday(now);
    setCurrentDisplayDate(now);
  };

  const displayedYear = currentDisplayDate.getFullYear();
  const displayedMonth = currentDisplayDate.getMonth();

  // Filter events for the currently displayed month and year
  const monthlyEvents = (eventsData ?? [])
    .filter(
      (event) => event.year === displayedYear && event.month === displayedMonth,
    )
    .map((event) => ({ ...event, type: "event" }) as StaticEvent);

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation currentPath="Calendar" />
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white p-3 shadow-md sm:p-4 md:p-6">
        <MonthNavigator
          currentDate={currentDisplayDate}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />

        {isLoading && <div className="text-center">Loading events...</div>}
        {error && (
          <div className="text-center text-red-500">Could not load events.</div>
        )}

        {isMobileView && (
          <MobileEventList
            events={monthlyEvents}
            month={displayedMonth}
            year={displayedYear}
          />
        )}

        <div className="mt-1 flex-1 overflow-hidden md:mt-4">
          <CalendarMonthGrid
            year={displayedYear}
            month={displayedMonth}
            events={monthlyEvents}
            todayDate={today}
            showEventsInGrid={!isMobileView}
          />
        </div>
      </div>
    </div>
  );
}
