import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTwoFactorStore } from '../store/twoFactorStore';
import { Shield, Loader2, ChevronLeft, QrCode, KeyRound, ShieldOff } from 'lucide-react';

export default function TwoFactor() {
  const { qrCode, isEnabled, isLoading, error, success, setup2FA, confirm2FA, disable2FA, clearMessages } = useTwoFactorStore();
  const [step, setStep] = useState('main');
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const navigate = useNavigate();

  const handleSetup = async () => {
    clearMessages();
    const data = await setup2FA();
    if (data) setStep('confirm');
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    clearMessages();
    const ok = await confirm2FA(code);
    if (ok) { setStep('main'); setCode(''); }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    clearMessages();
    const ok = await disable2FA(disableCode);
    if (ok) { setStep('main'); setDisableCode(''); }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={24} style={{ color: '#10b981' }} /> Ikki bosqichli himoya (2FA)
          </h1>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div style={{ maxWidth: 480 }}>
        {step === 'main' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <Shield size={48} style={{ color: isEnabled ? '#10b981' : '#64748b', marginBottom: 16 }} />
              <h3 style={{ color: 'white', margin: '0 0 8px' }}>
                {isEnabled ? '2FA yoqilgan ✅' : '2FA o\'chirilgan'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                Ikki bosqichli himoya sizning hisobingizni yanada xavfsiz qiladi. 
                Google Authenticator yoki shunga o'xshash dastur orqali ishlaydi.
              </p>

              {!isEnabled ? (
                <button className="btn btn--primary" onClick={handleSetup} disabled={isLoading} style={{ width: '100%' }}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><QrCode size={16} /> 2FA ni yoqish</>}
                </button>
              ) : (
                <button className="btn btn--danger" onClick={() => { setStep('disable'); clearMessages(); }} style={{ width: '100%' }}>
                  <ShieldOff size={16} /> 2FA ni o'chirish
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ color: 'white', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <QrCode size={20} style={{ color: '#10b981' }} /> QR kodni skanerlang
              </h3>

              {qrCode && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  {qrCode.qr_code_url ? (
                    <img src={qrCode.qr_code_url} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12, background: 'white', padding: 8 }} />
                  ) : qrCode.secret ? (
                    <div style={{ padding: 16, background: 'rgba(16,185,129,0.06)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Secret key:</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, color: '#10b981', fontWeight: 700, letterSpacing: 2, wordBreak: 'break-all' }}>
                        {qrCode.secret}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 16, background: 'rgba(16,185,129,0.06)', borderRadius: 12 }}>
                      <pre style={{ color: '#e2e8f0', fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(qrCode, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleConfirm}>
                <div className="form-group">
                  <label className="form-label">Authenticator dasturidan kodni kiriting</label>
                  <input className="form-input" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6}
                    style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn--secondary" style={{ flex: 1 }} onClick={() => { setStep('main'); clearMessages(); }}>Bekor qilish</button>
                  <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Tasdiqlash'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {step === 'disable' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ color: 'white', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldOff size={20} style={{ color: '#ef4444' }} /> 2FA ni o'chirish
              </h3>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
                O'chirish uchun authenticator dasturidagi kodni kiriting.
              </p>
              <form onSubmit={handleDisable}>
                <div className="form-group">
                  <label className="form-label">Kod</label>
                  <input className="form-input" required value={disableCode} onChange={(e) => setDisableCode(e.target.value)} placeholder="123456" maxLength={6}
                    style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn--secondary" style={{ flex: 1 }} onClick={() => { setStep('main'); clearMessages(); }}>Bekor qilish</button>
                  <button type="submit" className="btn btn--danger" style={{ flex: 1 }} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : "O'chirish"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
