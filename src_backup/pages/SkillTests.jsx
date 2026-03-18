import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSkillTestStore } from '../store/skillTestStore';
import { FlaskConical, Plus, Loader2, Trash2, X, ChevronLeft, Edit3, Eye, CheckCircle } from 'lucide-react';

export default function SkillTests() {
  const {
    tests, testDetail, isLoading, error,
    fetchTests, fetchTest, createTest, updateTest, deleteTest
  } = useSkillTestStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ skill: '', score: '', max_score: '100' });
  const [editForm, setEditForm] = useState({ skill: '', score: '', max_score: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => { fetchTests(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await createTest({ skill: form.skill, score: Number(form.score), max_score: Number(form.max_score) });
    if (ok) { setShowCreate(false); setForm({ skill: '', score: '', max_score: '100' }); }
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchTest(id);
  };

  const openEdit = (item) => {
    setEditForm({ skill: item.skill || '', score: String(item.score || ''), max_score: String(item.max_score || '100') });
    setShowEdit(item.id);
    setEditSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    const ok = await updateTest(showEdit, { skill: editForm.skill, score: Number(editForm.score), max_score: Number(editForm.max_score) });
    setEditLoading(false);
    if (ok) {
      setEditSuccess('Yangilandi!');
      setTimeout(() => { setShowEdit(null); setEditSuccess(''); }, 1200);
    }
  };

  const getScorePercent = (score, max) => max > 0 ? Math.round((score / max) * 100) : 0;
  const getScoreColor = (pct) => pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  const navigate = useNavigate();
  const d = testDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FlaskConical size={24} style={{ color: '#8b5cf6' }} /> Ko'nikma testlari
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Yangi test
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#8b5cf6' }} /></div>
      ) : tests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FlaskConical size={48} /></div>
          <h3>Testlar yo'q</h3>
          <p>Ko'nikmalaringizni baholang va natijalarni ko'rsating</p>
        </div>
      ) : (
        <div className="grid-2">
          {tests.map((item, i) => {
            const pct = getScorePercent(item.score, item.max_score);
            const col = getScoreColor(pct);
            return (
              <motion.div key={item.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ cursor: 'pointer' }} onClick={() => openDetail(item.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', color: 'white', fontSize: 16 }}>{item.skill || 'Test'}</h4>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : ''}
                    </div>
                  </div>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    border: `3px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: col,
                  }}>
                    {pct}%
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>

                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                  Natija: <strong style={{ color: 'white' }}>{item.score}</strong> / {item.max_score}
                </div>

                <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn--secondary btn--sm" onClick={() => openEdit(item)}>
                    <Edit3 size={14} /> Tahrirlash
                  </button>
                  <button className="btn btn--danger btn--sm" onClick={() => deleteTest(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title"><FlaskConical size={18} style={{ color: '#8b5cf6' }} /> Yangi test natijasi</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Ko'nikma nomi</label>
                  <input className="form-input" required value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} placeholder="React, Python, UI/UX..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Ball</label>
                  <input className="form-input" type="number" required min="0" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} placeholder="85" />
                </div>
                <div className="form-group">
                  <label className="form-label">Maksimal ball</label>
                  <input className="form-input" type="number" required min="1" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Saqlash'}
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
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title"><Eye size={18} style={{ color: '#8b5cf6' }} /> Test natijasi</h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#8b5cf6' }} /></div>
              ) : (() => {
                const pct = getScorePercent(d.score, d.max_score);
                const col = getScoreColor(pct);
                return (
                  <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{
                        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
                        border: `4px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 800, color: col,
                      }}>{pct}%</div>
                      <h3 style={{ color: 'white', margin: 0 }}>{d.skill}</h3>
                    </div>
                    <div style={{ padding: 16, background: 'rgba(139,92,246,0.06)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.15)', lineHeight: 2.2 }}>
                      <div>🎯 <strong>Ball:</strong> {d.score} / {d.max_score}</div>
                      <div>📊 <strong>Foiz:</strong> {pct}%</div>
                      <div>📋 <strong>Natija:</strong> {pct >= 80 ? "A'lo ⭐" : pct >= 50 ? "Yaxshi ✅" : "Qayta o'rganish kerak ⚠️"}</div>
                      {d.created_at && <div>📅 <strong>Sana:</strong> {new Date(d.created_at).toLocaleString('ru-RU')}</div>}
                    </div>
                  </div>
                );
              })()}
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
                <h3 className="modal-title"><Edit3 size={18} style={{ color: '#f59e0b' }} /> Test natijasini tahrirlash</h3>
                <button onClick={() => setShowEdit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {editSuccess && <div className="success-msg">{editSuccess}</div>}
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Ko'nikma</label>
                  <input className="form-input" required value={editForm.skill} onChange={(e) => setEditForm({ ...editForm, skill: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ball</label>
                  <input className="form-input" type="number" required min="0" value={editForm.score} onChange={(e) => setEditForm({ ...editForm, score: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Maksimal ball</label>
                  <input className="form-input" type="number" required min="1" value={editForm.max_score} onChange={(e) => setEditForm({ ...editForm, max_score: e.target.value })} />
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
