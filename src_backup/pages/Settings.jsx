import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { 
  Settings as SettingsIcon, 
  Loader2, 
  ChevronLeft,
  Percent,
  Briefcase,
  RefreshCw,
  HardDrive,
  FileText,
  Clock,
  ShieldAlert,
  Zap,
  CreditCard,
  Mail,
  Lock,
  Trash2,
  AlertTriangle,
  X,
  Key
} from 'lucide-react';

export default function Settings() {
  const { settings, isLoading, error, fetchSettings } = useSettingsStore();
  const { 
    user, resetPassword, setEmail, deleteMyAccount, setPassword: changePassword,
    isLoading: authLoading, error: authError, success: authSuccess, clearMessages 
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('platform');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const navigate = useNavigate();

  const handleEmailChange = async (e) => {
    e.preventDefault();
    clearMessages();
    const ok = await setEmail(newEmail, emailPassword);
    if (ok) { setNewEmail(''); setEmailPassword(''); }
  };

  const handlePasswordReset = async () => {
    clearMessages();
    if (user?.email) await resetPassword(user.email);
  };

  const handleDeleteAccount = async () => {
    clearMessages();
    const ok = await deleteMyAccount(deletePassword);
    if (ok) navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    clearMessages();
    if (newPwd !== confirmPwd) {
      useAuthStore.setState({ error: 'Yangi parollar mos kelmaydi!' });
      return;
    }
    if (newPwd.length < 8) {
      useAuthStore.setState({ error: 'Parol kamida 8 belgidan iborat bo\'lishi kerak!' });
      return;
    }
    const ok = await changePassword(currentPwd, newPwd);
    if (ok) { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }
  };

  const getSettingDetails = (key) => {
    switch (key) {
      case 'freelance_commission_default':
        return { label: 'Freelance (Standart)', icon: <Percent size={20} color="#f59e0b" />, suffix: '%', desc: 'Oddiy platforma komissiyasi' };
      case 'freelance_commission_pro':
        return { label: 'Freelance (Pro)', icon: <Zap size={20} color="#eab308" />, suffix: '%', desc: 'Pro foydalanuvchilar uchun komissiya' };
      case 'barter_commission':
        return { label: 'Barter komissiyasi', icon: <RefreshCw size={20} color="#3b82f6" />, suffix: '%', desc: 'Barter xizmatlari uchun komissiya' };
      case 'premium_job_cost':
        return { label: 'Premium loyiha narxi', icon: <Briefcase size={20} color="#8b5cf6" />, prefix: '$', desc: "Loyihani premium statusiga o'tkazish" };
      case 'max_submission_file_mb':
        return { label: 'Topshiriq fayl hajmi', icon: <HardDrive size={20} color="#10b981" />, suffix: ' MB', desc: "Topshiriq uchun maksimal hajm" };
      case 'token_reactivation_fee':
        return { label: 'Qayta faollashtirish', icon: <CreditCard size={20} color="#ef4444" />, prefix: '$', desc: "Profilni tiklash to'lovi" };
      case 'max_dispute_evidence_mb':
        return { label: 'Nizo dalil hajmi', icon: <ShieldAlert size={20} color="#f43f5e" />, suffix: ' MB', desc: "Nizolar uchun fayl chegarasi" };
      case 'media_retention_days':
        return { label: 'Fayllarni saqlash muddati', icon: <Clock size={20} color="#6366f1" />, suffix: ' kun', desc: "Media fayllar bazada saqlanish vaqti" };
      default:
        return { label: key, icon: <FileText size={20} color="#94a3b8" />, prefix: '', suffix: '', desc: '' };
    }
  };

  const currentSettings = settings && settings.length > 0 ? settings[0] : null;
  const tabs = [
    { id: 'platform', label: 'Platforma', icon: SettingsIcon },
    { id: 'account', label: 'Hisob', icon: Key },
    { id: 'danger', label: 'Xavfli zona', icon: AlertTriangle },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px', border: '1px solid rgba(255,255,255,0.08)' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0, fontSize: 24 }}>
            <div style={{ padding: 8, background: 'rgba(99, 102, 241, 0.1)', borderRadius: 10 }}>
              <SettingsIcon size={24} style={{ color: '#8b5cf6' }} />
            </div>
            Sozlamalar
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); clearMessages(); }}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: activeTab === t.id ? (t.id === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)') : 'transparent',
              color: activeTab === t.id ? (t.id === 'danger' ? '#ef4444' : '#a78bfa') : '#64748b',
            }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {authError && <div className="error-msg">{authError}</div>}
      {authSuccess && <div className="success-msg">{authSuccess}</div>}

      {/* Platform tab */}
      {activeTab === 'platform' && (
        <>
          {error && <div className="error-msg">{error}</div>}
          {isLoading ? (
            <div className="loader-center" style={{ minHeight: 300 }}>
              <Loader2 className="animate-spin" size={32} style={{ color: '#8b5cf6' }} />
            </div>
          ) : !currentSettings ? (
            <div className="empty-state" style={{ minHeight: 300 }}>
              <div className="empty-state-icon"><SettingsIcon size={48} /></div>
              <h3>Sozlamalar yo'q</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {Object.entries(currentSettings)
                .filter(([key]) => key !== 'id')
                .map(([key, value], index) => {
                  const { label, icon, prefix = '', suffix = '', desc } = getSettingDetails(key);
                  return (
                    <motion.div key={key} className="card"
                      initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, border: '1px solid rgba(255,255,255,0.03)', background: 'linear-gradient(180deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.4) 100%)' }}
                      whileHover={{ y: -4, borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {icon}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{label}</h3>
                          {desc && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{desc}</p>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                        <span style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>{prefix}{value}</span>
                        <span style={{ fontSize: 15, fontWeight: 500, color: '#94a3b8', marginLeft: 4 }}>{suffix}</span>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* Account tab */}
      {activeTab === 'account' && (
        <div style={{ maxWidth: 520 }}>
          {/* Email change */}
          <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: 24, marginBottom: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={18} style={{ color: '#6366f1' }} /> Email o'zgartirish
            </h3>
            <div style={{ padding: 12, background: 'rgba(99,102,241,0.06)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#94a3b8' }}>
              Hozirgi email: <strong style={{ color: '#e2e8f0' }}>{user?.email || '—'}</strong>
            </div>
            <form onSubmit={handleEmailChange}>
              <div className="form-group">
                <label className="form-label">Yangi email</label>
                <input className="form-input" type="email" required value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)} placeholder="newemail@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Joriy parol (tasdiqlash)</label>
                <input className="form-input" type="password" required value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)} placeholder="Parolingiz" />
              </div>
              <button type="submit" className="btn btn--primary" disabled={authLoading} style={{ width: '100%' }}>
                {authLoading ? <Loader2 className="animate-spin" size={16} /> : <><Mail size={15} /> Email yangilash</>}
              </button>
            </form>
          </motion.div>

          {/* Password change */}
          <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ padding: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} style={{ color: '#f59e0b' }} /> Parolni o'zgartirish
            </h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Joriy parol</label>
                <input className="form-input" type="password" required value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Hozirgi parol" />
              </div>
              <div className="form-group">
                <label className="form-label">Yangi parol</label>
                <input className="form-input" type="password" required value={newPwd} minLength={8}
                  onChange={(e) => setNewPwd(e.target.value)} placeholder="Kamida 8 belgi" />
              </div>
              <div className="form-group">
                <label className="form-label">Yangi parolni tasdiqlang</label>
                <input className="form-input" type="password" required value={confirmPwd} minLength={8}
                  onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Qayta kiriting" />
              </div>
              <button type="submit" className="btn btn--primary" disabled={authLoading} style={{ width: '100%', background: '#f59e0b' }}>
                {authLoading ? <Loader2 className="animate-spin" size={16} /> : <><Key size={15} /> Parolni o'zgartirish</>}
              </button>
            </form>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button onClick={handlePasswordReset} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12 }}>
                Parolni unutdingizmi? → Email orqali tiklash
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Danger zone tab */}
      {activeTab === 'danger' && (
        <div style={{ maxWidth: 520 }}>
          <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: 24, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 12px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> Hisobni o'chirish
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.7 }}>
              Hisobingizni o'chirsangiz, barcha ma'lumotlaringiz — profilingiz, shartnomalaringiz, barter sessiyalaringiz va boshqa barcha ma'lumotlar qaytarib bo'lmas darajada o'chiriladi.
            </p>
            <button onClick={() => { setShowDeleteModal(true); clearMessages(); }} className="btn btn--danger" style={{ width: '100%' }}>
              <Trash2 size={15} /> Hisobimni o'chirish
            </button>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className="modal-title" style={{ color: '#ef4444' }}>
                  <AlertTriangle size={18} /> Haqiqatan ham o'chirmoqchimisiz?
                </h3>
                <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.7 }}>
                Bu amalni ortga qaytarib bo'lmaydi. Davom etish uchun parolingizni kiriting.
              </p>
              {authError && <div className="error-msg" style={{ marginBottom: 12 }}>{authError}</div>}
              <div className="form-group">
                <label className="form-label">Joriy parol</label>
                <input className="form-input" type="password" required value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)} placeholder="Parolingizni kiriting" />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => setShowDeleteModal(false)} className="btn btn--secondary" style={{ flex: 1 }}>
                  Bekor qilish
                </button>
                <button onClick={handleDeleteAccount} className="btn btn--danger" style={{ flex: 1 }} disabled={authLoading || !deletePassword}>
                  {authLoading ? <Loader2 className="animate-spin" size={16} /> : <><Trash2 size={15} /> O'chirish</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
