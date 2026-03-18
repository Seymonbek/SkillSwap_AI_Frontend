import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useModerationStore } from '../store/moderationStore';
import {
  BarChart3, Users, Shield, AlertTriangle, Loader2, ChevronLeft,
  DollarSign, Coins, TrendingUp, Activity, FileCheck, Briefcase
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}15`, border: `1px solid ${color}30`,
      }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const { stats, revenue, tokenStats, fetchStats, fetchRevenue, fetchTokenStats } = useModerationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchRevenue();
    fetchTokenStats();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ChevronLeft size={20} /></button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={24} style={{ color: '#f59e0b' }} /> Admin Dashboard
          </h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Users} label="Jami foydalanuvchilar" value={stats?.total_users} color="#6366f1" />
        <StatCard icon={Activity} label="Faol (30 kun)" value={stats?.active_users_30d} color="#10b981" />
        <StatCard icon={Briefcase} label="Jami shartnomalar" value={stats?.total_contracts} color="#3b82f6" />
        <StatCard icon={FileCheck} label="Tugallangan" value={stats?.completed_contracts} color="#22c55e" />
        <StatCard icon={AlertTriangle} label="Faol nizolar" value={stats?.active_disputes} color="#ef4444" />
        <StatCard icon={Shield} label="Barter sessiyalar" value={stats?.total_barter_sessions} color="#a855f7" />
      </div>

      {/* Token Stats */}
      {tokenStats && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ color: 'white', margin: '0 0 14px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Coins size={18} style={{ color: '#f59e0b' }} /> Token aylanmasi
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <StatCard icon={Coins} label="Aylanmada" value={tokenStats.total_tokens_in_circulation} color="#f59e0b" />
            <StatCard icon={TrendingUp} label="Sotib olingan" value={tokenStats.total_tokens_purchased} color="#10b981" />
            <StatCard icon={DollarSign} label="Yoqilgan" value={tokenStats.total_tokens_burned} color="#ef4444" />
          </div>
        </div>
      )}

      {/* Revenue Table */}
      <div>
        <h3 style={{ color: 'white', margin: '0 0 14px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={18} style={{ color: '#10b981' }} /> Kunlik tushum hisoboti
        </h3>
        {revenue.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center', color: '#64748b' }}>
            Ma'lumot yo'q
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Sana', 'Escrow', 'Token', 'Obuna', 'Jami'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {revenue.slice(0, 15).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#e2e8f0' }}>{r.date}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>${r.escrow_release}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>${r.token_purchase}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>${r.subscription}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#10b981', fontWeight: 700 }}>${r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
