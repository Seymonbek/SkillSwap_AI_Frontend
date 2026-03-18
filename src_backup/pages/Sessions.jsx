import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { CalendarClock, Plus, Loader2, Trash2, X, ChevronLeft, Edit3, Eye } from 'lucide-react';

export default function Sessions() {
  const {
    sessions, sessionDetail, isLoading, error,
    fetchSessions, fetchSession, createSession, updateSession, deleteSession
  } = useSessionStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(null);

  const [form, setForm] = useState({ topic: '', scheduled_time: '', duration_minutes: 60, mentor: '' });
  const [editForm, setEditForm] = useState({ topic: '', scheduled_time: '', duration_minutes: 60 });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => { fetchSessions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await createSession({
      topic: form.topic,
      scheduled_time: new Date(form.scheduled_time).toISOString(),
      duration_minutes: parseInt(form.duration_minutes),
      mentor: parseInt(form.mentor),
    });
    if (ok) {
      setShowCreate(false);
      setForm({ topic: '', scheduled_time: '', duration_minutes: 60, mentor: '' });
    }
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchSession(id);
  };

  const openEdit = (s) => {
    const dt = s.scheduled_time ? new Date(s.scheduled_time) : null;
    let localDt = '';
    if (dt) {
      const offset = dt.getTimezoneOffset();
      const local = new Date(dt.getTime() - offset * 60000);
      localDt = local.toISOString().slice(0, 16);
    }
    setEditForm({
      topic: s.topic || '',
      scheduled_time: localDt,
      duration_minutes: s.duration_minutes || 60,
    });
    setShowEdit(s.id);
    setEditSuccess('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    const payload = {
      topic: editForm.topic,
      duration_minutes: parseInt(editForm.duration_minutes),
    };
    if (editForm.scheduled_time) {
      payload.scheduled_time = new Date(editForm.scheduled_time).toISOString();
    }
    const ok = await updateSession(showEdit, payload);
    setEditLoading(false);
    if (ok) {
      setEditSuccess('Muvaffaqiyatli yangilandi!');
      setTimeout(() => { setShowEdit(null); setEditSuccess(''); }, 1200);
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const navigate = useNavigate();
  const d = sessionDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarClock size={24} style={{ color: '#3b82f6' }} /> Sessiyalar
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Yangi sessiya
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#3b82f6' }} /></div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CalendarClock size={48} /></div>
          <h3>Sessiyalar yo'q</h3>
          <p>Mentor bilan birinchi barter sessiyasini yarating</p>
        </div>
      ) : (
        <div className="grid-2">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ cursor: 'pointer' }}
              onClick={() => openDetail(s.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ margin: 0, color: 'white', fontSize: 16 }}>{s.topic}</h4>
                <span className={`badge badge--${s.status?.toLowerCase()}`}>{s.status}</span>
              </div>

              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                <div>📅 {fmtDate(s.scheduled_time)}</div>
                <div>⏱ {s.duration_minutes || 60} daq.</div>
                <div>👨‍🏫 Mentor #{s.mentor} → Talaba #{s.student}</div>
                {s.token_cost && <div>🪙 Narxi: {s.token_cost} token</div>}
                {s.earned_tokens > 0 && <div>💰 Ishlab topilgan: {s.earned_tokens} token</div>}
              </div>

              <p style={{ fontSize: 11, color: '#475569', margin: '8px 0 12px' }}>
                Yaratilgan: {new Date(s.created_at).toLocaleDateString('ru-RU')}
              </p>

              <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn--secondary btn--sm" onClick={() => openEdit(s)}>
                  <Edit3 size={14} /> Tahrirlash
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => deleteSession(s.id)}>
                  <Trash2 size={14} /> O'chirish
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
                <h3 className="modal-title">Yangi sessiya</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Mavzu</label>
                  <input className="form-input" required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Sessiya mavzusi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sana va vaqt</label>
                  <input className="form-input" type="datetime-local" required value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Davomiyligi (daq.)</label>
                  <input className="form-input" type="number" min="15" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mentor ID si</label>
                  <input className="form-input" type="number" required value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} placeholder="Mentor ID si" />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 8 }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sessiya yaratish'}
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
                  <Eye size={18} style={{ color: '#3b82f6' }} /> Sessiya tafsilotlari
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <Loader2 className="animate-spin" size={28} style={{ color: '#3b82f6' }} />
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>ID: #{d.id}</span>
                    <span className={`badge badge--${d.status?.toLowerCase()}`}>{d.status}</span>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 12 }}>{d.topic}</div>
                    <div style={{ marginBottom: 8 }}>📅 <strong>Rejalashtirilgan:</strong> {fmtDate(d.scheduled_time)}</div>
                    <div style={{ marginBottom: 8 }}>⏱ <strong>Davomiyligi:</strong> {d.duration_minutes || 60} daqiqa</div>
                    <div style={{ marginBottom: 8 }}>👨‍🏫 <strong>Mentor:</strong> #{d.mentor}</div>
                    <div style={{ marginBottom: 8 }}>👨‍🎓 <strong>Talaba:</strong> #{d.student || '—'}</div>
                  </div>

                  {(d.token_cost || d.earned_tokens > 0) && (
                    <div style={{ padding: '16px', background: 'rgba(59,130,246,0.06)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.15)', marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginBottom: 6 }}>Moliyaviy ma'lumotlar</div>
                      {d.token_cost && <div>🪙 Narxi: {d.token_cost} token</div>}
                      {d.earned_tokens > 0 && <div>💰 Ishlab topilgan: {d.earned_tokens} token</div>}
                    </div>
                  )}

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
                  <Edit3 size={18} style={{ color: '#f59e0b' }} /> Sessiyani tahrirlash
                </h3>
                <button onClick={() => setShowEdit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {editSuccess && <div className="success-msg">{editSuccess}</div>}

              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Mavzu</label>
                  <input className="form-input" required value={editForm.topic} onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })} placeholder="Sessiya mavzusi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sana va vaqt</label>
                  <input className="form-input" type="datetime-local" value={editForm.scheduled_time} onChange={(e) => setEditForm({ ...editForm, scheduled_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Davomiyligi (daq.)</label>
                  <input className="form-input" type="number" min="15" value={editForm.duration_minutes} onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })} />
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
