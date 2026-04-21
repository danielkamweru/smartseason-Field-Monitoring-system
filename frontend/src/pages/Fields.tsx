import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fieldsAPI, usersAPI } from '../services/api';
import { Field, Agent } from '../types';
import {
  PlusIcon, PencilIcon, TrashIcon,
  FunnelIcon, CalendarIcon, UserIcon, MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'badge-active', at_risk: 'badge-risk', completed: 'badge-completed',
  };
  return <span className={map[status] || 'badge-active'}>{status.replace('_', ' ')}</span>;
};

const stageBadge = (stage: string) => {
  const map: Record<string, string> = {
    planted: 'badge-planted', growing: 'badge-growing', ready: 'badge-ready', harvested: 'badge-harvested',
  };
  return <span className={map[stage] || 'badge-planted'}>{stage}</span>;
};

const Fields = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState<Field[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [formData, setFormData] = useState({ name: '', crop_type: '', planting_date: '', assigned_agent_id: null as number | null });
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchFields = React.useCallback(async () => {
    try {
      const r = await fieldsAPI.getAll();
      setFields(r.data.fields);
    } catch { setError('Failed to fetch fields'); }
    finally { setLoading(false); }
  }, []);

  const fetchAgents = React.useCallback(async () => {
    try { const r = await usersAPI.getAgents(); setAgents(r.data.agents); } catch {}
  }, []);

  useEffect(() => {
    fetchFields();
    if (user?.role === 'admin') fetchAgents();
  }, [user?.role, fetchFields, fetchAgents]);

  const openCreate = () => {
    setEditingField(null);
    setFormData({ name: '', crop_type: '', planting_date: '', assigned_agent_id: null });
    setShowModal(true);
  };

  const openEdit = (field: Field) => {
    setEditingField(field);
    setFormData({ name: field.name, crop_type: field.crop_type, planting_date: field.planting_date, assigned_agent_id: field.assigned_agent_id ?? null });
    setShowModal(true);
  };

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingField) await fieldsAPI.update(editingField.id, formData);
      else await fieldsAPI.create(formData);
      setShowModal(false);
      fetchFields();
    } catch { setError(editingField ? 'Failed to update field' : 'Failed to create field'); }
  }, [editingField, formData, fetchFields]);

  const handleDelete = React.useCallback(async (id: number) => {
    if (!window.confirm('Delete this field? This cannot be undone.')) return;
    try { await fieldsAPI.delete(id); fetchFields(); }
    catch { setError('Failed to delete field'); }
  }, [fetchFields]);

  const filtered = fields
    .filter(f => filterStatus === 'all' || f.status === filterStatus)
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.crop_type.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-shamba-green border-t-transparent"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Fields</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.role === 'admin' ? 'Manage all fields in the system' : 'Your assigned fields'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openCreate} className="btn-primary gap-2">
            <PlusIcon className="w-4 h-4" /> Add Field
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Field Name', 'Crop Type', 'Planting Date', 'Stage', 'Status', ...(user?.role === 'admin' ? ['Agent'] : []), 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filtered.map(field => (
                <tr key={field.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{field.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{field.crop_type}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(field.planting_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-4">{stageBadge(field.current_stage)}</td>
                  <td className="px-5 py-4">{statusBadge(field.status)}</td>
                  {user?.role === 'admin' && (
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {field.agent_name
                        ? <div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-gray-400" />{field.agent_name}</div>
                        : <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                  )}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/fields/${field.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-shamba-dark-green bg-green-50 hover:bg-green-100 transition-colors"
                        title="View field details & update stage"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        View Details
                      </button>
                      {user?.role === 'admin' && (
                        <>
                          <button onClick={() => openEdit(field)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors" title="Edit field">
                            <PencilIcon className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button onClick={() => handleDelete(field.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors" title="Delete field">
                            <TrashIcon className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <ClipboardIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No fields found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 font-poppins">
                {editingField ? 'Edit Field' : 'Create New Field'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                {[
                  { name: 'name', label: 'Field Name', type: 'text', placeholder: 'e.g. North Field' },
                  { name: 'crop_type', label: 'Crop Type', type: 'text', placeholder: 'e.g. Maize' },
                  { name: 'planting_date', label: 'Planting Date', type: 'date', placeholder: '' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      required
                      value={(formData as any)[f.name]}
                      onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      className="input-field"
                    />
                  </div>
                ))}
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign Agent</label>
                    <select
                      value={formData.assigned_agent_id ?? ''}
                      onChange={e => setFormData({ ...formData, assigned_agent_id: e.target.value ? Number(e.target.value) : null })}
                      className="input-field"
                    >
                      <option value="">Unassigned</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingField ? 'Save Changes' : 'Create Field'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Fallback icon for empty state
const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

export default Fields;
