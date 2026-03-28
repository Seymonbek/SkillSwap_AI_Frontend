import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/shared/api';
import { clearStoredAuth, hasActiveSession } from '@/shared/lib/auth';
import {
  Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff,
  AlertCircle, Shield, RefreshCw, CheckCircle2
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('login'); // login, 2fa, reset, reset-sent
  const [twoFACode, setTwoFACode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [tempToken, setTempToken] = useState(null);

  useEffect(() => {
    if (!hasActiveSession()) {
      clearStoredAuth();
    }
  }, []);

  const getErrorMessage = (err, fallback) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') {
      const normalizedDetail = detail.toLowerCase();

      if (
        normalizedDetail.includes('given token not valid') ||
        normalizedDetail.includes('token not valid') ||
        normalizedDetail.includes('token is invalid') ||
        normalizedDetail.includes('token is expired')
      ) {
        return 'Sessiya muddati tugagan yoki yaroqsiz. Qaytadan kirib ko‘ring.';
      }

      if (
        normalizedDetail.includes('no active account') ||
        normalizedDetail.includes('credentials') ||
        normalizedDetail.includes('password')
      ) {
        return 'Email yoki parol noto‘g‘ri.';
      }

      return detail;
    }
    if (err.response?.data?.error) return err.response.data.error;
    if (err.response?.data?.non_field_errors?.[0]) return err.response.data.non_field_errors[0];
    if (err.code === 'ERR_NETWORK') {
      return "Server bilan bog'lanib bo'lmadi. API manzili yoki CORS sozlamasini tekshiring.";
    }
    return fallback;
  };

  const validateForm = () => {
    const errors = [];
    if (!form.email) errors.push('Email majburiy');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push("Noto'g'ri email format");
    if (!form.password) errors.push('Parol majburiy');
    else if (form.password.length < 6) errors.push('Parol kamida 6 ta belgi');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.login(form);

      if (res.data.requires_2fa) {
        setTempToken(res.data.temp_token);
        setStep('2fa');
        setLoading(false);
        return;
      }

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      const userRes = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(userRes.data));

      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Login amalga oshmadi'));
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!twoFACode || twoFACode.length !== 6) {
      setError('6 raqamli kodni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.verifyLogin2FA({
        temp_token: tempToken,
        code: twoFACode
      });

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      const userRes = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(userRes.data));

      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, "2FA kodi noto'g'ri"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Email majburiy');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword({ email: resetEmail });
      setStep('reset-sent');
    } catch (err) {
      setError(getErrorMessage(err, 'Xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="blob-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>
      <div className="grid-pattern" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            {step === 'login' && (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">Xush kelibsiz!</h1>
                <p className="text-slate-400">SkillSwap AI ga kirish</p>
              </>
            )}
            {step === '2fa' && (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">2FA Tasdiqlash</h1>
                <p className="text-slate-400">6 raqamli kodni kiriting</p>
              </>
            )}
            {step === 'reset' && (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">Parolni tiklash</h1>
                <p className="text-slate-400">Email manzilingizni kiriting</p>
              </>
            )}
            {step === 'reset-sent' && (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">Email yuborildi</h1>
                <p className="text-slate-400">Kodni tekshiring</p>
              </>
            )}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="glass-input pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Parol</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="glass-input pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500" />
                  <span className="text-sm text-slate-400">Eslab qolish</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setStep('reset'); setError(''); }}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Parolni unutdingizmi?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
              >
                {loading ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Kirish
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handle2FASubmit} className="space-y-5">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">6 raqamli kod</label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  className="glass-input w-full text-center text-2xl tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Tasdiqlash'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('login'); setError(''); }}
                className="btn-secondary w-full"
              >
                Orqaga
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="glass-input w-full pl-12"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Kod yuborish'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('login'); setError(''); }}
                className="btn-secondary w-full"
              >
                Orqaga
              </button>
            </form>
          )}

          {step === 'reset-sent' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-slate-300">
                Parolni tiklash kodi email manzilingizga yuborildi.
              </p>
              <button
                onClick={() => { setStep('login'); setError(''); }}
                className="btn-primary w-full"
              >
                Login sahifasiga qaytish
              </button>
            </div>
          )}

          {step === 'login' && (
            <div className="mt-8 text-center">
              <p className="text-slate-400">
                Akkauntingiz yo&apos;qmi?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Ro&apos;yxatdan o&apos;tish
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
