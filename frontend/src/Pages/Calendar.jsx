import React, { useState, useEffect } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { AtCoderIcon, CodeChefIcon, CodeforcesIcon, LeetCodeIcon } from "../Components/PlatformIcons";
import { EnvelopeIcon, DevicePhoneMobileIcon, ClockIcon, BellIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';
import ContestModal from "../Components/ContestModal";
import Loading from "../Components/Loading";

const platformIcons = {
  Codeforces: CodeforcesIcon,
  LeetCode: LeetCodeIcon,
  AtCoder: AtCoderIcon,
  CodeChef: CodeChefIcon,
  // Fallback for unknown platforms if needed
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const formatDate = (date) =>
  new Date(date)
    .toLocaleDateString([], { month: "short", day: "2-digit" })
    .toUpperCase();

// Helper to format date for ICS (YYYYMMDDTHHMMSSZ)
const formatICSDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Contests
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/api/contests`)
      .then((res) => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching contests:", err);
        setLoading(false);
      });

    // Fetch User Preferences if logged in
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/users/${userEmail}`)
        .then((res) => setUserPreferences(res.data.preferences))
        .catch((err) => console.error("Error fetching user prefs:", err));
    }
  }, []);

  const upcomingContests = [...events]
    .filter((event) => new Date(event.start) >= new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  const generateICS = () => {
    const viewStart = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1);
    const viewEnd = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0);

    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= viewStart && eventDate <= viewEnd;
    });

    if (monthEvents.length === 0) {
      alert("No contests found for this month to export.");
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Contest Platform//Contest Tracker//EN\n";

    monthEvents.forEach(event => {
      const start = formatICSDate(event.start);
      // Default to 2 hours if no end time, or use start + duration if available
      // Assuming event.end exists or we imply a duration. Let's assume 2 hours for safety if no end.
      let end = event.end ? formatICSDate(event.end) : null;
      if (!end) {
        const startDate = new Date(event.start);
        startDate.setHours(startDate.getHours() + 2);
        end = formatICSDate(startDate);
      }

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${event._id || event.id || start + event.title.replace(/\s/g, "")}@contestplatform\n`;
      icsContent += `DTSTAMP:${formatICSDate(new Date())}\n`;
      icsContent += `DTSTART:${start}\n`;
      icsContent += `DTEND:${end}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      icsContent += `DESCRIPTION:Platform: ${event.platform}\\nType: ${event.type || 'Contest'}\n`;
      if (event.url) icsContent += `URL:${event.url}\n`;
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    const monthName = currentViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    link.download = `contests-${monthName.replace(" ", "-")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [selectedContest, setSelectedContest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState(null);

  const handleEventClick = (info) => {
    info.jsEvent.preventDefault();
    // Clicking behaves the same as hover now (opens/keeps open), or specifically focuses it?
    // Let's ensure it opens/positions just like hover
    handleInteraction(info);
  };

  const handleEventMouseEnter = (info) => {
    handleInteraction(info);
  };

  const handleEventMouseLeave = () => {
    // Small delay to allow moving to popover
    setTimeout(() => {
      // We rely on the Modal's internal click-outside or mouse-leave logic to handle closing
      // But since we are controlling isOpen here, we need to signal close.
      // However, if we move mouse to modal, we don't want to close.
      // The simple way: Let the modal handle it?
      // Actually, controlling "hover" state from parent is tricky if separate components.
      // Strategy: Parent sets "Open", but "Close" is triggered by clicking outside OR explicitly leaving event+modal.
      // For simplicity: Hover opens it. Clicking outside closes it. 
      // User asked "hoverd and as well clicked". 
      // If I hover, it opens. If I move mouse away, should it close? Usually yes for tooltips.
      // But user wants to CLICK buttons inside. So it must persist if mouse moves to it.
      // This is handled if the popover is adjacent.
      // Let's TRY leaving it open until click outside or other event hover?
      // Reference image shows a persistent-looking card. 
      // "Hover" usually implies ephemeral. 
      // Let's add a close handler that checks hover state?
      // Actually, the previous implementation had a "click outside" to close.
      // If we want hover to OPEN, that's fine. 
      // If we want hover-out to CLOSE, we need to bridge the gap.
      // Let's stick to "Hover OPENS it". Closing happens on click outside (standard comfortable UX) OR hovering another event.
    }, 100);
  };

  const handleInteraction = (info) => {
    const rect = info.el.getBoundingClientRect();
    setPopoverPos({
      x: rect.left,
      y: rect.bottom + 5
    });

    const fullContest = {
      ...info.event.extendedProps,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      url: info.event.extendedProps.url || info.event.url
    };
    setSelectedContest(fullContest);
    setIsModalOpen(true);
  }

  const handleSidebarClick = (e, contest) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    // Position the modal to the left of the sidebar item if possible, or contextually appropriate
    // Sidebar is on the right, so we might want it to appear to the left of the item
    // But ContestModal logic handles positioning (mostly bottom/right logic fallback or just x,y).
    // Let's pass the element's position.
    setPopoverPos({
      x: rect.left, // Align with left edge of item
      y: rect.bottom + 5 // Below item
    });
    setSelectedContest(contest);
    setIsModalOpen(true);
  };

  const handleAddToCalendar = (contest) => {
    if (!contest) return;
    const start = new Date(contest.start).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = contest.end
      ? new Date(contest.end).toISOString().replace(/-|:|\.\d\d\d/g, "")
      : new Date(new Date(contest.start).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(contest.title)}&dates=${start}/${end}&details=${encodeURIComponent(`Platform: ${contest.platform}\n${contest.url}`)}&location=${encodeURIComponent(contest.url)}`;
    window.open(gCalUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 p-4 md:p-8 font-sans transition-colors duration-300">
      <ContestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contest={selectedContest}
        onAddToCalendar={handleAddToCalendar}
        Icon={selectedContest ? platformIcons[selectedContest.platform] : null}
        position={popoverPos}
      />
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
          <div className="flex-1 bg-[#13131f]/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden ring-1 ring-white/5">
            <div className="p-6">
              {loading ? (
                <Loading />
              ) : (
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
                      userPreferences: userPreferences // Pass prefs to event
                    },
                  }))}
                  height="auto"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth",
                  }}
                  datesSet={(dateInfo) => {
                    // Determine the current month being viewed based on the midpoint of the visible range
                    const midDate = new Date(dateInfo.view.currentStart);
                    midDate.setDate(midDate.getDate() + 15);
                    setCurrentViewDate(midDate);
                  }}
                  eventContent={renderEventContent}
                  eventClick={handleEventClick}
                  dayCellClassNames="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                  eventClassNames="transition-all duration-200 hover:scale-[1.02] hover:brightness-110 shadow-md"
                  dayMaxEvents={3}
                  moreLinkText="more"
                  moreLinkClassNames="text-blue-400 hover:text-blue-300 font-semibold text-xs"
                />
              )}
            </div>
          </div>

          <aside className="w-full xl:w-[400px] space-y-6">
            {/* Google Calendar Sync Button */}
            <div className="bg-[#13131f]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg flex flex-col items-start gap-3 relative overflow-hidden group hover:bg-[#13131f]/80 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CalendarDaysIcon className="w-24 h-24 text-purple-500 transform -rotate-12" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Sync to Calendar</h3>
                <p className="text-gray-400 text-sm">Download this month's contests to your Google Calendar.</p>
              </div>
              <button
                onClick={generateICS}
                className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 z-10"
              >
                <CalendarDaysIcon className="w-5 h-5" />
                Add to Google Calendar
              </button>
            </div>

            {/* Reminder Button */}
            <div className="bg-[#13131f]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg flex flex-col items-start gap-3 relative overflow-hidden group hover:bg-[#13131f]/80 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BellIcon className="w-24 h-24 text-blue-500 transform rotate-12" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Never Miss a Contest</h3>
                <p className="text-gray-400 text-sm">Get notified via Email or SMS before contests start.</p>
              </div>
              <button
                onClick={() => window.location.href = '/profile'}
                className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 z-10"
              >
                <BellIcon className="w-5 h-5" />
                Set Reminders
              </button>
            </div>

            <div className="bg-[#13131f]/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/10 p-6 ring-1 ring-white/5">
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
                      onClick={(e) => handleSidebarClick(e, event)}
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
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }

        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }

        .fc .fc-toolbar-title {
          font-weight: 800;
          font-size: 2rem; /* Increased Title */
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          letter-spacing: -0.025em;
        }

        /* ... buttons ... */

        .fc-col-header-cell-cushion {
          color: #e5e7eb; 
          font-weight: 700;
          font-size: 1.25rem; /* Increased from 1.1rem */
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 8px !important;
        }

        .fc-daygrid-day-number {
          padding: 0.75rem 0.75rem;
          color: #d1d5db; /* Lighter */
          font-weight: 600; 
          font-size: 1.25rem; /* Increased from 1.1rem */
        }

        .fc-day-today .fc-daygrid-day-number {
          background-color: #3b82f6;
          color: white;
          border-radius: 8px;
          min-width: 40px; /* Increased */
          height: 40px; /* Increased */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 4px;
        }

        .fc-event {
          border: none !important;
          background-color: transparent !important;
          padding: 4px 8px; 
          margin-top: 4px;
          border-radius: 6px;
          font-size: 1rem; /* Increased from 0.95rem */
          font-weight: 600; 
          letter-spacing: 0.01em;
        }
        
        .fc-daygrid-day-frame {
          min-height: 120px;
        }

        .fc-popover {
          background-color: #1a1a2e !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4) !important;
          border-radius: 0.75rem !important;
          overflow: hidden;
          z-index: 40 !important; /* Below custom modal if needed */
        }

        .fc-popover-header {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #e5e7eb !important;
          font-weight: 700 !important;
          padding: 0.75rem 1rem !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .fc-popover-body {
          padding: 0.5rem !important;
        }
        
        .fc-theme-standard .fc-popover-header {
           background: transparent;
        }
      `}</style>
    </div>
  );
}


function renderEventContent(eventInfo) {
  const platform = eventInfo.event.extendedProps.platform;
  const Icon = platformIcons[platform] || platformIcons[eventInfo.event.extendedProps.platform];
  const prefs = eventInfo.event.extendedProps.userPreferences;

  // Determine Notification Icons to show
  const showEmail = prefs?.notifications?.channels?.email;
  const showSms = prefs?.notifications?.channels?.sms;

  // Determine Reminders
  const show1Day = prefs?.notifications?.reminders?.oneDay;
  const show2Day = prefs?.notifications?.reminders?.twoDays;

  return (
    <div
      className="flex flex-col gap-0.5 px-2 py-1 overflow-hidden w-full h-full relative"
      style={{
        backgroundColor: eventInfo.event.extendedProps.contestColor + "20",
        borderLeft: eventInfo.isStart ? `3px solid ${eventInfo.event.extendedProps.contestColor}` : "none",
        borderTopLeftRadius: eventInfo.isStart ? "4px" : "0",
        borderBottomLeftRadius: eventInfo.isStart ? "4px" : "0",
        borderRadius: eventInfo.isStart ? "4px" : "0 4px 4px 0",
      }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span
          className="truncate leading-tight font-medium text-xs"
          style={{ color: eventInfo.event.extendedProps.contestColor }}
        >
          {eventInfo.event.title}
        </span>
      </div>

      {/* Notification Indicators */}
      {(showEmail || showSms || show1Day || show2Day) && (
        <div className="flex items-center gap-1.5 mt-0.5 opacity-80">
          {showEmail && <EnvelopeIcon className="w-3 h-3 text-blue-300" title="Email Notification" />}
          {showSms && <DevicePhoneMobileIcon className="w-3 h-3 text-green-300" title="SMS Notification" />}

          {/* Divider if we have both channel and reminder */}
          {/* {(showEmail || showSms) && (show1Day || show2Day) && <span className="w-0.5 h-3 bg-white/20 mx-0.5" />} */}

          {show1Day && (
            <span className="flex items-center gap-0.5 bg-white/10 px-1 rounded text-[9px] font-bold text-yellow-200" title="1 Day Reminder">
              <ClockIcon className="w-2.5 h-2.5" /> 1d
            </span>
          )}
          {show2Day && (
            <span className="flex items-center gap-0.5 bg-white/10 px-1 rounded text-[9px] font-bold text-purple-200" title="2 Day Reminder">
              <ClockIcon className="w-2.5 h-2.5" /> 2d
            </span>
          )}
        </div>
      )}
    </div>
  );
}
