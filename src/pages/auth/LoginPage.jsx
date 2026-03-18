import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/api';
import { Button } from '@/shared/ui/atoms/Button';
import { FormField } from '@/shared/ui/molecules/FormField';
import { Card, CardContent } from '@/shared/ui/molecules/Card';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/jwt/create/', form);
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      
      // Get user info
      const userRes = await api.get('/auth/users/me/');
      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <Typography.H2>SkillSwap AI</Typography.H2>
          <Typography.Small muted>Platformaga xush kelibsiz</Typography.Small>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                leftIcon={<Mail size={18} />}
                required
              />

              <FormField
                label="Parol"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                leftIcon={<Lock size={18} />}
                required
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                rightIcon={!loading && <ArrowRight size={18} />}
              >
                Kirish
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Typography.Small>
                Akkauntingiz yo'qmi?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Ro'yxatdan o'tish
                </button>
              </Typography.Small>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
