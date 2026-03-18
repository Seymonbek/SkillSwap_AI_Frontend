import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '../store/portfolioStore';
import { FolderOpen, Plus, Loader2, Trash2, X, ChevronLeft, Edit3, Eye, ExternalLink } from 'lucide-react';

export default function Portfolio() {
  const {
    items, itemDetail, isLoading, error,
    fetchPortfolio, fetchPortfolioItem, createPortfolioItem, updatePortfolioItem, deletePortfolioItem
  } = usePortfolioStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', project_url: '', image_url: '', technologies: '' });
  const [editForm, setEditForm] = useState({ title: '', description: '', project_url: '', image_url: '', technologies: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => { fetchPortfolio(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { title: form.title, description: form.description };
    if (form.project_url) payload.project_url = form.project_url;
    if (form.image_url) payload.image_url = form.image_url;
    if (form.technologies) payload.technologies = form.technologies.split(',').map(s => s.trim());
    const ok = await createPortfolioItem(payload);
    if (ok) {
      setShowCreate(false);
      setForm({ title: '', description: '', project_url: '', image_url: '', technologies: '' });
    }
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchPortfolioItem(id);
  };

  const openEdit = (item) => {
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      project_url: item.project_url || '',
      image_url: item.image_url || '',
      technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : (item.technologies || ''),
    });
    setShowEdit(item.id);
    setEditSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    const payload = {
      title: editForm.title,
      description: editForm.description,
    };
    if (editForm.project_url) payload.project_url = editForm.project_url;
    if (editForm.image_url) payload.image_url = editForm.image_url;
    if (editForm.technologies) payload.technologies = editForm.technologies.split(',').map(s => s.trim());
    const ok = await updatePortfolioItem(showEdit, payload);
    setEditLoading(false);
    if (ok) {
      setEditSuccess('Muvaffaqiyatli yangilandi!');
      setTimeout(() => { setShowEdit(null); setEditSuccess(''); }, 1200);
    }
  };

  const navigate = useNavigate();
  const d = itemDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={24} style={{ color: '#ec4899' }} /> Portfolio
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Yangi loyiha
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#ec4899' }} /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={48} /></div>
          <h3>Portfolio bo'sh</h3>
          <p>O'z loyihalaringizni qo'shib portfolioingizni yarating</p>
        </div>
      ) : (
        <div className="grid-2">
          {items.map((item, i) => (
            <motion.div key={item.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ cursor: 'pointer' }} onClick={() => openDetail(item.id)}>
              {item.image_url && (
                <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', height: 160, background: 'rgba(0,0,0,0.3)' }}>
                  <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <h4 style={{ margin: '0 0 8px', color: 'white', fontSize: 16 }}>{item.title}</h4>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>
                {item.description?.slice(0, 120)}{item.description?.length > 120 ? '...' : ''}
              </p>
              {item.technologies && Array.isArray(item.technologies) && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {item.technologies.slice(0, 5).map((t, j) => (
                    <span key={j} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(236,72,153,0.15)', color: '#f472b6'
                    }}>{t}</span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                {item.project_url && (
                  <a href={item.project_url} target="_blank" rel="noreferrer" className="btn btn--secondary btn--sm">
                    <ExternalLink size={14} /> Ko'rish
                  </a>
                )}
                <button className="btn btn--secondary btn--sm" onClick={() => openEdit(item)}>
                  <Edit3 size={14} /> Tahrirlash
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => deletePortfolioItem(item.id)}>
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
                <h3 className="modal-title">Yangi portfolio loyiha</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Sarlavha</label>
                  <input className="form-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Loyiha sarlavhasi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tavsif</label>
                  <textarea className="form-textarea" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Loyiha haqida batafsil..." style={{ minHeight: 80 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Loyiha havolasi (ixtiyoriy)</label>
                  <input className="form-input" value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Rasm havolasi (ixtiyoriy)</label>
                  <input className="form-input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Texnologiyalar (vergul bilan)</label>
                  <input className="form-input" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="React, Django, PostgreSQL" />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Loyihani qo\'shish'}
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
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#ec4899' }} /> Loyiha tafsilotlari
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#ec4899' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  {d.image_url && (
                    <div style={{ borderRadius: 12, overflow: 'hidden', height: 200, marginBottom: 16, background: 'rgba(0,0,0,0.3)' }}>
                      <img src={d.image_url} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <h3 style={{ margin: '0 0 12px', color: 'white', fontSize: 20 }}>{d.title}</h3>
                  <div style={{ padding: 16, background: 'rgba(236,72,153,0.06)', borderRadius: 12, border: '1px solid rgba(236,72,153,0.15)', marginBottom: 16 }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#e2e8f0' }}>{d.description}</p>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', lineHeight: 2.2, marginBottom: 16 }}>
                    {d.project_url && <div>🔗 <strong>Havola:</strong> <a href={d.project_url} target="_blank" rel="noreferrer" style={{ color: '#ec4899' }}>{d.project_url}</a></div>}
                    {d.technologies && Array.isArray(d.technologies) && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                        {d.technologies.map((t, j) => (
                          <span key={j} style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 6,
                            background: 'rgba(236,72,153,0.15)', color: '#f472b6'
                          }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                    {d.created_at && <span>📅 Yaratilgan: {new Date(d.created_at).toLocaleDateString('ru-RU')}</span>}
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
                  <Edit3 size={18} style={{ color: '#f59e0b' }} /> Loyihani tahrirlash
                </h3>
                <button onClick={() => setShowEdit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {editSuccess && <div className="success-msg">{editSuccess}</div>}
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Sarlavha</label>
                  <input className="form-input" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tavsif</label>
                  <textarea className="form-textarea" required value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} style={{ minHeight: 80 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Loyiha havolasi</label>
                  <input className="form-input" value={editForm.project_url} onChange={(e) => setEditForm({ ...editForm, project_url: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rasm havolasi</label>
                  <input className="form-input" value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Texnologiyalar</label>
                  <input className="form-input" value={editForm.technologies} onChange={(e) => setEditForm({ ...editForm, technologies: e.target.value })} />
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
