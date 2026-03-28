import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { disputeService } from '@/shared/api';
import {
  AlertTriangle, X, Send, FileText, Loader2,
  CheckCircle2, AlertCircle, Info
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export const DisputesPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ contract_id: '', category: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        contract_id: createData.contract_id,
        reason: `[${createData.category}] ${createData.description}`.trim(),
      };

      await disputeService.createDispute(payload);
      setCreateSuccess(true);
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
        setCreateData({ contract_id: '', category: '', description: '' });
      }, 2000);
    } catch (err) {
      setCreateError(err.response?.data?.detail || err.response?.data?.reason?.[0] || "Xatolik yuz berdi");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '250px', height: '250px', opacity: 0.1 }} />
      </div>

      <motion.div initial="hidden" animate="visible" variants={staggerContainer}
        className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white"><span className="neon-text">Nizolar</span></h1>
              <p className="text-slate-400 text-sm">Nizolarni hal qilish</p>
            </div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Nizo ochish
          </button>
        </motion.div>

        {/* Info */}
        <motion.div variants={fadeInUp} className="glass-card p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">Nizo qanday ishlaydi?</h3>
              <p className="text-sm text-slate-400">
                Agar shartnoma bo&apos;yicha kelishmovchilik bo&apos;lsa, siz nizo ochishingiz mumkin.
                Platformamiz moderatorlari har ikkala tomonni eshitib, adolatli qaror chiqaradi.
                Dalillar (screenshot, xabarlar) qo&apos;shishingiz tavsiya etiladi.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Empty State */}
        <motion.div variants={fadeInUp} className="glass-card p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nizolar yo&apos;q</h3>
          <p className="text-slate-400">
            Hozircha faol nizolar yo&apos;q. Shartnoma bo&apos;yicha muammo bo&apos;lsa, yuqoridagi tugmadan nizo oching.
          </p>
        </motion.div>
      </motion.div>

      {/* Create Dispute Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Nizo ochish</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleCreateDispute} className="p-6 space-y-4">
                {createSuccess ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white">Nizo ochildi</h3>
                    <p className="text-slate-400 mt-1">Moderatorlar tez orada ko&apos;rib chiqadi</p>
                  </div>
                ) : (
                  <>
                    {createError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="text-red-400 text-sm">{createError}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Shartnoma ID</label>
                      <input type="text" value={createData.contract_id}
                        onChange={e => setCreateData({ ...createData, contract_id: e.target.value })}
                        className="glass-input w-full" placeholder="Shartnoma raqamini kiriting" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Sabab</label>
                      <select value={createData.category}
                        onChange={e => setCreateData({ ...createData, category: e.target.value })}
                        className="glass-input w-full" required>
                        <option value="">Tanlang</option>
                        <option value="QUALITY">Sifat muammosi</option>
                        <option value="DEADLINE">Muddat buzilishi</option>
                        <option value="PAYMENT">To&apos;lov muammosi</option>
                        <option value="COMMUNICATION">Aloqa muammosi</option>
                        <option value="OTHER">Boshqa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Tavsif</label>
                      <textarea value={createData.description}
                        onChange={e => setCreateData({ ...createData, description: e.target.value })}
                        className="glass-input w-full h-24 resize-none" placeholder="Muammoni batafsil tushuntiring... Kamida 20 belgi." required />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                      <button type="submit" disabled={creating} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                        {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Yuborish</>}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DisputesPage;
