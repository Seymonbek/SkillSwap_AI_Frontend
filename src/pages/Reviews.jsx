import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReviewStore } from '../store/reviewStore';
import { Star, Plus, Loader2, Trash2, X, ChevronLeft, Edit3, Eye } from 'lucide-react';

const StarRating = ({ rating, onRate, size = 18, interactive = false }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        fill={s <= rating ? '#f59e0b' : 'transparent'}
        color={s <= rating ? '#f59e0b' : '#475569'}
        style={{ cursor: interactive ? 'pointer' : 'default' }}
        onClick={() => interactive && onRate?.(s)}
      />
    ))}
  </div>
);

export default function Reviews() {
  const {
    reviews, reviewDetail, isLoading, error,
    fetchReviews, fetchReview, createReview, updateReview, deleteReview
  } = useReviewStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ reviewee: '', rating: 5, comment: '' });
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => { fetchReviews(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await createReview({ reviewee: Number(form.reviewee), rating: form.rating, comment: form.comment });
    if (ok) {
      setShowCreate(false);
      setForm({ reviewee: '', rating: 5, comment: '' });
    }
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchReview(id);
  };

  const openEdit = (item) => {
    setEditForm({ rating: item.rating || 5, comment: item.comment || '' });
    setShowEdit(item.id);
    setEditSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    const ok = await updateReview(showEdit, { rating: editForm.rating, comment: editForm.comment });
    setEditLoading(false);
    if (ok) {
      setEditSuccess('Muvaffaqiyatli yangilandi!');
      setTimeout(() => { setShowEdit(null); setEditSuccess(''); }, 1200);
    }
  };

  const navigate = useNavigate();
  const d = reviewDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star size={24} style={{ color: '#f59e0b' }} /> Izohlar va Baholar
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Izoh qoldirish
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#f59e0b' }} /></div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Star size={48} /></div>
          <h3>Izohlar yo'q</h3>
          <p>Foydalanuvchilarga izoh qoldirib, ishonch tizimini yarating</p>
        </div>
      ) : (
        <div className="grid-2">
          {reviews.map((item, i) => (
            <motion.div key={item.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ cursor: 'pointer' }} onClick={() => openDetail(item.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 16
                  }}>
                    {(item.reviewee_detail?.first_name || item.reviewee_detail?.email || '?')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
                      {item.reviewee_detail?.first_name
                        ? `${item.reviewee_detail.first_name} ${item.reviewee_detail.last_name || ''}`
                        : item.reviewee_detail?.email || `Foydalanuvchi #${item.reviewee}`}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : ''}
                    </div>
                  </div>
                </div>
                <StarRating rating={item.rating || 0} />
              </div>

              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: '8px 0 12px' }}>
                {item.comment?.slice(0, 150)}{item.comment?.length > 150 ? '...' : ''}
              </p>

              <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn--secondary btn--sm" onClick={() => openEdit(item)}>
                  <Edit3 size={14} /> Tahrirlash
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => deleteReview(item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={18} style={{ color: '#f59e0b' }} /> Yangi izoh
                </h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Foydalanuvchi ID</label>
                  <input className="form-input" required type="number" value={form.reviewee} onChange={(e) => setForm({ ...form, reviewee: e.target.value })} placeholder="Foydalanuvchi IDsi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Baho</label>
                  <StarRating rating={form.rating} onRate={(r) => setForm({ ...form, rating: r })} size={28} interactive />
                </div>
                <div className="form-group">
                  <label className="form-label">Izoh matni</label>
                  <textarea className="form-textarea" required value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Izohingizni yozing..." style={{ minHeight: 80 }} />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Izoh qoldirish'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#f59e0b' }} /> Izoh tafsilotlari
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#f59e0b' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 20
                    }}>
                      {(d.reviewee_detail?.first_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>
                        {d.reviewee_detail?.first_name
                          ? `${d.reviewee_detail.first_name} ${d.reviewee_detail.last_name || ''}`
                          : d.reviewee_detail?.email || `Foydalanuvchi #${d.reviewee}`}
                      </div>
                      <StarRating rating={d.rating || 0} />
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(245,158,11,0.06)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.15)', marginBottom: 16 }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#e2e8f0' }}>{d.comment || "Izoh matni yo'q"}</p>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', lineHeight: 2.2 }}>
                    <div>⭐ <strong>Baho:</strong> {d.rating}/5</div>
                    {d.reviewer_detail && <div>👤 <strong>Kim yozdi:</strong> {d.reviewer_detail.first_name || d.reviewer_detail.email}</div>}
                    {d.created_at && <div>📅 <strong>Sana:</strong> {new Date(d.created_at).toLocaleString('ru-RU')}</div>}
                    {d.updated_at && <div>🔄 <strong>Yangilangan:</strong> {new Date(d.updated_at).toLocaleString('ru-RU')}</div>}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEdit(null)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Edit3 size={18} style={{ color: '#f59e0b' }} /> Izohni tahrirlash
                </h3>
                <button onClick={() => setShowEdit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {editSuccess && <div className="success-msg">{editSuccess}</div>}
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Baho</label>
                  <StarRating rating={editForm.rating} onRate={(r) => setEditForm({ ...editForm, rating: r })} size={28} interactive />
                </div>
                <div className="form-group">
                  <label className="form-label">Izoh matni</label>
                  <textarea className="form-textarea" required value={editForm.comment} onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })} style={{ minHeight: 80 }} />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }} disabled={editLoading}>
                  {editLoading ? <Loader2 className="animate-spin" size={18} /> : 'Saqlash'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
