import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { AssetStatusType, BookingStatusType, AllocationStatusType } from '../utils/api';

interface KPIData {
  totalAssets: number;
  allocated: number;
  underMaintenance: number;
  activeBookings: number;
  overdueReturns: number;
}

export default function Dashboard() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalAssets: 0,
    allocated: 0,
    underMaintenance: 0,
    activeBookings: 0,
    overdueReturns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/reports/asset-utilization');
        const data = res.data;
        setKpiData({
          totalAssets: data.total || 0,
          allocated: data.allocated || 0,
          underMaintenance: data.underMaintenance || 0,
          activeBookings: 0,
          overdueReturns: 0,
        });
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  const kpiCards = [
    {
      label: 'Total Assets',
      value: kpiData.totalAssets,
      color: 'bg-blue-500',
      icon: '📦',
    },
    {
      label: 'Allocated',
      value: kpiData.allocated,
      color: 'bg-emerald-500',
      icon: '👤',
    },
    {
      label: 'Under Maintenance',
      value: kpiData.underMaintenance,
      color: 'bg-amber-500',
      icon: '🔧',
    },
    {
      label: 'Overdue Returns',
      value: kpiData.overdueReturns,
      color: 'bg-red-500',
      icon: '⚠️',
      highlight: true,
    },
  ];

  const quickActions = [
    { label: 'Register Asset', path: '/assets', icon: '📦', color: 'bg-primary-600' },
    { label: 'Book Resource', path: '/bookings', icon: '📅', color: 'bg-emerald-600' },
    { label: 'Raise Maintenance', path: '/maintenance', icon: '🔧', color: 'bg-amber-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's what's happening with your assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{card.label}</p>
                <p className={`text-3xl font-bold mt-1 ${card.highlight ? 'text-red-600' : 'text-slate-900'}`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white text-lg mb-3`}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-slate-900">{action.label}</h3>
              <p className="text-sm text-slate-600 mt-1">Click to get started</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-900">System initialized</p>
                <p className="text-xs text-slate-500">Just now</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-900">Database</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-900">API Server</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
