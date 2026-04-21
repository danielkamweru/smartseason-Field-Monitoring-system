import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', role: 'agent',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (error) clearError();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    if (result.success) navigate('/dashboard');
  };

  const fields = [
    { name: 'username', label: 'Username', type: 'text', placeholder: 'johndoe' },
    { name: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#14532d] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <img src="/shamba-logo.jpeg" alt="Shamba" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
          <span className="text-white font-bold text-xl font-poppins">SmartSeason</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white font-poppins leading-tight mb-4">
            Join the SmartSeason<br />community today.
          </h1>
          <p className="text-green-300 text-lg leading-relaxed">
            Create your account and start monitoring fields, tracking growth stages, and managing your agricultural operations.
          </p>
          <div className="mt-10 space-y-4">
            {['Real-time field status tracking', 'Role-based access control', 'Complete update history & audit trail'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-shamba-green flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-200 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-600 text-sm">© 2026 SmartSeason · Powered by Shamba Records</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/shamba-logo.jpeg" alt="Shamba" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-shamba-dark-green font-poppins">SmartSeason</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 font-poppins mb-1">Create account</h2>
          <p className="text-gray-500 text-sm mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-shamba-green font-semibold hover:text-shamba-dark-green">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(f => (
              <div key={f.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                <input
                  name={f.name}
                  type={f.type}
                  value={(formData as any)[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  className={`input-field ${errors[f.name] ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {errors[f.name] && <p className="mt-1 text-xs text-red-500">{errors[f.name]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="input-field">
                <option value="agent">Field Agent</option>
                <option value="admin">Admin (Coordinator)</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
