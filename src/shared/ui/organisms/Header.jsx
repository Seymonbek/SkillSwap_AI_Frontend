import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, MessageSquare, ChevronLeft, Sparkles, Search } from 'lucide-react';

export const Header = ({
  title,
  showBack = false,
  onBack,
  user,
  notifications = 0,
  messages = 0,
  onMenuClick,
  className,
}) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full glass-card rounded-none border-x-0 border-t-0 ${className}`}>
      <div className="flex items-center gap-3 h-16 px-4 max-w-7xl mx-auto">
        {/* Left section */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack || (() => navigate(-1))}
              aria-label="Orqaga qaytish"
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Navigatsiyani ochish"
              className="p-2 rounded-xl hover:bg-white/5 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </button>
          )}
          {title ? (
            <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold neon-text hidden sm:block truncate">SkillSwap AI</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Qidirish..."
              className="glass-input w-full py-2.5 pl-10"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search (mobile) */}
          <button
            type="button"
            onClick={() => navigate('/search')}
            aria-label="Qidiruv sahifasini ochish"
            className="md:hidden p-2.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Search className="w-5 h-5 text-slate-300" />
          </button>

          {/* Messages */}
          <button
            type="button"
            onClick={() => navigate('/chat')}
            aria-label="Chat sahifasini ochish"
            className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-slate-300" />
            {messages > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                {messages > 9 ? '9+' : messages}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            aria-label="Bildirishnomalarni ochish"
            className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-300" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>

          {/* Tokens Balance */}
          {user?.wallet && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 ml-2">
              <span className="text-amber-400 font-bold">{user.wallet.time_tokens || 0}</span>
              <span className="text-amber-400 text-xs font-medium">Token</span>
            </div>
          )}

          {/* Profile */}
          <div
            onClick={() => navigate('/profile')}
            className="cursor-pointer ml-2"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-slate-700/50">
              {user?.first_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
