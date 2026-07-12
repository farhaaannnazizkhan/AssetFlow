import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User } from '../utils/api';

type Tab = 'departments' | 'categories' | 'employees';

interface Department {
  id: string;
  name: string;
  headId?: string;
  status: string;
  head?: { id: string; name: string };
  _count: { users: number; assets: number };
}

interface Category {
  id: string;
  name: string;
  customFields?: any;
  _count: { assets: number };
}

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState<Tab>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  const [deptForm, setDeptForm] = useState({ name: '' });
  const [catForm, setCatForm] = useState({ name: '', customFields: '' });
  const [roleForm, setRoleForm] = useState({ role: 'EMPLOYEE' });

  useEffect(() => {
    if (activeTab === 'departments') fetchDepartments();
    else if (activeTab === 'categories') fetchCategories();
    else if (activeTab === 'employees') fetchEmployees();
  }, [activeTab]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/departments', deptForm);
      setDeptForm({ name: '' });
      setShowDeptModal(false);
      fetchDepartments();
    } catch (error) {
      console.error('Error creating department:', error);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customFields = catForm.customFields ? JSON.parse(catForm.customFields) : null;
      await api.post('/categories', { ...catForm, customFields });
      setCatForm({ name: '', customFields: '' });
      setShowCatModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const updateEmployeeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await api.put(`/employees/${selectedEmployee.id}/role`, { role: roleForm.role });
      setShowRoleModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const tabs = [
    { id: 'departments' as Tab, label: 'Departments', icon: '🏢' },
    { id: 'categories' as Tab, label: 'Categories', icon: '📂' },
    { id: 'employees' as Tab, label: 'Employee Directory', icon: '👥' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organization Setup</h1>
          <p className="text-slate-600 mt-1">Manage departments, categories, and employees.</p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowDeptModal(true)} className="btn-primary">
              + Add Department
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(dept => (
                <div key={dept.id} className="card p-6">
                  <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Head: {dept.head?.name || 'Unassigned'}
                  </p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-slate-600">
                    <span>{dept._count.users} users</span>
                    <span>{dept._count.assets} assets</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                      {dept.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCatModal(true)} className="btn-primary">
              + Add Category
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="card p-6">
                  <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                  <div className="mt-3">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                      {cat._count.assets} assets
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-sm">
                              {emp.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{emp.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setRoleForm({ role: emp.role });
                            setShowRoleModal(true);
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Department</h2>
            <form onSubmit={createDepartment} className="space-y-4">
              <div>
                <label className="label">Department Name</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="input mt-1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowDeptModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Category</h2>
            <form onSubmit={createCategory} className="space-y-4">
              <div>
                <label className="label">Category Name</label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="input mt-1"
                  required
                />
              </div>
              <div>
                <label className="label">Custom Fields (JSON)</label>
                <textarea
                  value={catForm.customFields}
                  onChange={(e) => setCatForm({ ...catForm, customFields: e.target.value })}
                  className="input mt-1"
                  rows={3}
                  placeholder='{"condition": "string"}'
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCatModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoleModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Change Role</h2>
            <p className="text-sm text-slate-600 mb-4">
              Change role for <strong>{selectedEmployee.name}</strong>
            </p>
            <form onSubmit={updateEmployeeRole} className="space-y-4">
              <div>
                <label className="label">Role</label>
                <select
                  value={roleForm.role}
                  onChange={(e) => setRoleForm({ role: e.target.value })}
                  className="input mt-1"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="ASSET_MANAGER">Asset Manager</option>
                  <option value="AUDITOR">Auditor</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => { setShowRoleModal(false); setSelectedEmployee(null); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
