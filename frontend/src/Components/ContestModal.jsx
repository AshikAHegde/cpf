import React, { useEffect, useState, useRef } from 'react';
import { XMarkIcon, CalendarDaysIcon, ArrowTopRightOnSquareIcon, ClockIcon } from '@heroicons/react/24/outline';

const ContestModal = ({ isOpen, onClose, contest, onAddToCalendar, Icon, position }) => {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 200);
        }
    }, [isOpen]);

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If clicking inside the card, ignore
            if (cardRef.current && cardRef.current.contains(event.target)) {
                return;
            }
            onClose();
        };

        if (isOpen) {
            // Use mousedown to detect click start outside
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isVisible && !isOpen) return null;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

    const formatTime = (date) =>
        new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const getDuration = (start, end) => {
        if (!end) return null;
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) return null;

        const diff = endDate - startDate;
        if (diff < 0) return null; // Should not happen for valid contests

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    };

    // Calculate position styles
    const getStyle = () => {
        if (!position) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }; // Fallback to center
        const { x, y } = position;

        // Default width of the card
        const width = Math.min(400, window.innerWidth - 20);
        const height = 300; // Approximate height for calculation

        let left = x;
        let top = y;

        // Horizontal containment
        if (left + width > window.innerWidth) {
            left = window.innerWidth - width - 20;
        }
        if (left < 10) left = 10;

        // Vertical containment - if below view, flip to top
        if (top + height > window.innerHeight) {
            // Flip to above
            // Assuming y is the bottom of the element, we want to go above the element
            // But we only have x/y passed as "bottom center" of element usually
            top = y - height - 20;
            if (top < 10) top = 10;
        }

        return {
            top: `${top}px`,
            left: `${left}px`,
            position: 'fixed'
        };
    };

    const getStatus = (start, end) => {
        const now = new Date();
        const startDate = new Date(start);
        let endDate = end ? new Date(end) : null;

        // Verify endDate is valid and after 1970 (to catch null -> 1970 issue if passed as 0/null/undefined)
        if (!endDate || isNaN(endDate.getTime()) || endDate.getFullYear() === 1970) {
            // Fallback: Assume 2 hour duration if end is missing/invalid
            endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        }

        if (now > endDate) return { text: 'COMPLETED', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' };
        if (now >= startDate && now <= endDate) return { text: 'ONGOING', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
        return { text: 'UPCOMING', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    };

    const status = getStatus(contest?.start, contest?.end);

    return (
        <div
            ref={cardRef}
            className={`z-50 w-[90vw] md:w-[380px] bg-[#0f0f13] border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ease-out origin-top-left ring-1 ring-white/5`}
            style={{
                ...getStyle(),
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-5px)',
                pointerEvents: isOpen ? 'auto' : 'none'
            }}
        >
            {/* Minimal Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {/* Close Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-3 right-3 p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors z-10 cursor-pointer border border-white/5"
            >
                <XMarkIcon className="w-4 h-4" />
            </button>

            <div className="p-5 pt-6">
                {/* Header */}
                <div className="flex gap-4 mb-5">
                    {Icon && (
                        <div className="shrink-0 p-3 bg-[#181824] rounded-xl border border-white/5 shadow-sm">
                            <Icon className="w-8 h-8 text-gray-100" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                                {contest?.platform}
                            </span>
                            <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${status.color} ${status.bg}`}>
                                {status.text}
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-white leading-snug line-clamp-2" title={contest?.title}>
                            {contest?.title}
                        </h2>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#181824] p-3 rounded-lg border border-white/5">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1">Start Date</div>
                        <div className="text-sm font-medium text-gray-200">
                            {formatDate(contest?.start)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                            {formatTime(contest?.start)}
                        </div>
                    </div>
                    <div className="bg-[#181824] p-3 rounded-lg border border-white/5">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1">Duration</div>
                        <div className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                            {getDuration(contest?.start, contest?.end) || '--'}
                        </div>
                        {contest?.end && (
                            <div className="text-xs text-gray-500 mt-0.5">
                                Ends: {formatTime(contest?.end)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <a
                        href={contest?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        Participate
                    </a>

                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToCalendar(contest); }}
                        className="shrink-0 flex items-center justify-center w-10 bg-[#181824] hover:bg-[#20202e] text-gray-400 hover:text-white rounded-lg border border-white/5 transition-all active:scale-95"
                        title="Add to Google Calendar"
                    >
                        <CalendarDaysIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContestModal;
