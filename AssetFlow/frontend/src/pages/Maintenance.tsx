import { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface MaintenanceRequest {
  id: string;
  asset: { id: string; assetTag: string; name: string; status: string };
  user: { id: string; name: string; email: string };
  description: string;
  priority: string;
  status: string;
  photo?: string;
  createdAt: string;
}

export default function Maintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ assetId: '', description: '', priority: 'MEDIUM' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/maintenance');
      setRequests(res.data);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('assetId', form.assetId);
      formData.append('description', form.description);
      formData.append('priority', form.priority);
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }
      await api.post('/maintenance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowModal(false);
      setForm({ assetId: '', description: '', priority: 'MEDIUM' });
      setSelectedFile(null);
      fetchRequests();
    } catch (error) {
      console.error('Error creating maintenance request:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/maintenance/${id}/${status.toLowerCase()}`);
      fetchRequests();
    } catch (error) {
      console.error('Error updating maintenance status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-amber-100 text-amber-700',
      CRITICAL: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      REQUESTED: 'bg-slate-100 text-slate-700',
      APPROVED: 'bg-blue-100 text-blue-700',
      REJECTED: 'bg-red-100 text-red-700',
      TECHNICIAN_ASSIGNED: 'bg-purple-100 text-purple-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-600 mt-1">Manage maintenance requests and approvals.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Raise Request
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {request.asset.assetTag} - {request.asset.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{request.description}</p>
                  <p className="text-xs text-slate-500">
                    Requested by {request.user.name} on {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {request.status === 'REQUESTED' && (
                    <>
                      <button onClick={() => updateStatus(request.id, 'approve')} className="btn-success text-xs px-3 py-1">
                        Approve
                      </button>
                      <button onClick={() => updateStatus(request.id, 'reject')} className="btn-danger text-xs px-3 py-1">
                        Reject
                      </button>
                    </>
                  )}
                  {request.status === 'APPROVED' && (
                    <button onClick={() => updateStatus(request.id, 'resolve')} className="btn-success text-xs px-3 py-1">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Raise Maintenance Request</h2>
            <form onSubmit={createRequest} className="space-y-4">
              <div>
                <label className="label">Asset *</label>
                <select
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  className="input mt-1"
                  required
                >
                  <option value="">Select asset</option>
                  {requests.map(r => (
                    <option key={r.asset.id} value={r.asset.id}>
                      {r.asset.assetTag} - {r.asset.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input mt-1"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="label">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="input mt-1"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="label">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="input mt-1"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
