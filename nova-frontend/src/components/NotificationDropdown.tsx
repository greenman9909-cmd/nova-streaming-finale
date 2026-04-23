import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    image?: string | null;
    icon?: string | null;
    link?: string | null;
    read: boolean;
    created_at?: string | null;
}

const formatTimeAgo = (input?: string | null) => {
    if (!input) return '';
    const ts = new Date(input).getTime();
    if (Number.isNaN(ts)) return '';
    const diffMs = Date.now() - ts;
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 45) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
};

export default function NotificationDropdown() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }
        let mounted = true;
        const loadNotifications = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('id,title,message,image,icon,link,read,created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!mounted) return;
            if (error) {
                console.error('Failed to load notifications:', error);
                setNotifications([]);
            } else {
                setNotifications((data || []) as NotificationItem[]);
            }
            setIsLoading(false);
        };

        loadNotifications();
        return () => { mounted = false; };
    }, [user?.id]);

    const markAsRead = async () => {
        if (notifications.length === 0) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (!user) return;
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);
        if (error) console.error('Failed to mark notifications read:', error);
    };

    const clearAll = async () => {
        setNotifications([]);
        if (!user) return;
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id);
        if (error) console.error('Failed to clear notifications:', error);
    };

    const handleNotificationClick = (notification: NotificationItem) => {
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon with wiggle */}
            <button
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAsRead(); }}
                className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 group hover:scale-105"
            >
                <i className={`ri-notification-3-line text-lg text-gray-300 group-hover:text-white transition-colors ${isOpen ? 'text-white' : ''} ${unreadCount > 0 ? 'animate-bell-wiggle' : ''}`}></i>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex items-center justify-center">
                        <span className="absolute w-3 h-3 bg-red-500/40 rounded-full animate-ping"></span>
                        <span className="relative w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0f]"></span>
                    </span>
                )}
            </button>

            {/* Animated Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-12 right-0 w-80 md:w-96 bg-[#0f0f13]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-white transition-colors">
                                Clear all
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
                                    <p className="text-sm text-gray-500">Cargando notificaciones...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <i className="ri-notification-off-line text-3xl text-gray-600 mb-2"></i>
                                    <p className="text-sm text-gray-500">No new notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notification, index) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className={`p-4 hover:bg-white/5 transition-colors flex gap-4 cursor-pointer group ${!notification.read ? 'bg-white/[0.02]' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex-shrink-0">
                                                {notification.image ? (
                                                    <img
                                                        src={notification.image}
                                                        alt=""
                                                        className="w-12 h-16 object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                                                        <i className={`${notification.icon || 'ri-notification-3-fill'} text-gray-400`}></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-white truncate group-hover:text-violet-300 transition-colors">{notification.title}</h4>
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.message}</p>
                                                <span className="text-[10px] text-gray-500 mt-2 block">{formatTimeAgo(notification.created_at)}</span>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 flex-shrink-0 shadow-[0_0_6px_rgba(139,92,246,0.5)]"></div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-white/5 bg-white/[0.02] text-center">
                            <Link to="/settings" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                Notification Settings
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
