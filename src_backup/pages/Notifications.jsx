import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { Bell, Loader2, CheckCheck, Eye, X, ChevronLeft } from 'lucide-react';

export default function Notifications() {
  const {
    notifications, notificationDetail, unreadCount, isLoading, error,
    fetchNotifications, fetchNotification, markRead, markAllRead, fetchUnreadCount
  } = useNotificationStore();

  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const openDetail = async (n) => {
    setShowDetail(true);
    await fetchNotification(n.id);
    if (!n.is_read) await markRead(n.id);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const navigate = useNavigate();
  const d = notificationDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={24} style={{ color: '#f59e0b' }} /> Bildirishnomalar
            {unreadCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: 'white', fontSize: 12, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20, marginLeft: 4
              }}>{unreadCount}</span>
            )}
          </h1>
        </div>
        <button className="btn btn--secondary" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
          <CheckCheck size={16} /> Barchasini o'qilgan deb belgilash
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isLoading ? (
        <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#f59e0b' }} /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={48} /></div>
          <h3>Bildirishnomalar yo'q</h3>
          <p>Yangi bildirishnomalar shu yerda paydo bo'ladi</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => openDetail(n)}
              style={{
                padding: '16px 20px',
                background: n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${n.is_read ? 'rgba(255,255,255,0.06)' : 'rgba(245,158,11,0.2)'}`,
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: n.is_read ? 'transparent' : '#f59e0b',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: n.is_read ? '#94a3b8' : 'white', fontWeight: n.is_read ? 400 : 600, fontSize: 14, marginBottom: 4 }}>
                  {n.title || n.message || n.content || 'Bildirishnoma'}
                </div>
                {n.body && <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                  {n.created_at ? new Date(n.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
              {!n.is_read && (
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                  title="O'qilgan deb belgilash"
                  style={{ flexShrink: 0 }}
                >
                  <CheckCheck size={14} />
                </button>
              )}
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
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#f59e0b' }} /> Bildirishnoma
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#f59e0b' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{ padding: 16, background: 'rgba(245,158,11,0.06)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.15)', marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 8 }}>{d.title || d.message || 'Bildirishnoma'}</div>
                    <p style={{ margin: 0, lineHeight: 1.7, color: '#e2e8f0' }}>{d.body || d.content || d.message || "Ma'lumot yo'q"}</p>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', lineHeight: 2.2 }}>
                    <div>📋 <strong>Tur:</strong> {d.notification_type || d.type || '—'}</div>
                    <div>📊 <strong>Holat:</strong> {d.is_read ? "O'qilgan ✅" : "O'qilmagan 🔔"}</div>
                    {d.created_at && <div>📅 <strong>Vaqt:</strong> {new Date(d.created_at).toLocaleString('ru-RU')}</div>}
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
