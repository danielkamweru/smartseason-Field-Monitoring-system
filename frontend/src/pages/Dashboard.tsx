import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fieldsAPI } from '../services/api';
import { DashboardStats, Field } from '../types';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [atRiskFields, setAtRiskFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fieldsAPI.getDashboardStats(),
      fieldsAPI.getAll(),
    ])
      .then(([statsRes, fieldsRes]) => {
        setStats(statsRes.data.stats);
        setAtRiskFields((fieldsRes.data.fields as Field[]).filter(f => f.status === 'at_risk'));
      })
      .catch(() => setError('Failed to load dashboard statistics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-shamba-green border-t-transparent"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
  );

  if (!stats) return null;

  const activeCount = stats.statusBreakdown.find((s: any) => s.status === 'active')?.count || 0;
  const atRiskCount = stats.statusBreakdown.find((s: any) => s.status === 'at_risk')?.count || 0;
  const completedCount = stats.statusBreakdown.find((s: any) => s.status === 'completed')?.count || 0;

  const summaryCards = [
    { label: 'Total Fields', value: stats.totalFields, icon: ChartBarIcon, color: 'bg-shamba-green', light: 'bg-green-50 text-shamba-dark-green' },
    { label: 'Active', value: activeCount, icon: CheckCircleIcon, color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
    { label: 'At Risk', value: atRiskCount, icon: ExclamationTriangleIcon, color: 'bg-red-500', light: 'bg-red-50 text-red-700' },
    { label: 'Completed', value: completedCount, icon: ClockIcon, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
  ];

  const stageColors: Record<string, string> = {
    planted: 'bg-yellow-400',
    growing: 'bg-shamba-green',
    ready: 'bg-sky-400',
    harvested: 'bg-purple-400',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">
            {user?.role === 'admin' ? 'System Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.role === 'admin' ? 'Overview of all fields and agents' : `Welcome back, ${user?.username}`}
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/fields')} className="btn-primary gap-2">
              <PlusIcon className="w-4 h-4" /> New Field
            </button>
          )}
          <button onClick={() => navigate('/fields')} className="btn-secondary gap-2">
            View Fields <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, light }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${light}`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Field Status</h3>
          <div className="space-y-4">
            {stats.statusBreakdown.map((s: any) => {
              const pct = stats.totalFields > 0 ? Math.round((s.count / stats.totalFields) * 100) : 0;
              const barColor = s.status === 'active' ? 'bg-shamba-green' : s.status === 'at_risk' ? 'bg-red-500' : 'bg-blue-500';
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700 capitalize">{s.status.replace('_', ' ')}</span>
                    <span className="text-gray-500">{s.count} fields · {pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage breakdown */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Growth Stages</h3>
          <div className="space-y-4">
            {stats.stageBreakdown.map((s: any) => {
              const pct = stats.totalFields > 0 ? Math.round((s.count / stats.totalFields) * 100) : 0;
              const barColor = stageColors[s.current_stage] || 'bg-gray-400';
              return (
                <div key={s.current_stage}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700 capitalize">{s.current_stage}</span>
                    <span className="text-gray-500">{s.count} fields · {pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* At Risk Fields alert (admin only) */}
      {user?.role === 'admin' && atRiskFields.length > 0 && (
        <div className="card border-l-4 border-red-500 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">At Risk Fields <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">{atRiskFields.length}</span></h3>
            </div>
            <button onClick={() => navigate('/fields')} className="text-sm text-red-600 font-semibold hover:text-red-800 flex items-center gap-1">
              View all <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {atRiskFields.slice(0, 6).map(f => (
              <button key={f.id} onClick={() => navigate(`/fields/${f.id}`)} className="text-left p-3 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
                <p className="text-sm font-semibold text-gray-900">{f.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.crop_type} · <span className="capitalize">{f.current_stage}</span></p>
                {f.agent_name && <p className="text-xs text-red-600 mt-1">Agent: {f.agent_name}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Agent stats (admin only) */}
      {user?.role === 'admin' && stats.agentStats && stats.agentStats.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Agent Overview</h3>
            <button onClick={() => navigate('/agents')} className="text-sm text-shamba-green font-semibold hover:text-shamba-dark-green flex items-center gap-1">
              View all <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.agentStats.map((agent: any) => (
              <div key={agent.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-shamba-green flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-sm">{agent.username[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{agent.username}</p>
                  <p className="text-xs text-gray-500">{agent.field_count} field{agent.field_count !== 1 ? 's' : ''} assigned</p>
                </div>
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="w-4 h-4 text-shamba-green" />
                  <span className="text-lg font-bold text-shamba-dark-green">{agent.field_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
