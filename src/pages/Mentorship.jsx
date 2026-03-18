import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMentorshipStore } from '../store/mentorshipStore';
import { Users, Plus, Loader2, Trash2, CheckCircle, Clock, X, ChevronLeft, Edit3, Eye } from 'lucide-react';

export default function Mentorship() {
  const {
    mentorships, mentorshipDetail, isLoading, error,
    fetchMentorships, fetchMentorship, createMentorship, updateMentorship,
    acceptMentorship, negotiateMentorship, deleteMentorship
  } = useMentorshipStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showNeg, setShowNeg] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(null);

  const [form, setForm] = useState({ mentor: '', message: '', duration_months: 3 });
  const [negForm, setNegForm] = useState({ proposed_schedule: '' });
  const [editForm, setEditForm] = useState({ message: '', duration_months: 3 });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => { fetchMentorships(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await createMentorship({
      mentor: parseInt(form.mentor),
      message: form.message,
      duration_months: parseInt(form.duration_months),
    });
    if (ok) {
      setShowCreate(false);
      setForm({ mentor: '', message: '', duration_months: 3 });
    }
  };

  const handleNeg = async (e) => {
    e.preventDefault();
    await negotiateMentorship(showNeg, { proposed_schedule: negForm.proposed_schedule });
    setShowNeg(null);
    setNegForm({ proposed_schedule: '' });
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchMentorship(id);
  };

  const openEdit = (m) => {
    setEditForm({ message: m.message || '', duration_months: m.duration_months || 3 });
    setShowEdit(m.id);
    setEditSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    const ok = await updateMentorship(showEdit, {
      message: editForm.message,
      duration_months: parseInt(editForm.duration_months),
    });
    setEditLoading(false);
    if (ok) {
      setEditSuccess('Muvaffaqiyatli yangilandi!');
      setTimeout(() => { setShowEdit(null); setEditSuccess(''); }, 1200);
    }
  };

  const navigate = useNavigate();
  const d = mentorshipDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} style={{ color: '#8b5cf6' }} /> Mentorlik
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Yangi so'rov
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#8b5cf6' }} /></div>
      ) : mentorships.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={48} /></div>
          <h3>So'rovlar yo'q</h3>
          <p>Birinchi mentorlik so'rovini yarating</p>
        </div>
      ) : (
        <div className="grid-2">
          {mentorships.map((m, i) => (
            <motion.div
              key={m.id}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ cursor: 'pointer' }}
              onClick={() => openDetail(m.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Mentor ID</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, color: 'white' }}>#{m.mentor}</p>
                </div>
                <span className={`badge badge--${m.status?.toLowerCase()}`}>{m.status}</span>
              </div>

              <p style={{ color: '#94a3b8', fontSize: 14, margin: '8px 0', lineHeight: 1.5 }}>{m.message}</p>

              {m.duration_months && (
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0' }}>
                  ⏱ Davomiyligi: {m.duration_months} oy.
                </p>
              )}

              <p style={{ fontSize: 11, color: '#475569', margin: '8px 0 12px' }}>
                Yaratilgan: {new Date(m.created_at).toLocaleDateString('ru-RU')}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                {m.status === 'PENDING' && (
                  <button className="btn btn--primary btn--sm" onClick={() => acceptMentorship(m.id)}>
                    <CheckCircle size={14} /> Qabul qilish
                  </button>
                )}
                {(m.status === 'PENDING' || m.status === 'NEGOTIATING') && (
                  <button className="btn btn--secondary btn--sm" onClick={() => setShowNeg(m.id)}>
                    <Clock size={14} /> Vaqtni kelishish
                  </button>
                )}
                <button className="btn btn--secondary btn--sm" onClick={() => openEdit(m)}>
                  <Edit3 size={14} /> Tahrirlash
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => deleteMentorship(m.id)}>
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
                <h3 className="modal-title">Yangi mentorlik so'rovi</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Mentor ID si</label>
                  <input className="form-input" type="number" required value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} placeholder="Mentor ID sini kiriting" />
                </div>
                <div className="form-group">
                  <label className="form-label">Xabar (Maqsad)</label>
                  <textarea className="form-textarea" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Maqsadlaringizni tasvirlab bering..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Davomiyligi (oy)</label>
                  <input className="form-input" type="number" min="1" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "So'rov yuborish"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Negotiate modal */}
      <AnimatePresence>
        {showNeg && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNeg(null)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title">Vaqtni kelishish</h3>
                <button onClick={() => setShowNeg(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleNeg}>
                <div className="form-group">
                  <label className="form-label">Taklif qilingan jadval</label>
                  <textarea className="form-textarea" required value={negForm.proposed_schedule} onChange={(e) => setNegForm({ proposed_schedule: e.target.value })} placeholder="Masalan: Du/Chor/Ju 18:00-19:00" />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>Yuborish</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowDetail(false); }}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#8b5cf6' }} /> Mentorlik tafsilotlari
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <Loader2 className="animate-spin" size={28} style={{ color: '#8b5cf6' }} />
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>ID: #{d.id}</span>
                    <span className={`badge badge--${d.status?.toLowerCase()}`}>{d.status}</span>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                    <div style={{ marginBottom: 8 }}>👨‍🏫 <strong>Mentor:</strong> #{d.mentor}</div>
                    <div style={{ marginBottom: 8 }}>👨‍🎓 <strong>O'quvchi:</strong> #{d.mentee || d.student || '—'}</div>
                    <div style={{ marginBottom: 8 }}>⏱ <strong>Davomiyligi:</strong> {d.duration_months || '—'} oy</div>
                    {d.proposed_schedule && <div style={{ marginBottom: 8 }}>📅 <strong>Jadval:</strong> {d.proposed_schedule}</div>}
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(139,92,246,0.06)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.15)', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600, marginBottom: 6 }}>Xabar</div>
                    <p style={{ margin: 0, color: '#e2e8f0' }}>{d.message || 'Xabar yo\'q'}</p>
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                    <span>📅 Yaratilgan: {new Date(d.created_at).toLocaleDateString('ru-RU')}</span>
                    {d.updated_at && <span>🔄 Yangilangan: {new Date(d.updated_at).toLocaleDateString('ru-RU')}</span>}
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
                  <Edit3 size={18} style={{ color: '#f59e0b' }} /> Mentorlikni tahrirlash
                </h3>
                <button onClick={() => setShowEdit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {editSuccess && <div className="success-msg">{editSuccess}</div>}

              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Xabar (Maqsad)</label>
                  <textarea className="form-textarea" required value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} placeholder="Maqsadlaringizni tasvirlab bering..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Davomiyligi (oy)</label>
                  <input className="form-input" type="number" min="1" value={editForm.duration_months} onChange={(e) => setEditForm({ ...editForm, duration_months: e.target.value })} />
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
