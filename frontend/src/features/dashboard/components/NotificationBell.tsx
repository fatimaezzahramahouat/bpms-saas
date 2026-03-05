import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../../services/api';

interface Notification {
    id: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications([]);
            setIsOpen(false);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
        }).format(date);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 relative hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 animate-pulse">
                        {notifications.length}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/50">
                            <h3 className="font-bold text-sm">Notifications</h3>
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-h1-blue hover:underline font-medium flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    Marquer tout comme lu
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'TASK_CREATED'
                                                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                                                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                                                    }`}>
                                                    {notif.type === 'TASK_CREATED' ? <Clock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider">
                                                        {formatDate(notif.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm text-zinc-500">Aucune nouvelle notification</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 text-center">
                                <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Fin des notifications</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
