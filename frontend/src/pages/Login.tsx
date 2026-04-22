import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FormData, FormErrors } from '../types/form';

const Login = () => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Left panel */}
      <div className="lg:w-1/2 bg-[#14532d] flex flex-col justify-between p-8 sm:p-12"
        style={{ minHeight: '100vh' }}>
        <div className="flex flex-col items-center gap-4">
          <img
            src="/shamba-logo.jpeg"
            alt="Shamba Records"
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover shadow-2xl ring-4 ring-green-700"
          />
          <div className="text-center">
            <p className="text-white font-bold text-xl sm:text-2xl font-poppins">SmartSeason</p>
            <p className="text-green-400 text-sm mt-0.5">Powered by Shamba Records</p>
          </div>
        </div>
        <div className="mt-8 lg:mt-0">
          <h1 className="text-2xl sm:text-4xl font-bold text-white font-poppins leading-tight mb-4">
            Monitor your fields,<br />grow your harvest.
          </h1>
          <p className="text-green-300 text-base sm:text-lg leading-relaxed">
            Track crop progress, manage field agents, and get real-time insights across all your fields.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Fields Tracked', value: '500+' },
              { label: 'Active Agents', value: '50+' },
              { label: 'Harvests Done', value: '1.2K' },
            ].map(stat => (
              <div key={stat.label} className="bg-green-800/50 rounded-2xl p-3 sm:p-4">
                <p className="text-shamba-green text-xl sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-green-300 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-600 text-sm mt-8 lg:mt-0">© 2026 SmartSeason</p>
      </div>

      {/* Right panel */}
      <div className="lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 sm:px-8 py-10 sm:py-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-poppins mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6 sm:mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-shamba-green font-semibold hover:text-shamba-dark-green">
              Sign up
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="•••••••"
                  className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

          <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-5">
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
