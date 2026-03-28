import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { freelanceService } from '@/shared/api';
import {
  FileText, ChevronRight, Clock, DollarSign,
  CheckCircle2, AlertCircle, User, Loader2,
  Milestone, ArrowRight, X
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

const statusColors = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  FUNDED: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  RELEASED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export const ContractsPage = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contracts');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitData, setSubmitData] = useState({ comment: '', link: '', file: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchContracts(); }, []);

  const fetchContracts = async () => {
    try {
      const res = await freelanceService.getContracts();
      setContracts(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch contracts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async (contractId) => {
    try {
      const res = await freelanceService.getMilestones({ contract: contractId });
      setMilestones(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch milestones error:', err);
    }
  };

  const fetchSubmissions = async (contractId) => {
    try {
      const res = await freelanceService.getSubmissions({ contract: contractId });
      setSubmissions(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch submissions error:', err);
    }
  };

  const handleSelectContract = async (contract) => {
    setSelectedContract(contract);
    await Promise.all([
      fetchMilestones(contract.id),
      fetchSubmissions(contract.id),
    ]);
  };

  const handleFundMilestone = async (id) => {
    await freelanceService.fundMilestone(id, {});
    if (selectedContract?.id) {
      await fetchMilestones(selectedContract.id);
    }
  };

  const handleReleaseMilestone = async (id) => {
    await freelanceService.releaseMilestone(id, {});
    if (selectedContract?.id) {
      await fetchMilestones(selectedContract.id);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('contract', selectedContract.id);
      formData.append('comment', submitData.comment);
      if (submitData.link) formData.append('link', submitData.link);
      if (submitData.file) formData.append('file', submitData.file);
      const res = await freelanceService.createSubmission(formData);
      setSubmissions(prev => [...prev, res.data]);
      setShowSubmitModal(false);
      setSubmitData({ comment: '', link: '', file: null });
    } catch (err) {
      console.error('Submit work error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveSubmission = async (id) => {
    try {
      await freelanceService.approveSubmission(id, {});
      if (selectedContract?.id) {
        await fetchSubmissions(selectedContract.id);
      }
    } catch (err) {
      console.error('Approve submission error:', err);
    }
  };

  const handleRequestRevision = async (id) => {
    try {
      const feedback = window.prompt("Qayta ishlash uchun izoh yozing:");
      if (!feedback || feedback.trim().length < 5) {
        return;
      }
      await freelanceService.requestRevision(id, { feedback: feedback.trim() });
      if (selectedContract?.id) {
        await fetchSubmissions(selectedContract.id);
      }
    } catch (err) {
      console.error('Request revision error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="glass-card h-24 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="blob-bg">
        <div className="blob blob-2" style={{ width: '300px', height: '300px', opacity: 0.1 }} />
      </div>

      <motion.div
        initial="hidden" animate="visible" variants={staggerContainer}
        className="max-w-4xl mx-auto space-y-6 relative z-10"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
              <FileText className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white"><span className="neon-text">Shartnomalar</span></h1>
              <p className="text-slate-400 text-sm">Shartnomalar va bosqichlar</p>
            </div>
          </div>
        </motion.div>

        {/* Contract Detail or List */}
        {selectedContract ? (
          <>
            {/* Back button */}
            <motion.div variants={fadeInUp}>
              <button onClick={() => { setSelectedContract(null); setMilestones([]); setSubmissions([]); }}
                className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                ← Orqaga
              </button>
            </motion.div>

            {/* Contract Info */}
            <motion.div variants={fadeInUp} className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white">{selectedContract.job_title || `Shartnoma #${selectedContract.id}`}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {selectedContract.client_name && `Mijoz: ${selectedContract.client_name}`}
                    {selectedContract.freelancer_name && ` • Frilenser: ${selectedContract.freelancer_name}`}
                  </p>
                </div>
                <span className={`self-start px-3 py-1 rounded-full text-xs border ${statusColors[selectedContract.status] || statusColors.PENDING}`}>
                  {selectedContract.status}
                </span>
              </div>
              {selectedContract.total_amount && (
                <p className="mt-3 text-emerald-400 font-semibold text-lg">${selectedContract.total_amount}</p>
              )}
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeInUp} className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'milestones', label: 'Bosqichlar', count: milestones.length },
                { id: 'submissions', label: 'Topshiriqlar', count: submissions.length },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-white/5'
                  }`}>
                  {tab.label}
                  {tab.count > 0 && <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">{tab.count}</span>}
                </button>
              ))}
            </motion.div>

            {/* Milestones */}
            {activeTab === 'milestones' && (
              <motion.div variants={fadeInUp} className="space-y-3">
                {milestones.length > 0 ? milestones.map(ms => (
                  <div key={ms.id} className="glass-card p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{ms.title || ms.description}</h4>
                        <p className="text-sm text-slate-400 mt-1">{ms.description}</p>
                        {ms.amount && <p className="text-emerald-400 font-semibold mt-2">${ms.amount}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[ms.status] || statusColors.PENDING}`}>
                          {ms.status}
                        </span>
                        {ms.status === 'PENDING' && (
                          <button onClick={() => handleFundMilestone(ms.id)} className="btn-primary text-xs px-3 py-1">Fund</button>
                        )}
                        {ms.status === 'FUNDED' && (
                          <button onClick={() => handleReleaseMilestone(ms.id)} className="btn-primary text-xs px-3 py-1">Release</button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="glass-card p-8 text-center">
                    <Milestone className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">Bosqichlar yo&apos;q</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Submissions */}
            {activeTab === 'submissions' && (
              <motion.div variants={fadeInUp} className="space-y-3">
                <button onClick={() => setShowSubmitModal(true)} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Ish topshirish
                </button>
                {submissions.length > 0 ? submissions.map(sub => (
                  <div key={sub.id} className="glass-card p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{sub.description || `Topshiriq #${sub.id}`}</h4>
                        <p className="text-xs text-slate-500 mt-1">{new Date(sub.created_at).toLocaleDateString('uz-UZ')}</p>
                        {sub.file && (
                          <a href={sub.file} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm underline mt-1 block">
                            Faylni ko&apos;rish
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[sub.status] || statusColors.PENDING}`}>
                          {sub.status}
                        </span>
                        {sub.status === 'SUBMITTED' && (
                          <>
                            <button onClick={() => handleApproveSubmission(sub.id)} className="btn-primary text-xs px-2 py-1">✓</button>
                            <button onClick={() => handleRequestRevision(sub.id)} className="btn-secondary text-xs px-2 py-1">↩</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="glass-card p-8 text-center">
                    <p className="text-slate-400">Topshiriqlar yo&apos;q</p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        ) : (
          /* Contracts List */
          <motion.div variants={fadeInUp} className="space-y-3">
            {contracts.length > 0 ? contracts.map(contract => (
              <div key={contract.id} onClick={() => handleSelectContract(contract)}
                className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{contract.job_title || `Shartnoma #${contract.id}`}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {contract.client_name && `Mijoz: ${contract.client_name}`}
                    </p>
                    {contract.total_amount && (
                      <p className="text-emerald-400 font-semibold text-sm mt-1">${contract.total_amount}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[contract.status] || statusColors.PENDING}`}>
                      {contract.status}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </div>
                </div>
              </div>
            )) : (
              <div className="glass-card p-12 text-center">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Shartnomalar yo&apos;q</h3>
                <p className="text-slate-400 mb-4">Ishlar bo&apos;limidan yangi shartnoma oching</p>
                <button onClick={() => navigate('/jobs')} className="btn-primary">Ishlarni ko&apos;rish</button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Submit Work Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Ish topshirish</h2>
                <button onClick={() => setShowSubmitModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSubmitWork} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Shartnoma</label>
                  <input
                    type="text"
                    value={selectedContract?.job_title || `Shartnoma #${selectedContract?.id || ''}`}
                    className="glass-input w-full opacity-80"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tavsif</label>
                  <textarea value={submitData.comment} onChange={e => setSubmitData({ ...submitData, comment: e.target.value })}
                    className="glass-input w-full h-24 resize-none" placeholder="Ish haqida..." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Havola (ixtiyoriy)</label>
                  <input type="url" value={submitData.link}
                    onChange={e => setSubmitData({ ...submitData, link: e.target.value })}
                    className="glass-input w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fayl (ixtiyoriy)</label>
                  <input type="file" onChange={e => setSubmitData({ ...submitData, file: e.target.files[0] })}
                    className="glass-input w-full" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => setShowSubmitModal(false)} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Topshirish'}
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

export default ContractsPage;
