import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFreelanceStore } from '../store/freelanceStore';
import { FileCheck, Loader2, ChevronLeft } from 'lucide-react';

export default function Contracts() {
  const { contracts, isLoading, error, fetchContracts } = useFreelanceStore();

  useEffect(() => { fetchContracts(); }, []);

  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileCheck size={24} style={{ color: '#f59e0b' }} /> Shartnomalar
          </h1>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#f59e0b' }} /></div>
      ) : contracts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileCheck size={48} /></div>
          <h3>Shartnomalar yo'q</h3>
          <p>Shartnomalar taklif qabul qilinganda avtomatik ravishda yaratiladi</p>
        </div>
      ) : (
        <div className="grid-2">
          {contracts.map((c, i) => (
            <motion.div key={c.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ margin: 0, color: 'white', fontSize: 15 }}>Shartnoma</h4>
                <span className={`badge badge--${(c.status || 'pending').toLowerCase()}`}>{c.status || 'ACTIVE'}</span>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 2 }}>
                <div>📋 ID: <span style={{ color: '#64748b', fontSize: 11 }}>{c.id}</span></div>
                {c.job && <div>📁 Loyiha: {typeof c.job === 'object' ? c.job.title : c.job}</div>}
                {c.client_detail && <div>👤 Mijoz: {c.client_detail.first_name || c.client_detail.email}</div>}
                {c.freelancer_detail && <div>💻 Frilanser: {c.freelancer_detail.first_name || c.freelancer_detail.email}</div>}
                {c.total_amount && <div>💰 Summa: ${c.total_amount}</div>}
                {c.escrow_status && <div>🔒 Escrow: {c.escrow_status}</div>}
                {c.created_at && <div>📅 Yaratilgan: {new Date(c.created_at).toLocaleDateString('ru-RU')}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
