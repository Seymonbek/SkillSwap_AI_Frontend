import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  freelanceService, chatService, barterService,
  notificationsService, authService
} from '@/shared/api';
import {
  Briefcase, MessageSquare, Star, TrendingUp,
  Clock, ArrowRight, Activity, Users, DollarSign,
  Zap, ChevronRight, Sparkles, Search, BookOpen,
  Bell, Wallet, FileText
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalMessages: 0,
    barterSessions: 0,
    unreadNotifications: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);
  const [mentorships, setMentorships] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const results = await Promise.allSettled([
        freelanceService.getJobs(),                     // 0
        chatService.getRooms(),                          // 1
        barterService.getMentorships(),                  // 2
        notificationsService.getUnreadCount(),           // 3
        authService.getMe(),                             // 4
      ]);

      // Jobs
      if (results[0].status === 'fulfilled') {
        const jobsData = results[0].value.data;
        const jobs = jobsData?.results || jobsData || [];
        setRecentJobs(jobs.slice(0, 3));
        setStats(prev => ({ ...prev, activeJobs: jobsData?.count || jobs.length }));
      }

      // Chat Rooms
      if (results[1].status === 'fulfilled') {
        const roomsData = results[1].value.data;
        const rooms = roomsData?.results || roomsData || [];
        setRecentRooms(rooms.slice(0, 3));
        setStats(prev => ({ ...prev, totalMessages: rooms.length }));
      }

      // Mentorships
      if (results[2].status === 'fulfilled') {
        const barterData = results[2].value.data;
        const items = barterData?.results || barterData || [];
        setMentorships(items.slice(0, 3));
        setStats(prev => ({ ...prev, barterSessions: items.length }));
      }

      // Unread count
      if (results[3].status === 'fulfilled') {
        const countData = results[3].value.data;
        setStats(prev => ({
          ...prev,
          unreadNotifications: countData?.count ?? countData?.unread_count ?? 0,
        }));
      }

      // User profile
      if (results[4].status === 'fulfilled') {
        const userData = results[4].value.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Briefcase, label: 'Faol ishlar', value: stats.activeJobs, color: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-400' },
    { icon: MessageSquare, label: 'Xabarlar', value: stats.totalMessages, color: 'from-violet-500 to-purple-500', iconColor: 'text-violet-400' },
    { icon: BookOpen, label: 'Barter', value: stats.barterSessions, color: 'from-amber-500 to-orange-500', iconColor: 'text-amber-400' },
    { icon: Bell, label: "O'qilmagan", value: stats.unreadNotifications, color: 'from-red-500 to-pink-500', iconColor: 'text-red-400' },
  ];

  const quickActions = [
    { icon: Search, label: 'Ish qidirish', onClick: () => navigate('/jobs'), color: 'from-emerald-500 to-teal-500' },
    { icon: Users, label: 'Mentor topish', onClick: () => navigate('/barter'), color: 'from-violet-500 to-purple-500' },
    { icon: MessageSquare, label: 'Xabarlar', onClick: () => navigate('/chat'), color: 'from-blue-500 to-cyan-500' },
    { icon: Wallet, label: "Hamyon", onClick: () => navigate('/wallet'), color: 'from-amber-500 to-orange-500' },
    { icon: FileText, label: 'Shartnomalar', onClick: () => navigate('/contracts'), color: 'from-pink-500 to-rose-500' },
    { icon: Sparkles, label: 'AI Qidiruv', onClick: () => navigate('/search'), color: 'from-cyan-500 to-blue-500' },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="glass-card h-32 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
        <div className="glass-card h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      {/* Background */}
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.15 }} />
        <div className="blob blob-3" style={{ width: '200px', height: '200px', opacity: 0.1 }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-4xl mx-auto space-y-6 relative z-10"
      >
        {/* Welcome */}
        <motion.div variants={fadeInUp}>
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-purple-500/10" />
            <div className="relative z-10">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Salom, <span className="neon-text">{user?.first_name || 'Foydalanuvchi'}</span>! 👋
              </h1>
              <p className="text-slate-400">Bugungi ish kuniga tayyor!</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="glass-card p-4 group hover:scale-[1.02] transition-transform">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Tezkor harakatlar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="glass-card p-4 flex flex-col items-center gap-2 hover:scale-[1.05] transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-slate-300 font-medium text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Jobs */}
        <motion.div variants={fadeInUp}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              So'nggi ishlar
            </h2>
            <button
              onClick={() => navigate('/jobs')}
              className="text-sm text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              Barchasi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentJobs.length > 0 ? recentJobs.map(job => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{job.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-1">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                      <span className="text-emerald-400 font-semibold text-sm">
                        ${job.budget_min || 0} - ${job.budget_max || 0}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        job.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        job.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-800 text-slate-400 border border-white/5'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                </div>
              </div>
            )) : (
              <div className="glass-card p-6 text-center">
                <p className="text-slate-400">Hozircha ishlar yo&apos;q</p>
                <button onClick={() => navigate('/jobs')} className="btn-secondary mt-3 text-sm">
                  Ishlarni ko&apos;rish
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Chats */}
        <motion.div variants={fadeInUp}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-400" />
              So'nggi suhbatlar
            </h2>
            <button
              onClick={() => navigate('/chat')}
              className="text-sm text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              Barchasi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="glass-card overflow-hidden">
            {recentRooms.length > 0 ? recentRooms.map((room, index) => (
              <div
                key={room.id}
                onClick={() => navigate(`/chat/${room.id}`)}
                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${
                  index < recentRooms.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  {room.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate text-sm">{room.name}</h4>
                  <p className="text-xs text-slate-400 truncate">
                    {room.last_message?.content || "Xabar yo'q"}
                  </p>
                </div>
                {room.unread_count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                    {room.unread_count}
                  </span>
                )}
              </div>
            )) : (
              <div className="p-6 text-center">
                <p className="text-slate-400 text-sm">Suhbatlar yo&apos;q</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Mentorships */}
        {mentorships.length > 0 && (
          <motion.div variants={fadeInUp}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Mentorlik
              </h2>
              <button
                onClick={() => navigate('/barter')}
                className="text-sm text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
              >
                Barchasi <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {mentorships.map(item => (
                <div key={item.id} className="glass-card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-medium text-white text-sm">
                        {item.skill_offered || item.mentor_name || 'Mentorlik'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {item.status}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' :
                      item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardPage;
