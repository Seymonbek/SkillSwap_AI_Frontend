import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { Home, MessageSquare, Video, Briefcase, User } from 'lucide-react';

/**
 * BottomNav Organism - Mobile bottom navigation bar
 * iOS/Android style tab bar
 */

const navItems = [
  { icon: Home, label: 'Bosh sahifa', path: '/dashboard' },
  { icon: Briefcase, label: 'Ishlar', path: '/jobs' },
  { icon: Video, label: 'Video', path: '/video' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Profil', path: '/profile' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 md:hidden">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-16 h-full rounded-xl transition-all duration-200',
                isActive
                  ? 'text-emerald-500'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <item.icon
                size={22}
                className={cn(
                  'transition-all duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
