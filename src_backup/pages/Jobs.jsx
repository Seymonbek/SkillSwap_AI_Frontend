import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFreelanceStore } from '../store/freelanceStore';
import { SkeletonCard } from '../components/Skeleton';
import { ErrorDisplay, SuccessDisplay, FieldError } from '../components/ErrorDisplay';
import { validators, validateForm, getFirstError } from '../utils/validators';
import { Briefcase, Plus, Loader2, Trash2, Edit, X, DollarSign, Calendar, ChevronLeft, Eye, CheckCircle } from 'lucide-react';

export default function Jobs() {
  const { jobs, jobDetail, isLoading, error, fetchJobs, fetchJob, createJob, updateJob, deleteJob } = useFreelanceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', budget: '', deadline: '', required_skills: '' });

  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [localSuccess, setLocalSuccess] = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', budget: '', deadline: '', required_skills: '' });
    setFormErrors({});
    setFormTouched({});
  };

  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case 'title':
        error = validators.minLength(value, 5, 'Sarlavha');
        break;
      case 'description':
        error = validators.minLength(value, 20, 'Tavsif');
        break;
      case 'budget':
        error = validators.budget(value);
        break;
      case 'deadline':
        error = validators.deadline(value);
        break;
      default:
        break;
    }
    return error;
  };

  const handleFieldChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setFormTouched({ ...formTouched, [field]: true });
    const error = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: error });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Validate all fields
    const touched = { title: true, description: true, budget: true, deadline: true };
    setFormTouched(touched);

    const errors = validateForm({
      title: () => validators.minLength(form.title, 5, 'Sarlavha'),
      description: () => validators.minLength(form.description, 20, 'Tavsif'),
      budget: () => form.budget ? validators.budget(form.budget) : null,
      deadline: () => form.deadline ? validators.deadline(form.deadline) : null
    });

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = { ...form };
    if (payload.budget) payload.budget = payload.budget;
    if (!payload.deadline) delete payload.deadline;
    if (payload.required_skills) payload.required_skills = payload.required_skills.split(',').map(s => s.trim()).filter(s => s);
    else delete payload.required_skills;
    payload.status = 'OPEN';

    const ok = editJob
      ? await updateJob(editJob.id, payload)
      : await createJob(payload);
    if (ok) {
      setLocalSuccess(editJob ? 'Loyiha muvaffaqiyatli yangilandi!' : 'Yangi loyiha yaratildi!');
      setShowCreate(false);
      setEditJob(null);
      resetForm();
      setTimeout(() => setLocalSuccess(null), 3000);
    }
  };

  const openEdit = (job) => {
    setEditJob(job);
    setForm({
      title: job.title || '',
      description: job.description || '',
      budget: job.budget || '',
      deadline: job.deadline || '',
      required_skills: Array.isArray(job.required_skills) ? job.required_skills.join(', ') : '',
    });
    setShowCreate(true);
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchJob(id);
  };

  const navigate = useNavigate();
  const d = jobDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase size={24} style={{ color: '#3b82f6' }} /> Loyihalar va Vakansiyalar
          </h1>
        </div>
        <button className="btn btn--primary" onClick={() => { resetForm(); setEditJob(null); setShowCreate(true); }}>
          <Plus size={16} /> Loyiha yaratish
        </button>
      </div>

      <ErrorDisplay error={error} onClose={() => useFreelanceStore.setState({ error: null })} />
      <SuccessDisplay success={localSuccess} onClose={() => setLocalSuccess(null)} />

      {isLoading ? (
        <SkeletonCard count={4} />
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Briefcase size={48} /></div>
          <h3>Loyihalar yo'q</h3>
          <p>Birinchi loyiha yoki vakansiyani yarating</p>
        </div>
      ) : (
        <div className="grid-2">
          {jobs.map((job, i) => (
            <motion.div key={job.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ cursor: 'pointer' }} onClick={() => openDetail(job.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ margin: 0, color: 'white', fontSize: 16 }}>{job.title}</h4>
                <span className={`badge badge--${(job.status || 'pending').toLowerCase()}`}>{job.status || 'OPEN'}</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: '8px 0' }}>{job.description?.slice(0, 150)}{job.description?.length > 150 ? '...' : ''}</p>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 2 }}>
                {job.budget && <div><DollarSign size={12} style={{ display: 'inline' }} /> Byudjet: ${job.budget}</div>}
                {job.deadline && <div><Calendar size={12} style={{ display: 'inline' }} /> Dedlayn: {new Date(job.deadline).toLocaleDateString('ru-RU')}</div>}
                {job.client_detail && <div>👤 Mijoz: {job.client_detail.first_name || job.client_detail.email}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn--secondary btn--sm" onClick={() => openEdit(job)}><Edit size={14} /> Tahrirlash</button>
                <button className="btn btn--danger btn--sm" onClick={() => deleteJob(job.id)}><Trash2 size={14} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowCreate(false); setEditJob(null); }}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title">{editJob ? 'Loyihani tahrirlash' : 'Yangi loyiha'}</h3>
                <button onClick={() => { setShowCreate(false); setEditJob(null); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Sarlavha *</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Loyiha sarlavhasi (kamida 5 ta belgi)"
                    style={formErrors.title && formTouched.title ? { borderColor: '#ef4444' } : {}}
                  />
                  <FieldError error={formTouched.title && formErrors.title} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tavsif (TZ) *</label>
                  <textarea
                    className="form-textarea"
                    value={form.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Batafsil tavsif (kamida 20 ta belgi)..."
                    style={{ minHeight: 100, ...(formErrors.description && formTouched.description ? { borderColor: '#ef4444' } : {}) }}
                  />
                  <FieldError error={formTouched.description && formErrors.description} />
                </div>
                <div className="form-group">
                  <label className="form-label">Byudjet ($)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="5"
                    max="1000000"
                    value={form.budget}
                    onChange={(e) => handleFieldChange('budget', e.target.value)}
                    placeholder="1000.00"
                    style={formErrors.budget && formTouched.budget ? { borderColor: '#ef4444' } : {}}
                  />
                  <FieldError error={formTouched.budget && formErrors.budget} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dedlayn</label>
                  <input
                    className="form-input"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.deadline}
                    onChange={(e) => handleFieldChange('deadline', e.target.value)}
                    style={formErrors.deadline && formTouched.deadline ? { borderColor: '#ef4444' } : {}}
                  />
                  <FieldError error={formTouched.deadline && formErrors.deadline} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ko'nikmalar (vergul bilan)</label>
                  <input
                    className="form-input"
                    value={form.required_skills}
                    onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
                    placeholder="Python, Django, React"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={isLoading || Object.values(formErrors).some(e => e)}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (editJob ? 'Saqlash' : 'Loyiha yaratish')}
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
                  <Eye size={18} style={{ color: '#3b82f6' }} /> Loyiha tafsilotlari
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#3b82f6' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>ID: {d.id}</span>
                    <span className={`badge badge--${(d.status || 'open').toLowerCase()}`}>{d.status || 'OPEN'}</span>
                  </div>
                  <h3 style={{ margin: '0 0 12px', color: 'white', fontSize: 20 }}>{d.title}</h3>
                  <div style={{ padding: 16, background: 'rgba(59,130,246,0.06)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.15)', marginBottom: 16 }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{d.description}</p>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, lineHeight: 2.2 }}>
                    {d.budget && <div>💰 <strong>Byudjet:</strong> ${d.budget}</div>}
                    {d.deadline && <div>📅 <strong>Dedlayn:</strong> {new Date(d.deadline).toLocaleDateString('ru-RU')}</div>}
                    {d.client_detail && <div>👤 <strong>Mijoz:</strong> {d.client_detail.first_name || d.client_detail.email}</div>}
                    {d.required_skills && <div>🛠 <strong>Ko'nikmalar:</strong> {Array.isArray(d.required_skills) ? d.required_skills.join(', ') : d.required_skills}</div>}
                    {d.proposals_count !== undefined && <div>📝 <strong>Takliflar soni:</strong> {d.proposals_count}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                    <span>📅 Yaratilgan: {new Date(d.created_at).toLocaleDateString('ru-RU')}</span>
                    {d.updated_at && <span>🔄 Yangilangan: {new Date(d.updated_at).toLocaleDateString('ru-RU')}</span>}
                  </div>
                  <button
                    className="btn btn--primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      navigate('/proposals', { state: { jobId: d.id } });
                    }}
                  >
                    Taklif yuborish
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
