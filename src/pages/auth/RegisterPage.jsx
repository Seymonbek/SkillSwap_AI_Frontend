import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '@/shared/api';
import { clearStoredAuth } from '@/shared/lib/auth';
import { User, Mail, Lock, Phone, ArrowLeft, ArrowRight, Check, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react';

const formatAuthError = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;

  const messages = Object.entries(data)
    .flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values
        .filter(Boolean)
        .map((item) => {
          if (typeof item !== 'string') return '';
          return field === 'detail' ? item : `${field}: ${item}`;
        })
        .filter(Boolean);
    });

  return messages.length > 0 ? messages.join('. ') : fallback;
};

const hasExistingEmailError = (data) => {
  if (!data?.email) return false;
  const emailMessages = Array.isArray(data.email) ? data.email : [data.email];
  const normalized = emailMessages.join(' ').toLowerCase();
  return normalized.includes('already') || normalized.includes('allaqachon') || normalized.includes('exists');
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [activationEmail, setActivationEmail] = useState('');
  const [canResendActivation, setCanResendActivation] = useState(false);
  const [resendingActivation, setResendingActivation] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    re_password: '',
  });

  useEffect(() => {
    clearStoredAuth();
  }, []);

  const validateStep1 = () => {
    if (!form.first_name.trim()) return 'Ism majburiy';
    if (!form.last_name.trim()) return 'Familiya majburiy';
    if (!form.email.trim()) return 'Email majburiy';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Noto'g'ri email format";
    return null;
  };

  const validateStep2 = () => {
    if (!form.password) return 'Parol majburiy';
    if (form.password.length < 8) return "Parol kamida 8 ta belgi bo'lishi kerak";
    if (form.password !== form.re_password) return 'Parollar mos kelmadi';
    return null;
  };

  const handleResendActivation = async () => {
    if (!activationEmail) return;

    setResendingActivation(true);
    setError('');
    setInfoMessage('');

    try {
      await authService.resendActivation({ email: activationEmail });
      setInfoMessage("Aktivatsiya xati qayta yuborildi. Pochtangizni va spam papkasini tekshiring.");
    } catch (err) {
      setError(formatAuthError(err.response?.data, "Aktivatsiya xatini qayta yuborib bo'lmadi."));
    } finally {
      setResendingActivation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
      return;
    }

    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      await authService.createUser({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: normalizedEmail,
        password: form.password,
        re_password: form.re_password,
      });

      setActivationEmail(normalizedEmail);
      setCanResendActivation(true);
      setRegistrationComplete(true);
      setInfoMessage("Akkaunt yaratildi. Hozir login qilishdan oldin email orqali aktivatsiya talab qilinadi.");
    } catch (err) {
      const data = err.response?.data;
      const normalizedEmail = form.email.trim().toLowerCase();

      if (hasExistingEmailError(data)) {
        setActivationEmail(normalizedEmail);
        setCanResendActivation(true);
        setInfoMessage("Bu email bilan akkaunt allaqachon yaratilgan. Agar hali kira olmasangiz, aktivatsiya xatini qayta yuboring.");
      }

      setError(formatAuthError(data, "Ro'yxatdan o'tishda xatolik yuz berdi"));
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
          {/* Back Button */}
          <button
            onClick={() => step === 1 ? navigate('/login') : setStep(1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Orqaga</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {step === 1 ? "Shaxsiy ma'lumotlar" : 'Parol yaratish'}
            </h1>
            <p className="text-slate-400">{step === 1 ? 'Qadam 1/2' : 'Qadam 2/2'}</p>

            {/* Step indicator */}
            <div className="flex gap-2 mt-4 justify-center">
              <div className={`h-1 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              <div className={`h-1 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {infoMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
            >
              <p className="text-sm text-emerald-300">{infoMessage}</p>
            </motion.div>
          )}

          {registrationComplete ? (
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <p className="text-emerald-300 text-sm">
                  Akkaunt yaratildi. {activationEmail ? `${activationEmail} manziliga` : 'Pochtangizga'} aktivatsiya xati yuborilgan bo'lishi mumkin. Emailni tasdiqlagandan keyin login qiling.
                </p>
              </motion.div>
              <div className="flex flex-col gap-3">
                {canResendActivation && (
                  <button
                    onClick={handleResendActivation}
                    disabled={resendingActivation}
                    className="btn-secondary w-full py-3"
                  >
                    {resendingActivation ? 'Yuborilmoqda...' : 'Aktivatsiya xatini qayta yuborish'}
                  </button>
                )}
                <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">
                  Login sahifasiga o&apos;tish
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ism</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ismingiz"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      className="glass-input pl-12"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Familiya</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Familiyangiz"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      className="glass-input pl-12"
                      required
                    />
                  </div>
                </div>
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Telefon (ixtiyoriy)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="+998 90 123 45 67"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="glass-input pl-12"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Kuchli parol kiriting"
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
                  <p className="text-xs text-slate-500 mt-1">Kamida 8 ta belgi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Parolni tasdiqlang</label>
                  <div className="relative">
                    <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Parolni qayta kiriting"
                      value={form.re_password}
                      onChange={(e) => setForm({ ...form, re_password: e.target.value })}
                      className="glass-input pl-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 1 ? 'Davom etish' : "Ro'yxatdan o'tish"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          )}

          {!registrationComplete && canResendActivation && (
            <div className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
              <p className="text-sm text-amber-200">
                Agar bu email bilan akkaunt oldinroq yaratilgan bo'lsa, yangi ro'yxatdan o'tish o'rniga aktivatsiya xatini qayta yuborishingiz mumkin.
              </p>
              <button
                onClick={handleResendActivation}
                disabled={resendingActivation}
                className="btn-secondary mt-3 w-full py-3"
              >
                {resendingActivation ? 'Yuborilmoqda...' : 'Aktivatsiya xatini qayta yuborish'}
              </button>
            </div>
          )}

          {!registrationComplete && step === 1 && (
            <div className="mt-8 text-center">
              <p className="text-slate-400">
                Akkauntingiz bormi?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Kirish
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
