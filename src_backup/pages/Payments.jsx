import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePaymentStore } from '../store/paymentStore';
import { CreditCard, Loader2, ChevronLeft, Coins, Shield, ArrowRightLeft } from 'lucide-react';

export default function Payments() {
  const { isLoading, error, success, buyTokens, createPaymentIntent, fundEscrow, releaseEscrow, clearMessages } = usePaymentStore();
  const [tab, setTab] = useState('tokens');
  const [tokenForm, setTokenForm] = useState({ amount: '' });
  const [intentForm, setIntentForm] = useState({ amount: '', currency: 'usd' });
  const [escrowFundForm, setEscrowFundForm] = useState({ milestone_id: '', amount: '' });
  const [escrowReleaseForm, setEscrowReleaseForm] = useState({ milestone_id: '' });

  const navigate = useNavigate();

  const handleBuyTokens = async (e) => {
    e.preventDefault();
    clearMessages();
    await buyTokens({ amount: Number(tokenForm.amount) });
  };

  const handleCreateIntent = async (e) => {
    e.preventDefault();
    clearMessages();
    await createPaymentIntent({ amount: Number(intentForm.amount), currency: intentForm.currency });
  };

  const handleFundEscrow = async (e) => {
    e.preventDefault();
    clearMessages();
    await fundEscrow({ milestone_id: Number(escrowFundForm.milestone_id), amount: Number(escrowFundForm.amount) });
  };

  const handleReleaseEscrow = async (e) => {
    e.preventDefault();
    clearMessages();
    await releaseEscrow({ milestone_id: Number(escrowReleaseForm.milestone_id) });
  };

  const tabs = [
    { key: 'tokens', label: 'Token sotib olish', icon: Coins },
    { key: 'stripe', label: 'Stripe to\'lov', icon: CreditCard },
    { key: 'escrow', label: 'Escrow', icon: Shield },
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={24} style={{ color: '#10b981' }} /> To'lovlar
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map((t) => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn--primary' : 'btn--secondary'}`} onClick={() => { setTab(t.key); clearMessages(); }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {error && <div className="error-msg">{typeof error === 'object' ? JSON.stringify(error) : error}</div>}
      {success && <div className="success-msg">✅ Muvaffaqiyatli! {typeof success === 'object' ? JSON.stringify(success) : success}</div>}

      <div style={{ maxWidth: 500 }}>
        {tab === 'tokens' && (
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ margin: '0 0 16px', color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coins size={20} style={{ color: '#f59e0b' }} /> Token sotib olish
            </h3>
            <form onSubmit={handleBuyTokens}>
              <div className="form-group">
                <label className="form-label">Token miqdori</label>
                <input className="form-input" type="number" required min="1" value={tokenForm.amount} onChange={(e) => setTokenForm({ amount: e.target.value })} placeholder="100" />
              </div>
              <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sotib olish'}
              </button>
            </form>
          </motion.div>
        )}

        {tab === 'stripe' && (
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ margin: '0 0 16px', color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={20} style={{ color: '#6366f1' }} /> Stripe to'lov
            </h3>
            <form onSubmit={handleCreateIntent}>
              <div className="form-group">
                <label className="form-label">Summa</label>
                <input className="form-input" type="number" required min="1" value={intentForm.amount} onChange={(e) => setIntentForm({ ...intentForm, amount: e.target.value })} placeholder="50" />
              </div>
              <div className="form-group">
                <label className="form-label">Valyuta</label>
                <select className="form-input" value={intentForm.currency} onChange={(e) => setIntentForm({ ...intentForm, currency: e.target.value })}>
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="uzs">UZS</option>
                </select>
              </div>
              <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "To'lov yaratish"}
              </button>
            </form>
          </motion.div>
        )}

        {tab === 'escrow' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h3 style={{ margin: '0 0 16px', color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={20} style={{ color: '#10b981' }} /> Escrow moliyalashtirish
              </h3>
              <form onSubmit={handleFundEscrow}>
                <div className="form-group">
                  <label className="form-label">Milestone ID</label>
                  <input className="form-input" type="number" required value={escrowFundForm.milestone_id} onChange={(e) => setEscrowFundForm({ ...escrowFundForm, milestone_id: e.target.value })} placeholder="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Summa</label>
                  <input className="form-input" type="number" required min="1" value={escrowFundForm.amount} onChange={(e) => setEscrowFundForm({ ...escrowFundForm, amount: e.target.value })} placeholder="100" />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Moliyalashtirish'}
                </button>
              </form>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 style={{ margin: '0 0 16px', color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowRightLeft size={20} style={{ color: '#22d3ee' }} /> Escrow to'lash
              </h3>
              <form onSubmit={handleReleaseEscrow}>
                <div className="form-group">
                  <label className="form-label">Milestone ID</label>
                  <input className="form-input" type="number" required value={escrowReleaseForm.milestone_id} onChange={(e) => setEscrowReleaseForm({ milestone_id: e.target.value })} placeholder="1" />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "To'lash"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
