import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Phone, PhoneOff } from 'lucide-react';
import { ToastProvider } from '@/shared/ui/providers/ToastProvider';
import { Header } from '@/shared/ui/organisms/Header';
import { BottomNav } from '@/shared/ui/organisms/BottomNav';
import { PwaInstallPrompt } from '@/shared/ui/organisms/PwaInstallPrompt';
import { Sidebar } from '@/shared/ui/organisms/Sidebar';
import { hasActiveSession } from '@/shared/lib/auth';
import { chatService } from '@/shared/api';
import { useAuthStore } from '@/entities/user/model/store';
import { useNotificationStore } from '@/entities/notification/model/store';

const LandingPage = lazy(() => import('@/pages/home/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const PasswordResetConfirmPage = lazy(() => import('@/pages/auth/PasswordResetConfirmPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'));
const VideoPage = lazy(() => import('@/pages/video/VideoPage'));
const JobsPage = lazy(() => import('@/pages/jobs/JobsPage'));
const JobDetailPage = lazy(() => import('@/pages/jobs/JobDetailPage'));
const BarterPage = lazy(() => import('@/pages/barter/BarterPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const WalletPage = lazy(() => import('@/pages/wallet/WalletPage'));
const ContractsPage = lazy(() => import('@/pages/contracts/ContractsPage'));
const DisputesPage = lazy(() => import('@/pages/disputes/DisputesPage'));
const SearchPage = lazy(() => import('@/pages/search/SearchPage'));
const SubscriptionsPage = lazy(() => import('@/pages/subscriptions/SubscriptionsPage'));

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

const RouteLoader = ({ fullScreen = false }) => (
  <div
    className={[
      fullScreen ? 'min-h-screen' : 'min-h-[50vh]',
      'flex items-center justify-center px-6',
    ].join(' ')}
  >
    <div className="glass-card w-full max-w-md p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">
        SkillSwap AI
      </p>
      <h2 className="mt-2 text-xl font-bold text-white">Sahifa yuklanmoqda</h2>
      <p className="mt-2 text-sm text-slate-400">
        Production build endi route bo&apos;yicha bo&apos;linadi, shuning uchun kerakli sahifa alohida yuklanadi.
      </p>
    </div>
  </div>
);

const LazyRoute = ({ children, fullScreen = false }) => (
  <Suspense fallback={<RouteLoader fullScreen={fullScreen} />}>
    {children}
  </Suspense>
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

const renderPublicPage = (PageComponent, { guarded = false } = {}) => {
  const page = (
    <LazyRoute fullScreen>
      <PageComponent />
    </LazyRoute>
  );

  if (guarded) {
    return <PublicRoute>{page}</PublicRoute>;
  }

  return page;
};

const renderProtectedPage = (PageComponent) => (
  <ProtectedRoute>
    <AppLayout>
      <LazyRoute>
        <PageComponent />
      </LazyRoute>
    </AppLayout>
  </ProtectedRoute>
);

export const App = () => {
  return (
    <ToastProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={renderPublicPage(LandingPage)} />
        <Route path="/login" element={renderPublicPage(LoginPage, { guarded: true })} />
        <Route path="/register" element={renderPublicPage(RegisterPage, { guarded: true })} />
        <Route path="/password/reset/confirm/:uid/:token" element={renderPublicPage(PasswordResetConfirmPage)} />

        {/* Protected routes */}
        <Route path="/dashboard" element={renderProtectedPage(DashboardPage)} />
        <Route path="/jobs" element={renderProtectedPage(JobsPage)} />
        <Route path="/jobs/:id" element={renderProtectedPage(JobDetailPage)} />
        <Route path="/barter" element={renderProtectedPage(BarterPage)} />
        <Route path="/chat" element={renderProtectedPage(ChatPage)} />
        <Route path="/chat/:roomId" element={renderProtectedPage(ChatPage)} />
        <Route path="/video" element={renderProtectedPage(VideoPage)} />
        <Route path="/notifications" element={renderProtectedPage(NotificationsPage)} />
        <Route path="/profile/:id" element={renderProtectedPage(ProfilePage)} />
        <Route path="/profile" element={renderProtectedPage(ProfilePage)} />
        <Route path="/wallet" element={renderProtectedPage(WalletPage)} />
        <Route path="/contracts" element={renderProtectedPage(ContractsPage)} />
        <Route path="/disputes" element={renderProtectedPage(DisputesPage)} />
        <Route path="/search" element={renderProtectedPage(SearchPage)} />
        <Route path="/subscriptions" element={renderProtectedPage(SubscriptionsPage)} />

        {/* Fallback routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PwaInstallPrompt />
    </ToastProvider>
  );
};
