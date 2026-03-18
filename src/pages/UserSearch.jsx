import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserSearchStore } from '../store/userSearchStore';
import { Users, Search, Loader2, X, ChevronLeft, Eye, Download, Star } from 'lucide-react';

export default function UserSearch() {
  const { users, userDetail, isLoading, error, searchUsers, fetchUserDetail, exportData, clearUsers } = useUserSearchStore();
  const [query, setQuery] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await searchUsers(query);
  };

  const openDetail = async (id) => {
    setShowDetail(true);
    await fetchUserDetail(id);
  };

  const handleExport = async () => {
    setExporting(true);
    await exportData();
    setExporting(false);
  };

  const navigate = useNavigate();
  const d = userDetail;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} style={{ color: '#06b6d4' }} /> Foydalanuvchilar qidiruvi
          </h1>
        </div>
        <button className="btn btn--secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" size={16} /> : <><Download size={16} /> GDPR Export</>}
        </button>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          className="form-input"
          style={{ flex: 1 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, email yoki ko'nikma bo'yicha qidiring..."
        />
        <button type="submit" className="btn btn--primary" disabled={isLoading || !query.trim()}>
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Search size={16} /> Qidirish</>}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {/* Results */}
      {users.length > 0 ? (
        <div className="grid-2">
          {users.map((u, i) => (
            <motion.div key={u.id} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ cursor: 'pointer' }} onClick={() => openDetail(u.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 20, flexShrink: 0
                }}>
                  {(u.first_name || u.email || '?')[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>
                    {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.email}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                </div>
              </div>

              {u.bio && (
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: '0 0 10px' }}>
                  {u.bio?.slice(0, 100)}{u.bio?.length > 100 ? '...' : ''}
                </p>
              )}

              {u.skills && Array.isArray(u.skills) && u.skills.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {u.skills.slice(0, 5).map((s, j) => (
                    <span key={j} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(6,182,212,0.15)', color: '#22d3ee'
                    }}>{s}</span>
                  ))}
                  {u.skills.length > 5 && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                      +{u.skills.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#475569' }}>
                {u.rating !== undefined && u.rating !== null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" /> {u.rating}
                  </span>
                )}
                {u.completed_projects !== undefined && (
                  <span>🏆 {u.completed_projects} loyiha</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : !isLoading && query ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={48} /></div>
          <h3>Natija topilmadi</h3>
          <p>Boshqa so'z bilan qidirib ko'ring</p>
        </div>
      ) : !query ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Search size={48} /></div>
          <h3>Foydalanuvchilarni qidiring</h3>
          <p>Ism, email yoki ko'nikma bo'yicha qidirish mumkin</p>
        </div>
      ) : null}

      {/* Detail modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#06b6d4' }} /> Foydalanuvchi profili
                </h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              {!d ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Loader2 className="animate-spin" size={28} style={{ color: '#06b6d4' }} /></div>
              ) : (
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  {/* Avatar + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 28
                    }}>
                      {(d.first_name || d.email || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: 20 }}>
                        {d.first_name ? `${d.first_name} ${d.last_name || ''}` : 'Nomsiz'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>{d.email}</div>
                      {d.rating !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Star size={14} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>{d.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {d.bio && (
                    <div style={{ padding: 16, background: 'rgba(6,182,212,0.06)', borderRadius: 12, border: '1px solid rgba(6,182,212,0.15)', marginBottom: 16 }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#e2e8f0' }}>{d.bio}</p>
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', lineHeight: 2.2, marginBottom: 16 }}>
                    {d.role && <div>🎭 <strong>Roli:</strong> {d.role}</div>}
                    {d.phone && <div>📞 <strong>Telefon:</strong> {d.phone}</div>}
                    {d.location && <div>📍 <strong>Joylashuv:</strong> {d.location}</div>}
                    {d.completed_projects !== undefined && <div>🏆 <strong>Tugallangan loyihalar:</strong> {d.completed_projects}</div>}
                    {d.date_joined && <div>📅 <strong>Qo'shilgan:</strong> {new Date(d.date_joined).toLocaleDateString('ru-RU')}</div>}
                    {d.is_verified !== undefined && <div>✅ <strong>Tasdiqlangan:</strong> {d.is_verified ? 'Ha' : "Yo'q"}</div>}
                  </div>

                  {/* Skills */}
                  {d.skills && Array.isArray(d.skills) && d.skills.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 8, color: 'white' }}>Ko'nikmalar</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {d.skills.map((s, j) => (
                          <span key={j} style={{
                            fontSize: 12, padding: '4px 12px', borderRadius: 8,
                            background: 'rgba(6,182,212,0.15)', color: '#22d3ee'
                          }}>{s}</span>
                        ))}
                      </div>
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
