import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobStore } from '@/entities/job/model/store';
import { getApiErrorMessage } from '@/shared/lib/apiError';
import {
  buildJobFormState,
  buildJobPayload,
  formatJobBudget,
  getBookmarkedJobIds,
  getJobStatusMeta,
  normalizeJob,
  toggleJobBookmark,
} from '@/shared/lib/job';
import { getUserDisplayName } from '@/shared/lib/user';
import useToast from '@/shared/ui/providers/useToast';
import {
  Search,
  Plus,
  Briefcase,
  Clock,
  ChevronRight,
  Bookmark,
  X,
  CheckCircle2,
  Sparkles,
  Wand2,
  Loader2,
  Pencil,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight as ChevronRightSmall,
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
      staggerChildren: 0.08,
    },
  },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  budget: '',
  deadline: '',
  required_skills: '',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Hammasi' },
  { value: 'OPEN', label: 'Ochiq' },
  { value: 'DRAFT', label: 'Qoralama' },
  { value: 'IN_PROGRESS', label: 'Jarayonda' },
  { value: 'COMPLETED', label: 'Tugallangan' },
  { value: 'CANCELLED', label: 'Bekor qilingan' },
];

export const JobsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const jobs = useJobStore((state) => state.jobs);
  const loading = useJobStore((state) => state.isLoading);
  const error = useJobStore((state) => state.error);
  const pagination = useJobStore((state) => state.pagination);
  const fetchJobs = useJobStore((state) => state.fetchJobs);
  const fetchJob = useJobStore((state) => state.fetchJob);
  const createJob = useJobStore((state) => state.createJob);
  const updateJob = useJobStore((state) => state.updateJob);
  const deleteJob = useJobStore((state) => state.deleteJob);
  const generateAndSaveJob = useJobStore((state) => state.generateAndSaveJob);

  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDraftId, setAiDraftId] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(() => getBookmarkedJobIds());
  const [deletingJobId, setDeletingJobId] = useState(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const refreshJobs = useCallback(
    async (nextPage = 1, nextSearch = '', nextStatus = 'all') => {
      const trimmedSearch = nextSearch.trim();
      const params = { page: nextPage };

      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      if (nextStatus !== 'all') {
        params.status = nextStatus;
      }

      await fetchJobs(params);
    },
    [fetchJobs]
  );

  const handleOpenEditModal = useCallback(
    (job) => {
      const normalizedJob = normalizeJob(job);
      setEditingJob(normalizedJob);
      setAiDraftId(null);
      setFormError('');
      setCreateForm(buildJobFormState(normalizedJob));
      setShowCreateModal(true);
    },
    []
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshJobs(page, deferredSearchQuery, filterStatus);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [deferredSearchQuery, filterStatus, page, refreshJobs]);

  useEffect(() => {
    const editJobId = location.state?.editJobId;
    if (!editJobId) return;

    let isCancelled = false;

    const openRequestedJob = async () => {
      const existingJob = jobs.find((job) => job.id === editJobId);
      const targetJob = existingJob || (await fetchJob(editJobId));

      if (!isCancelled && targetJob) {
        handleOpenEditModal(targetJob);
      }

      navigate(location.pathname, { replace: true, state: null });
    };

    openRequestedJob();

    return () => {
      isCancelled = true;
    };
  }, [fetchJob, handleOpenEditModal, jobs, location.pathname, location.state, navigate]);

  const cleanupAiDraft = useCallback(async () => {
    if (!aiDraftId) return;

    await deleteJob(aiDraftId);
    setAiDraftId(null);
  }, [aiDraftId, deleteJob]);

  const resetModalState = useCallback(() => {
    setCreateForm(EMPTY_FORM);
    setEditingJob(null);
    setFormError('');
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setAiDraftId(null);
    resetModalState();
    setShowCreateModal(true);
  }, [resetModalState]);

  const handleCloseCreateModal = useCallback(async () => {
    if (!editingJob && aiDraftId) {
      await cleanupAiDraft();
    }

    setShowCreateModal(false);
    resetModalState();
  }, [aiDraftId, cleanupAiDraft, editingJob, resetModalState]);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setAiGenerating(true);
    try {
      if (aiDraftId) {
        await cleanupAiDraft();
      }

      const result = await generateAndSaveJob({ prompt: aiPrompt.trim() });

      if (!result.success) {
        throw { response: { data: result.error } };
      }

      const draftJob = normalizeJob(result.data?.data || result.data || {});
      setEditingJob(null);
      setAiDraftId(result.data?.job_id || draftJob.id || null);
      setCreateForm(buildJobFormState(draftJob));
      setShowAIGenerate(false);
      setShowCreateModal(true);
      toast.success("AI tavsiyalari formaga joylandi.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "AI orqali ish yaratib bo'lmadi."));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateOrUpdateJob = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const payload = buildJobPayload(createForm);

      if (!payload.title || !payload.description) {
        throw new Error("Sarlavha va tavsifni to'ldiring.");
      }

      const result = editingJob
        ? await updateJob(editingJob.id, payload)
        : await createJob(payload);

      if (!result.success) {
        throw { response: { data: result.error } };
      }

      if (!editingJob && aiDraftId) {
        await cleanupAiDraft();
      }

      setShowCreateModal(false);
      resetModalState();
      setAiPrompt('');
      setPage(1);
      await refreshJobs(1, deferredSearchQuery, filterStatus);
      toast.success(editingJob ? "Ish yangilandi." : "Ish muvaffaqiyatli yaratildi.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : getApiErrorMessage(err, "Ishni saqlab bo'lmadi.");
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (job) => {
    const confirmed = window.confirm(`"${job.title}" ishini o'chirmoqchimisiz?`);
    if (!confirmed) return;

    setDeletingJobId(job.id);
    try {
      const result = await deleteJob(job.id);
      if (!result.success) {
        throw { response: { data: result.error } };
      }

      const nextPage = jobs.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await refreshJobs(nextPage, deferredSearchQuery, filterStatus);
      toast.success("Ish o'chirildi.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Ishni o'chirib bo'lmadi."));
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleToggleBookmark = (jobId) => {
    const nextBookmarks = toggleJobBookmark(jobId);
    const nextIsBookmarked = nextBookmarks.includes(jobId);
    setBookmarkedIds(nextBookmarks);

    if (nextIsBookmarked) {
      toast.info("Ish saqlanganlar ro'yxatiga qo'shildi.");
    } else {
      toast.info("Ish saqlanganlardan olib tashlandi.");
    }
  };

  const totalJobs = pagination.count || jobs.length;
  const hasPreviousPage = Boolean(pagination.previous) && page > 1;
  const hasNextPage = Boolean(pagination.next);

  return (
    <div className="min-h-dvh px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] sm:px-6 sm:pt-6 sm:pb-28 lg:pb-12">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.15 }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-6xl mx-auto space-y-6 relative z-10"
      >
        <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              <span className="neon-text">Ishlar</span>
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {totalJobs} ta natija topildi
            </p>
          </div>
          <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAIGenerate(true)}
              className="btn-secondary flex items-center justify-center gap-2 px-4 py-3"
            >
              <Wand2 className="w-5 h-5" />
              AI yordamida
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              Ish yaratish
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Sarlavha, tavsif yoki ko'nikma bo'yicha qidiring..."
              className="glass-input w-full pl-12 py-4"
            />
          </div>
          <div className="glass-card px-4 py-3 flex items-center gap-2 text-slate-400">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Sahifa: {page}</span>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setFilterStatus(filter.value);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === filter.value
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'glass-card text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{filter.label}</span>
            </button>
          ))}
        </motion.div>

        {error && (
          <motion.div variants={fadeInUp} className="glass-card border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            {getApiErrorMessage({ response: { data: error } }, "Ishlarni yuklashda xatolik bo'ldi.")}
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="space-y-4">
          {loading ? (
            [1, 2, 3, 4].map((value) => (
              <div key={value} className="glass-card p-6 h-44 animate-pulse" />
            ))
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentUserId={currentUser?.id}
                deletingJobId={deletingJobId}
                isBookmarked={bookmarkedIds.includes(job.id)}
                onBookmarkToggle={handleToggleBookmark}
                onDelete={handleDeleteJob}
                onEdit={handleOpenEditModal}
              />
            ))
          ) : (
            <div className="text-center py-16 glass-card">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ish topilmadi</h3>
              <p className="text-slate-400 mb-6">
                Filtr yoki qidiruvni o'zgartirib ko'ring, yoki yangi e'lon yarating.
              </p>
              <button onClick={handleOpenCreateModal} className="btn-primary px-6 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Ish yaratish
              </button>
            </div>
          )}
        </motion.div>

        {(hasPreviousPage || hasNextPage) && (
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={!hasPreviousPage || loading}
              className="btn-secondary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Oldingi
            </button>
            <span className="text-sm text-slate-400">Sahifa {page}</span>
            <button
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={!hasNextPage || loading}
              className="btn-secondary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keyingi
              <ChevronRightSmall className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAIGenerate && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto sm:max-h-[calc(100dvh-4rem)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI ish yaratish</h2>
                    <p className="text-sm text-slate-400">G'oyangizni yozing, AI formani tayyorlaydi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIGenerate(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/5"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ish tavsifi</label>
                  <textarea
                    placeholder="Masalan: React va Django bilan marketplace kerak..."
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    className="glass-input w-full min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    AI sarlavha, tavsif, byudjet va ko'nikmalar bo'yicha qoralama beradi.
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    onClick={() => setShowAIGenerate(false)}
                    className="btn-secondary min-h-12 flex-1 py-3"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    className="btn-primary min-h-12 flex-1 items-center justify-center gap-2 py-3"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Tayyorlanmoqda...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Formani tayyorlash
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto sm:max-h-[calc(100dvh-4rem)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingJob ? "Ishni tahrirlash" : 'Yangi ish yaratish'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {editingJob ? "Ma'lumotlarni yangilang." : "E'lon tafsilotlarini to'ldiring."}
                  </p>
                </div>
                <button
                  onClick={handleCloseCreateModal}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/5"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleCreateOrUpdateJob} className="space-y-5 p-5 sm:p-6">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sarlavha</label>
                  <input
                    type="text"
                    placeholder="Masalan: React dashboard yaratish"
                    value={createForm.title}
                    onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                    className="glass-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tavsif</label>
                  <textarea
                    placeholder="Ish tavsifi, talablar va natijani yozing"
                    value={createForm.description}
                    onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                    className="glass-input w-full min-h-[120px] resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Byudjet ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="1000"
                      value={createForm.budget}
                      onChange={(event) => setCreateForm((current) => ({ ...current, budget: event.target.value }))}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Muddati</label>
                    <input
                      type="date"
                      value={createForm.deadline}
                      onChange={(event) => setCreateForm((current) => ({ ...current, deadline: event.target.value }))}
                      className="glass-input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Kerakli ko'nikmalar</label>
                  <input
                    type="text"
                    placeholder="React, Tailwind, API integratsiya"
                    value={createForm.required_skills}
                    onChange={(event) => setCreateForm((current) => ({ ...current, required_skills: event.target.value }))}
                    className="glass-input w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Ko'nikmalarni vergul bilan ajrating.</p>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
                  <button type="button" onClick={handleCloseCreateModal} className="btn-secondary min-h-12 flex-1 py-3">
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary min-h-12 flex-1 items-center justify-center gap-2 py-3"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {editingJob ? 'Saqlash' : 'Yaratish'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const JobCard = ({
  job,
  currentUserId,
  deletingJobId,
  isBookmarked,
  onBookmarkToggle,
  onDelete,
  onEdit,
}) => {
  const navigate = useNavigate();
  const statusMeta = getJobStatusMeta(job.status);
  const isOwner = job.owner?.id === currentUserId;

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="glass-card p-5 sm:p-6 cursor-pointer group transition-all hover:bg-white/5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.color} border ${statusMeta.border}`}>
              {statusMeta.label}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {job.created_at ? new Date(job.created_at).toLocaleDateString('uz-UZ') : "Sana yo'q"}
            </span>
            {isOwner && (
              <span className="px-2 py-1 bg-violet-500/10 text-violet-300 text-xs rounded-full border border-violet-500/20">
                Sizning e'loningiz
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {job.title}
          </h3>
          <p className="text-slate-400 text-sm line-clamp-2 mb-4">
            {job.description}
          </p>

          {job.skills_required?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills_required.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-400 border border-white/5"
                >
                  {skill}
                </span>
              ))}
              {job.skills_required.length > 4 && (
                <span className="px-2 py-1 text-xs text-slate-500">
                  +{job.skills_required.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              {formatJobBudget(job)}
            </span>
            {job.deadline && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-4 h-4" />
                {new Date(job.deadline).toLocaleDateString('uz-UZ')}
              </span>
            )}
            <span className="text-slate-500 text-sm">
              Egasi: {getUserDisplayName(job.owner, 'Noma`lum')}
            </span>
            <span className="text-slate-500 text-sm">
              Takliflar: {job.proposals_count || 0}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onBookmarkToggle(job.id);
              }}
              className={`p-2 rounded-xl transition-all ${
                isBookmarked
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-800/50 text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {isOwner && (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(job);
                  }}
                  className="p-2 rounded-xl bg-slate-800/50 text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-all"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(job);
                  }}
                  disabled={deletingJobId === job.id}
                  className="p-2 rounded-xl bg-slate-800/50 text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {deletingJobId === job.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
