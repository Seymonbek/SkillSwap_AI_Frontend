import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useModerationStore } from '../store/moderationStore';
import { Users, Loader2, ChevronLeft, X, Eye, Ban, ShieldCheck, User, Wallet, Calendar } from 'lucide-react';

export default function AdminUsers() {
  const {
    users, userDetail, isLoading, error, success,
    fetchUsers, fetchUser, banUser, clearMessages
  } = useModerationStore();

  const [showDetail, setShowDetail] = useState(false);
  const [banLoading, setBanLoading] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchUser(id);
  };

  const handleBan = async (id, currentBan) => {
    setBanLoading(id);
    clearMessages();
    await banUser(id, { is_banned: !currentBan, email: users.find(u => u.id === id)?.email || '' });
    setBanLoading(null);
    fetchUsers();
  };

  const navigate = useNavigate();
  const d = userDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} style={{ color: '#6366f1' }} /> Foydalanuvchilar boshqaruvi
          </h1>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#6366f1' }} /></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={48} /></div>
          <h3>Foydalanuvchilar yo'q</h3>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['ID', 'Email', 'Ism', 'KYC', 'Balans', 'Ban', 'Oxirgi kirish', 'Amallar'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: u.is_banned ? 0.5 : 1 }}
                >
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#64748b' }}>#{u.id}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#e2e8f0' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>
                    {u.first_name || ''} {u.last_name || ''}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                      background: u.kyc_status === 'APPROVED' ? '#10b98120' : u.kyc_status === 'PENDING' ? '#f59e0b20' : '#64748b20',
                      color: u.kyc_status === 'APPROVED' ? '#10b981' : u.kyc_status === 'PENDING' ? '#f59e0b' : '#64748b',
                    }}>
                      {u.kyc_status || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
                    ${u.wallet_balance || '0'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {u.is_banned ? (
                      <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: '#ef444420', color: '#ef4444' }}>BAN</span>
                    ) : (
                      <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: '#10b98120', color: '#10b981' }}>Faol</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b' }}>
                    {u.last_login ? new Date(u.last_login).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--secondary btn--sm" onClick={() => openDetail(u.id)}>
                        <Eye size={13} />
                      </button>
                      <button
                        className={`btn btn--sm ${u.is_banned ? '' : 'btn--danger'}`}
                        style={u.is_banned ? { background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 } : {}}
                        onClick={() => handleBan(u.id, u.is_banned)}
                        disabled={banLoading === u.id}
                      >
                        {banLoading === u.id ? <Loader2 className="animate-spin" size={13} /> : u.is_banned ? <><ShieldCheck size={13} /> Ochish</> : <><Ban size={13} /> Ban</>}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title"><User size={18} style={{ color: '#6366f1' }} /> Foydalanuvchi ma'lumotlari</h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#6366f1' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', margin: '0 auto 10px',
                      background: d.is_banned ? '#ef444420' : '#6366f120',
                      border: `2px solid ${d.is_banned ? '#ef4444' : '#6366f1'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 700, color: d.is_banned ? '#ef4444' : '#6366f1',
                    }}>
                      {(d.first_name?.[0] || d.email?.[0] || '?').toUpperCase()}
                    </div>
                    <h3 style={{ color: 'white', margin: '0 0 2px' }}>{d.first_name || ''} {d.last_name || ''}</h3>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{d.email}</div>
                  </div>

                  <div style={{ padding: 16, background: 'rgba(99,102,241,0.06)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)', lineHeight: 2.4 }}>
                    <div>🆔 <strong>ID:</strong> #{d.id}</div>
                    <div><Wallet size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>Balans:</strong> ${d.wallet_balance || '0'}</div>
                    <div>🔐 <strong>KYC:</strong> {d.kyc_status || 'NOT_SUBMITTED'}</div>
                    <div>🚫 <strong>Ban:</strong> {d.is_banned ? '❌ Ha' : '✅ Yo\'q'}</div>
                    <div><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>Ro'yxat:</strong> {d.date_joined ? new Date(d.date_joined).toLocaleDateString('ru-RU') : '—'}</div>
                    <div>🕐 <strong>Oxirgi kirish:</strong> {d.last_login ? new Date(d.last_login).toLocaleString('ru-RU') : '—'}</div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
