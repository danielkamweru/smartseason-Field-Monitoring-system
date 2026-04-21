import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, fieldsAPI } from '../services/api';
import { Agent } from '../types';
import { UserIcon, ClipboardDocumentListIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Agents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentStats, setAgentStats] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const [ar, sr] = await Promise.all([usersAPI.getAgents(), fieldsAPI.getDashboardStats()]);
      setAgents(ar.data.agents);
      const map: Record<number, number> = {};
      sr.data.stats.agentStats?.forEach((a: any) => { map[a.id] = a.field_count; });
      setAgentStats(map);
    } catch { setError('Failed to fetch agent data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [user?.role, fetchData]);

  if (user?.role !== 'admin') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
        <UserIcon className="w-7 h-7 text-red-500" />
      </div>
      <p className="font-semibold text-gray-900">Access Denied</p>
      <p className="text-sm text-gray-500">Only administrators can view this page.</p>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-shamba-green border-t-transparent"></div>
    </div>
  );

  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>;

  const totalFields = Object.values(agentStats).reduce((s: number, c: number) => s + c, 0);
  const avgFields = agents.length > 0 ? (totalFields / agents.length).toFixed(1) : '0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-poppins">Field Agents</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage and monitor all field agents</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Agents', value: agents.length, icon: UserIcon, color: 'bg-shamba-green' },
          { label: 'Total Assigned Fields', value: totalFields, icon: ClipboardDocumentListIcon, color: 'bg-blue-500' },
          { label: 'Avg Fields / Agent', value: avgFields, icon: CheckCircleIcon, color: 'bg-emerald-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Agents table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">All Agents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Agent', 'Email', 'Assigned Fields', 'Workload', 'Joined'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {agents.map(agent => {
                const count = agentStats[agent.id] || 0;
                const pct = totalFields > 0 ? Math.round((count / totalFields) * 100) : 0;
                const workloadColor = count > 5 ? 'bg-shamba-green' : count > 0 ? 'bg-yellow-400' : 'bg-gray-300';
                return (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-shamba-green flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white text-sm font-bold">{agent.username[0].toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{agent.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{agent.email}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {count} field{count !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${workloadColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(agent.created_at || '').toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {agents.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No agents found</p>
            </div>
          )}
        </div>
      </div>

      {/* Field distribution */}
      {agents.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Field Distribution</h3>
          <div className="space-y-4">
            {agents.map(agent => {
              const count = agentStats[agent.id] || 0;
              const pct = totalFields > 0 ? Math.round((count / totalFields) * 100) : 0;
              return (
                <div key={agent.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-shamba-green flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{agent.username[0].toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-gray-700">{agent.username}</span>
                    </div>
                    <span className="text-gray-500">{count} fields · {pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-shamba-green rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
