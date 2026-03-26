import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useMentorshipStore } from '../store/mentorshipStore';
import { useSessionStore } from '../store/sessionStore';
import {
  Star,
  Flame,
  Users,
  CalendarClock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trophy,
  ChevronLeft,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
};

export default function Dashboard() {
  const { user, fetchUser } = useAuthStore();
  const { mentorships, fetchMentorships } = useMentorshipStore();
  const { sessions, fetchSessions } = useSessionStore();

  useEffect(() => {
    if (!user) fetchUser();
    fetchMentorships();
    fetchSessions();
  }, []);

  const stats = [
    {
      icon: Star,
      label: 'Barter reytingi',
      value: user?.barter_rating?.toFixed(1) || '0.0',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: Trophy,
      label: 'Freelance reytingi',
      value: user?.freelance_rating?.toFixed(1) || '0.0',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
    },
    {
      icon: Flame,
      label: 'Ketma-ket kunlar',
      value: user?.streak_days ?? 0,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
    },
    {
      icon: ShieldCheck,
      label: 'KYC Holati',
      value: user?.is_kyc_verified ? 'Tasdiqlangan' : 'Tasdiqlanmagan',
      color: user?.is_kyc_verified ? '#22c55e' : '#94a3b8',
      bg: user?.is_kyc_verified ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.08)',
    },
  ];

  const navigate = useNavigate();

  return (
    <div>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">
              Salom, {user?.first_name || user?.email?.split('@')[0] || 'Foydalanuvchi'} 👋
            </h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
              BARTER.AI ga xush kelibsiz — sizning ko'nikmalar almashish platformangiz
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="card stat-card"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={i}
          >
            <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid-2">
        {/* Recent mentorships */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} style={{ color: '#8b5cf6' }} /> Mentorlik
            </h3>
            <Link to="/mentorship" style={{ fontSize: 13, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4 }}>
              Barchasi <ArrowRight size={14} />
            </Link>
          </div>
          {mentorships.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 13 }}>Mentorlik so'rovlari yo'q</p>
          ) : (
            mentorships.slice(0, 3).map((m) => (
              <div key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>Mentor #{m.mentor}</span>
                <span className={`badge badge--${m.status?.toLowerCase()}`}>{m.status}</span>
              </div>
            ))
          )}
        </motion.div>

        {/* Recent sessions */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarClock size={18} style={{ color: '#3b82f6' }} /> Sessiyalar
            </h3>
            <Link to="/sessions" style={{ fontSize: 13, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
              Barchasi <ArrowRight size={14} />
            </Link>
          </div>
          {sessions.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 13 }}>Rejalashtirilgan sessiyalar yo'q</p>
          ) : (
            sessions.slice(0, 3).map((s) => (
              <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>{s.topic}</span>
                <span className={`badge badge--${s.status?.toLowerCase()}`}>{s.status}</span>
              </div>
            ))
          )}
        </motion.div>
      </div>

      {/* Quick action buttons */}
      <motion.div
        style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link to="/matchmaking" className="btn btn--primary">
          <Sparkles size={16} /> AI Sherik izlash
        </Link>
        <Link to="/mentorship" className="btn btn--secondary">
          <Users size={16} /> Mentorlik yaratish
        </Link>
        <Link to="/sessions" className="btn btn--secondary">
          <CalendarClock size={16} /> Yangi sessiya
        </Link>
      </motion.div>
    </div>
  );
}
