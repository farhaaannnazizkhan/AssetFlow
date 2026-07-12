import { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      ALLOCATION: '📦',
      TRANSFER_REQUEST: '🔄',
      TRANSFER_APPROVED: '✅',
      TRANSFER_REJECTED: '❌',
      RETURN_REMINDER: '⏰',
      OVERDUE_RETURN: '⚠️',
      MAINTENANCE_REQUEST: '🔧',
      MAINTENANCE_APPROVED: '✅',
      MAINTENANCE_RESOLVED: '✅',
      AUDIT_ASSIGNED: '📋',
      AUDIT_CYCLE_CLOSED: '📋',
      SYSTEM: 'ℹ️',
    };
    return icons[type] || '📢';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600 mt-1">Stay updated with all your notifications.</p>
        </div>
        <button onClick={markAllAsRead} className="btn-secondary">
          Mark All as Read
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-slate-200">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No notifications yet
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                  <div className="flex-1">
                    <p className={`text-sm ${notification.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
