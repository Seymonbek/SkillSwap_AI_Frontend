import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useKycStore } from '../store/kycStore';
import { BadgeCheck, Loader2, ChevronLeft, Upload, FileCheck } from 'lucide-react';

export default function KYC() {
  const { status, isLoading, error, success, fetchKycStatus, submitKyc, clearMessages } = useKycStore();
  const [document_type, setDocType] = useState('passport');
  const fileRef = useRef(null);

  useEffect(() => { fetchKycStatus(); }, []);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    const file = fileRef.current?.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('document_type', document_type);
    formData.append('document', file);
    await submitKyc(formData);
    fetchKycStatus();
  };

  const statusColor = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    not_submitted: '#64748b',
  };

  const statusText = {
    pending: "Ko'rib chiqilmoqda ⏳",
    approved: 'Tasdiqlangan ✅',
    rejected: 'Rad etilgan ❌',
    not_submitted: 'Yuborilmagan',
  };

  const kycStatus = status?.status || status?.kyc_status || 'not_submitted';

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BadgeCheck size={24} style={{ color: '#06b6d4' }} /> Shaxsni tasdiqlash (KYC)
          </h1>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div style={{ maxWidth: 520 }}>
        {/* Status card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 28 }}>
          <BadgeCheck size={48} style={{ color: statusColor[kycStatus] || '#64748b', marginBottom: 12 }} />
          <h3 style={{ color: 'white', margin: '0 0 8px' }}>KYC holati</h3>
          <div style={{
            display: 'inline-block', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600,
            background: `${statusColor[kycStatus]}20`, color: statusColor[kycStatus], border: `1px solid ${statusColor[kycStatus]}40`,
          }}>
            {statusText[kycStatus] || kycStatus}
          </div>
          {status && (
            <div style={{ marginTop: 16, fontSize: 13, color: '#94a3b8', lineHeight: 2 }}>
              {status.document_type && <div>📄 Hujjat turi: <strong>{status.document_type}</strong></div>}
              {status.submitted_at && <div>📅 Yuborilgan: {new Date(status.submitted_at).toLocaleDateString('ru-RU')}</div>}
              {status.reviewed_at && <div>✅ Ko'rib chiqilgan: {new Date(status.reviewed_at).toLocaleDateString('ru-RU')}</div>}
              {status.rejection_reason && <div style={{ color: '#ef4444' }}>❌ Sabab: {status.rejection_reason}</div>}
            </div>
          )}
        </motion.div>

        {/* Submit form */}
        {(kycStatus === 'not_submitted' || kycStatus === 'rejected') && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ padding: 28 }}>
            <h3 style={{ color: 'white', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Upload size={20} style={{ color: '#06b6d4' }} /> Hujjatni yuborish
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Hujjat turi</label>
                <select className="form-input" value={document_type} onChange={(e) => setDocType(e.target.value)}>
                  <option value="passport">Pasport</option>
                  <option value="id_card">ID karta</option>
                  <option value="driver_license">Haydovchilik guvohnomasi</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hujjat faylini yuklang</label>
                <input type="file" ref={fileRef} className="form-input" accept="image/*,.pdf" required
                  style={{ padding: 10 }} />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>JPG, PNG yoki PDF (max 5MB)</div>
              </div>
              <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><FileCheck size={16} /> Yuborish</>}
              </button>
            </form>
          </motion.div>
        )}

        {kycStatus === 'pending' && (
          <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
            Hujjatingiz ko'rib chiqilmoqda. Bu 1-3 ish kuni davom etishi mumkin.
          </div>
        )}
      </div>
    </div>
  );
}
