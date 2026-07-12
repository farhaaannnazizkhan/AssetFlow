import { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Allocation {
  id: string;
  assetId: string;
  userId: string;
  status: string;
  expectedReturnDate?: string;
  asset: Asset;
  user: User;
}

export default function Allocations() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [form, setForm] = useState({ assetId: '', userId: '', expectedReturnDate: '', conditionNotes: '' });
  const [returnForm, setReturnForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
    fetchAllocations();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/allocations/active');
      setAllocations(res.data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/allocations', form);
      setShowModal(false);
      setForm({ assetId: '', userId: '', expectedReturnDate: '', conditionNotes: '' });
      fetchAllocations();
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.offerTransfer) {
        setConflictData(error.response.data);
        setShowConflictModal(true);
      } else {
        console.error('Error creating allocation:', error);
        alert(error.response?.data?.message || 'Failed to create allocation');
      }
    }
  };

  const returnAsset = async (allocationId: string) => {
    try {
      await api.put(`/allocations/${allocationId}/return`, {
        conditionNotes: returnForm[allocationId] || '',
      });
      fetchAllocations();
    } catch (error) {
      console.error('Error returning asset:', error);
    }
  };

  const requestTransfer = async () => {
    if (!conflictData) return;
    try {
      await api.post('/transfers', {
        allocationId: conflictData.allocationId,
        targetHolderId: form.userId,
      });
      setShowConflictModal(false);
      setConflictData(null);
      fetchAllocations();
    } catch (error) {
      console.error('Error requesting transfer:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-emerald-100 text-emerald-700',
      RETURNED: 'bg-slate-100 text-slate-700',
      OVERDUE: 'bg-red-100 text-red-700',
      TRANSFERRED: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Allocations</h1>
          <p className="text-slate-600 mt-1">Manage asset allocations and returns.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + New Allocation
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Allocated To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Expected Return</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {allocations.map(allocation => (
              <tr key={allocation.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{allocation.asset.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{allocation.asset.assetTag}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {allocation.user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(allocation.status)}`}>
                    {allocation.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {allocation.expectedReturnDate ? new Date(allocation.expectedReturnDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {allocation.status === 'ACTIVE' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Condition notes..."
                        value={returnForm[allocation.id] || ''}
                        onChange={(e) => setReturnForm({ ...returnForm, [allocation.id]: e.target.value })}
                        className="input text-sm py-1"
                      />
                      <button
                        onClick={() => returnAsset(allocation.id)}
                        className="btn-success text-xs px-3 py-1"
                      >
                        Return
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Allocation</h2>
            <form onSubmit={createAllocation} className="space-y-4">
              <div>
                <label className="label">Asset *</label>
                <select
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  className="input mt-1"
                  required
                >
                  <option value="">Select asset</option>
                  {assets.filter(a => a.status === 'AVAILABLE' || a.status === 'RESERVED').map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetTag} - {asset.name} ({asset.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Employee *</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="input mt-1"
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Expected Return Date</label>
                <input
                  type="date"
                  value={form.expectedReturnDate}
                  onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="label">Condition Notes</label>
                <textarea
                  value={form.conditionNotes}
                  onChange={(e) => setForm({ ...form, conditionNotes: e.target.value })}
                  className="input mt-1"
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Allocate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConflictModal && conflictData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Asset Conflict</h2>
            <p className="text-slate-700 mb-4">
              {conflictData.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowConflictModal(false); setConflictData(null); }} className="btn-secondary">Cancel</button>
              <button onClick={requestTransfer} className="btn-primary">Request Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
