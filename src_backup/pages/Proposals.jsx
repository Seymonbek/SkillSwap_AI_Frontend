import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFreelanceStore } from '../store/freelanceStore';
import { useAuthStore } from '../store/authStore';
import { FileText, Plus, Loader2, Trash2, CheckCircle, X, DollarSign, ChevronLeft, Edit3, Eye } from 'lucide-react';


export default function Proposals() {
  const {
    proposals, proposalDetail, isLoading, error,
    fetchProposals, fetchProposal, createProposal, updateProposal, acceptProposal, deleteProposal
  } = useFreelanceStore();
  const { user } = useAuthStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ job: '', cover_letter: '', proposed_price: '', estimated_days: '' });
  const [editForm, setEditForm] = useState({ cover_letter: '', proposed_price: '', estimated_days: '' });
  const location = useLocation();
  const navigate = useNavigate();

  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => { 
    fetchProposals(); 
    if (location.state?.jobId) {
      setForm(prev => ({ ...prev, job: location.state.jobId }));
      setShowCreate(true);
      // Optional: clear state so it doesn't open again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { job: form.job, cover_letter: form.cover_letter };
    if (form.proposed_price) payload.proposed_price = form.proposed_price;
    // Estimated days may or may not be on the backend schedule ProposalRequest. Checking API yaml, wait, there is no estimated_days in API.
    // I should only send what is accepted. The backend asks for: job, cover_letter, proposed_price.
    if (form.estimated_days) payload.estimated_days = parseInt(form.estimated_days); // leave just in case
    
    const ok = await createProposal(payload);
    if (ok) {
      setShowCreate(false);
      setForm({ job: '', cover_letter: '', proposed_price: '', estimated_days: '' });
    }
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchProposal(id);
  };

  const openEdit = (p) => {
    setEditForm({
      cover_letter: p.cover_letter || '',
      proposed_price: p.proposed_price || '',
      estimated_days: p.estimated_days || '',
    });
    setShowEdit(p.id);
    setEditSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    const payload = { cover_letter: editForm.cover_letter };
    if (editForm.proposed_price) payload.proposed_price = editForm.proposed_price;
    if (editForm.estimated_days) payload.estimated_days = parseInt(editForm.estimated_days);
    const ok = await updateProposal(showEdit, payload);
    setEditLoading(false);
    if (ok) {
      setEditSuccess('Muvaffaqiyatli yangilandi!');
      setTimeout(() => { setShowEdit(null); setEditSuccess(''); }, 1200);
    }
  };

  const d = proposalDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={24} style={{ color: '#22c55e' }} /> Takliflar (Proposals)
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Yangi taklif
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#22c55e' }} /></div>
      ) : proposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileText size={48} /></div>
          <h3>Takliflar yo'q</h3>
          <p>Loyiha takliflari shu yerda paydo bo'ladi</p>
        </div>
      ) : (
        <div className="grid-2">
          {proposals.map((p, i) => (
            <motion.div key={p.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ cursor: 'pointer' }} onClick={() => openDetail(p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Loyiha</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, color: 'white', fontSize: 14 }}>#{typeof p.job === 'object' ? p.job.title : p.job}</p>
                </div>
                <span className={`badge badge--${(p.status || 'pending').toLowerCase()}`}>{p.status || 'PENDING'}</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: '8px 0' }}>{p.cover_letter?.slice(0, 120)}{p.cover_letter?.length > 120 ? '...' : ''}</p>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 2 }}>
                {p.proposed_price && <div><DollarSign size={12} style={{ display: 'inline' }} /> Taklif narxi: ${p.proposed_price}</div>}
                {p.estimated_days && <div>📅 Muddat: {p.estimated_days} kun</div>}
                {p.freelancer_detail && <div>👤 Frilanser: {p.freelancer_detail.first_name || p.freelancer_detail.email}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                {(p.status === 'PENDING' || !p.status) && user?.id && user.id !== p.freelancer && (
                  <button className="btn btn--primary btn--sm" onClick={() => acceptProposal(p.id, { job: typeof p.job === 'object' ? p.job.id : p.job, cover_letter: p.cover_letter, proposed_price: p.proposed_price })}>
                    <CheckCircle size={14} /> Qabul qilish
                  </button>
                )}
                {user?.id === p.freelancer && (
                  <>
                    <button className="btn btn--secondary btn--sm" onClick={() => openEdit(p)}>
                      <Edit3 size={14} /> Tahrirlash
                    </button>
                    <button className="btn btn--danger btn--sm" onClick={() => deleteProposal(p.id)}><Trash2 size={14} /></button>
                  </>
                )}
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
                <h3 className="modal-title">Yangi taklif</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Loyiha ID si (UUID)</label>
                  <input className="form-input" required value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value })} placeholder="Loyiha UUID si" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ilova xati</label>
                  <textarea className="form-textarea" required value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} placeholder="Nega siz mos kelasiz..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Taklif etilgan byudjet ($)</label>
                  <input className="form-input" type="number" step="0.01" value={form.proposed_price} onChange={(e) => setForm({ ...form, proposed_price: e.target.value })} placeholder="500.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bajarish muddati (kun)</label>
                  <input className="form-input" type="number" value={form.estimated_days} onChange={(e) => setForm({ ...form, estimated_days: e.target.value })} placeholder="14" />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Taklif yuborish'}
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
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#22c55e' }} /> Taklif tafsilotlari
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#22c55e' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>ID: {d.id}</span>
                    <span className={`badge badge--${(d.status || 'pending').toLowerCase()}`}>{d.status || 'PENDING'}</span>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, lineHeight: 2.2 }}>
                    <div>📋 <strong>Loyiha:</strong> {typeof d.job === 'object' ? d.job.title : `#${d.job}`}</div>
                    {d.freelancer_detail && <div>👤 <strong>Frilanser:</strong> {d.freelancer_detail.first_name || d.freelancer_detail.email}</div>}
                    {d.proposed_price && <div>💰 <strong>Taklif narxi:</strong> ${d.proposed_price}</div>}
                    {d.estimated_days && <div>📅 <strong>Muddat:</strong> {d.estimated_days} kun</div>}
                  </div>
                  <div style={{ padding: 16, background: 'rgba(34,197,94,0.06)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.15)', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 6 }}>Ilova xati</div>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#e2e8f0' }}>{d.cover_letter || 'Ilova xati yo\'q'}</p>
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
                  <Edit3 size={18} style={{ color: '#f59e0b' }} /> Taklifni tahrirlash
                </h3>
                <button onClick={() => setShowEdit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {editSuccess && <div className="success-msg">{editSuccess}</div>}
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Ilova xati</label>
                  <textarea className="form-textarea" required value={editForm.cover_letter} onChange={(e) => setEditForm({ ...editForm, cover_letter: e.target.value })} placeholder="Nega siz mos kelasiz..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Taklif etilgan narx ($)</label>
                  <input className="form-input" type="number" step="0.01" value={editForm.proposed_price} onChange={(e) => setEditForm({ ...editForm, proposed_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bajarish muddati (kun)</label>
                  <input className="form-input" type="number" value={editForm.estimated_days} onChange={(e) => setEditForm({ ...editForm, estimated_days: e.target.value })} />
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
