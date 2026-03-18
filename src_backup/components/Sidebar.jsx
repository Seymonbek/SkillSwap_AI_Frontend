import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Sparkles,
  MessageCircle,
  UserCircle,
  LogOut,
  ChevronLeft,
  Zap,
  Briefcase,
  FileText,
  FileCheck,
  Wallet,
  PackageCheck,
  Brain,
  AlertTriangle,
  Settings,
  Bell,
  Search,
  FolderOpen,
  Star,
  CreditCard,
  Package,
  Shield,
  BadgeCheck,
  FlaskConical,
  BarChart3,
  Gavel,
  Video,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navSections = [
  {
    title: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
    ],
  },
  {
    title: 'Barter',
    items: [
      { to: '/mentorship', icon: Users, label: 'Mentorlik' },
      { to: '/sessions', icon: CalendarClock, label: 'Sessiyalar' },
      { to: '/matchmaking', icon: Sparkles, label: 'AI Sherik izlash' },
    ],
  },
  {
    title: 'Freelance',
    items: [
      { to: '/jobs', icon: Briefcase, label: 'Loyihalar' },
      { to: '/proposals', icon: FileText, label: 'Takliflar' },
      { to: '/contracts', icon: FileCheck, label: 'Shartnomalar' },
      { to: '/milestones', icon: Wallet, label: 'Bosqichlar' },
      { to: '/submissions', icon: PackageCheck, label: 'Topshiriqlar' },
      { to: '/ai-services', icon: Brain, label: 'AI Xizmatlar' },
    ],
  },
  {
    title: 'Tizim',
    items: [
      { to: '/chat', icon: MessageCircle, label: 'Chat' },
      { to: '/video-calls', icon: Video, label: "Qo'ng'iroqlar" },
      { to: '/notifications', icon: Bell, label: 'Bildirishnomalar' },
      { to: '/search', icon: Search, label: 'Qidiruv' },
      { to: '/portfolio', icon: FolderOpen, label: 'Portfolio' },
      { to: '/reviews', icon: Star, label: 'Izohlar' },
      { to: '/user-search', icon: Users, label: 'Foydalanuvchilar' },
      { to: '/payments', icon: CreditCard, label: "To'lovlar" },
      { to: '/subscriptions', icon: Package, label: 'Obunalar' },
      { to: '/skill-tests', icon: FlaskConical, label: 'Testlar' },
      { to: '/two-factor', icon: Shield, label: '2FA' },
      { to: '/kyc', icon: BadgeCheck, label: 'KYC' },
      { to: '/disputes', icon: AlertTriangle, label: 'Nizolar' },
      { to: '/profile', icon: UserCircle, label: 'Profil' },
      { to: '/settings', icon: Settings, label: 'Sozlamalar' },
    ],
  },
];

const adminSection = {
  title: '🛡️ Admin',
  items: [
    { to: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/admin/disputes', icon: Gavel, label: 'Nizolar' },
    { to: '/admin/kyc', icon: BadgeCheck, label: 'KYC so\'rovlar' },
    { to: '/admin/users', icon: Users, label: 'Foydalanuvchilar' },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const isAdmin = user?.is_staff || user?.is_superuser;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="sidebar"
    >
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Zap size={22} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="logo-text"
              >
                BARTER.AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button onClick={onToggle} className="sidebar-toggle" title="Qisqartirish">
          <ChevronLeft
            size={18}
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />
        </button>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {[...navSections, ...(isAdmin ? [adminSection] : [])].map((section, si) => (
          <div key={si}>
            {section.title && !collapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1.2, padding: '14px 14px 6px', marginTop: si > 0 ? 4 : 0 }}>
                {section.title}
              </div>
            )}
            {section.title && collapsed && si > 0 && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 8px' }} />
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                }
              >
                <item.icon size={19} className="sidebar-link-icon" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="sidebar-link-text"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-link sidebar-logout">
          <LogOut size={19} className="sidebar-link-icon" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="sidebar-link-text"
              >
                Chiqish
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
