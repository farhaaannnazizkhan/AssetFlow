import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { AssetStatusType } from '../utils/api';

interface AssetWithDetails {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: { id: string; name: string };
  serialNumber?: string;
  status: AssetStatusType;
  condition?: string;
  location?: string;
  departmentId?: string;
  department?: { id: string; name: string };
  purchaseDate?: string;
  purchaseCost?: number;
  allocations?: any[];
  maintenanceRequests?: any[];
}

export default function AssetDirectory() {
  const [assets, setAssets] = useState<AssetWithDetails[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    serialNumber: '',
    condition: '',
    location: '',
    departmentId: '',
    purchaseDate: '',
    purchaseCost: '',
  });

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = assets.filter(a => {
      const matchesSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.assetTag.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesCategory = !categoryFilter || a.categoryId === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
    setFilteredAssets(filtered);
  }, [search, statusFilter, categoryFilter, assets]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
      setFilteredAssets(res.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const createAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      await api.post('/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowModal(false);
      setForm({
        name: '',
        description: '',
        categoryId: '',
        serialNumber: '',
        condition: '',
        location: '',
        departmentId: '',
        purchaseDate: '',
        purchaseCost: '',
      });
      fetchAssets();
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const viewAsset = async (assetId: string) => {
    try {
      const res = await api.get<AssetWithDetails>(`/assets/${assetId}`);
      setSelectedAsset(res.data);
    } catch (error) {
      console.error('Error fetching asset details:', error);
    }
  };

  const getStatusColor = (status: AssetStatusType) => {
    const colors: Record<AssetStatusType, string> = {
      AVAILABLE: 'bg-emerald-100 text-emerald-700',
      ALLOCATED: 'bg-blue-100 text-blue-700',
      RESERVED: 'bg-purple-100 text-purple-700',
      UNDER_MAINTENANCE: 'bg-amber-100 text-amber-700',
      LOST: 'bg-red-100 text-red-700',
      RETIRED: 'bg-slate-100 text-slate-700',
      DISPOSED: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Asset Directory</h1>
          <p className="text-slate-600 mt-1">Manage and track all organizational assets.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Register Asset
        </button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input">
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-primary-600">
                    {asset.assetTag}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{asset.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {asset.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {asset.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => viewAsset(asset.id)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Register New Asset</h2>
            <form onSubmit={createAsset} className="space-y-4">
              <div>
                <label className="label">Asset Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input mt-1" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input mt-1" rows={3} />
              </div>
              <div>
                <label className="label">Category *</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input mt-1" required>
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Serial Number</label>
                  <input type="text" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="input mt-1" />
                </div>
                <div>
                  <label className="label">Condition</label>
                  <input type="text" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="input mt-1" />
                </div>
              </div>
              <div>
                <label className="label">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="input mt-1" />
                </div>
                <div>
                  <label className="label">Purchase Cost</label>
                  <input type="number" step="0.01" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} className="input mt-1" />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Asset Details</h2>
              <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Asset Tag</p>
                  <p className="font-mono font-medium text-primary-600">{selectedAsset.assetTag}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="font-medium text-slate-900">{selectedAsset.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Category</p>
                  <p className="text-slate-900">{selectedAsset.category?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedAsset.status)}`}>
                    {selectedAsset.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Location</p>
                  <p className="text-slate-900">{selectedAsset.location || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Serial Number</p>
                  <p className="text-slate-900">{selectedAsset.serialNumber || '-'}</p>
                </div>
              </div>
              {selectedAsset.description && (
                <div>
                  <p className="text-sm text-slate-600">Description</p>
                  <p className="text-slate-900">{selectedAsset.description}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-slate-900 mt-4 mb-2">Allocation History</h3>
                <div className="space-y-2">
                  {selectedAsset.allocations?.length ? (
                    selectedAsset.allocations.map((alloc: any) => (
                      <div key={alloc.id} className="bg-slate-50 p-3 rounded-lg text-sm">
                        <p className="font-medium">{alloc.user?.name} - {alloc.status}</p>
                        <p className="text-slate-500">{new Date(alloc.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No allocation history</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
