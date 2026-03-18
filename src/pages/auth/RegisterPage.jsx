import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/api';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Card, CardContent } from '@/shared/ui/molecules/Card';
import { Typography } from '@/shared/ui/atoms/Typography';
import { User, Mail, Lock, Phone, ArrowLeft, Check } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (form.password !== form.password_confirm) {
      setError('Parollar mos kelmadi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/users/', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      });

      // Auto login after registration
      const loginRes = await api.post('/auth/jwt/create/', {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem('access_token', loginRes.data.access);
      localStorage.setItem('refresh_token', loginRes.data.refresh);

      const userRes = await api.get('/auth/users/me/');
      localStorage.setItem('user', JSON.stringify(userRes.data));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Ro\'yxatdan o\'tishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        <button
          onClick={() => step === 1 ? navigate('/login') : setStep(1)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6"
        >
          <ArrowLeft size={20} />
          <span>Orqaga</span>
        </button>

        <div className="mb-8">
          <Typography.H3>
            {step === 1 ? 'Shaxsiy ma\'lumotlar' : 'Parol yaratish'}
          </Typography.H3>
          <Typography.Small muted>
            {step === 1 ? 'Qadam 1/2' : 'Qadam 2/2'}
          </Typography.Small>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Ism <span className="text-red-400">*</span>
                    </label>
                    <Input
                      placeholder="Ismingiz"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      leftIcon={<User size={18} />}
                      fullWidth
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Familiya <span className="text-red-400">*</span>
                    </label>
                    <Input
                      placeholder="Familiyangiz"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      leftIcon={<User size={18} />}
                      fullWidth
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      leftIcon={<Mail size={18} />}
                      fullWidth
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Telefon
                    </label>
                    <Input
                      placeholder="+998 90 123 45 67"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      leftIcon={<Phone size={18} />}
                      fullWidth
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Parol <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Kuchli parol kiriting"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      leftIcon={<Lock size={18} />}
                      fullWidth
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Parolni tasdiqlang <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Parolni qayta kiriting"
                      value={form.password_confirm}
                      onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                      leftIcon={<Check size={18} />}
                      fullWidth
                      required
                    />
                  </div>
                </>
              )}

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
              >
                {step === 1 ? 'Davom etish' : 'Ro\'yxatdan o\'tish'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
