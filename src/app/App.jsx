import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastProvider } from '@/shared/ui/providers/ToastProvider';
import { Header } from '@/shared/ui/organisms/Header';
import { BottomNav } from '@/shared/ui/organisms/BottomNav';
import { Sidebar } from '@/shared/ui/organisms/Sidebar';
import { useAuthStore } from '@/entities/user/model/store';
import { useNotificationStore } from '@/entities/notification/model/store';

// Pages
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
  return !!localStorage.getItem('access_token');
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
  if (isAuthenticated()) {
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { unreadCount, startPolling, stopPolling, connectWebSocket, disconnectWebSocket } = useNotificationStore();

  // Initialize auth state from Zustand on first load
  useEffect(() => {
    const { initAuth } = useAuthStore.getState();
    initAuth();
  }, []);

  // Start notification polling + WebSocket
  useEffect(() => {
    if (isAuthenticated()) {
      startPolling();
      connectWebSocket();
    }
    return () => {
      stopPolling();
      disconnectWebSocket();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <Header user={user} notifications={unreadCount} />
      <Sidebar />
      <main className="page-container md:ml-64">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />
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
