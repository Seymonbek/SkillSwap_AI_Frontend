import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Briefcase, BookOpen, MessageSquare, User,
  Wallet, FileText, Search, Crown, Bell,
  AlertTriangle, Video, Sparkles, X
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

const SidebarSections = ({ onNavigate }) => {
  const location = useLocation();

  return (
    <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
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
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
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
  );
};

export const Sidebar = ({ mobile = false, onClose }) => {
  const navigate = useNavigate();
  const handleNavigate = (path) => {
    navigate(path);
    onClose?.();
  };

  if (mobile) {
    return (
      <div className="fixed inset-0 z-[90] md:hidden">
        <button
          type="button"
          aria-label="Navigatsiyani yopish"
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          onClick={onClose}
        />
        <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col border-r border-white/10 bg-slate-950/95 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">SkillSwap AI</p>
                <p className="text-xs text-slate-400">Navigatsiya</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Navigatsiyani yopish"
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          <SidebarSections onNavigate={handleNavigate} />

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SkillSwap AI v2.0</span>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 z-30 flex-col border-r border-white/5 bg-slate-950/80 backdrop-blur-xl overflow-y-auto">
      <SidebarSections onNavigate={handleNavigate} />

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
