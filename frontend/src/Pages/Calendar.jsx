import React, { useState, useEffect } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { AtCoderIcon, CodeChefIcon, CodeforcesIcon, LeetCodeIcon } from "../Components/PlatformIcons";

const platformIcons = {
  Codeforces: CodeforcesIcon,
  LeetCode: LeetCodeIcon,
  AtCoder: AtCoderIcon,
  CodeChef: CodeChefIcon,
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const formatDate = (date) =>
  new Date(date)
    .toLocaleDateString([], { month: "short", day: "2-digit" })
    .toUpperCase();

export default function CalendarPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/contests`)
      .then((res) => setEvents(res.data))
      .catch((err) => console.error("Error fetching contests:", err));
  }, []);


  const upcomingContests = [...events]
    .filter((event) => new Date(event.start) >= new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tight">
              Contest Tracker
            </h1>
            <p className="text-gray-400 text-lg font-medium max-w-2xl">
              Track your coding journey across every major platform
            </p>
          </div>


        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 bg-[#13131f]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 overflow-hidden ring-1 ring-white/5">
            <div className="p-6">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"

                events={events.map((event) => ({
                  ...event,
                  backgroundColor: "transparent",
                  borderColor: "transparent",
                  textColor: "inherit",
                  extendedProps: {
                    ...event.extendedProps,
                    contestColor: event.color,
                  },
                }))}
                height="auto"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth",
                }}
                eventContent={renderEventContent}
                eventClick={(info) => {
                  alert(
                    `Contest: ${info.event.title}\nPlatform: ${info.event.extendedProps.platform}\nTime: ${formatTime(info.event.start)}`
                  );
                }}
                dayCellClassNames="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                eventClassNames="transition-all duration-200 hover:scale-[1.02] hover:brightness-110 shadow-md"
                dayMaxEvents={3}
                moreLinkText="more"
                moreLinkClassNames="text-blue-400 hover:text-blue-300 font-semibold text-xs"
              />
            </div>
          </div>

          <aside className="w-full xl:w-[400px] space-y-6">
            <div className="bg-[#13131f]/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/5 p-6 ring-1 ring-white/5">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 text-lg">
                  📅
                </span>
                Upcoming Contests
              </h2>
              <div className="space-y-4">
                {upcomingContests.map((event, idx) => {
                  const Icon = platformIcons[event.platform];
                  return (
                    <div
                      key={idx}
                      className="group relative bg-[#1c1c2e] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-blue-500/5 group-hover:to-transparent transition-all duration-500" />

                      <div className="relative flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {Icon && <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />}
                            <span className="text-[10px] font-bold tracking-wider text-blue-300 uppercase">
                              {event.platform}
                            </span>
                            <span className="text-[10px] font-semibold text-gray-500">
                              • {formatDate(event.start)}
                            </span>
                          </div>
                          <h3 className="font-bold text-white text-base leading-tight group-hover:text-blue-400 transition-colors">
                            {event.title}
                          </h3>
                        </div>
                      </div>

                      <div className="relative flex items-center justify-between mt-4 text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-300 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(event.start)}
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-md text-white shadow-sm"
                          style={{ backgroundColor: event.color }}
                        >
                          {event.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .fc {
          --fc-border-color: rgba(255, 255, 255, 0.08);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(255, 255, 255, 0.02);
          --fc-today-bg-color: rgba(59, 130, 246, 0.08);
          --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.05);
        }

        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }


        .fc .fc-toolbar-title {
          font-weight: 700;
          font-size: 1.5rem;
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .fc .fc-button-primary {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #9ca3af;
          font-weight: 600;
          text-transform: capitalize;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .fc .fc-button-primary:hover, .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .fc .fc-button-primary:disabled {
           opacity: 0.5;
        }

        .fc-col-header-cell {
          background-color: rgba(255, 255, 255, 0.02);
          padding: 1rem 0;
        }
        
        .fc-col-header-cell-cushion {
          color: #9ca3af;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .fc-daygrid-day-number {
          padding: 0.5rem 0.75rem;
          color: #6b7280;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .fc-day-today .fc-daygrid-day-number {
          background-color: #3b82f6;
          color: white;
          border-radius: 8px;
          min-width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 4px;
        }

        .fc-event {
          border: none !important;
          background-color: transparent !important;
          padding: 2px 4px;
          margin-top: 2px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .fc-daygrid-day-frame {
          min-height: 120px;
        }
      `}</style>
    </div>
  );
}


function renderEventContent(eventInfo) {
  const platform = eventInfo.event.extendedProps.platform;
  const Icon = platformIcons[platform] || platformIcons[eventInfo.event.extendedProps.platform];

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 overflow-hidden w-full h-full"
      style={{
        backgroundColor: eventInfo.event.extendedProps.contestColor + "20",
        borderLeft: eventInfo.isStart ? `3px solid ${eventInfo.event.extendedProps.contestColor}` : "none",
        borderTopLeftRadius: eventInfo.isStart ? "4px" : "0",
        borderBottomLeftRadius: eventInfo.isStart ? "4px" : "0",
        borderRadius: eventInfo.isStart ? "4px" : "0 4px 4px 0",
      }}
    >
      {/* Icons are now full-color images, so we don't apply text color to them */}
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span
        className="truncate leading-tight font-medium text-xs"
        style={{ color: eventInfo.event.extendedProps.contestColor }}
      >
        {eventInfo.event.title}
      </span>
    </div>
  );
}
