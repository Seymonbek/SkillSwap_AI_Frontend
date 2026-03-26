import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Mentorship from './pages/Mentorship';
import Sessions from './pages/Sessions';
import Matchmaking from './pages/Matchmaking';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import Proposals from './pages/Proposals';
import Contracts from './pages/Contracts';
import Milestones from './pages/Milestones';
import Submissions from './pages/Submissions';
import AIServices from './pages/AIServices';
import Disputes from './pages/Disputes';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Portfolio from './pages/Portfolio';
import Reviews from './pages/Reviews';
import UserSearch from './pages/UserSearch';
import Payments from './pages/Payments';
import Subscriptions from './pages/Subscriptions';
import TwoFactor from './pages/TwoFactor';
import KYC from './pages/KYC';
import SkillTests from './pages/SkillTests';
import AdminDashboard from './pages/AdminDashboard';
import AdminDisputes from './pages/AdminDisputes';
import AdminKYC from './pages/AdminKYC';
import AdminUsers from './pages/AdminUsers';
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import AccountActivation from './pages/AccountActivation';
import VideoCalls from './pages/VideoCalls';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordConfirm />} />
        <Route path="/activate" element={<AccountActivation />} />

        {/* Protected routes with Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          {/* Freelance */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/submissions" element={<Submissions />} />
          <Route path="/ai-services" element={<AIServices />} />
          {/* System */}
          <Route path="/disputes" element={<Disputes />} />
          <Route path="/video-calls" element={<VideoCalls />} />
          <Route path="/settings" element={<Settings />} />
          {/* New modules */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search" element={<Search />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/user-search" element={<UserSearch />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/two-factor" element={<TwoFactor />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/skill-tests" element={<SkillTests />} />
          {/* Admin Panel */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/disputes" element={<AdminDisputes />} />
          <Route path="/admin/kyc" element={<AdminKYC />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;