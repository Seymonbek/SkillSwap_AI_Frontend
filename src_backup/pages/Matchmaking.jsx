import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { Sparkles, Loader2, Zap, ArrowRight, ChevronLeft } from 'lucide-react';

export default function Matchmaking() {
  const { matchResult, matchLoading, error, runMatchmaking } = useSessionStore();
  const [form, setForm] = useState({ skills_i_have: '', skills_i_want: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    runMatchmaking(form);
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
            <Sparkles size={24} style={{ color: '#f59e0b' }} /> AI Sherik izlash
          </h1>
        </div>
      </div>

      <motion.div
        className="card"
        style={{ maxWidth: 640 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: 700, color: 'white', fontSize: 16 }}>Ideal sherikni toping</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            O'z ko'nikmalaringizni va o'rganmoqchi bo'lgan narsalaringizni kiriting — AI bilim almashish uchun eng yaxshi sherikni topadi
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">🧠 Mening ko'nikmalarim (skills_i_have)</label>
            <textarea
              className="form-textarea"
              required
              value={form.skills_i_have}
              onChange={(e) => setForm({ ...form, skills_i_have: e.target.value })}
              placeholder="Masalan: Python, Django, REST API, PostgreSQL"
              style={{ minHeight: 60 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">📚 O'rganmoqchiman (skills_i_want)</label>
            <textarea
              className="form-textarea"
              required
              value={form.skills_i_want}
              onChange={(e) => setForm({ ...form, skills_i_want: e.target.value })}
              placeholder="Masalan: React, UI/UX Dizayn, Figma"
              style={{ minHeight: 60 }}
            />
          </div>
          <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={matchLoading}>
            {matchLoading ? (
              <><Loader2 className="animate-spin" size={18} /> AI izlamoqda...</>
            ) : (
              <><Sparkles size={16} /> Sherik topish <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {error && <div className="error-msg" style={{ marginTop: 16 }}>{error}</div>}

        {matchResult && (
          <motion.div
            className="match-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h4>🎯 AI qidiruv natijasi</h4>
            <pre>{typeof matchResult === 'string' ? matchResult : JSON.stringify(matchResult, null, 2)}</pre>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
