import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { freelanceService } from '@/shared/api';
import {
  Search, Plus, Briefcase, Clock, DollarSign,
  ChevronRight, Bookmark, Filter, X, CheckCircle2,
  Sparkles, Wand2, Loader2
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const JobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', budget: '', deadline: '', required_skills: '',
  });

  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => { fetchJobs(); }, [filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const res = await freelanceService.getJobs(params);
      setJobs(res.data.results || res.data || []);
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await freelanceService.generateJob({ prompt: aiPrompt });
      setCreateForm({
        title: res.data.title || '',
        description: res.data.description || '',
        budget: res.data.budget || '',
        deadline: res.data.deadline || '',
        required_skills: Array.isArray(res.data.required_skills) ? res.data.required_skills.join(', ') : res.data.required_skills || ''
      });
      setShowAIGenerate(false);
      setShowCreateModal(true);
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        ...createForm,
        budget: createForm.budget ? parseFloat(createForm.budget) : undefined,
        required_skills: createForm.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        status: 'OPEN',
      };

      await freelanceService.createJob(payload);
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', budget: '', deadline: '', required_skills: '' });
      fetchJobs();
    } catch (err) {
      console.error('Create job error:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filters = [
    { value: 'all', label: 'Hammasi', count: jobs.length },
    { value: 'OPEN', label: 'Ochiq', color: 'bg-emerald-500' },
    { value: 'IN_PROGRESS', label: 'Jarayonda', color: 'bg-amber-500' },
    { value: 'COMPLETED', label: 'Tugallangan', color: 'bg-blue-500' },
  ];

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Background */}
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.15 }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-6xl mx-auto space-y-6 relative z-10"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              <span className="neon-text">Ishlar</span>
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {jobs.length} ta ish mavjud
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAIGenerate(true)}
              className="btn-secondary flex items-center gap-2 px-4 py-3"
            >
              <Wand2 className="w-5 h-5" />
              AI Yaratish
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              Ish yaratish
            </button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={fadeInUp} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ishlarni qidirish..."
            className="glass-input w-full pl-12 py-4"
          />
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeInUp} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterStatus === filter.value
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'glass-card text-slate-400 hover:text-slate-200'
                }`}
            >
              {filter.color && filterStatus === filter.value && (
                <span className={`w-2 h-2 rounded-full ${filter.color}`} />
              )}
              {filter.label}
              {filter.count !== undefined && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Jobs List */}
        <motion.div variants={fadeInUp} className="space-y-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 h-40 animate-pulse" />
            ))
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ishlar topilmadi</h3>
              <p className="text-slate-400 mb-6">Boshqa so&apos;rov bilan qayta urinib ko&apos;ring</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary px-6 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Ish yaratish
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {showAIGenerate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-lg"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI ish yaratish</h2>
                    <p className="text-sm text-slate-400">G\'oyangizni tasvirlang, AI sizga ish yaratib beradi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIGenerate(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ish tavsifi</label>
                  <textarea
                    placeholder="Masalan: Menga React va Node.js bilan e-commerce sayt yaratish kerak..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="glass-input w-full min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    AI sizga sarlavha, tavsif, byudjet va kerakli ko\'nikmalarni taklif qiladi
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAIGenerate(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Yaratilmoqda...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        AI bilan yaratish
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Yangi ish yaratish</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sarlavha</label>
                <input
                  type="text"
                  placeholder="Ish sarlavhasi"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="glass-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tavsif</label>
                <textarea
                  placeholder="Ish tavsifi"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="glass-input w-full min-h-[100px] resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Byudjet ($)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={createForm.budget}
                    onChange={(e) => setCreateForm({ ...createForm, budget: e.target.value })}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Muddati</label>
                  <input
                    type="date"
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                    className="glass-input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kerakli ko&apos;nikmalar</label>
                <input
                  type="text"
                  placeholder="React, Node.js, Python"
                  value={createForm.required_skills}
                  onChange={(e) => setCreateForm({ ...createForm, required_skills: e.target.value })}
                  className="glass-input w-full"
                />
                <p className="text-xs text-slate-500 mt-1">Vergul bilan ajrating</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1 py-3"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Yaratish
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const JobCard = ({ job }) => {
  const navigate = useNavigate();

  const statusConfig = {
    OPEN: { label: 'Ochiq', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    IN_PROGRESS: { label: 'Jarayonda', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    COMPLETED: { label: 'Tugallangan', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    CANCELLED: { label: 'Bekor qilingan', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  };

  const config = statusConfig[job.status] || statusConfig.OPEN;

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="glass-card p-6 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Status & Date */}
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
              {config.label}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(job.created_at).toLocaleDateString('uz-UZ')}
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {job.title}
          </h3>
          <p className="text-slate-400 text-sm line-clamp-2 mb-4">
            {job.description?.slice(0, 120)}...
          </p>

          {/* Skills */}
          {job.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {job.required_skills.slice(0, 4).map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-400 border border-white/5"
                >
                  {skill}
                </span>
              ))}
              {job.required_skills.length > 4 && (
                <span className="px-2 py-1 text-xs text-slate-500">
                  +{job.required_skills.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm">
            {job.budget && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <DollarSign className="w-4 h-4" />
                {job.budget.toLocaleString()}
              </span>
            )}
            {job.deadline && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-4 h-4" />
                {new Date(job.deadline).toLocaleDateString('uz-UZ')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="p-2 rounded-xl bg-slate-800/50 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-all"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
