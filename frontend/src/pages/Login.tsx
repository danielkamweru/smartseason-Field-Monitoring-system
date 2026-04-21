import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FormData, FormErrors } from '../types/form';

const Login = () => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (error) clearError();
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const result = await login(formData);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#14532d] flex-col justify-between p-12">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/shamba-logo.jpeg"
            alt="Shamba Records"
            className="w-32 h-32 rounded-3xl object-cover shadow-2xl ring-4 ring-green-700"
          />
          <div className="text-center">
            <p className="text-white font-bold text-2xl font-poppins">SmartSeason</p>
            <p className="text-green-400 text-sm mt-0.5">Powered by Shamba Records</p>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white font-poppins leading-tight mb-4">
            Monitor your fields,<br />grow your harvest.
          </h1>
          <p className="text-green-300 text-lg leading-relaxed">
            Track crop progress, manage field agents, and get real-time insights across all your fields.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Fields Tracked', value: '500+' },
              { label: 'Active Agents', value: '50+' },
              { label: 'Harvests Done', value: '1.2K' },
            ].map(stat => (
              <div key={stat.label} className="bg-green-800/50 rounded-2xl p-4">
                <p className="text-shamba-green text-2xl font-bold">{stat.value}</p>
                <p className="text-green-300 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-600 text-sm">© 2026 SmartSeason</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/shamba-logo.jpeg" alt="Shamba" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-shamba-dark-green font-poppins">SmartSeason</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 font-poppins mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-shamba-green font-semibold hover:text-shamba-dark-green">
              Sign up
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input-field ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wide font-semibold">Demo credentials</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'Admin', email: 'admin@smartseason.com' },
                { role: 'Agent', email: 'agent1@smartseason.com' },
              ].map(c => (
                <div key={c.role} className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-shamba-dark-green mb-1">{c.role}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  <p className="text-xs text-gray-400">password</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
