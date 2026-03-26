import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/authStore';
import { Menu } from 'lucide-react';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop always visible, mobile toggled */}
      <div className={`sidebar-wrapper ${mobileOpen ? 'sidebar-wrapper--open' : ''}`}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={22} />
          </button>
          <div className="topbar-right">
            {user && (
              <div className="topbar-user">
                <div className="topbar-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" />
                  ) : (
                    <span>{(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}</span>
                  )}
                </div>
                <span className="topbar-username">
                  {user.first_name || user.email?.split('@')[0]}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
