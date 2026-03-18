import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useModerationStore } from '../store/moderationStore';
import { BadgeCheck, Loader2, ChevronLeft, X, Eye, Check, XCircle, User, FileImage } from 'lucide-react';

const statusColors = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };
const statusLabels = { PENDING: 'Kutilmoqda', APPROVED: 'Tasdiqlangan', REJECTED: 'Rad etilgan' };

export default function AdminKYC() {
  const {
    kycList, kycDetail, isLoading, error, success,
    fetchKycList, fetchKycDetail, reviewKyc, clearMessages
  } = useModerationStore();

  const [showDetail, setShowDetail] = useState(false);
  const [showReview, setShowReview] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => { fetchKycList(); }, []);

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchKycDetail(id);
  };

  const handleReview = async (action) => {
    clearMessages();
    const data = { action };
    if (action === 'REJECT' && rejectionReason) data.rejection_reason = rejectionReason;
    const res = await reviewKyc(showReview, data);
    if (res) {
      setShowReview(null);
      setRejectionReason('');
      fetchKycList();
    }
  };

  const navigate = useNavigate();
  const d = kycDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BadgeCheck size={24} style={{ color: '#06b6d4' }} /> KYC so'rovlar
          </h1>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#06b6d4' }} /></div>
      ) : kycList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BadgeCheck size={48} /></div>
          <h3>KYC so'rovlar yo'q</h3>
          <p>Hozircha ko'rib chiqilishi kerak bo'lgan so'rov yo'q</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Foydalanuvchi', 'Holat', 'Sana', 'Hujjat', 'Selfie', 'Amallar'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kycList.map((item, i) => (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={14} style={{ color: '#64748b' }} />
                      {item.user_email || '—'}
                    </div>
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
                  <td style={{ padding: '12px 16px' }}>
                    {item.document_photo ? (
                      <a href={item.document_photo} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileImage size={14} /> Ko'rish
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {item.selfie_photo ? (
                      <a href={item.selfie_photo} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileImage size={14} /> Ko'rish
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--secondary btn--sm" onClick={() => openDetail(item.id)}>
                        <Eye size={13} />
                      </button>
                      {item.status === 'PENDING' && (
                        <>
                          <button className="btn btn--sm" style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                            onClick={() => { setShowReview(item.id); clearMessages(); }}>
                            <Check size={13} />
                          </button>
                          <button className="btn btn--danger btn--sm" onClick={() => { setShowReview(item.id); clearMessages(); }}>
                            <XCircle size={13} />
                          </button>
                        </>
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
                <h3 className="modal-title"><Eye size={18} style={{ color: '#06b6d4' }} /> KYC tafsiloti</h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#06b6d4' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ padding: 16, background: 'rgba(6,182,212,0.06)', borderRadius: 12, border: '1px solid rgba(6,182,212,0.15)', marginBottom: 16, lineHeight: 2.2 }}>
                    <div>👤 <strong>Email:</strong> {d.user_email}</div>
                    <div>📊 <strong>Holat:</strong> {statusLabels[d.status] || d.status}</div>
                    <div>📅 <strong>Yuborilgan:</strong> {new Date(d.created_at).toLocaleString('ru-RU')}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {d.document_photo && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>📄 Hujjat</div>
                        <img src={d.document_photo} alt="Document" style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    )}
                    {d.selfie_photo && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>🤳 Selfie</div>
                        <img src={d.selfie_photo} alt="Selfie" style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review modal */}
      <AnimatePresence>
        {showReview && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReview(null)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className="modal-title"><BadgeCheck size={18} style={{ color: '#06b6d4' }} /> KYC ni ko'rib chiqish</h3>
                <button onClick={() => setShowReview(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div className="form-group">
                <label className="form-label">Rad etish sababi (ixtiyoriy)</label>
                <textarea className="form-input" rows={3} value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Hujjat noaniq, qayta yuklang..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn btn--danger" style={{ flex: 1 }} onClick={() => handleReview('REJECT')} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><XCircle size={16} /> Rad etish</>}
                </button>
                <button className="btn btn--primary" style={{ flex: 1, background: '#10b981' }} onClick={() => handleReview('APPROVE')} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> Tasdiqlash</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
