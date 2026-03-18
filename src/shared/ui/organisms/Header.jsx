import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { SearchBar } from '@/shared/ui/molecules/SearchBar';
import { Avatar } from '@/shared/ui/atoms/Avatar';
import { Button } from '@/shared/ui/atoms/Button';
import { Menu, Bell, MessageSquare, ChevronLeft } from 'lucide-react';

/**
 * Header Organism - App header with search, notifications, profile
 * Mobile-first design with hamburger menu
 */

export const Header = ({
  title,
  showBack = false,
  onBack,
  showSearch = false,
  onSearch,
  user,
  notifications = 0,
  messages = 0,
  onMenuClick,
  className,
}) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className={cn(
      'sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-lg border-b border-slate-800',
      className
    )}>
      <div className="flex items-center gap-3 h-14 px-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack || (() => navigate(-1))}
            >
              <ChevronLeft size={20} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu size={20} />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
          )}
        </div>

        {/* Search - hidden on mobile unless showSearch */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              onSubmit={onSearch}
              placeholder="Qidirish..."
            />
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Messages */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/chat')}
            className="relative"
          >
            <MessageSquare size={20} />
            {messages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-emerald-500 text-white text-xs font-bold rounded-full">
                {messages > 9 ? '9+' : messages}
              </span>
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/notifications')}
            className="relative"
          >
            <Bell size={20} />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </Button>

          {/* Profile */}
          <div
            onClick={() => navigate('/profile')}
            className="cursor-pointer"
          >
            <Avatar
              src={user?.avatar}
              name={user?.first_name || user?.email}
              size="sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
