import { ReactNode, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../utils/api';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/organization', label: 'Organization', roles: ['ADMIN'], icon: '🏢' },
    { path: '/assets', label: 'Assets', roles: ['ADMIN', 'ASSET_MANAGER'], icon: '📦' },
    { path: '/allocations', label: 'Allocations', roles: ['ADMIN', 'ASSET_MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD'], icon: '👥' },
    { path: '/bookings', label: 'Bookings', roles: ['ADMIN', 'ASSET_MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD'], icon: '📅' },
    { path: '/maintenance', label: 'Maintenance', roles: ['ADMIN', 'ASSET_MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD'], icon: '🔧' },
    { path: '/audits', label: 'Audits', roles: ['ADMIN', 'AUDITOR'], icon: '✅' },
    { path: '/reports', label: 'Reports', roles: ['ADMIN', 'ASSET_MANAGER'], icon: '📈' },
    { path: '/notifications', label: 'Notifications', roles: ['ADMIN', 'ASSET_MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD', 'AUDITOR'], icon: '🔔' },
  ];

  const visibleNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role || 'EMPLOYEE'));

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotificationsOpen(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-slate-900">AssetFlow</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {visibleNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative"
                >
                  <span className="text-lg">🔔</span>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:text-primary-700">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">
                        No notifications
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-700 hidden lg:block">
                  {user?.name}
                </span>
              </div>

              <button
                onClick={logout}
                className="text-sm text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
