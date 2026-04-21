import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, fieldsAPI } from '../services/api';
import { Agent, AgentStats } from '../types';
import { 
  UserIcon, 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Agents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentStats, setAgentStats] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAgentsAndStats();
    }
  }, []);

  const fetchAgentsAndStats = async () => {
    try {
      const [agentsResponse, statsResponse] = await Promise.all([
        usersAPI.getAgents(),
        fieldsAPI.getDashboardStats()
      ]);
      
      setAgents(agentsResponse.data.agents);
      
      // Process agent statistics
      const stats = statsResponse.data.stats;
      const agentFieldStats: Record<number, number> = {};
      
      if (stats.agentStats) {
        stats.agentStats.forEach((agent: any) => {
          agentFieldStats[agent.id] = agent.field_count;
        });
      }
      
      setAgentStats(agentFieldStats);
    } catch (err) {
      setError('Failed to fetch agent data');
      console.error('Agents fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 font-medium">Access Denied</div>
        <div className="text-gray-600 mt-2">Only administrators can view this page.</div>
      </div>
    );
  }

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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Field Agents</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all field agents and their assigned fields and performance metrics.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-shamba-green rounded-md p-3">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Agents
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {agents.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Assigned Fields
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Object.values(agentStats).reduce((sum: number, count: number) => sum + count, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Fields per Agent
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {agents.length > 0 
                      ? (Object.values(agentStats).reduce((sum: number, count: number) => sum + count, 0) / agents.length).toFixed(1)
                      : '0'
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Agent
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Assigned Fields
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Join Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          {agent.username}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {agent.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-shamba-green text-white">
                            {agentStats[agent.id] || 0} fields
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(agent.created_at || '').toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => window.location.href = `/fields?agent=${agent.id}`}
                          className="text-shamba-green hover:text-shamba-dark-green"
                        >
                          View Fields
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No agents found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Performance Insights */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Field Distribution</h4>
              <div className="space-y-2">
                {agents.map((agent) => {
                  const fieldCount = agentStats[agent.id] || 0;
                  const totalFields = Object.values(agentStats).reduce((sum: number, count: number) => sum + count, 0);
                  const percentage = totalFields > 0 ? (fieldCount / totalFields) * 100 : 0;
                  
                  return (
                    <div key={agent.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{agent.username}</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{fieldCount} fields</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-shamba-green h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Agent Status</h4>
              <div className="space-y-3">
                {agents.map((agent) => {
                  const fieldCount = agentStats[agent.id] || 0;
                  let status: string = 'inactive';
                  let statusColor: string = 'bg-gray-100 text-gray-800';
                  let statusIcon = <ClockIcon className="w-4 h-4" />;
                  
                  if (fieldCount > 5) {
                    status = 'active';
                    statusColor = 'bg-green-100 text-green-800';
                    statusIcon = <CheckCircleIcon className="w-4 h-4" />;
                  } else if (fieldCount > 0) {
                    status = 'moderate';
                    statusColor = 'bg-yellow-100 text-yellow-800';
                    statusIcon = <ExclamationTriangleIcon className="w-4 h-4" />;
                  }
                  
                  return (
                    <div key={agent.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{agent.username}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusIcon}
                        <span className="ml-1">{status}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agents;
