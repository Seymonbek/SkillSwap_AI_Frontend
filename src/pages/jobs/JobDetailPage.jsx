import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { freelanceService } from '@/shared/api';
import { buildDirectChatLink } from '@/shared/lib/utils';
import {
  ArrowLeft, Clock, DollarSign, MapPin, Calendar,
  Briefcase, MessageSquare, Send, CheckCircle2, Star,
  Bookmark, Share2, X, Loader2, User, FileText,
  Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalForm, setProposalForm] = useState({ cover_letter: '', proposed_price: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Proposals
  const [proposals, setProposals] = useState([]);
  const [showProposals, setShowProposals] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  // AI Scope
  const [generatingScope, setGeneratingScope] = useState(false);
  const [aiScope, setAiScope] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchJobDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await freelanceService.getJob(id);
      setJob(res.data);
    } catch (err) {
      console.error('Fetch job error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchJobDetail();
    else setLoading(false);
  }, [fetchJobDetail, id]);

  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      const res = await freelanceService.getProposals({ job: id });
      setProposals(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch proposals error:', err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleToggleProposals = () => {
    if (!showProposals && proposals.length === 0) {
      fetchProposals();
    }
    setShowProposals(!showProposals);
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await freelanceService.createProposal({
        job: parseInt(id),
        cover_letter: proposalForm.cover_letter,
        proposed_price: parseFloat(proposalForm.proposed_price),
      });
      setShowProposalModal(false);
      setProposalForm({ cover_letter: '', proposed_price: '' });
      fetchJobDetail(); // Update proposals_count
    } catch (err) {
      setSubmitError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    setAcceptingId(proposalId);
    try {
      await freelanceService.acceptProposal(proposalId, {});
      // Refresh data
      await Promise.all([fetchJobDetail(), fetchProposals()]);
    } catch (err) {
      console.error('Accept proposal error:', err);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleGenerateScope = async () => {
    setGeneratingScope(true);
    try {
      const res = await freelanceService.generateScope({ job_id: parseInt(id) });
      setAiScope(res.data);
    } catch (err) {
      console.error('Generate scope error:', err);
    } finally {
      setGeneratingScope(false);
    }
  };

  const isOwner = job?.owner?.id === currentUser.id;

  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-24">
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
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Ish topilmadi</h2>
          <button onClick={() => navigate('/jobs')} className="btn-primary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Orqaga
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    OPEN: { label: 'Ochiq', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    IN_PROGRESS: { label: 'Jarayonda', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    COMPLETED: { label: 'Tugallangan', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    CANCELLED: { label: 'Bekor qilingan', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  };
  const config = statusConfig[job.status] || statusConfig.OPEN;

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.1 }} />
      </div>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/jobs')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Orqaga
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Job Header Card */}
        <div className="glass-card p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color} border ${config.border}`}>
              {config.label}
            </span>
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(job.created_at).toLocaleDateString('uz-UZ')}
            </span>
            {isOwner && (
              <span className="px-2 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full border border-violet-500/20">
                Sizning ish e&apos;loningiz
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">{job.title}</h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-3 text-center">
              <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Byudjet</p>
              <p className="font-bold text-emerald-400">
                ${job.budget_min || job.budget || 0} {job.budget_max ? `- $${job.budget_max}` : ''}
              </p>
            </div>
            {job.deadline && (
              <div className="glass-card p-3 text-center">
                <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Muddat</p>
                <p className="font-bold text-blue-400">{new Date(job.deadline).toLocaleDateString('uz-UZ')}</p>
              </div>
            )}
            <div className="glass-card p-3 text-center">
              <Briefcase className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Takliflar</p>
              <p className="font-bold text-purple-400">{job.proposals_count || 0}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Daraja</p>
              <p className="font-bold text-amber-400">{job.experience_level || 'N/A'}</p>
            </div>
          </div>

          {/* Skills */}
          {(job.required_skills?.length > 0 || job.skills_required?.length > 0) && (
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-2">Kerakli ko&apos;nikmalar</p>
              <div className="flex flex-wrap gap-2">
                {(job.required_skills || job.skills_required || []).map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm text-slate-300 border border-white/5">
                    {typeof skill === 'string' ? skill : skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {!isOwner && job.status === 'OPEN' && (
              <button onClick={() => setShowProposalModal(true)} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Taklif yuborish
              </button>
            )}
            {isOwner && (
              <button onClick={handleToggleProposals}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Takliflarni ko&apos;rish ({job.proposals_count || 0})
                {showProposals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            <button onClick={() => navigate(buildDirectChatLink(job.owner))}
              className="btn-secondary flex items-center gap-2 px-4">
              <MessageSquare className="w-4 h-4" /> Xabar
            </button>
            <button onClick={handleGenerateScope} disabled={generatingScope}
              className="btn-secondary flex items-center gap-2 px-4">
              {generatingScope ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Scope
            </button>
          </div>
        </div>

        {/* AI Scope Result */}
        {aiScope && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-bold text-white">AI Scope Tahlili</h3>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 whitespace-pre-wrap">{aiScope.scope || aiScope.analysis || JSON.stringify(aiScope, null, 2)}</p>
            </div>
          </motion.div>
        )}

        {/* Proposals List (For Owner) */}
        <AnimatePresence>
          {showProposals && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Takliflar ({proposals.length})
              </h3>
              {loadingProposals ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="glass-card h-24 animate-pulse" />)}
                </div>
              ) : proposals.length > 0 ? (
                proposals.map(proposal => (
                  <div key={proposal.id} className="glass-card p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {proposal.freelancer?.first_name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-white">
                              {proposal.freelancer?.first_name} {proposal.freelancer?.last_name}
                            </h4>
                            <p className="text-sm text-slate-400">{proposal.freelancer?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-400 font-bold">${proposal.proposed_price}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              proposal.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' :
                              proposal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {proposal.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm mt-2 line-clamp-3">{proposal.cover_letter}</p>
                        {proposal.freelancer?.rating > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-amber-400 text-sm">{proposal.freelancer.rating}</span>
                          </div>
                        )}
                        {proposal.status === 'PENDING' && isOwner && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleAcceptProposal(proposal.id)} disabled={acceptingId === proposal.id}
                              className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors flex items-center gap-2">
                              {acceptingId === proposal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Qabul qilish
                            </button>
                            <button onClick={() => navigate(buildDirectChatLink(proposal.freelancer))}
                              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> Xabar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Hozircha takliflar yo&apos;q</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Ish tavsifi</h3>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        {/* Client Info */}
        {job.owner && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Mijoz haqida</h3>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {job.owner.first_name?.charAt(0).toUpperCase() || job.owner.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{job.owner.first_name} {job.owner.last_name}</h4>
                <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" /> {job.owner.location || "Joylashuv ko'rsatilmagan"}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  {job.owner.freelance_rating && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400" /> {job.owner.freelance_rating}
                    </span>
                  )}
                  {job.owner.is_verified && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Tasdiqlangan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Proposal Modal */}
      <AnimatePresence>
        {showProposalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-lg">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Taklif yuborish</h2>
                <button onClick={() => setShowProposalModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSubmitProposal} className="p-6 space-y-5">
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{submitError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Narx taklifi ($)</label>
                  <input type="number" value={proposalForm.proposed_price}
                    onChange={(e) => setProposalForm({ ...proposalForm, proposed_price: e.target.value })}
                    placeholder="Masalan: 1000" className="glass-input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Xat (muhim)</label>
                  <textarea value={proposalForm.cover_letter}
                    onChange={(e) => setProposalForm({ ...proposalForm, cover_letter: e.target.value })}
                    placeholder="Nima uchun aynan sizni tanlashlari kerak?" rows={5}
                    className="glass-input w-full resize-none" required />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowProposalModal(false)} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Yuborish</>}
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
