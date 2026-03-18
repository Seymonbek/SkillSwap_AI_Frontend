import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { validators } from '../utils/validators';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, isLoading, error, clearMessages } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    // Client-side validation
    const errors = {};
    const emailError = validators.email(email);
    if (emailError) errors.email = emailError;
    if (!password) errors.password = 'Parol kiritilishi kerak';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: null });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-900">
      {/* Dekorativ neon dog'lar (Tailwind v4 xususiyati) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl z-10 mx-4 relative bg-dark-800/60 backdrop-blur-xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-brand-900/50 text-brand-400 border border-brand-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Sparkles size={28} />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Tizimga kirish
          </h2>
          <p className="text-gray-400 mt-2">BARTER.AI tizimiga xush kelibsiz</p>
        </div>

        <ErrorDisplay error={error} onClose={clearMessages} />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-400 text-gray-500">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className={`block w-full pl-11 pr-4 py-3 border ${fieldErrors.email ? 'border-red-500' : 'border-white/10'} bg-dark-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner`}
                placeholder="admin@example.com"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-2 text-sm text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          {/* Parol */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Parol *</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-400 text-gray-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                className={`block w-full pl-11 pr-12 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-white/10'} bg-dark-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-2 text-sm text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] mt-6"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Kirish'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-gray-400 hover:text-brand-400 text-sm transition-colors">
            Parolni unutdingizmi?
          </Link>
        </div>

        <p className="mt-4 text-center text-gray-400 text-sm">
          Akkauntingiz yo'qmi?{' '}
          <Link to="/register" className="text-brand-400 hover:underline font-semibold">Ro'yxatdan o'tish</Link>
        </p>
      </motion.div>
    </div>
  );
}