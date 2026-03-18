import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, Loader2, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { validators } from '../utils/validators';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register, isLoading, error, success, clearMessages } = useAuthStore();
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  // Parol kuchini hisoblash
  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 5);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    // Clear field error when user types
    if (fieldErrors.password) {
      setFieldErrors({ ...fieldErrors, password: null });
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444'; // Weak - Red
    if (passwordStrength <= 3) return '#f59e0b'; // Medium - Orange
    return '#10b981'; // Strong - Green
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Zaif';
    if (passwordStrength <= 3) return 'O\'rtacha';
    return 'Kuchli';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    // Client-side validation
    const errors = {};
    const emailError = validators.email(email);
    if (emailError) errors.email = emailError;

    const passwordError = validators.password(password);
    if (passwordError) errors.password = passwordError;

    const matchError = validators.passwordMatch(password, rePassword);
    if (matchError) errors.rePassword = matchError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const ok = await register(email, password, rePassword);
    if (ok) setDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-900">
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl z-10 mx-4 relative bg-dark-800/60 backdrop-blur-xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-brand-900/50 text-brand-400 border border-brand-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <UserPlus size={28} />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Ro'yxatdan o'tish
          </h2>
          <p className="text-gray-400 mt-2">BARTER.AI da akkaunt yarating</p>
        </div>

        <ErrorDisplay error={error} onClose={clearMessages} />

        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="inline-flex items-center justify-center p-4 mb-6 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Akkaunt yaratildi! 🎉</h3>
            <p className="text-gray-400 text-sm mb-6">
              {success || "Ro'yxatdan muvaffaqiyatli o'tdingiz. Endi tizimga kiring."}
            </p>
            <Link to="/login" className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <ArrowLeft size={16} className="mr-2" /> Tizimga kirish
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-400 text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                  }}
                  className={`block w-full pl-11 pr-4 py-3 border ${fieldErrors.email ? 'border-red-500' : 'border-white/10'} bg-dark-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner`}
                  placeholder="email@example.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Parol *</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-400 text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`block w-full pl-11 pr-12 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-white/10'} bg-dark-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner`}
                  placeholder="Kamida 8 belgi"
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Parol kuchi:</span>
                    <span className="text-xs font-medium" style={{ color: getStrengthColor() }}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getStrengthColor()
                      }}
                    />
                  </div>
                  <ul className="mt-2 text-xs text-gray-500 space-y-1">
                    <li className={password.length >= 8 ? 'text-green-400' : ''}>✓ Kamida 8 ta belgi</li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>✓ Katta harf (A-Z)</li>
                    <li className={/[a-z]/.test(password) ? 'text-green-400' : ''}>✓ Kichik harf (a-z)</li>
                    <li className={/[0-9]/.test(password) ? 'text-green-400' : ''}>✓ Raqam (0-9)</li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Parolni tasdiqlang *</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-400 text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showRePassword ? 'text' : 'password'}
                  value={rePassword}
                  onChange={(e) => {
                    setRePassword(e.target.value);
                    if (fieldErrors.rePassword) setFieldErrors({ ...fieldErrors, rePassword: null });
                  }}
                  className={`block w-full pl-11 pr-12 py-3 border ${fieldErrors.rePassword ? 'border-red-500' : 'border-white/10'} bg-dark-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner`}
                  placeholder="Parolni qayta kiriting"
                />
                <button
                  type="button"
                  onClick={() => setShowRePassword(!showRePassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showRePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.rePassword && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.rePassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || passwordStrength < 2}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] mt-6"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Akkaunt yaratish'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-400 text-sm">
          Akkauntingiz bormi?{' '}
          <Link to="/login" className="text-brand-400 hover:underline font-semibold">Kirish</Link>
        </p>
      </motion.div>
    </div>
  );
}