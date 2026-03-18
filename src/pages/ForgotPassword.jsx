import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Sparkles, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { resetPassword, isLoading, error, success, clearMessages } = useAuthStore();
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    const ok = await resetPassword(email);
    if (ok) setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-900">
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
            Parolni tiklash
          </h2>
          <p className="text-gray-400 mt-2">
            {sent ? "Email manzilingizni tekshiring" : "Email manzilingizni kiriting"}
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </motion.div>
        )}

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="inline-flex items-center justify-center p-4 mb-6 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Email yuborildi!</h3>
            <p className="text-gray-400 text-sm mb-6">
              Parol tiklash havolasi <strong style={{ color: '#a78bfa' }}>{email}</strong> manziliga yuborildi. Email'ingizni tekshiring.
            </p>
            <Link to="/login" className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <ArrowLeft size={16} className="mr-2" /> Kirish sahifasiga qaytish
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email manzil</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-400 text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-white/10 bg-dark-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Havolani yuborish'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-400 text-sm">
          <Link to="/login" className="text-brand-400 hover:underline font-semibold">
            <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Kirish sahifasiga qaytish
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
