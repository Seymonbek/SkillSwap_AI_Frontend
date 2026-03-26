import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/axios';
import { UserCircle, Save, Loader2, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react';

export default function Profile() {
  const { user, fetchUser } = useAuthStore();
  const [form, setForm] = useState({ first_name: '', last_name: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Password change
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  useEffect(() => { if (!user) fetchUser(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/auth/users/me/', form);
      setSuccess('Profil yangilandi!');
      fetchUser();
    } catch (err) {
      setError(err.response?.data?.detail || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMsg('');
    try {
      await api.post('/auth/users/set_password/', pwForm);
      setPwMsg('Parol o\'zgartirildi!');
      setPwForm({ current_password: '', new_password: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.current_password?.[0] || err.response?.data?.new_password?.[0] || 'Parolni almashtirishda xatolik');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCircle size={24} style={{ color: '#8b5cf6' }} /> Profil
        </h1>
      </div>

      <div className="grid-2">
        {/* Profile info */}
        <motion.div className="card profile-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="profile-avatar-section">
            <div className="profile-avatar-lg">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" />
              ) : (
                (user?.first_name?.[0] || user?.email?.[0] || '?').toUpperCase()
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'white', fontSize: 18 }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12 }}>
                <span style={{ color: '#f59e0b' }}>⭐ Barter: {user?.barter_rating?.toFixed(1) || '0.0'}</span>
                <span style={{ color: '#8b5cf6' }}>🏆 Freelance: {user?.freelance_rating?.toFixed(1) || '0.0'}</span>
                <span style={{ color: '#ef4444' }}>🔥 {user?.streak_days || 0} kun</span>
              </div>
            </div>
          </div>

          {success && <div className="success-msg">{success}</div>}
          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Ism</label>
              <input className="form-[input]" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Ism" />
            </div>
            <div className="form-group">
              <label className="form-label">Familiya</label>
              <input className="form-[input]" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Familiya" />
            </div>
            <div className="form-group">
              <label className="form-label">O'z haqimda</label>
              <textarea className="form-[textarea]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="O'zingiz, tajribangiz va ko'nikmalaringiz haqida gapirib bering..." />
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={16} /> Saqlash</>}
            </button>
          </form>
        </motion.div>

        {/* Password change */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ margin: '0 0 20px', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} style={{ color: '#f59e0b' }} /> Parolni o'zgartirish
          </h3>

          {pwMsg && (
            <div className={pwMsg.includes('xatolik') ? 'error-msg' : 'success-msg'}>{pwMsg}</div>
          )}

          <form onSubmit={handlePwChange}>
            <div className="form-group">
              <label className="form-label">Joriy parol</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                  placeholder="Joriy parol"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Yangi parol</label>
              <input
                className="form-input"
                type="password"
                required
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                placeholder="Yangi parol"
              />
            </div>
            <button type="submit" className="btn btn--secondary" disabled={pwLoading}>
              {pwLoading ? <Loader2 className="animate-spin" size={18} /> : 'Parolni o\'zgartirish'}
            </button>
          </form>

          {/* Extra info */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Ma'lumot</h4>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 2 }}>
              <div>🔐 2FA: {user?.is_two_factor_enabled ? <span style={{ color: '#22c55e' }}>Yoqilgan</span> : <span style={{ color: '#94a3b8' }}>O'chirilgan</span>}</div>
              <div>✅ KYC: {user?.is_kyc_verified ? <span style={{ color: '#22c55e' }}>Tasdiqlangan</span> : <span style={{ color: '#f59e0b' }}>Tasdiqlanmagan</span>}</div>
              <div>📅 So'nggi faollik: {user?.last_activity ? new Date(user.last_activity).toLocaleDateString('ru-RU') : '—'}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
