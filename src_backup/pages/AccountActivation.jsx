import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, AlertTriangle, ArrowLeft, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AccountActivation() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const { activateAccount, resendActivation, isLoading, error, success, clearMessages } = useAuthStore();
  const [status, setStatus] = useState('loading'); // loading | success | error | resend
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    if (uid && token) {
      activate();
    } else {
      setStatus('resend');
    }
  }, []);

  const activate = async () => {
    clearMessages();
    setStatus('loading');
    const ok = await activateAccount(uid, token);
    setStatus(ok ? 'success' : 'error');
  };

  const handleResend = async (e) => {
    e.preventDefault();
    clearMessages();
    await resendActivation(resendEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-900">
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl z-10 mx-4 relative bg-dark-800/60 backdrop-blur-xl border border-white/10 shadow-2xl text-center"
      >
        <div className="mb-6">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-brand-900/50 text-brand-400 border border-brand-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Sparkles size={28} />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Akkaunt aktivatsiyasi
          </h2>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div style={{ padding: 40 }}>
            <Loader2 className="animate-spin mx-auto" size={40} style={{ color: '#a78bfa' }} />
            <p className="text-gray-400 mt-4">Akkaunt faollashtirilmoqda...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="inline-flex items-center justify-center p-4 mb-6 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Tabriklaymiz! 🎉</h3>
            <p className="text-gray-400 text-sm mb-6">Akkauntingiz muvaffaqiyatli faollashtirildi. Endi tizimga kirishingiz mumkin.</p>
            <Link to="/login" className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              Tizimga kirish →
            </Link>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="inline-flex items-center justify-center p-4 mb-6 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Xatolik!</h3>
            <p className="text-red-400 text-sm mb-4">{error || 'Aktivatsiya havolasi yaroqsiz yoki muddati o\'tgan.'}</p>
            <button onClick={() => setStatus('resend')} className="text-brand-400 hover:underline font-semibold text-sm">
              Aktivatsiya emailini qayta yuborish →
            </button>
          </motion.div>
        )}

        {/* Resend form */}
        {status === 'resend' && (
          <div>
            <p className="text-gray-400 text-sm mb-6">
              Aktivatsiya havolasi kelmaganmi? Email manzilingizni kiriting va qayta yuboramiz.
            </p>

            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {success}
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleResend} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input type="email" required value={resendEmail} onChange={(e) => setResendEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-white/10 bg-dark-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner"
                  placeholder="email@example.com" />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all disabled:opacity-70 shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Qayta yuborish'}
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-gray-400 text-sm">
          <Link to="/login" className="text-brand-400 hover:underline font-semibold">
            <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Kirish sahifasiga
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
