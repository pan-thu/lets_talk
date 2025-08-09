interface StaticEvent {
  day: number;
  title: string;
  time?: string;
  type?: "today-event" | "event" | "today-event-highlight"; // To differentiate styling
  color?: string; // Optional specific color
}

interface CalendarMonthGridProps {
  year: number;
  month: number; // 0-indexed (0 for January, 11 for December)
  events: StaticEvent[];
  todayDate: Date;
  showEventsInGrid?: boolean; // New prop to control event display
}

export function CalendarMonthGrid({
  year,
  month,
  events,
  todayDate,
  showEventsInGrid = true, // Default to true for desktop
}: CalendarMonthGridProps) {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

  const actualTodayDay = todayDate.getDate();
  const actualTodayMonth = todayDate.getMonth();
  const actualTodayYear = todayDate.getFullYear();

  // Calculate days from the previous month to fill the first row
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

  // Calculate how many rows we need
  const numRows = Math.ceil((startDayOfWeek + daysInMonth) / 7);

  const cells = [];
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    const prevMonthDay = daysInPrevMonth - startDayOfWeek + i + 1;
    cells.push(
      <div
        key={`empty-prev-${i}`}
        className="flex h-full flex-col border border-gray-200/70 backdrop-blur-sm"
      >
        <div className="p-1">
          <span className="float-right self-end text-sm text-gray-400/90">
            {prevMonthDay}
          </span>
        </div>
      </div>,
    );
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isActualToday =
      day === actualTodayDay &&
      month === actualTodayMonth &&
      year === actualTodayYear;
    const dayEvents = events.filter((event) => event.day === day);
    const hasEvents = dayEvents.length > 0;

    let cellClasses =
      "border border-gray-200/80 flex flex-col h-full hover:bg-gray-50/50 transition-colors duration-150";

    if (isActualToday) {
      cellClasses += " bg-green-50/20 ring-1 ring-green-100/30";
    }

    let dayNumberClasses = "text-sm text-gray-700"; // Position day number at top-right

    if (isActualToday) {
      dayNumberClasses +=
        " bg-green-200/60 text-green-800 rounded-full h-6 w-6 flex items-center justify-center";
    }

    cells.push(
      <div key={`day-${day}`} className={cellClasses}>
        <div className="p-1">
          <div className="flex justify-end">
            {/* Show indicator dot for days with events on mobile */}
            {!showEventsInGrid && hasEvents && (
              <div className="mr-1 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
            )}
            <span className={dayNumberClasses}>{day}</span>
          </div>
          {/* Only show events in grid if showEventsInGrid is true */}
          {showEventsInGrid && (
            <div className="mt-1 flex flex-grow flex-col space-y-0.5 overflow-hidden pt-0.5">
              {dayEvents.slice(0, 2).map((event, index) => (
                <div
                  key={index}
                  title={event.title}
                  className="flex cursor-pointer overflow-hidden rounded shadow-sm transition-shadow duration-200 hover:shadow"
                  style={{ backgroundColor: "rgba(232, 244, 252, 0.85)" }}
                >
                  <div className="w-1.5 bg-blue-500/90"></div>
                  <div className="flex-1 truncate px-2 py-1.5 backdrop-blur-[2px]">
                    {event.time && (
                      <div className="text-xs font-medium text-blue-600">
                        {event.time}
                      </div>
                    )}
                    <div className="truncate text-xs text-gray-800">
                      {event.title}
                    </div>
                  </div>
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="mt-1 text-center text-xs text-gray-500 hover:underline">
                  + {dayEvents.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>,
    );
  }

  // Add empty cells for days after the last of the month to fill the grid
  const totalCells = cells.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    const nextMonthDay = i + 1;
    cells.push(
      <div
        key={`empty-next-${i}`}
        className="flex h-full flex-col border border-gray-200/70 backdrop-blur-sm"
      >
        <div className="p-1">
          <span className="float-right self-end text-sm text-gray-400/90">
            {nextMonthDay}
          </span>
        </div>
      </div>,
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Day Headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="border border-gray-200/80 bg-gray-50/30 py-2"
          >
            {day}
          </div>
        ))}
      </div>
      {/* Calendar Grid */}
      <div
        className="grid flex-1 grid-cols-7"
        style={{
          gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
