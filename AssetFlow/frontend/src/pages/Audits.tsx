import { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface AuditCycle {
  id: string;
  name: string;
  description?: string;
  scope: string;
  startDate: string;
  endDate: string;
  status: string;
  auditItems: any[];
  assignedAudits: any[];
}

interface AuditItem {
  id: string;
  asset: { id: string; assetTag: string; name: string };
  result?: string;
  notes?: string;
}

export default function Audits() {
  const [cycles, setCycles] = useState<AuditCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<AuditCycle | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    scope: '',
    startDate: '',
    endDate: '',
  });
  const [items, setItems] = useState<AuditItem[]>([]);
  const [discrepancies, setDiscrepancies] = useState<AuditItem[]>([]);

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audits');
      setCycles(res.data);
    } catch (error) {
      console.error('Error fetching audit cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/audits', createForm);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', scope: '', startDate: '', endDate: '' });
      fetchCycles();
    } catch (error) {
      console.error('Error creating audit cycle:', error);
    }
  };

  const viewCycle = async (cycle: AuditCycle) => {
    setSelectedCycle(cycle);
    try {
      const res = await api.get(`/audits/${cycle.id}`);
      setItems(res.data.auditItems || []);
    } catch (error) {
      console.error('Error fetching cycle details:', error);
    }
  };

  const updateAuditItem = async (itemId: string, result: string) => {
    try {
      await api.put(`/audit-items/${itemId}`, { result });
      const res = await api.get(`/audits/${selectedCycle?.id}`);
      setItems(res.data.auditItems || []);
    } catch (error) {
      console.error('Error updating audit item:', error);
    }
  };

  const fetchDiscrepancies = async (cycleId: string) => {
    try {
      const res = await api.get(`/audits/${cycleId}/discrepancy`);
      setDiscrepancies(res.data);
    } catch (error) {
      console.error('Error fetching discrepancies:', error);
    }
  };

  const closeCycle = async (cycleId: string) => {
    try {
      await api.put(`/audits/${cycleId}/close`);
      fetchCycles();
      setSelectedCycle(null);
    } catch (error) {
      console.error('Error closing cycle:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      CLOSED: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getResultColor = (result?: string) => {
    const colors: Record<string, string> = {
      VERIFIED: 'bg-emerald-100 text-emerald-700',
      MISSING: 'bg-red-100 text-red-700',
      DAMAGED: 'bg-amber-100 text-amber-700',
    };
    return colors[result || ''] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Management</h1>
          <p className="text-slate-600 mt-1">Create and manage audit cycles.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Create Audit Cycle
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cycles.map(cycle => (
            <div
              key={cycle.id}
              onClick={() => viewCycle(cycle)}
              className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{cycle.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{cycle.description}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-slate-500">
                      {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">{cycle.scope}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(cycle.status)}`}>
                  {cycle.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>{cycle.assignedAudits?.length || 0} auditors</span>
                <span>{cycle.auditItems?.length || 0} items</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCycle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedCycle.name}</h2>
                <p className="text-sm text-slate-600">{selectedCycle.description}</p>
              </div>
              <button onClick={() => { setSelectedCycle(null); setDiscrepancies([]); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex space-x-3 mb-4">
              <button onClick={() => fetchDiscrepancies(selectedCycle.id)} className="btn-secondary text-sm">
                View Discrepancies
              </button>
              <button onClick={() => closeCycle(selectedCycle.id)} className="btn-danger text-sm">
                Close Cycle
              </button>
            </div>

            {discrepancies.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-2">Discrepancies</h3>
                <div className="space-y-2">
                  {discrepancies.map(item => (
                    <div key={item.id} className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-slate-900">
                        {item.asset.assetTag} - {item.asset.name}
                      </p>
                      <p className="text-xs text-slate-600">Result: {item.result}</p>
                      {item.notes && <p className="text-xs text-slate-600">Notes: {item.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-semibold text-slate-900 mb-2">Audit Items</h3>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item.asset.assetTag} - {item.asset.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.result ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${getResultColor(item.result)}`}>
                        {item.result}
                      </span>
                    ) : (
                      <>
                        <button onClick={() => updateAuditItem(item.id, 'VERIFIED')} className="btn-success text-xs px-2 py-1">
                          Verified
                        </button>
                        <button onClick={() => updateAuditItem(item.id, 'MISSING')} className="btn-danger text-xs px-2 py-1">
                          Missing
                        </button>
                        <button onClick={() => updateAuditItem(item.id, 'DAMAGED')} className="btn-secondary text-xs px-2 py-1">
                          Damaged
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Audit Cycle</h2>
            <form onSubmit={createCycle} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="input mt-1" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className="input mt-1" rows={2} />
              </div>
              <div>
                <label className="label">Scope *</label>
                <textarea value={createForm.scope} onChange={(e) => setCreateForm({ ...createForm, scope: e.target.value })} className="input mt-1" rows={2} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input type="date" value={createForm.startDate} onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })} className="input mt-1" required />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input type="date" value={createForm.endDate} onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })} className="input mt-1" required />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
