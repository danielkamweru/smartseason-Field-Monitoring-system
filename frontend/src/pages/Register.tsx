import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', role: 'agent',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    { name: 'password', label: 'Password', type: 'password', placeholder: '•••••••', isPassword: true },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '•••••••', isPassword: true, isConfirmPassword: true },
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
                {f.isPassword ? (
                  <div className="relative">
                    <input
                      name={f.name}
                      type={f.isConfirmPassword ? (showConfirmPassword ? "text" : "password") : (showPassword ? "text" : "password")}
                      value={(formData as any)[f.name]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      className={`input-field pr-10 ${errors[f.name] ? 'border-red-400 focus:ring-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => f.isConfirmPassword ? setShowConfirmPassword(!showConfirmPassword) : setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {(f.isConfirmPassword ? showConfirmPassword : showPassword) ? (
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
                ) : (
                  <input
                    name={f.name}
                    type={f.type}
                    value={(formData as any)[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className={`input-field ${errors[f.name] ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                )}
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
