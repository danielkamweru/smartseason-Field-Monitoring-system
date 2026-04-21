import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fieldsAPI, usersAPI } from '../services/api';
import { 
  ArrowLeftIcon,
  PencilIcon,
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Field {
  id: number;
  name: string;
  crop_type: string;
  planting_date: string;
  current_stage: string;
  status: string;
  agent_name?: string;
  assigned_agent_id?: number;
}

interface FieldUpdate {
  id: number;
  field_id: number;
  agent_id: number;
  stage: string;
  notes?: string;
  update_date: string;
  created_at?: string;
  agent_name?: string;
}

const FieldDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [field, setField] = useState<Field | null>(null);
  const [updates, setUpdates] = useState<FieldUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStageUpdate, setShowStageUpdate] = useState(false);
  const [stageFormData, setStageFormData] = useState({
    stage: '',
    notes: '',
  });

  useEffect(() => {
    if (!id) {
      setError('Field ID is required');
      setLoading(false);
      return;
    }
    fetchFieldData();
  }, [id]);

  const fetchFieldData = async () => {
    if (!id) return;
    try {
      const [fieldResponse, updatesResponse] = await Promise.all([
        fieldsAPI.getById(id),
        fieldsAPI.getUpdates(id)
      ]);
      setField(fieldResponse.data.field);
      setUpdates(updatesResponse.data.updates);
    } catch (err) {
      setError('Failed to fetch field data');
      console.error('Field detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'planted':
        return 'bg-yellow-100 text-yellow-800';
      case 'growing':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'harvested':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStageUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await fieldsAPI.updateStage(id, stageFormData);
      setShowStageUpdate(false);
      setStageFormData({ stage: '', notes: '' });
      fetchFieldData(); // Refresh field data
    } catch (err) {
      setError('Failed to update field stage');
      console.error('Stage update error:', err);
    }
  };

  const canUpdateStage = () => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'agent' && field?.assigned_agent_id === user.id) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shamba-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">{error}</div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="text-center text-gray-500">
        Field not found
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/fields')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Fields
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{field.name}</h1>
            <p className="mt-2 text-gray-600">{field.crop_type} Field</p>
          </div>
          {canUpdateStage() && (
            <button
              onClick={() => setShowStageUpdate(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-shamba-green hover:bg-shamba-dark-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-shamba-green"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Update Stage
            </button>
          )}
        </div>
      </div>

      {/* Field Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Field Details Card */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Field Information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Crop Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{field.crop_type}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Planting Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {new Date(field.planting_date || '').toLocaleDateString()}
                    </div>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Current Stage</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageColor(field.current_stage)}`}>
                      {field.current_stage}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(field.status)}`}>
                      {field.status.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                {field.agent_name && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Assigned Agent</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {field.agent_name}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Update History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Update History
              </h3>
              {updates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No updates recorded yet
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {updates.map((update, index) => (
                      <li key={update.id}>
                        <div className="relative pb-8">
                          {index !== updates.length - 1 ? (
                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          ) : null}
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <CheckCircleIcon className="h-10 w-10 rounded-full bg-shamba-green text-white p-2" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                <span className="font-semibold">{update.agent_name}</span> updated stage to{' '}
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageColor(update.stage)}`}>
                                  {update.stage}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {new Date(update.update_date).toLocaleDateString()} at {new Date(update.update_date).toLocaleTimeString()}
                              </p>
                              {update.notes && (
                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                  <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1 text-gray-400" />
                                  {update.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Days since planting</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.floor((new Date().getTime() - new Date(field.planting_date || '').getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total updates</span>
                  <span className="text-sm font-medium text-gray-900">{updates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {updates.length > 0 
                      ? new Date(updates[0].update_date).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Growth Progress</h3>
              <div className="space-y-3">
                {['planted', 'growing', 'ready', 'harvested'].map((stage, index) => {
                  const isCurrentStage = field.current_stage === stage;
                  const isPastStage = ['planted', 'growing', 'ready', 'harvested'].indexOf(field.current_stage) > index;
                  
                  return (
                    <div key={stage} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPastStage || isCurrentStage ? 'bg-shamba-green' : 'bg-gray-300'
                      }`}>
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className={`text-sm font-medium ${
                          isCurrentStage ? 'text-shamba-green' : isPastStage ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Update Modal */}
      {showStageUpdate && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleStageUpdate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Update Field Stage
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">New Stage</label>
                      <select
                        required
                        value={stageFormData.stage}
                        onChange={(e) => setStageFormData({...stageFormData, stage: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shamba-green focus:ring-shamba-green sm:text-sm"
                      >
                        <option value="">Select a stage</option>
                        <option value="planted">Planted</option>
                        <option value="growing">Growing</option>
                        <option value="ready">Ready</option>
                        <option value="harvested">Harvested</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                      <textarea
                        rows={3}
                        value={stageFormData.notes}
                        onChange={(e) => setStageFormData({...stageFormData, notes: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shamba-green focus:ring-shamba-green sm:text-sm"
                        placeholder="Add any observations or notes about this update..."
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-shamba-green text-base font-medium text-white hover:bg-shamba-dark-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-shamba-green sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Update Stage
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStageUpdate(false);
                      setStageFormData({ stage: '', notes: '' });
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-shamba-green sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldDetail;
