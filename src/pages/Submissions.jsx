import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFreelanceStore } from '../store/freelanceStore';
import { PackageCheck, Plus, Loader2, Trash2, CheckCircle, RotateCcw, X, ChevronLeft, Edit3, Eye } from 'lucide-react';

export default function Submissions() {
  const {
    submissions, submissionDetail, isLoading, error,
    fetchSubmissions, fetchSubmission, createSubmission, updateSubmission,
    approveSubmission, requestRevision, deleteSubmission
  } = useFreelanceStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ milestone: '', description: '', file_url: '' });
  const [editForm, setEditForm] = useState({ description: '', file_url: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => { fetchSubmissions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { milestone: form.milestone, description: form.description };
    if (form.file_url) payload.file_url = form.file_url;
    const ok = await createSubmission(payload);
    if (ok) {
      setShowCreate(false);
      setForm({ milestone: '', description: '', file_url: '' });
    }
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchSubmission(id);
  };

  const openEdit = (s) => {
    setEditForm({
      description: s.description || '',
      file_url: s.file_url || '',
    });
    setShowEdit(s.id);
    setEditSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    const payload = { description: editForm.description };
    if (editForm.file_url) payload.file_url = editForm.file_url;
    const ok = await updateSubmission(showEdit, payload);
    setEditLoading(false);
    if (ok) {
      setEditSuccess('Muvaffaqiyatli yangilandi!');
      setTimeout(() => { setShowEdit(null); setEditSuccess(''); }, 1200);
    }
  };

  const navigate = useNavigate();
  const d = submissionDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PackageCheck size={24} style={{ color: '#8b5cf6' }} /> Ishni topshirish (Submissions)
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Ishni topshirish
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#8b5cf6' }} /></div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><PackageCheck size={48} /></div>
          <h3>Topshiriqlar yo'q</h3>
          <p>Frilanser ishini topshiradi — mijoz qabul qiladi yoki qayta ishlashni so'raydi</p>
        </div>
      ) : (
        <div className="grid-2">
          {submissions.map((s, i) => (
            <motion.div key={s.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ cursor: 'pointer' }} onClick={() => openDetail(s.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ margin: 0, color: 'white', fontSize: 15 }}>Ishni topshirish</h4>
                <span className={`badge badge--${(s.status || 'pending').toLowerCase()}`}>{s.status || 'PENDING'}</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: '8px 0' }}>{s.description?.slice(0, 150)}</p>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 2 }}>
                {s.milestone && <div>📋 Bosqich: <span style={{ fontSize: 11 }}>{s.milestone}</span></div>}
                {s.freelancer_detail && <div>💻 Frilanser: {s.freelancer_detail.first_name || s.freelancer_detail.email}</div>}
                {s.file_url && <div>📎 <a href={s.file_url} target="_blank" rel="noreferrer" style={{ color: '#8b5cf6' }}>Biriktirilgan fayl</a></div>}
                {s.created_at && <div>📅 {new Date(s.created_at).toLocaleDateString('ru-RU')}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                {(s.status === 'PENDING' || s.status === 'SUBMITTED') && (
                  <>
                    <button className="btn btn--primary btn--sm" onClick={() => approveSubmission(s.id)}>
                      <CheckCircle size={14} /> Qabul qilish
                    </button>
                    <button className="btn btn--secondary btn--sm" onClick={() => requestRevision(s.id)}>
                      <RotateCcw size={14} /> Qayta ishlash
                    </button>
                  </>
                )}
                <button className="btn btn--secondary btn--sm" onClick={() => openEdit(s)}>
                  <Edit3 size={14} /> Tahrirlash
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => deleteSubmission(s.id)}><Trash2 size={14} /></button>
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
                <h3 className="modal-title">Ishni topshirish</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Bosqich ID si (Milestone UUID)</label>
                  <input className="form-input" required value={form.milestone} onChange={(e) => setForm({ ...form, milestone: e.target.value })} placeholder="Bosqich UUID si" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ish tavsifi</label>
                  <textarea className="form-textarea" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Nimalar qilindi..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Fayl havolasi (ixtiyoriy)</label>
                  <input className="form-input" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }}>Ishni topshirish</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#8b5cf6' }} /> Topshiriq tafsilotlari
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#8b5cf6' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>ID: {d.id}</span>
                    <span className={`badge badge--${(d.status || 'pending').toLowerCase()}`}>{d.status || 'PENDING'}</span>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(139,92,246,0.06)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.15)', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600, marginBottom: 6 }}>Ish tavsifi</div>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#e2e8f0' }}>{d.description || "Tavsif yo'q"}</p>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, lineHeight: 2.2 }}>
                    {d.milestone && <div>📋 <strong>Bosqich:</strong> {d.milestone}</div>}
                    {d.freelancer_detail && <div>💻 <strong>Frilanser:</strong> {d.freelancer_detail.first_name || d.freelancer_detail.email}</div>}
                    {d.file_url && <div>📎 <strong>Fayl:</strong> <a href={d.file_url} target="_blank" rel="noreferrer" style={{ color: '#8b5cf6' }}>{d.file_url}</a></div>}
                    {d.reviewer_comment && <div>💬 <strong>Izoh:</strong> {d.reviewer_comment}</div>}
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
                  <Edit3 size={18} style={{ color: '#f59e0b' }} /> Topshiriqni tahrirlash
                </h3>
                <button onClick={() => setShowEdit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {editSuccess && <div className="success-msg">{editSuccess}</div>}
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Ish tavsifi</label>
                  <textarea className="form-textarea" required value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Nimalar qilindi..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Fayl havolasi (ixtiyoriy)</label>
                  <input className="form-input" value={editForm.file_url} onChange={(e) => setEditForm({ ...editForm, file_url: e.target.value })} placeholder="https://..." />
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
