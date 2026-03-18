import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFreelanceStore } from '../store/freelanceStore';
import { Wallet, Plus, Loader2, Trash2, Lock, Unlock, X, ChevronLeft, Edit3, Eye } from 'lucide-react';

export default function Milestones() {
  const {
    milestones, milestoneDetail, isLoading, error,
    fetchMilestones, fetchMilestone, createMilestone, updateMilestone,
    fundMilestone, releaseMilestone, deleteMilestone
  } = useFreelanceStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ title: '', amount: '', due_date: '' });
  const [editForm, setEditForm] = useState({ title: '', amount: '', due_date: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => { fetchMilestones(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await createMilestone({ title: form.title, amount: form.amount, due_date: form.due_date });
    if (ok) {
      setShowCreate(false);
      setForm({ title: '', amount: '', due_date: '' });
    }
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchMilestone(id);
  };

  const openEdit = (m) => {
    setEditForm({
      title: m.title || '',
      amount: m.amount || '',
      due_date: m.due_date || '',
    });
    setShowEdit(m.id);
    setEditSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    const ok = await updateMilestone(showEdit, {
      title: editForm.title,
      amount: editForm.amount,
      due_date: editForm.due_date,
    });
    setEditLoading(false);
    if (ok) {
      setEditSuccess('Muvaffaqiyatli yangilandi!');
      setTimeout(() => { setShowEdit(null); setEditSuccess(''); }, 1200);
    }
  };

  const statusLabel = { PENDING: 'Kutilmoqda', FUNDED: 'Muzlatilgan', COMPLETED: "To'langan" };
  const navigate = useNavigate();
  const d = milestoneDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wallet size={24} style={{ color: '#f59e0b' }} /> Bosqichlar (Milestones)
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Yangi bosqich
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#f59e0b' }} /></div>
      ) : milestones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Wallet size={48} /></div>
          <h3>Bosqichlar yo'q</h3>
          <p>To'lov bosqichlari (Escrow) shu yerda paydo bo'ladi</p>
        </div>
      ) : (
        <div className="grid-2">
          {milestones.map((m, i) => (
            <motion.div key={m.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ cursor: 'pointer' }} onClick={() => openDetail(m.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ margin: 0, color: 'white', fontSize: 15 }}>{m.title}</h4>
                <span className={`badge badge--${(m.status || 'pending').toLowerCase()}`}>{statusLabel[m.status] || m.status}</span>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 2 }}>
                <div>💰 Summa: <span style={{ color: 'white', fontWeight: 600 }}>${m.amount}</span></div>
                {m.due_date && <div>📅 Muddat: {new Date(m.due_date).toLocaleDateString('ru-RU')}</div>}
                {m.contract && <div>📋 Shartnoma: <span style={{ fontSize: 11, color: '#64748b' }}>{m.contract}</span></div>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                {m.status === 'PENDING' && (
                  <button className="btn btn--primary btn--sm" onClick={() => fundMilestone(m.id)}>
                    <Lock size={14} /> Muzlatish (Fund)
                  </button>
                )}
                {m.status === 'FUNDED' && (
                  <button className="btn btn--sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }} onClick={() => releaseMilestone(m.id)}>
                    <Unlock size={14} /> To'lash (Release)
                  </button>
                )}
                <button className="btn btn--secondary btn--sm" onClick={() => openEdit(m)}>
                  <Edit3 size={14} /> Tahrirlash
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => deleteMilestone(m.id)}><Trash2 size={14} /></button>
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
                <h3 className="modal-title">Yangi bosqich</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Bosqich nomi</label>
                  <input className="form-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masalan: Dizayn qismi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Summa ($)</label>
                  <input className="form-input" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Muddat</label>
                  <input className="form-input" type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }}>Bosqich yaratish</button>
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
                  <Eye size={18} style={{ color: '#f59e0b' }} /> Bosqich tafsilotlari
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#f59e0b' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>ID: {d.id}</span>
                    <span className={`badge badge--${(d.status || 'pending').toLowerCase()}`}>{statusLabel[d.status] || d.status}</span>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(245,158,11,0.06)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.15)', marginBottom: 16 }}>
                    <h3 style={{ margin: '0 0 12px', color: 'white', fontSize: 18 }}>{d.title}</h3>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>${d.amount}</div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, lineHeight: 2.2 }}>
                    {d.due_date && <div>📅 <strong>Muddat:</strong> {new Date(d.due_date).toLocaleDateString('ru-RU')}</div>}
                    {d.contract && <div>📋 <strong>Shartnoma:</strong> {d.contract}</div>}
                    {d.description && <div>📝 <strong>Tavsif:</strong> {d.description}</div>}
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
                  <Edit3 size={18} style={{ color: '#f59e0b' }} /> Bosqichni tahrirlash
                </h3>
                <button onClick={() => setShowEdit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {editSuccess && <div className="success-msg">{editSuccess}</div>}
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Bosqich nomi</label>
                  <input className="form-input" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Summa ($)</label>
                  <input className="form-input" type="number" step="0.01" required value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Muddat</label>
                  <input className="form-input" type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
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
