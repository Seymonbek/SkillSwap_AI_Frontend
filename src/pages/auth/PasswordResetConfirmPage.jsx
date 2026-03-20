import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '@/shared/api';
import { Lock, Check, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const PasswordResetConfirmPage = () => {
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const [searchParams] = useSearchParams();

  const uidParam = uid || searchParams.get('uid');
  const tokenParam = token || searchParams.get('token');

  const [form, setForm] = useState({ new_password: '', re_new_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.new_password.length < 8) {
      setError("Parol kamida 8 belgidan iborat bo'lishi kerak");
      return;
    }
    if (form.new_password !== form.re_new_password) {
      setError('Parollar mos kelmayapti');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPasswordConfirm({
        uid: uidParam,
        token: tokenParam,
        new_password: form.new_password,
        re_new_password: form.re_new_password,
      });
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = [];
        Object.values(data).forEach(v => {
          if (Array.isArray(v)) messages.push(...v);
          else if (typeof v === 'string') messages.push(v);
        });
        setError(messages.join('. ') || 'Xatolik yuz berdi');
      } else {
        setError('Server bilan aloqa bo\'lmadi');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!uidParam || !tokenParam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Noto&apos;g&apos;ri havola</h2>
          <p className="text-slate-400 mb-6">Bu havola yaroqsiz yoki muddati tugagan</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">Login sahifasiga qaytish</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.15 }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full relative z-10">
        {success ? (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Parol yangilandi!</h2>
            <p className="text-slate-400 mb-6">Yangi parolingiz bilan kiring</p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">Kirish sahifasiga</button>
          </div>
        ) : (
          <>
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Orqaga
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Yangi parol</h2>
                <p className="text-slate-400 text-sm">Yangi parolingizni kiriting</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Yangi parol</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.new_password}
                    onChange={e => setForm({ ...form, new_password: e.target.value })}
                    className="glass-input w-full pr-10" placeholder="Kamida 8 belgi" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Parolni tasdiqlash</label>
                <input type={showPassword ? 'text' : 'password'} value={form.re_new_password}
                  onChange={e => setForm({ ...form, re_new_password: e.target.value })}
                  className="glass-input w-full" placeholder="Parolni qayta kiriting" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-4 h-4" /> Parolni yangilash</>}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PasswordResetConfirmPage;
