import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Briefcase, BookOpen, MessageSquare, User,
  Wallet, FileText, Search, Crown, Bell,
  AlertTriangle, Video, Sparkles
} from 'lucide-react';

const sidebarItems = [
  { section: 'Asosiy', items: [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Search, label: 'Qidiruv', path: '/search' },
    { icon: Bell, label: 'Bildirishnomalar', path: '/notifications' },
  ]},
  { section: 'Ish', items: [
    { icon: Briefcase, label: 'Ishlar', path: '/jobs' },
    { icon: FileText, label: 'Shartnomalar', path: '/contracts' },
    { icon: AlertTriangle, label: 'Nizolar', path: '/disputes' },
  ]},
  { section: 'Barter', items: [
    { icon: BookOpen, label: "Barter Ta'lim", path: '/barter' },
    { icon: Video, label: 'Video Qo\'ng\'iroq', path: '/video' },
  ]},
  { section: 'Moliya', items: [
    { icon: Wallet, label: 'Hamyon', path: '/wallet' },
    { icon: Crown, label: 'Obuna', path: '/subscriptions' },
  ]},
  { section: 'Aloqa', items: [
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profil', path: '/profile' },
  ]},
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 z-30 flex-col border-r border-white/5 bg-slate-950/80 backdrop-blur-xl overflow-y-auto">
      <nav className="flex-1 py-4 px-3 space-y-6">
        {sidebarItems.map((group) => (
          <div key={group.section}>
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-3">
              {group.section}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  location.pathname.startsWith(item.path + '/');
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-400' : ''}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SkillSwap AI v2.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
