import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/shared/api/api';
import { useToast } from '@/shared/ui/providers/ToastProvider';
import { Button } from '@/shared/ui/atoms/Button';
import { FormField } from '@/shared/ui/molecules/FormField';
import { Card, CardContent } from '@/shared/ui/molecules/Card';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Mail, Lock, ArrowRight, Sparkles, Zap } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  // const { error: showError, success } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/jwt/create/', form);
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      const userRes = await api.get('/auth/users/me/');
      localStorage.setItem('user', JSON.stringify(userRes.data));

      // success('Xush kelibsiz!');
      navigate('/dashboard');
    } catch (err) {
      // showError(err.response?.data?.detail || 'Email yoki parol noto\'g\'ri');
      alert(err.response?.data?.detail || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        {/* Animated orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <Typography.H2 className="text-gradient mb-2">SkillSwap AI</Typography.H2>
          <Typography.Small muted className="text-slate-400">
            Platformaga xush kelibsiz
          </Typography.Small>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card gradient className="backdrop-blur-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <FormField
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  leftIcon={<Mail size={18} className="text-slate-400" />}
                  required
                />

                <FormField
                  label="Parol"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  leftIcon={<Lock size={18} className="text-slate-400" />}
                  required
                />

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    rightIcon={!loading && <ArrowRight size={18} />}
                    className="mt-2"
                  >
                    Kirish
                  </Button>
                </motion.div>
              </form>

              <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                <Typography.Small className="text-slate-400">
                  Akkauntingiz yo'qmi?{' '}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/register')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                  >
                    Ro'yxatdan o'tish
                    <Zap size={14} className="text-amber-400" />
                  </motion.button>
                </Typography.Small>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-xs text-slate-500"
        >
          © 2025 SkillSwap AI. Barcha huquqlar himoyalangan.
        </motion.p>
      </div>
    </div>
  );
};
