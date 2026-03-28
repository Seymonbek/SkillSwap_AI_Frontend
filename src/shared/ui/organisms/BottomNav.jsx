import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageSquare, Briefcase, User, BookOpen } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Asosiy', path: '/dashboard' },
  { icon: Briefcase, label: 'Ishlar', path: '/jobs' },
  { icon: BookOpen, label: 'Barter', path: '/barter' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Profil', path: '/profile' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[max(env(safe-area-inset-bottom),0.25rem)]">
      <div className="glass-card mx-4 mb-4 rounded-2xl px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${isActive
                    ? 'text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-300`}>
                  <item.icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
