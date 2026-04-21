import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fieldsAPI } from '../services/api';
import {
  ArrowLeftIcon, PencilIcon, CalendarIcon, UserIcon,
  ChatBubbleLeftRightIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Field {
  id: number; name: string; crop_type: string; planting_date: string;
  current_stage: string; status: string; agent_name?: string; assigned_agent_id?: number;
}
interface FieldUpdate {
  id: number; field_id: number; agent_id: number; stage: string;
  notes?: string; update_date: string; agent_name?: string;
}

const stageBadgeClass: Record<string, string> = {
  planted: 'badge-planted', growing: 'badge-growing', ready: 'badge-ready', harvested: 'badge-harvested',
};
const statusBadgeClass: Record<string, string> = {
  active: 'badge-active', at_risk: 'badge-risk', completed: 'badge-completed',
};
const stages = ['planted', 'growing', 'ready', 'harvested'];

const FieldDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [field, setField] = useState<Field | null>(null);
  const [updates, setUpdates] = useState<FieldUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageForm, setStageForm] = useState({ stage: '', notes: '' });

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    try {
      const [fr, ur] = await Promise.all([fieldsAPI.getById(id), fieldsAPI.getUpdates(id)]);
      setField(fr.data.field);
      setUpdates(ur.data.updates);
    } catch { setError('Failed to fetch field data'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) fetchData(); }, [id, fetchData]);

  const handleStageUpdate = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await fieldsAPI.updateStage(id, stageForm);
      setShowStageModal(false);
      setStageForm({ stage: '', notes: '' });
      fetchData();
    } catch { setError('Failed to update stage'); }
  }, [id, stageForm, fetchData]);

  const canUpdate = user?.role === 'admin' || (user?.role === 'agent' && field?.assigned_agent_id === user?.id);
  const currentStageIdx = stages.indexOf(field?.current_stage || '');
  const daysSincePlanting = field ? Math.floor((Date.now() - new Date(field.planting_date).getTime()) / 86400000) : 0;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-shamba-green border-t-transparent"></div>
    </div>
  );
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>;
  if (!field) return <div className="text-center text-gray-500 py-16">Field not found</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/fields')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Fields
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">{field.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={stageBadgeClass[field.current_stage] || 'badge-planted'}>{field.current_stage}</span>
              <span className={statusBadgeClass[field.status] || 'badge-active'}>{field.status.replace('_', ' ')}</span>
            </div>
          </div>
          {canUpdate && (
            <button onClick={() => setShowStageModal(true)} className="btn-primary gap-2 flex-shrink-0">
              <PencilIcon className="w-4 h-4" /> Update Stage
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Field info */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Field Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Crop Type', value: field.crop_type },
                { label: 'Planting Date', value: new Date(field.planting_date).toLocaleDateString(), icon: CalendarIcon },
                { label: 'Assigned Agent', value: field.agent_name || 'Unassigned', icon: UserIcon },
                { label: 'Days Since Planting', value: `${daysSincePlanting} days` },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update history */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Update History</h3>
            {updates.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No updates recorded yet</p>
              </div>
            ) : (
              <div className="space-y-0">
                {updates.map((update, i) => (
                  <div key={update.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-shamba-green flex items-center justify-center flex-shrink-0 shadow-sm">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                      {i < updates.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className={`pb-6 flex-1 ${i === updates.length - 1 ? '' : ''}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{update.agent_name}</span>
                        <span className="text-xs text-gray-400">updated stage to</span>
                        <span className={stageBadgeClass[update.stage] || 'badge-planted'}>{update.stage}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(update.update_date).toLocaleDateString()} at {new Date(update.update_date).toLocaleTimeString()}
                      </p>
                      {update.notes && (
                        <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-100">
                          {update.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Days since planting', value: daysSincePlanting },
                { label: 'Total updates', value: updates.length },
                { label: 'Last updated', value: updates.length > 0 ? new Date(updates[0].update_date).toLocaleDateString() : 'Never' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth progress */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Growth Progress</h3>
            <div className="space-y-3">
              {stages.map((stage, idx) => {
                const done = idx <= currentStageIdx;
                const current = idx === currentStageIdx;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-shamba-green shadow-sm' : 'bg-gray-100'}`}>
                      {done
                        ? <CheckCircleIcon className="w-4 h-4 text-white" />
                        : <span className="w-2 h-2 rounded-full bg-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium capitalize ${current ? 'text-shamba-dark-green' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                        {stage}
                      </p>
                      {current && <p className="text-xs text-shamba-green font-semibold">Current stage</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stage update modal */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 font-poppins">Update Field Stage</h3>
            </div>
            <form onSubmit={handleStageUpdate}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Stage</label>
                  <select
                    required
                    value={stageForm.stage}
                    onChange={e => setStageForm({ ...stageForm, stage: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select a stage</option>
                    {stages.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    rows={3}
                    value={stageForm.notes}
                    onChange={e => setStageForm({ ...stageForm, notes: e.target.value })}
                    placeholder="Add observations about this update..."
                    className="input-field resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button type="button" onClick={() => setShowStageModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update Stage</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldDetail;
