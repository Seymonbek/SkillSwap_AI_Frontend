import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import { ToastProvider } from '@/shared/ui/providers/ToastProvider';
import { Header } from '@/shared/ui/organisms/Header';
import { BottomNav } from '@/shared/ui/organisms/BottomNav';
import { Sidebar } from '@/shared/ui/organisms/Sidebar';
import { hasActiveSession } from '@/shared/lib/auth';
import { chatService } from '@/shared/api';
import { useAuthStore } from '@/entities/user/model/store';
import { useNotificationStore } from '@/entities/notification/model/store';

import { LandingPage } from '@/pages/home/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { PasswordResetConfirmPage } from '@/pages/auth/PasswordResetConfirmPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { VideoPage } from '@/pages/video/VideoPage';
import { JobsPage } from '@/pages/jobs/JobsPage';
import { JobDetailPage } from '@/pages/jobs/JobDetailPage';
import { BarterPage } from '@/pages/barter/BarterPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { WalletPage } from '@/pages/wallet/WalletPage';
import { ContractsPage } from '@/pages/contracts/ContractsPage';
import { DisputesPage } from '@/pages/disputes/DisputesPage';
import { SearchPage } from '@/pages/search/SearchPage';
import { SubscriptionsPage } from '@/pages/subscriptions/SubscriptionsPage';

// Simple auth check
const isAuthenticated = () => {
  return hasActiveSession();
};

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public route wrapper (redirect if logged in)
const PublicRoute = ({ children }) => {
  if (hasActiveSession()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Page transition wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className="h-full"
  >
    {children}
  </motion.div>
);

// Layout for authenticated pages
const AppLayout = ({ children }) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const initAuth = useAuthStore((state) => state.initAuth);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const {
    unreadCount,
    incomingCall,
    clearIncomingCall,
    markAsRead,
    startPolling,
    stopPolling,
    connectWebSocket,
    disconnectWebSocket,
  } = useNotificationStore();

  const refreshChatUnreadCount = useCallback(async () => {
    if (!isAuthenticated()) {
      setChatUnreadCount(0);
      return;
    }

    try {
      const res = await chatService.getRooms();
      const rooms = res.data?.results || res.data || [];
      const unread = rooms.reduce((sum, room) => sum + Number(room.unread_count || 0), 0);
      setChatUnreadCount(unread);
    } catch {
      // Keep the previous unread badge value on transient failures.
    }
  }, []);

  // Initialize auth state from Zustand on first load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated() || user) {
      return;
    }

    void fetchCurrentUser();
  }, [fetchCurrentUser, user]);

  // Start notification polling + WebSocket
  useEffect(() => {
    if (!isAuthenticated()) {
      return undefined;
    }

    const initTimer = window.setTimeout(() => {
      startPolling();
      connectWebSocket();
    }, 0);

    return () => {
      window.clearTimeout(initTimer);
      stopPolling();
      disconnectWebSocket();
    };
    // Global notification polling/socket app bo'ylab bitta marta boshqariladi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshChatUnreadCount();

    const handleChatRoomsUpdated = () => {
      void refreshChatUnreadCount();
    };

    window.addEventListener('chat:rooms-updated', handleChatRoomsUpdated);

    return () => {
      window.removeEventListener('chat:rooms-updated', handleChatRoomsUpdated);
    };
  }, [refreshChatUnreadCount]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const extractRoomId = (actionUrl) => {
    if (!actionUrl) return null;
    try {
      const fakeBase = window.location.origin;
      const url = new URL(actionUrl, fakeBase);
      return url.searchParams.get('room');
    } catch {
      return null;
    }
  };

  const getActionHref = (actionUrl) => {
    if (!actionUrl) return null;

    try {
      const url = new URL(actionUrl, window.location.origin);

      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}${url.hash}`;
      }

      return url.toString();
    } catch {
      return actionUrl;
    }
  };

  const handleIncomingCall = async () => {
    if (!incomingCall) return;
    const roomId = extractRoomId(incomingCall.action_url);
    const actionHref = getActionHref(incomingCall.action_url);
    if (incomingCall.id) {
      await markAsRead(incomingCall.id);
    }
    clearIncomingCall();
    if (actionHref) {
      window.location.href = actionHref;
    } else if (roomId) {
      window.location.href = `/video?room=${roomId}`;
    }
  };

  const dismissIncomingCall = async () => {
    if (incomingCall?.id) {
      await markAsRead(incomingCall.id);
    }
    clearIncomingCall();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <Header
        user={user}
        notifications={unreadCount}
        messages={chatUnreadCount}
        onMenuClick={() => setIsMobileSidebarOpen(true)}
      />
      <Sidebar />
      {isMobileSidebarOpen && <Sidebar mobile onClose={() => setIsMobileSidebarOpen(false)} />}
      <main className="page-container md:ml-64">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />

      {incomingCall && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 border border-emerald-500/20 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center animate-pulse">
                <Phone className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Incoming Call</p>
                <h3 className="text-xl font-bold text-white">{incomingCall.title || "Sizga qo'ng'iroq qilishyapti"}</h3>
                <p className="text-sm text-slate-400 mt-1">{incomingCall.message || "Qabul qilish uchun pastdagi tugmani bosing."}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={dismissIncomingCall}
                className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <PhoneOff className="w-4 h-4" />
                Bekor qilish
              </button>
              <button
                onClick={handleIncomingCall}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Phone className="w-4 h-4" />
                Qabul qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const App = () => {
  return (
    <ToastProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/password/reset/confirm/:uid/:token" element={<PasswordResetConfirmPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><AppLayout><JobsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><AppLayout><JobDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/barter" element={<ProtectedRoute><AppLayout><BarterPage /></AppLayout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
        <Route path="/chat/:roomId" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
        <Route path="/video" element={<ProtectedRoute><AppLayout><VideoPage /></AppLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><AppLayout><WalletPage /></AppLayout></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute><AppLayout><ContractsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/disputes" element={<ProtectedRoute><AppLayout><DisputesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><AppLayout><SearchPage /></AppLayout></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute><AppLayout><SubscriptionsPage /></AppLayout></ProtectedRoute>} />

        {/* Fallback routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};
