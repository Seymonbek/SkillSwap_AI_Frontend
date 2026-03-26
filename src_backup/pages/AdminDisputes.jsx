import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useModerationStore } from '../store/moderationStore';
import { AlertTriangle, Loader2, ChevronLeft, X, Eye, Gavel, User, DollarSign } from 'lucide-react';

const statusColors = {
  OPEN: '#f59e0b',
  UNDER_REVIEW: '#3b82f6',
  RESOLVED: '#10b981',
  CANCELLED: '#64748b',
};
const statusLabels = {
  OPEN: 'Ochiq',
  UNDER_REVIEW: "Ko'rib chiqilmoqda",
  RESOLVED: 'Hal qilindi',
  CANCELLED: 'Bekor qilindi',
};

export default function AdminDisputes() {
  const {
    disputes, disputeDetail, isLoading, error, success,
    fetchDisputes, fetchDispute, resolveDispute, clearMessages
  } = useModerationStore();

  const [showDetail, setShowDetail] = useState(false);
  const [showResolve, setShowResolve] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    admin_comment: '', resolution_type: 'RELEASE_FREELANCER', refund_amount: '', release_amount: ''
  });

  useEffect(() => { fetchDisputes(); }, []);

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchDispute(id);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    clearMessages();
    const data = { ...resolveForm };
    if (!data.refund_amount) delete data.refund_amount;
    if (!data.release_amount) delete data.release_amount;
    const res = await resolveDispute(showResolve, data);
    if (res) {
      setShowResolve(null);
      fetchDisputes();
    }
  };

  const navigate = useNavigate();
  const d = disputeDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} /> Nizolar boshqaruvi
          </h1>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#ef4444' }} /></div>
      ) : disputes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><AlertTriangle size={48} /></div>
          <h3>Nizolar yo'q</h3>
          <p>Hozircha hal qilinishi kerak bo'lgan nizo yo'q</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Tashabbuskor', 'Shartnoma', 'Summa', 'Holat', 'Sana', 'Amallar'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disputes.map((item, i) => (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                  onClick={() => openDetail(item.id)}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={14} style={{ color: '#64748b' }} />
                      {item.initiator_email || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>{item.contract_title || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
                    ${item.contract_amount || '0'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: `${statusColors[item.status] || '#64748b'}20`,
                      color: statusColors[item.status] || '#64748b',
                    }}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--secondary btn--sm" onClick={() => openDetail(item.id)}>
                        <Eye size={13} />
                      </button>
                      {(item.status === 'OPEN' || item.status === 'UNDER_REVIEW') && (
                        <button className="btn btn--primary btn--sm" onClick={() => { setShowResolve(item.id); clearMessages(); }}>
                          <Gavel size={13} /> Hal qilish
                        </button>
                      )}
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
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title"><Eye size={18} style={{ color: '#ef4444' }} /> Nizo tafsiloti</h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#ef4444' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ padding: 16, background: 'rgba(239,68,68,0.06)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.15)', marginBottom: 16, lineHeight: 2.2 }}>
                    <div>👤 <strong>Tashabbuskor:</strong> {d.initiator_email}</div>
                    <div>📋 <strong>Shartnoma:</strong> {d.contract_title}</div>
                    <div>💰 <strong>Summa:</strong> ${d.contract_amount}</div>
                    <div>📊 <strong>Holat:</strong> {statusLabels[d.status] || d.status}</div>
                    <div>📅 <strong>Vaqt:</strong> {new Date(d.created_at).toLocaleString('ru-RU')}</div>
                    {d.resolution && <div>⚖️ <strong>Qaror:</strong> {d.resolution}</div>}
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>SABAB:</div>
                    <p style={{ margin: 0, lineHeight: 1.7, color: '#e2e8f0' }}>{d.reason}</p>
                  </div>
                  {d.evidences?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>DALILLAR ({d.evidences.length}):</div>
                      {d.evidences.map((ev) => (
                        <div key={ev.id} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                          <div>📎 <strong>{ev.uploader_email}</strong></div>
                          {ev.description && <div style={{ color: '#94a3b8' }}>{ev.description}</div>}
                          {ev.file && <a href={ev.file} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontSize: 12 }}>Faylni ko'rish →</a>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolve modal */}
      <AnimatePresence>
        {showResolve && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResolve(null)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title"><Gavel size={18} style={{ color: '#f59e0b' }} /> Nizoni hal qilish</h3>
                <button onClick={() => setShowResolve(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleResolve}>
                <div className="form-group">
                  <label className="form-label">Qaror turi</label>
                  <select className="form-input" value={resolveForm.resolution_type}
                    onChange={(e) => setResolveForm({ ...resolveForm, resolution_type: e.target.value })}>
                    <option value="RELEASE_FREELANCER">Frilanserga 100% berish</option>
                    <option value="REFUND_CLIENT">Mijozga 100% qaytarish</option>
                    <option value="SPLIT">Bo'lib berish</option>
                  </select>
                </div>
                {resolveForm.resolution_type === 'SPLIT' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Mijozga qaytarish ($)</label>
                      <input className="form-input" type="number" value={resolveForm.refund_amount}
                        onChange={(e) => setResolveForm({ ...resolveForm, refund_amount: e.target.value })} placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Frilanserga berish ($)</label>
                      <input className="form-input" type="number" value={resolveForm.release_amount}
                        onChange={(e) => setResolveForm({ ...resolveForm, release_amount: e.target.value })} placeholder="0" />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Admin izohi</label>
                  <textarea className="form-input" rows={3} required value={resolveForm.admin_comment}
                    onChange={(e) => setResolveForm({ ...resolveForm, admin_comment: e.target.value })}
                    placeholder="Qaror asosi..." />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Hukm chiqarish'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
