import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsService } from '@/shared/api';
import {
  Bell, CheckCheck, Trash2, MessageSquare,
  Briefcase, DollarSign, AlertCircle, Info,
  Star, Clock, Loader2
} from 'lucide-react';

const notificationIcons = {
  SYSTEM: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  PAYMENT: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  DISPUTE: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  CHAT: { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  BARTER: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  FREELANCE: { icon: Briefcase, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsService.getNotifications();
      setNotifications(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id, {});
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead({});
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsService.getNotification(id); // Check if endpoint supports delete
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : n.notification_type === filter
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filters = [
    { value: 'all', label: 'Hammasi', count: notifications.length },
    { value: 'FREELANCE', label: 'Ishlar' },
    { value: 'BARTER', label: 'Barter' },
    { value: 'CHAT', label: 'Xabarlar' },
    { value: 'PAYMENT', label: 'To\'lovlar' },
    { value: 'SYSTEM', label: 'Tizim' },
  ];

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Background */}
      <div className="blob-bg">
        <div className="blob blob-2" style={{ width: '300px', height: '300px', opacity: 0.1 }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Bell className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                <span className="neon-text">Bildirishnomalar</span>
              </h1>
              <p className="text-slate-400 text-sm">
                {unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : "Barchasi o'qildi"}
              </p>
            </div>
          </div>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />
            Barchasini o'qish
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.value
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'glass-card text-slate-400 hover:text-slate-200'
                }`}
            >
              {f.label}
              {f.count !== undefined && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card h-24 animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  onDelete={() => handleDelete(notification.id)}
                  delay={index * 0.05}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
              <Bell className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Bildirishnomalar yo'q</h3>
            <p className="text-slate-400">
              Yangi bildirishnomalar kelganda shu yerda ko'rinadi
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationCard = ({ notification, onMarkAsRead, onDelete, delay }) => {
  const navigate = useNavigate();
  const config = notificationIcons[notification.notification_type] || notificationIcons.SYSTEM;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead();
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, delay }}
      className={`glass-card p-4 cursor-pointer transition-all ${!notification.is_read ? 'border-l-4 border-l-emerald-500' : ''
        }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={`text-base ${!notification.is_read ? 'font-semibold text-white' : 'text-slate-200'}`}>
                {notification.title}
              </h4>
              <p className="text-slate-400 text-sm mt-1">
                {notification.message}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {!notification.is_read && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(notification.created_at).toLocaleDateString('uz-UZ')}
            </span>
            <span className="px-2 py-0.5 bg-slate-800 rounded text-xs border border-white/5">
              {notification.notification_type}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationsPage;
