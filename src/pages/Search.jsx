import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../store/searchStore';
import { Search as SearchIcon, Loader2, Briefcase, Users, ChevronLeft } from 'lucide-react';

export default function Search() {
  const { jobResults, userResults, isLoading, error, searchJobs, searchUsers, clearResults } = useSearchStore();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('jobs');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    clearResults();
    if (tab === 'jobs') {
      await searchJobs(query);
    } else {
      await searchUsers(query);
    }
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
            <SearchIcon size={24} style={{ color: '#6366f1' }} /> Qidiruv
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${tab === 'jobs' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => { setTab('jobs'); clearResults(); }}
        >
          <Briefcase size={16} /> Loyihalar
        </button>
        <button
          className={`btn ${tab === 'users' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => { setTab('users'); clearResults(); }}
        >
          <Users size={16} /> Foydalanuvchilar
        </button>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          className="form-input"
          style={{ flex: 1 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'jobs' ? 'Loyiha nomini qidirish...' : 'Foydalanuvchini qidirish...'}
        />
        <button type="submit" className="btn btn--primary" disabled={isLoading || !query.trim()}>
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><SearchIcon size={16} /> Qidirish</>}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {/* Results */}
      {tab === 'jobs' && jobResults.length > 0 && (
        <div className="grid-2">
          {jobResults.map((job, i) => (
            <motion.div key={job.id} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ margin: 0, color: 'white', fontSize: 15 }}>{job.title}</h4>
                <span className={`badge badge--${(job.status || 'open').toLowerCase()}`}>{job.status || 'OPEN'}</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: '8px 0' }}>{job.description?.slice(0, 120)}</p>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 2 }}>
                {job.budget && <div>💰 ${job.budget}</div>}
                {job.deadline && <div>📅 {new Date(job.deadline).toLocaleDateString('ru-RU')}</div>}
                {job.client_detail && <div>👤 {job.client_detail.first_name || job.client_detail.email}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'users' && userResults.length > 0 && (
        <div className="grid-2">
          {userResults.map((u, i) => (
            <motion.div key={u.id} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 18
                }}>
                  {(u.first_name || u.email)?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                </div>
              </div>
              {u.skills && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(Array.isArray(u.skills) ? u.skills : []).slice(0, 5).map((s, j) => (
                    <span key={j} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(99,102,241,0.15)', color: '#818cf8'
                    }}>{s}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && tab === 'jobs' && jobResults.length === 0 && query && (
        <div className="empty-state">
          <div className="empty-state-icon"><Briefcase size={48} /></div>
          <h3>Natija topilmadi</h3>
          <p>Boshqa so'z bilan qidirib ko'ring</p>
        </div>
      )}

      {!isLoading && tab === 'users' && userResults.length === 0 && query && (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={48} /></div>
          <h3>Natija topilmadi</h3>
          <p>Boshqa so'z bilan qidirib ko'ring</p>
        </div>
      )}

      {!query && (
        <div className="empty-state">
          <div className="empty-state-icon"><SearchIcon size={48} /></div>
          <h3>Qidiruvni boshlang</h3>
          <p>{tab === 'jobs' ? "Loyihalarni qidiring" : "Foydalanuvchilarni qidiring"}</p>
        </div>
      )}
    </div>
  );
}
