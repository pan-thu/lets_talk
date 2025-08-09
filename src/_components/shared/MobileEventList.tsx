interface StaticEvent {
  day: number;
  title: string;
  time?: string;
  type?: "today-event" | "event" | "today-event-highlight";
  color?: string;
}

interface MobileEventListProps {
  events: StaticEvent[];
  month: number; // 0-indexed
  year: number;
}

export function MobileEventList({ events, month, year }: MobileEventListProps) {
  if (!events || events.length === 0) {
    return (
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-sm text-gray-500">
        No events scheduled for this month.
      </div>
    );
  }

  // Sort events by day, then by time (if available)
  const sortedEvents = [...events].sort((a, b) => {
    if (a.day !== b.day) {
      return a.day - b.day;
    }
    // Basic time sort
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    return 0;
  });

  const formatDate = (day: number, month: number, year: number) => {
    return new Date(year, month, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200/80 bg.white p-3 shadow-sm">
      <h3 className="text-md mb-3 font-semibold text-gray-800">
        This Month's Events
      </h3>
      <ul className="max-h-60 space-y-2.5 overflow-y-auto">
        {sortedEvents.map((event, index) => (
          <li
            key={index}
            className="flex items-start space-x-2.5 rounded-md bg-blue-50/70 p-2.5 shadow-xs"
          >
            <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {formatDate(event.day, month, year)}
                {event.time && (
                  <span className="ml-2 text-xs text-blue-600">
                    {event.time}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-700">{event.title}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
