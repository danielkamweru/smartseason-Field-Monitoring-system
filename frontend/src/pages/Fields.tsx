import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fieldsAPI, usersAPI } from '../services/api';
import { Field, Agent } from '../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const Fields = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState<Field[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    crop_type: string;
    planting_date: string;
    assigned_agent_id?: number | null;
  }>({
    name: '',
    crop_type: '',
    planting_date: '',
    assigned_agent_id: null,
  });
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchFields();
    if (user?.role === 'admin') {
      fetchAgents();
    }
  }, []);

  const fetchFields = async () => {
    try {
      const response = await fieldsAPI.getAll();
      setFields(response.data.fields);
    } catch (err) {
      setError('Failed to fetch fields');
      console.error('Fields fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await usersAPI.getAgents();
      setAgents(response.data.agents);
    } catch (err) {
      console.error('Agents fetch error:', err);
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

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fieldsAPI.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', crop_type: '', planting_date: '', assigned_agent_id: null });
      fetchFields();
    } catch (err) {
      setError('Failed to create field');
      console.error('Create field error:', err);
    }
  };

  const handleUpdateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) return;
    try {
      await fieldsAPI.update(selectedField.id, formData);
      setShowEditModal(false);
      setSelectedField(null);
      setFormData({ name: '', crop_type: '', planting_date: '', assigned_agent_id: null });
      fetchFields();
    } catch (err) {
      setError('Failed to update field');
      console.error('Update field error:', err);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      try {
        await fieldsAPI.delete(fieldId);
        fetchFields();
      } catch (err) {
        setError('Failed to delete field');
        console.error('Delete field error:', err);
      }
    }
  };

  const openEditModal = (field: Field) => {
    setSelectedField(field);
    setFormData({
      name: field.name,
      crop_type: field.crop_type,
      planting_date: field.planting_date,
      assigned_agent_id: field.assigned_agent_id ?? null,
    });
    setShowEditModal(true);
  };

  const filteredFields = filterStatus === 'all' 
    ? fields 
    : fields.filter(field => field.status === filterStatus);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shamba-green"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Fields</h1>
          <p className="mt-2 text-sm text-gray-700">
            {user?.role === 'admin' 
              ? 'A list of all fields in the system including their status and assigned agents.'
              : 'Fields assigned to you for monitoring and updates.'
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-shamba-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-shamba-dark-green focus:outline-none focus:ring-2 focus:ring-shamba-green focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Field
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6 flex items-center space-x-4">
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-700">Filter by status:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-shamba-green focus:outline-none focus:ring-shamba-green sm:text-sm"
        >
          <option value="all">All Fields</option>
          <option value="active">Active</option>
          <option value="at_risk">At Risk</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Fields Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Field Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Crop Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Planting Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Stage
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    {user?.role === 'admin' && (
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Agent
                      </th>
                    )}
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredFields.map((field) => (
                    <tr key={field.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {field.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {field.crop_type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(field.planting_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageColor(field.current_stage)}`}>
                          {field.current_stage}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(field.status)}`}>
                          {field.status.replace('_', ' ')}
                        </span>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {field.agent_name ? (
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {field.agent_name}
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </td>
                      )}
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => navigate(`/fields/${field.id}`)}
                          className="text-shamba-green hover:text-shamba-dark-green mr-3"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => openEditModal(field)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No fields found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={showEditModal ? handleUpdateField : handleCreateField}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {showEditModal ? 'Edit Field' : 'Create New Field'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Field Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shamba-green focus:ring-shamba-green sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Crop Type</label>
                      <input
                        type="text"
                        required
                        value={formData.crop_type}
                        onChange={(e) => setFormData({...formData, crop_type: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shamba-green focus:ring-shamba-green sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Planting Date</label>
                      <input
                        type="date"
                        required
                        value={formData.planting_date}
                        onChange={(e) => setFormData({...formData, planting_date: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shamba-green focus:ring-shamba-green sm:text-sm"
                      />
                    </div>
                     {user?.role === 'admin' && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700">Assign Agent</label>
                         <select
                           value={formData.assigned_agent_id ?? ''}
                           onChange={(e) => setFormData({...formData, assigned_agent_id: e.target.value ? Number(e.target.value) : null})}
                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-shamba-green focus:ring-shamba-green sm:text-sm"
                         >
                           <option value="">Unassigned</option>
                           {agents.map((agent) => (
                             <option key={agent.id} value={agent.id}>
                               {agent.username}
                             </option>
                           ))}
                         </select>
                       </div>
                     )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-shamba-green text-base font-medium text-white hover:bg-shamba-dark-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-shamba-green sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {showEditModal ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedField(null);
                      setFormData({ name: '', crop_type: '', planting_date: '', assigned_agent_id: null });
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

export default Fields;
