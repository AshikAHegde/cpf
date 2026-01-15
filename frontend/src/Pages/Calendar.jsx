import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
const events = [
  {
    title: "Weekly 482",
    start: "2026-01-04",
    color: "#757572", // yellow
    extendedProps: { platform: "LeetCode", icon: "🟡" },
  },
  {
    title: "Edu Round",
    start: "2026-01-05",
    color: "#38bdf8", // blue
    extendedProps: { platform: "Codeforces", icon: "🔵" },
  },
  // ...add more events as needed
];

export default function CalendarPage() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 bg-gray-800 rounded-lg p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          eventContent={renderEventContent}
        />
      </div>
      <aside className="w-full md:w-80 bg-gray-900 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Upcoming Contests</h2>
        <ul className="space-y-2">
          {events.slice(0, 5).map((event, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span>{event.extendedProps.icon}</span>
              <span>{event.title}</span>
              <span className="ml-auto text-xs text-gray-400">
                {event.start}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function renderEventContent(eventInfo) {
  return (
    <div className="flex items-center gap-1">
      <span>{eventInfo.event.extendedProps.icon}</span>
      <span>{eventInfo.event.title}</span>
    </div>
  );
}
