import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVideoCallStore } from '../store/videoCallStore';
import { VideoCallRoom } from '../components/VideoCallRoom';
import {
  Video, Loader2, ChevronLeft, X, Eye, Phone, PhoneOff, Clock,
  User, Users, Wifi, WifiOff, Monitor, History, Zap, AlertCircle, Plus
} from 'lucide-react';

const statusColors = {
  ACTIVE: '#10b981', IN_PROGRESS: '#10b981',
  ENDED: '#64748b', COMPLETED: '#64748b',
  MISSED: '#ef4444', CANCELLED: '#f59e0b',
  RINGING: '#3b82f6', CONNECTING: '#6366f1',
};
const statusLabels = {
  ACTIVE: 'Faol', IN_PROGRESS: 'Davom etmoqda',
  ENDED: 'Tugagan', COMPLETED: 'Tugagan',
  MISSED: "Javobsiz", CANCELLED: 'Bekor qilingan',
  RINGING: "Jiringlayapti", CONNECTING: 'Ulanmoqda',
};

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Hozirgina';
  if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function VideoCalls() {
  const {
    calls, callDetail, activeCall, iceServers, roomHistory, isLoading, error, currentCall,
    fetchCalls, fetchCall, fetchActiveCall, fetchIceServers, fetchRoomHistory,
    clearError, initiateCall, hangUp
  } = useVideoCallStore();

  const [activeTab, setActiveTab] = useState('history');
  const [showDetail, setShowDetail] = useState(false);
  const [showCallRoom, setShowCallRoom] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCalls();
    fetchActiveCall();
    fetchIceServers();
    fetchRoomHistory();
  }, []);

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchCall(id);
  };

  const startVideoCall = async (roomId) => {
    setIsCaller(true);
    setSelectedRoomId(roomId);
    const result = await initiateCall(roomId, null, 'VIDEO');
    if (result) {
      setShowCallRoom(true);
    }
  };

  const handleEndCall = () => {
    hangUp();
    setShowCallRoom(false);
    setIsCaller(false);
    setSelectedRoomId(null);
    fetchActiveCall();
  };

  const handleIncomingCall = (callData) => {
    // Kiruvchi qo'ng'iroqni qabul qilish
    setIsCaller(false);
    setShowCallRoom(true);
  };

  const tabs = [
    { id: 'history', label: "Qo'ng'iroqlar", icon: History, count: calls.length },
    { id: 'active', label: 'Faol', icon: Zap, count: activeCall ? 1 : 0 },
    { id: 'rooms', label: 'Xona tarixi', icon: Monitor, count: roomHistory.length },
    { id: 'ice', label: 'ICE Serverlar', icon: Wifi, count: iceServers.length },
  ];

  const d = callDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(16,185,129,0.1)', borderRadius: 12 }}>
              <Video size={22} style={{ color: '#10b981' }} />
            </div>
            Video Qo'ng'iroqlar
          </h1>
        </div>
      </div>

      {error && (
        <div className="error-msg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
          <button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: activeTab === t.id ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: activeTab === t.id ? '#10b981' : '#64748b',
            }}>
            <t.icon size={15} /> {t.label}
            {t.count > 0 && (
              <span style={{
                padding: '1px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                background: activeTab === t.id ? '#10b98130' : 'rgba(255,255,255,0.05)',
                color: activeTab === t.id ? '#10b981' : '#64748b',
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          {isLoading ? (
            <div className="loader-center"><Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} /></div>
          ) : calls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ background: 'rgba(16,185,129,0.06)' }}>
                <Video size={48} style={{ color: '#10b981' }} />
              </div>
              <h3>Qo'ng'iroqlar yo'q</h3>
              <p>Hozircha hech qanday video qo'ng'iroq amalga oshirilmagan</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {calls.map((call, i) => (
                <motion.div key={call.id} className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ padding: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(255,255,255,0.03)' }}
                  whileHover={{ borderColor: 'rgba(16,185,129,0.2)', y: -2 }}
                  onClick={() => openDetail(call.id)}
                >
                  {/* Call icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: call.status === 'MISSED' ? 'rgba(239,68,68,0.1)' :
                      call.status === 'ACTIVE' || call.status === 'IN_PROGRESS' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                    border: `1px solid ${call.status === 'MISSED' ? 'rgba(239,68,68,0.2)' :
                      call.status === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.1)'}`,
                  }}>
                    {call.status === 'MISSED' ? <PhoneOff size={20} style={{ color: '#ef4444' }} />
                      : call.status === 'ACTIVE' || call.status === 'IN_PROGRESS' ? <Phone size={20} style={{ color: '#10b981' }} />
                        : <Video size={20} style={{ color: '#64748b' }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                        {call.room_name || call.caller_email || `Qo'ng'iroq #${call.id}`}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                        background: `${statusColors[call.status] || '#64748b'}20`,
                        color: statusColors[call.status] || '#64748b',
                      }}>
                        {statusLabels[call.status] || call.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#64748b' }}>
                      {call.participants_count && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Users size={12} /> {call.participants_count} ishtirokchi
                        </span>
                      )}
                      {call.duration && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={12} /> {formatDuration(call.duration)}
                        </span>
                      )}
                      <span>{timeAgo(call.created_at || call.started_at)}</span>
                    </div>
                  </div>

                  <button className="btn btn--secondary btn--sm" onClick={(e) => { e.stopPropagation(); openDetail(call.id); }}>
                    <Eye size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Active Call Tab */}
      {activeTab === 'active' && (
        <div style={{ maxWidth: 520 }}>
          {!activeCall ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ background: 'rgba(16,185,129,0.06)' }}>
                <PhoneOff size={48} style={{ color: '#64748b' }} />
              </div>
              <h3>Faol qo'ng'iroq yo'q</h3>
              <p>Hozir hech qanday qo'ng'iroq davom etmayapti</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn btn--secondary" onClick={fetchActiveCall}>
                  <Loader2 size={14} /> Tekshirish
                </button>
                <button className="btn btn--primary" onClick={() => startVideoCall(1)}>
                  <Plus size={14} /> Yangi qo'ng'iroq
                </button>
              </div>
            </div>
          ) : (
            <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ padding: 28, textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}>
              {/* Pulsing indicator */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: 'rgba(16,185,129,0.2)' }}
                />
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981',
                }}>
                  <Phone size={28} style={{ color: '#10b981' }} />
                </div>
              </div>
              <h3 style={{ color: 'white', margin: '0 0 6px', fontSize: 18 }}>
                {activeCall.room_name || `Qo'ng'iroq #${activeCall.id}`}
              </h3>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                {statusLabels[activeCall.status] || activeCall.status}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                {activeCall.participants_count && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={14} /> {activeCall.participants_count}
                  </span>
                )}
                {activeCall.duration && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} /> {formatDuration(activeCall.duration)}
                  </span>
                )}
              </div>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, fontSize: 12, color: '#64748b', lineHeight: 2 }}>
                <div>🆔 ID: <strong style={{ color: '#e2e8f0' }}>{activeCall.id}</strong></div>
                {activeCall.caller_email && <div>📞 Qo'ng'iroqchi: <strong style={{ color: '#e2e8f0' }}>{activeCall.caller_email}</strong></div>}
                {activeCall.started_at && <div>🕐 Boshlangan: <strong style={{ color: '#e2e8f0' }}>{new Date(activeCall.started_at).toLocaleString('ru-RU')}</strong></div>}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
                <button
                  className="btn btn--primary"
                  onClick={() => startVideoCall(activeCall.room_id || activeCall.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Video size={18} /> Qo'ng'iroqqa qo'shilish
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Room History Tab */}
      {activeTab === 'rooms' && (
        <>
          {roomHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ background: 'rgba(99,102,241,0.06)' }}>
                <Monitor size={48} style={{ color: '#6366f1' }} />
              </div>
              <h3>Xona tarixi yo'q</h3>
              <p>Xonalardagi qo'ng'iroq tarixi hozircha bo'sh</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Xona', 'Ishtirokchilar', 'Davomiylik', 'Holat', 'Sana'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roomHistory.map((item, i) => (
                    <motion.tr key={item.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                        {item.room_name || `Xona #${item.room_id || item.id}`}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={13} /> {item.participants_count || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>
                        {formatDuration(item.duration)}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                          background: `${statusColors[item.status] || '#64748b'}20`,
                          color: statusColors[item.status] || '#64748b',
                        }}>
                          {statusLabels[item.status] || item.status || 'ENDED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b' }}>
                        {timeAgo(item.created_at || item.started_at)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ICE Servers Tab */}
      {activeTab === 'ice' && (
        <div>
          <div style={{ marginBottom: 16, padding: 14, background: 'rgba(16,185,129,0.05)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.1)', fontSize: 13, color: '#94a3b8' }}>
            💡 ICE serverlar WebRTC ulanishini o'rnatish uchun ishlatiladi. STUN serverlar NAT orqali ulanish imkonini beradi, TURN serverlar esa to'g'ridan-to'g'ri ulanish imkoni bo'lmaganda relay sifatida ishlaydi.
          </div>
          {iceServers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ background: 'rgba(239,68,68,0.06)' }}>
                <WifiOff size={48} style={{ color: '#ef4444' }} />
              </div>
              <h3>ICE serverlar topilmadi</h3>
              <p>Backend dan ICE konfiguratsiya olinmadi</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {iceServers.map((server, i) => (
                <motion.div key={i} className="card" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: server.urls?.includes('turn') ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${server.urls?.includes('turn') ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  }}>
                    <Wifi size={18} style={{ color: server.urls?.includes('turn') ? '#f59e0b' : '#10b981' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                      {server.urls?.includes('turn') ? 'TURN Server' : 'STUN Server'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {typeof server.urls === 'string' ? server.urls : JSON.stringify(server.urls)}
                    </div>
                    {server.username && (
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                        👤 {server.username}
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                    background: server.urls?.includes('turn') ? '#f59e0b15' : '#10b98115',
                    color: server.urls?.includes('turn') ? '#f59e0b' : '#10b981',
                  }}>
                    {server.urls?.includes('turn') ? 'RELAY' : 'P2P'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Call Room Overlay */}
      <AnimatePresence>
        {showCallRoom && currentCall && (
          <VideoCallRoom
            callId={currentCall.id}
            isCaller={isCaller}
            roomName={currentCall.room_name || `Qo'ng'iroq #${currentCall.id}`}
            onEndCall={handleEndCall}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title"><Video size={18} style={{ color: '#10b981' }} /> Qo'ng'iroq tafsiloti</h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <Loader2 className="animate-spin" size={28} style={{ color: '#10b981' }} />
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <div style={{
                    padding: 16, background: 'rgba(16,185,129,0.06)', borderRadius: 12,
                    border: '1px solid rgba(16,185,129,0.15)', lineHeight: 2.2,
                  }}>
                    <div>🆔 <strong>ID:</strong> {d.id}</div>
                    <div>📞 <strong>Qo'ng'iroqchi:</strong> {d.caller_email || '—'}</div>
                    <div>🏠 <strong>Xona:</strong> {d.room_name || '—'}</div>
                    <div>👥 <strong>Ishtirokchilar:</strong> {d.participants_count || '—'}</div>
                    <div>📊 <strong>Holat:</strong>
                      <span style={{
                        marginLeft: 6, padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: `${statusColors[d.status] || '#64748b'}20`,
                        color: statusColors[d.status] || '#64748b',
                      }}>
                        {statusLabels[d.status] || d.status}
                      </span>
                    </div>
                    <div>⏱️ <strong>Davomiylik:</strong> {formatDuration(d.duration)}</div>
                    <div>🕐 <strong>Boshlangan:</strong> {d.started_at ? new Date(d.started_at).toLocaleString('ru-RU') : '—'}</div>
                    {d.ended_at && <div>🔚 <strong>Tugagan:</strong> {new Date(d.ended_at).toLocaleString('ru-RU')}</div>}
                  </div>

                  {d.participants && d.participants.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>ISHTIROKCHILAR:</div>
                      {d.participants.map((p, i) => (
                        <div key={i} style={{
                          padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                          marginBottom: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <User size={14} style={{ color: '#64748b' }} />
                          <span style={{ color: '#e2e8f0' }}>{p.email || p.user_email || `User #${p.user_id || p.id}`}</span>
                          {p.joined_at && <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>{new Date(p.joined_at).toLocaleTimeString('ru-RU')}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
