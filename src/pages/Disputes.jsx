import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDisputeStore } from '../store/disputeStore';
import { AlertTriangle, Loader2, Gavel, Plus, ChevronLeft } from 'lucide-react';

export default function Disputes() {
  const { isLoading, error, result, createDispute, resolveDispute, clearResult } = useDisputeStore();
  const [mode, setMode] = useState('create'); // create | resolve
  const [createForm, setCreateForm] = useState({ contract: '', reason: '', description: '' });
  const [resolveForm, setResolveForm] = useState({ dispute_id: '', resolution: 'REFUND_CLIENT', refund_amount: '', release_amount: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    await createDispute({
      contract: createForm.contract,
      reason: createForm.reason,
      description: createForm.description,
    });
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    const payload = {
      dispute_id: parseInt(resolveForm.dispute_id),
      resolution: resolveForm.resolution,
    };
    if (resolveForm.resolution === 'SPLIT') {
      payload.refund_amount = resolveForm.refund_amount;
      payload.release_amount = resolveForm.release_amount;
    }
    await resolveDispute(payload);
  };

  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} /> Bahslar (Disputes)
          </h1>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`btn ${mode === 'create' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => { setMode('create'); clearResult(); }}>
          <Plus size={16} /> Bahs yaratish
        </button>
        <button className={`btn ${mode === 'resolve' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => { setMode('resolve'); clearResult(); }}>
          <Gavel size={16} /> Bahsni hal qilish
        </button>
      </div>

      <motion.div className="card" style={{ maxWidth: 560 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {mode === 'create' ? (
          <>
            <h3 style={{ margin: '0 0 16px', color: 'white', fontSize: 16 }}>🚨 Bahs yaratish</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Shartnoma ID si (UUID)</label>
                <input className="form-input" required value={createForm.contract} onChange={(e) => setCreateForm({ ...createForm, contract: e.target.value })} placeholder="Shartnoma UUID si" />
              </div>
              <div className="form-group">
                <label className="form-label">Sabab</label>
                <input className="form-input" required value={createForm.reason} onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })} placeholder="Bahsning qisqacha sababi" />
              </div>
              <div className="form-group">
                <label className="form-label">Tavsif</label>
                <textarea className="form-textarea" required value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Muammoning batafsil tavsifi..." />
              </div>
              <button type="submit" className="btn btn--danger" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : '⚠️ Bahs yaratish'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h3 style={{ margin: '0 0 16px', color: 'white', fontSize: 16 }}>⚖️ Bahsni hal qilish (Admin)</h3>
            <form onSubmit={handleResolve}>
              <div className="form-group">
                <label className="form-label">Bahs ID si</label>
                <input className="form-input" type="number" required value={resolveForm.dispute_id} onChange={(e) => setResolveForm({ ...resolveForm, dispute_id: e.target.value })} placeholder="Bahs ID si" />
              </div>
              <div className="form-group">
                <label className="form-label">Yechim</label>
                <select className="form-select" value={resolveForm.resolution} onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}>
                  <option value="REFUND_CLIENT">Mijozga 100% qaytarish</option>
                  <option value="RELEASE_FREELANCER">Frilanserga 100% berish</option>
                  <option value="SPLIT">Bo'lish</option>
                </select>
              </div>
              {resolveForm.resolution === 'SPLIT' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Mijozga qaytarish ($)</label>
                    <input className="form-input" type="number" step="0.01" value={resolveForm.refund_amount} onChange={(e) => setResolveForm({ ...resolveForm, refund_amount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frilanserga berish ($)</label>
                    <input className="form-input" type="number" step="0.01" value={resolveForm.release_amount} onChange={(e) => setResolveForm({ ...resolveForm, release_amount: e.target.value })} />
                  </div>
                </>
              )}
              <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : '⚖️ Bahsni hal qilish'}
              </button>
            </form>
          </>
        )}

        {error && <div className="error-msg" style={{ marginTop: 16 }}>{error}</div>}
        {result && (
          <motion.div className="success-msg" style={{ marginTop: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            ✅ {mode === 'create' ? 'Bahs yaratildi!' : 'Bahs hal qilindi!'} {typeof result === 'object' ? JSON.stringify(result) : result}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
