import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { Package, Loader2, ChevronLeft, X, Eye, Crown, Check } from 'lucide-react';

export default function Subscriptions() {
  const {
    subscriptions, subscriptionDetail, mySubscription, isLoading, error,
    fetchSubscriptions, fetchSubscription, buySubscription, fetchMySubscription
  } = useSubscriptionStore();

  const [showDetail, setShowDetail] = useState(false);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
    fetchMySubscription();
  }, []);

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchSubscription(id);
  };

  const handleBuy = async (subId) => {
    setBuying(subId);
    const res = await buySubscription({ subscription_id: subId });
    setBuying(null);
    if (res) fetchMySubscription();
  };

  const navigate = useNavigate();
  const d = subscriptionDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={24} style={{ color: '#a855f7' }} /> Obunalar
          </h1>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* My subscription */}
      {mySubscription && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{
          padding: 20, marginBottom: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08))',
          border: '1px solid rgba(168,85,247,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Crown size={20} style={{ color: '#f59e0b' }} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Sizning obunalingiz</span>
          </div>
          <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 2 }}>
            <div>📦 <strong>Reja:</strong> {mySubscription.name || mySubscription.plan?.name || '—'}</div>
            {mySubscription.expires_at && <div>📅 <strong>Amal qilish:</strong> {new Date(mySubscription.expires_at).toLocaleDateString('ru-RU')}</div>}
            <div>📊 <strong>Holat:</strong> {mySubscription.is_active ? '✅ Faol' : '❌ Nofaol'}</div>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#a855f7' }} /></div>
      ) : subscriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={48} /></div>
          <h3>Obunalar yo'q</h3>
          <p>Hozircha mavjud obuna rejalari yo'q</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {subscriptions.map((sub, i) => (
            <motion.div key={sub.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center', padding: 28 }}
            >
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Package size={36} style={{ color: '#a855f7' }} />
                </div>
                <h3 style={{ margin: '0 0 8px', color: 'white', fontSize: 20 }}>{sub.name || sub.title || 'Obuna'}</h3>
                {sub.price !== undefined && (
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#a855f7', marginBottom: 8 }}>
                    ${sub.price}<span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}>/oy</span>
                  </div>
                )}
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                  {sub.description?.slice(0, 120) || "Premium imkoniyatlar"}
                </p>
                {sub.features && Array.isArray(sub.features) && (
                  <div style={{ textAlign: 'left', marginBottom: 16 }}>
                    {sub.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: '#cbd5e1' }}>
                        <Check size={14} style={{ color: '#10b981' }} /> {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => openDetail(sub.id)}>
                  <Eye size={14} /> Batafsil
                </button>
                <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => handleBuy(sub.id)} disabled={buying === sub.id}>
                  {buying === sub.id ? <Loader2 className="animate-spin" size={16} /> : 'Sotib olish'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title"><Eye size={18} style={{ color: '#a855f7' }} /> Obuna tafsilotlari</h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#a855f7' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h2 style={{ color: 'white', margin: '0 0 4px' }}>{d.name || d.title}</h2>
                    {d.price !== undefined && <div style={{ fontSize: 28, fontWeight: 800, color: '#a855f7' }}>${d.price}<span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>/oy</span></div>}
                  </div>
                  <div style={{ padding: 16, background: 'rgba(168,85,247,0.06)', borderRadius: 12, border: '1px solid rgba(168,85,247,0.15)', marginBottom: 16 }}>
                    <p style={{ margin: 0, lineHeight: 1.7, color: '#e2e8f0' }}>{d.description || "Ma'lumot yo'q"}</p>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', lineHeight: 2.2 }}>
                    {d.duration_days && <div>📅 <strong>Muddat:</strong> {d.duration_days} kun</div>}
                    {d.token_limit && <div>🪙 <strong>Token limiti:</strong> {d.token_limit}</div>}
                    {d.created_at && <div>🕐 <strong>Yaratilgan:</strong> {new Date(d.created_at).toLocaleDateString('ru-RU')}</div>}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
