import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New Episode Available', message: 'Demon Slayer: Hashira Training Arc Ep 4 is out now!', time: '2h ago', image: 'https://image.tmdb.org/t/p/w200/xUfRZu2mi8jH6SzQ1HsYZ7UQl8g.jpg', read: false },
        { id: 2, title: 'Continue Watching', message: 'Pick up where you left off in Inception.', time: '5h ago', image: 'https://image.tmdb.org/t/p/w200/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', read: false },
        { id: 3, title: 'System Update', message: 'We have updated our video player for better performance.', time: '1d ago', icon: 'ri-settings-5-line', read: true },
        { id: 4, title: 'New Arrival', message: 'Dune: Part Two has been added to the library.', time: '2d ago', image: 'https://image.tmdb.org/t/p/w200/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAsRead(); }}
                className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
            >
                <i className={`ri-notification-3-line text-lg text-gray-300 group-hover:text-white transition-colors ${isOpen ? 'text-white' : ''}`}></i>
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0f] animate-pulse"></span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-12 right-0 w-80 md:w-96 bg-[#0f0f13]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up origin-top-right">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-white">Notifications</h3>
                        <button onClick={() => setNotifications([])} className="text-xs text-gray-400 hover:text-white transition-colors">
                            Clear all
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <i className="ri-notification-off-line text-3xl text-gray-600 mb-2"></i>
                                <p className="text-sm text-gray-500">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => (
                                    <div key={notification.id} className={`p-4 hover:bg-white/5 transition-colors flex gap-4 ${!notification.read ? 'bg-white/[0.02]' : ''}`}>
                                        <div className="flex-shrink-0">
                                            {notification.image ? (
                                                <img src={notification.image} alt="" className="w-12 h-16 object-cover rounded-md" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                                    <i className={`${notification.icon || 'ri-notification-3-fill'} text-gray-400`}></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-white truncate">{notification.title}</h4>
                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.message}</p>
                                            <span className="text-[10px] text-gray-500 mt-2 block">{notification.time}</span>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 flex-shrink-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-white/5 bg-white/[0.02] text-center">
                        <Link to="/settings" className="text-xs text-violet-400 hover:text-violet-300 font-medium">
                            Notification Settings
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
