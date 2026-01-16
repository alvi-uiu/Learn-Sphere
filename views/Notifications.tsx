import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeft, Bell, Heart, MessageCircle, Calendar, Users,
  CheckCheck, Trash2, Settings
} from 'lucide-react';
import { formatRelativeTime } from '../utils/date';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'session' | 'follow' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
}

interface NotificationsViewProps {
  onBack: () => void;
  onOpenSettings: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack, onOpenSettings }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'like',
      title: 'New Like',
      message: 'Sarah Chen liked your post about Machine Learning',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=random'
    },
    {
      id: '2',
      type: 'comment',
      title: 'New Comment',
      message: 'Alex Kim commented: "Great explanation! This helped me a lot."',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
      avatar: 'https://ui-avatars.com/api/?name=Alex+Kim&background=random'
    },
    {
      id: '3',
      type: 'session',
      title: 'Session Reminder',
      message: 'CS101 Study Group starts in 1 hour',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      read: true,
    },
    {
      id: '4',
      type: 'follow',
      title: 'New Follower',
      message: 'John Doe started following you',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random'
    },
    {
      id: '5',
      type: 'system',
      title: 'Welcome to LearnSphere!',
      message: 'Start exploring and connecting with fellow students.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      read: true,
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-pink-500" />;
      case 'comment': return <MessageCircle size={16} className="text-apple-blue" />;
      case 'session': return <Calendar size={16} className="text-indigo-500" />;
      case 'follow': return <Users size={16} className="text-green-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Notification settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <GlassCard className="divide-y divide-gray-200 dark:divide-white/5 overflow-hidden">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${
                !notification.read 
                  ? isDark ? 'bg-apple-blue/5' : 'bg-blue-50' 
                  : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              }`}
            >
              {/* Avatar or Icon */}
              <div className="flex-shrink-0">
                {notification.avatar ? (
                  <img
                    src={notification.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-white/10' : 'bg-gray-100'
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
                  {formatRelativeTime(notification.timestamp)}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
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
          className={`w-full mt-4 py-3 rounded-xl text-sm font-medium transition-colors ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Clear all notifications
        </button>
      )}
    </div>
  );
};
