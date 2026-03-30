import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobStore } from '@/entities/job/model/store';
import { freelanceService } from '@/shared/api';
import { getApiErrorMessage } from '@/shared/lib/apiError';
import {
  extractPaginatedData,
  formatJobBudget,
  getJobStatusMeta,
  isJobBookmarked,
  normalizeJob,
  normalizeProposals,
  toggleJobBookmark,
} from '@/shared/lib/job';
import { buildDirectChatLink } from '@/shared/lib/utils';
import { getUserAvatarInitial, getUserDisplayName } from '@/shared/lib/user';
import useToast from '@/shared/ui/providers/useToast';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  Briefcase,
  MessageSquare,
  Send,
  CheckCircle2,
  Star,
  Bookmark,
  Share2,
  X,
  Loader2,
  User,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const fetchJob = useJobStore((state) => state.fetchJob);
  const createProposal = useJobStore((state) => state.createProposal);
  const acceptProposal = useJobStore((state) => state.acceptProposal);
  const deleteJob = useJobStore((state) => state.deleteJob);
  const generateScope = useJobStore((state) => state.generateScope);

  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalForm, setProposalForm] = useState({ cover_letter: '', proposed_price: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [proposals, setProposals] = useState([]);
  const [showProposals, setShowProposals] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalsError, setProposalsError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [generatingScope, setGeneratingScope] = useState(false);
  const [aiScope, setAiScope] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(() => isJobBookmarked(id));

  const fetchJobDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setPageError('');

    const result = await fetchJob(id);
    if (result) {
      setJob(normalizeJob(result));
    } else {
      setJob(null);
      setPageError("Ish ma'lumotlarini yuklab bo'lmadi.");
    }

    setLoading(false);
  }, [fetchJob, id]);

  const fetchProposals = useCallback(async () => {
    if (!id) return;

    setLoadingProposals(true);
    setProposalsError('');

    try {
      const response = await freelanceService.getProposals({ job: id });
      const { items } = extractPaginatedData(response.data);
      setProposals(normalizeProposals(items));
    } catch (err) {
      setProposalsError(getApiErrorMessage(err, "Takliflarni yuklab bo'lmadi."));
    } finally {
      setLoadingProposals(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  useEffect(() => {
    setIsBookmarked(isJobBookmarked(id));
  }, [id]);

  const isOwner = String(job?.owner?.id || '') === String(currentUser?.id || '');
  const canSubmitProposal = !isOwner && job?.status === 'OPEN';
  const statusMeta = getJobStatusMeta(job?.status);

  const handleToggleProposals = async () => {
    if (!showProposals && proposals.length === 0) {
      await fetchProposals();
    }

    setShowProposals((current) => !current);
  };

  const handleSubmitProposal = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const result = await createProposal({
        job: id,
        cover_letter: proposalForm.cover_letter.trim(),
        proposed_price: Number(proposalForm.proposed_price),
      });

      if (!result.success) {
        throw { response: { data: result.error } };
      }

      setShowProposalModal(false);
      setProposalForm({ cover_letter: '', proposed_price: '' });
      await fetchJobDetail();
      toast.success('Taklif muvaffaqiyatli yuborildi.');
    } catch (err) {
      const message = getApiErrorMessage(err, "Taklif yuborishda xatolik yuz berdi.");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    setAcceptingId(proposalId);

    try {
      const result = await acceptProposal(proposalId);
      if (!result.success) {
        throw { response: { data: result.error } };
      }

      await Promise.all([fetchJobDetail(), fetchProposals()]);
      toast.success("Taklif qabul qilindi va shartnoma yaratildi.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Taklifni qabul qilib bo'lmadi."));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleGenerateScope = async () => {
    setGeneratingScope(true);
    try {
      const result = await generateScope({ job_id: id });
      if (!result.success) {
        throw { response: { data: result.error } };
      }

      setAiScope(result.data);
      toast.success("AI scope tayyor bo'ldi.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "AI scope yaratib bo'lmadi."));
    } finally {
      setGeneratingScope(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: job?.title || 'SkillSwap ishi',
      text: job?.description || '',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Ish havolasi ulashildi.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Havola nusxalandi.');
        return;
      }

      throw new Error('Share fallback mavjud emas');
    } catch {
      toast.error("Havolani ulashib bo'lmadi.");
    }
  };

  const handleToggleBookmark = () => {
    const nextBookmarks = toggleJobBookmark(id);
    const nextIsBookmarked = nextBookmarks.includes(id);
    setIsBookmarked(nextIsBookmarked);
    toast.info(nextIsBookmarked ? "Ish saqlanganlar ro'yxatiga qo'shildi." : "Ish saqlanganlardan olib tashlandi.");
  };

  const handleDeleteJob = async () => {
    if (!job) return;

    const confirmed = window.confirm(`"${job.title}" ishini o'chirmoqchimisiz?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const result = await deleteJob(job.id);
      if (!result.success) {
        throw { response: { data: result.error } };
      }

      toast.success("Ish o'chirildi.");
      navigate('/jobs');
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Ishni o'chirib bo'lmadi."));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] sm:px-6 sm:pb-28 lg:pb-12">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="glass-card h-12 w-32 animate-pulse" />
          <div className="glass-card h-64 animate-pulse" />
          <div className="glass-card h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-dvh px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] sm:px-6 sm:pb-28 lg:pb-12 flex items-center justify-center">
        <div className="glass-card p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-3">Ish topilmadi</h2>
          <p className="text-slate-400 mb-5">{pageError || "So'ralgan ish mavjud emas yoki o'chirilgan."}</p>
          <button onClick={() => navigate('/jobs')} className="btn-primary min-h-12 flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" />
            Ishlarga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] sm:px-6 sm:pb-28 lg:pb-12">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.1 }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="relative z-10 mx-auto max-w-4xl space-y-5 sm:space-y-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate('/jobs')}
            className="btn-secondary min-h-12 w-full justify-center gap-2 sm:w-auto sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </button>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {isOwner && (
              <>
                <button
                  onClick={() => navigate('/jobs', { state: { editJobId: job.id } })}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-800/50 p-2 text-slate-400 transition-colors hover:text-blue-400"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeleteJob}
                  disabled={deleting}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-800/50 p-2 text-slate-400 transition-colors hover:text-red-400 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </>
            )}
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl transition-colors ${
                isBookmarked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800/50 text-slate-400 hover:text-white'
              } flex min-h-11 min-w-11 items-center justify-center`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-800/50 p-2 text-slate-400 transition-colors hover:text-white"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMeta.bg} ${statusMeta.color} border ${statusMeta.border}`}>
              {statusMeta.label}
            </span>
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {job.created_at ? new Date(job.created_at).toLocaleDateString('uz-UZ') : "Sana yo'q"}
            </span>
            {isOwner && (
              <span className="px-2 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full border border-violet-500/20">
                Sizning ish e'loningiz
              </span>
            )}
          </div>

          <h1 className="mb-4 max-w-3xl break-words text-2xl font-bold leading-tight text-white sm:text-3xl">
            {job.title}
          </h1>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="glass-card flex min-h-28 flex-col justify-center p-4 text-center">
              <p className="text-xs text-slate-400">Byudjet</p>
              <p className="font-bold text-emerald-400">{formatJobBudget(job)}</p>
            </div>
            <div className="glass-card flex min-h-28 flex-col justify-center p-4 text-center">
              <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Muddat</p>
              <p className="font-bold text-blue-400">
                {job.deadline ? new Date(job.deadline).toLocaleDateString('uz-UZ') : 'Belgilanmagan'}
              </p>
            </div>
            <div className="glass-card flex min-h-28 flex-col justify-center p-4 text-center">
              <Briefcase className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Takliflar</p>
              <p className="font-bold text-purple-400">{job.proposals_count || 0}</p>
            </div>
            <div className="glass-card flex min-h-28 flex-col justify-center p-4 text-center">
              <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Mijoz reytingi</p>
              <p className="font-bold text-amber-400">{job.owner?.freelance_rating || 0}</p>
            </div>
          </div>

          {job.skills_required?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-2">Kerakli ko'nikmalar</p>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm text-slate-300 border border-white/5">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {canSubmitProposal && (
              <button
                onClick={() => setShowProposalModal(true)}
                className="btn-primary min-h-12 w-full justify-center gap-2 py-3"
              >
                <Send className="w-4 h-4" />
                Taklif yuborish
              </button>
            )}

            {isOwner && (
              <button
                onClick={handleToggleProposals}
                className="btn-primary min-h-12 w-full justify-center gap-2 py-3"
              >
                <FileText className="w-4 h-4" />
                Takliflarni ko'rish ({job.proposals_count || 0})
                {showProposals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}

            {job.owner && !isOwner && (
              <button
                onClick={() => navigate(buildDirectChatLink(job.owner, { job: job.id }))}
                className="btn-secondary min-h-12 w-full justify-center gap-2 px-4"
              >
                <MessageSquare className="w-4 h-4" />
                Mijozga yozish
              </button>
            )}

            <button
              onClick={handleGenerateScope}
              disabled={generatingScope}
              className="btn-secondary min-h-12 w-full justify-center gap-2 px-4"
            >
              {generatingScope ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Scope
            </button>
          </div>
        </div>

        {aiScope && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-bold text-white">AI Scope Tahlili</h3>
            </div>
            <div className="space-y-3">
              <p className="text-slate-300 whitespace-pre-wrap">
                {aiScope.scope || aiScope.message || 'AI tahlili tayyor.'}
              </p>
              {aiScope.analysis && (
                <details className="glass-card overflow-x-auto p-4">
                  <summary className="cursor-pointer text-sm text-slate-300">Texnik tafsilotlar</summary>
                  <pre className="mt-3 text-xs text-slate-400 whitespace-pre-wrap break-words">
                    {JSON.stringify(aiScope.analysis, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showProposals && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Takliflar ({proposals.length})
              </h3>

              {proposalsError && (
                <div className="glass-card border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                  {proposalsError}
                </div>
              )}

              {loadingProposals ? (
                <div className="space-y-3">
                  {[1, 2].map((value) => (
                    <div key={value} className="glass-card h-24 animate-pulse" />
                  ))}
                </div>
              ) : proposals.length > 0 ? (
                proposals.map((proposal) => {
                  const proposalStatus = getJobStatusMeta(proposal.status);
                  const freelancer = proposal.freelancer;

                  return (
                    <div key={proposal.id} className="glass-card p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                          {freelancer ? getUserAvatarInitial(freelancer, 'U') : <User className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-white">
                                {getUserDisplayName(freelancer, 'Frilanser')}
                              </h4>
                              {freelancer?.email && <p className="break-all text-sm text-slate-400">{freelancer.email}</p>}
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-emerald-400 font-bold">${proposal.proposed_price}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${proposalStatus.bg} ${proposalStatus.color}`}>
                                {proposalStatus.label}
                              </span>
                            </div>
                          </div>

                          <p className="text-slate-300 text-sm mt-2 whitespace-pre-wrap line-clamp-4">
                            {proposal.cover_letter}
                          </p>

                          {freelancer?.rating > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-amber-400 text-sm">{freelancer.rating}</span>
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {proposal.status === 'PENDING' && isOwner && (
                              <button
                                onClick={() => handleAcceptProposal(proposal.id)}
                                disabled={acceptingId === proposal.id}
                                className="flex min-h-11 items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                {acceptingId === proposal.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                Qabul qilish
                              </button>
                            )}

                            {freelancer && (
                              <button
                                onClick={() => navigate(buildDirectChatLink(freelancer, { job: job.id }))}
                                className="flex min-h-11 items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Xabar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="glass-card p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Hozircha takliflar yo'q</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-card p-5 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Ish tavsifi</h3>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        {job.owner && (
          <div className="glass-card p-5 sm:p-6">
            <h3 className="text-lg font-bold text-white mb-4">Mijoz haqida</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {getUserAvatarInitial(job.owner, 'U')}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white">{getUserDisplayName(job.owner, 'Mijoz')}</h4>
                {job.owner.location && (
                  <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {job.owner.location}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm sm:gap-4">
                  {job.owner.freelance_rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400" />
                      {job.owner.freelance_rating}
                    </span>
                  )}

                  {job.owner.is_verified && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Tasdiqlangan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showProposalModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto sm:max-h-[calc(100dvh-4rem)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-white">Taklif yuborish</h2>
                <button onClick={() => setShowProposalModal(false)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSubmitProposal} className="space-y-5 p-5 sm:p-6">
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Narx taklifi ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposalForm.proposed_price}
                    onChange={(event) => setProposalForm((current) => ({ ...current, proposed_price: event.target.value }))}
                    placeholder="Masalan: 1000"
                    className="glass-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Xat</label>
                  <textarea
                    value={proposalForm.cover_letter}
                    onChange={(event) => setProposalForm((current) => ({ ...current, cover_letter: event.target.value }))}
                    placeholder="Nima uchun aynan sizni tanlashlari kerak?"
                    rows={5}
                    className="glass-input w-full resize-none"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
                  <button type="button" onClick={() => setShowProposalModal(false)} className="btn-secondary min-h-12 flex-1 py-3">
                    Bekor qilish
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary min-h-12 flex-1 items-center justify-center gap-2 py-3">
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Yuborish
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

export default JobDetailPage;
