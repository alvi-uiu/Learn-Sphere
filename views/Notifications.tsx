import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeft, Bell, Heart, MessageCircle, CheckCircle2,
  CheckCheck, Trash2
} from 'lucide-react';
import { formatRelativeTime } from '../utils/date';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'project_accepted';
  title: string;
  message: string;
  post_id?: string;
  project_id?: string;
  actor_id: string;
  actor_name: string;
  actor_avatar: string;
  read: number;
  created_at: string;
}

interface NotificationsViewProps {
  onBack: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    try {
      const res = await fetch(`http://localhost:3001/api/notifications?userId=${user.id}`);
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-pink-500" />;
      case 'comment': return <MessageCircle size={16} className="text-apple-blue" />;
      case 'project_accepted': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('http://localhost:3001/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: 1 } : n)
      );
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const markAllAsRead = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      await fetch('http://localhost:3001/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}`, {
        method: 'DELETE'
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;

    try {
      await Promise.all(notifications.map(n =>
        fetch(`http://localhost:3001/api/notifications/${n.id}`, { method: 'DELETE' })
      ));
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear all:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <div className="w-12 h-12 apple-gradient rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft size={24} className={isDark ? 'text-white' : 'text-gray-700'} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Mark all as read"
            >
              <CheckCheck size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <GlassCard className="divide-y divide-gray-200 dark:divide-white/5 overflow-hidden">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.read && markAsRead(notification.id)}
              className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${!notification.read
                  ? isDark ? 'bg-apple-blue/5' : 'bg-blue-50'
                  : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                }`}
            >
              {/* Avatar or Icon */}
              <div className="flex-shrink-0">
                {notification.actor_avatar ? (
                  <img
                    src={notification.actor_avatar}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                    {getIcon(notification.type)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-apple-blue rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {formatRelativeTime(notification.created_at)}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                  }`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </GlassCard>
      ) : (
        <GlassCard className="p-12 text-center">
          <Bell size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No notifications
          </h3>
          <p className="text-sm text-gray-500">
            You're all caught up! Check back later for updates.
          </p>
        </GlassCard>
      )}

      {/* Clear All */}
      {notifications.length > 0 && (
        <button
          onClick={clearAll}
          className={`w-full mt-4 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          Clear all notifications
        </button>
      )}
    </div>
  );
};
