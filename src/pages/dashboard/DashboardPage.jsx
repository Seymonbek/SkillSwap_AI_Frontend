import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  barterService,
  chatService,
  commonService,
  freelanceService,
  notificationsService,
  searchService,
} from '@/shared/api';
import { useAuthStore } from '@/entities/user/model/store';
import { hasActiveSession } from '@/shared/lib/auth';
import { formatJobBudget, getJobStatusMeta, normalizeJobs } from '@/shared/lib/job';
import { formatRelativeTime } from '@/shared/lib/utils';
import {
  getUserAvatarInitial,
  getUserAvatarSrc,
  getUserDisplayName,
  getUserPrimaryRating,
  getUserTokenBalance,
} from '@/shared/lib/user';
import {
  AlertCircle,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  ChevronRight,
  FileText,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Video,
  Wallet,
  Zap,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const ACTIVE_MENTORSHIP_STATUSES = new Set(['PENDING', 'NEGOTIATING', 'ACCEPTED']);
const ACTIVE_SESSION_STATUSES = new Set(['PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']);

const toArray = (value) => (Array.isArray(value) ? value : []);
const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const hasListedSkills = (user) =>
  toArray(user?.skills_offered).length > 0 || toArray(user?.skills_wanted).length > 0;

const buildProfileChecklist = (user) => [
  { label: 'Ism', done: Boolean(user?.first_name || user?.last_name) },
  { label: 'Avatar', done: Boolean(getUserAvatarSrc(user)) },
  { label: 'Bio', done: Boolean(String(user?.bio || '').trim()) },
  { label: 'Joylashuv', done: Boolean(String(user?.location || '').trim()) },
  { label: "Taklif ko'nikmalari", done: toArray(user?.skills_offered).length > 0 },
  { label: "O'rganmoqchi ko'nikmalar", done: toArray(user?.skills_wanted).length > 0 },
];

const getRoomPeer = (room, currentUserId) => {
  const participants = toArray(room?.participants);
  if (participants.length === 0) {
    return null;
  }

  return (
    participants.find((participant) => String(participant.id) !== String(currentUserId)) ||
    participants[0]
  );
};

const getRoomDisplayName = (room, currentUserId) => {
  const explicitName = String(room?.name || '').trim();
  if (explicitName) {
    return explicitName;
  }

  const peer = getRoomPeer(room, currentUserId);
  return getUserDisplayName(peer, 'Suhbat');
};

const getRoomPreview = (room) => {
  const lastMessage = room?.last_message;
  if (!lastMessage) {
    return "Xabar yo'q";
  }

  const messageType = String(lastMessage.message_type || 'TEXT').toUpperCase();
  if (messageType === 'IMAGE') return 'Rasm yuborildi';
  if (messageType === 'AUDIO') return 'Audio yuborildi';
  if (messageType === 'FILE') return lastMessage.file_name || 'Fayl yuborildi';

  return lastMessage.content || "Xabar yo'q";
};

const getChatRoomId = (session) =>
  session?.chat_room_id || session?.chat_room?.id || session?.chat_room || null;

const buildSessionChatRoute = (session) => {
  const roomId = getChatRoomId(session);
  if (!roomId || !session?.id) {
    return '/barter';
  }

  return `/chat/${roomId}?session=${session.id}`;
};

const buildSessionVideoRoute = (session) => {
  const roomId = getChatRoomId(session);
  if (!roomId || !session?.id) {
    return '/barter';
  }

  return `/video?room=${roomId}&session=${session.id}`;
};

const getMentorshipPartner = (item, currentUserId) => {
  const mentorId = item?.mentor_detail?.id || item?.mentor;
  const isMentor = String(mentorId) === String(currentUserId);
  return isMentor ? item?.student_detail : item?.mentor_detail;
};

const getSessionPartner = (session, currentUserId) => {
  const mentorId = session?.mentor_detail?.id || session?.mentor;
  const isMentor = String(mentorId) === String(currentUserId);
  return isMentor ? session?.student_detail : session?.mentor_detail;
};

const getMentorshipStatusMeta = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'NEGOTIATING':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-slate-700/50 text-slate-300 border-white/10';
  }
};

const getSessionStatusMeta = (status) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'CONFIRMED':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'SCHEDULED':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-slate-700/50 text-slate-300 border-white/10';
  }
};

const sortMentorships = (items) =>
  [...items].sort((left, right) => {
    const leftPriority = ACTIVE_MENTORSHIP_STATUSES.has(left.status) ? 0 : 1;
    const rightPriority = ACTIVE_MENTORSHIP_STATUSES.has(right.status) ? 0 : 1;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
  });

const sortSessions = (items) =>
  [...items].sort((left, right) => {
    const leftPriority = ACTIVE_SESSION_STATUSES.has(left.status) ? 0 : 1;
    const rightPriority = ACTIVE_SESSION_STATUSES.has(right.status) ? 0 : 1;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return new Date(left.scheduled_time || left.created_at || 0).getTime() -
      new Date(right.scheduled_time || right.created_at || 0).getTime();
  });

export const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const [storedUser, setStoredUser] = useState(() => readStoredUser());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    totalRooms: 0,
    unreadMessages: 0,
    totalBarter: 0,
    activeBarter: 0,
    unreadNotifications: 0,
  });
  const [platformStats, setPlatformStats] = useState({
    users: 0,
    openJobs: 0,
    recommendedMentors: 0,
    premiumJobCost: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);
  const [recentMentorships, setRecentMentorships] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    const sessionActive = hasActiveSession();
    let currentUser = user || storedUser || readStoredUser();

    if (!currentUser && sessionActive) {
      const fetchedUser = await fetchCurrentUser();
      if (fetchedUser) {
        currentUser = fetchedUser;
        setStoredUser(fetchedUser);
      }
    }

    const results = await Promise.allSettled([
      freelanceService.getJobs({ ordering: '-created_at', page: 1 }),
      searchService.searchUsers({ page: 1 }),
      commonService.getSettings(),
      sessionActive ? chatService.getRooms() : Promise.resolve({ data: [] }),
      sessionActive ? barterService.getMentorships() : Promise.resolve({ data: [] }),
      sessionActive ? barterService.getSessions() : Promise.resolve({ data: [] }),
      sessionActive ? notificationsService.getUnreadCount() : Promise.resolve({ data: { unread_count: 0 } }),
    ]);

    const [
      jobsResult,
      usersResult,
      settingsResult,
      roomsResult,
      mentorshipsResult,
      sessionsResult,
      notificationsResult,
    ] = results;

    let hasAnyData = false;
    let nextTotalJobs = 0;
    let nextOpenJobs = 0;
    let nextUsersCount = 0;
    let nextRecommendedMentors = 0;
    let nextPremiumJobCost = 0;
    let nextTotalRooms = 0;
    let nextUnreadMessages = 0;
    let nextTotalBarter = 0;
    let nextActiveBarter = 0;
    let nextUnreadNotifications = 0;

    if (jobsResult.status === 'fulfilled') {
      const jobsPayload = jobsResult.value.data;
      const jobs = normalizeJobs(jobsPayload?.results || jobsPayload || []);
      nextTotalJobs = jobsPayload?.count ?? jobs.length;
      setRecentJobs(jobs.slice(0, 3));
      hasAnyData = true;
    } else {
      setRecentJobs([]);
    }

    if (usersResult.status === 'fulfilled') {
      const usersPayload = usersResult.value.data;
      const users = usersPayload?.results || usersPayload || [];
      const suggestedUsers = users.filter(
        (candidate) =>
          String(candidate.id) !== String(currentUser?.id || '') &&
          hasListedSkills(candidate)
      );

      nextUsersCount = usersPayload?.count ?? users.length;
      nextRecommendedMentors = suggestedUsers.length;
      setRecommendedUsers(suggestedUsers.slice(0, 3));
      hasAnyData = true;
    } else {
      setRecommendedUsers([]);
    }

    if (settingsResult.status === 'fulfilled') {
      const settingsPayload = settingsResult.value.data || {};
      nextPremiumJobCost = Number(settingsPayload.premium_job_cost || 0);
      hasAnyData = true;
    }

    if (roomsResult.status === 'fulfilled') {
      const roomsPayload = roomsResult.value.data;
      const rooms = roomsPayload?.results || roomsPayload || [];
      nextTotalRooms = roomsPayload?.count ?? rooms.length;
      nextUnreadMessages = rooms.reduce(
        (sum, room) => sum + Number(room.unread_count || 0),
        0
      );
      setRecentRooms(rooms.slice(0, 3));
      hasAnyData = true;
    } else {
      setRecentRooms([]);
    }

    if (mentorshipsResult.status === 'fulfilled') {
      const mentorshipsPayload = mentorshipsResult.value.data;
      const mentorships = mentorshipsPayload?.results || mentorshipsPayload || [];
      const sortedMentorships = sortMentorships(mentorships);
      const activeMentorshipsCount = mentorships.filter((item) =>
        ACTIVE_MENTORSHIP_STATUSES.has(item.status)
      ).length;

      nextTotalBarter += mentorships.length;
      nextActiveBarter += activeMentorshipsCount;
      setRecentMentorships(sortedMentorships.slice(0, 3));
      hasAnyData = true;
    } else {
      setRecentMentorships([]);
    }

    if (sessionsResult.status === 'fulfilled') {
      const sessionsPayload = sessionsResult.value.data;
      const sessions = sessionsPayload?.results || sessionsPayload || [];
      const sortedSessions = sortSessions(sessions);
      const activeSessionsCount = sessions.filter((item) =>
        ACTIVE_SESSION_STATUSES.has(item.status)
      ).length;

      nextTotalBarter += sessions.length;
      nextActiveBarter += activeSessionsCount;
      setRecentSessions(sortedSessions.slice(0, 3));
      hasAnyData = true;
    } else {
      setRecentSessions([]);
    }

    if (notificationsResult.status === 'fulfilled') {
      const unreadPayload = notificationsResult.value.data;
      nextUnreadNotifications = unreadPayload?.count ?? unreadPayload?.unread_count ?? 0;
      hasAnyData = true;
    }

    setStats({
      totalJobs: nextTotalJobs,
      openJobs: nextOpenJobs,
      totalRooms: nextTotalRooms,
      unreadMessages: nextUnreadMessages,
      totalBarter: nextTotalBarter,
      activeBarter: nextActiveBarter,
      unreadNotifications: nextUnreadNotifications,
    });
    setPlatformStats({
      users: nextUsersCount,
      openJobs: nextOpenJobs,
      recommendedMentors: nextRecommendedMentors,
      premiumJobCost: nextPremiumJobCost,
    });

    if (!hasAnyData) {
      setError("Asosiy sahifa ma'lumotlarini yuklab bo'lmadi. Qayta urinib ko'ring.");
    }

    if (silent) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }

  }, [fetchCurrentUser, storedUser, user]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadDashboard();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadDashboard]);

  const currentUser = user || storedUser || null;
  const currentUserId = currentUser?.id || null;
  const greetingName = currentUser?.first_name || getUserDisplayName(currentUser, 'Foydalanuvchi');
  const tokenBalance = getUserTokenBalance(currentUser);
  const profileChecklist = buildProfileChecklist(currentUser);
  const completedProfileItems = profileChecklist.filter((item) => item.done).length;
  const profileCompletion = profileChecklist.length > 0
    ? Math.round((completedProfileItems / profileChecklist.length) * 100)
    : 0;

  const statCards = [
    {
      icon: Users,
      label: 'Mutaxassislar',
      value: platformStats.users,
      hint: 'Platformadagi foydalanuvchilar',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Briefcase,
      label: 'Ochiq ishlar',
      value: platformStats.openJobs,
      hint: "Live backenddagi e'lonlar",
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: BookOpen,
      label: 'Mentor tavsiyasi',
      value: platformStats.recommendedMentors,
      hint: 'Skilli bor mos userlar',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Wallet,
      label: 'Time tokenlar',
      value: tokenBalance,
      hint: `${platformStats.premiumJobCost || 0} TK premium e'lon`,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const activityCards = [
    {
      icon: MessageSquare,
      label: 'Xabarlar',
      value: stats.totalRooms,
      hint: `${stats.unreadMessages} ta o'qilmagan`,
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: BookOpen,
      label: 'Barter',
      value: stats.totalBarter,
      hint: `${stats.activeBarter} ta faol`,
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Bell,
      label: 'Bildirishnomalar',
      value: stats.unreadNotifications,
      hint: "O'qilmagan",
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: Sparkles,
      label: 'Profil holati',
      value: `${profileCompletion}%`,
      hint: `${completedProfileItems}/${profileChecklist.length} qism to'ldirilgan`,
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  const quickActions = [
    { icon: Search, label: 'Ish qidirish', onClick: () => navigate('/jobs'), color: 'from-emerald-500 to-teal-500' },
    { icon: Users, label: 'Mentor topish', onClick: () => navigate('/barter'), color: 'from-violet-500 to-purple-500' },
    { icon: MessageSquare, label: 'Xabarlar', onClick: () => navigate('/chat'), color: 'from-blue-500 to-cyan-500' },
    { icon: Wallet, label: 'Hamyon', onClick: () => navigate('/wallet'), color: 'from-amber-500 to-orange-500' },
    { icon: FileText, label: 'Shartnomalar', onClick: () => navigate('/contracts'), color: 'from-pink-500 to-rose-500' },
    { icon: Sparkles, label: 'AI Qidiruv', onClick: () => navigate('/search'), color: 'from-cyan-500 to-blue-500' },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="glass-card h-32 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
        <div className="glass-card h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.15 }} />
        <div className="blob blob-3" style={{ width: '220px', height: '220px', opacity: 0.08 }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-4xl mx-auto space-y-6 relative z-10"
      >
        <motion.div variants={fadeInUp}>
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-purple-500/10" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Salom, <span className="neon-text">{greetingName}</span>!
                </h1>
                <p className="text-slate-400">
                  Asosiy boshqaruv paneli endi aniq hisoblar va real faoliyat bo&apos;yicha ishlaydi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard({ silent: true })}
                disabled={refreshing}
                className="btn-secondary inline-flex items-center justify-center gap-2 sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Yangilash
              </button>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={fadeInUp}>
            <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  className="btn-secondary sm:w-auto"
                >
                  Qayta urinish
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="glass-card p-4 group hover:scale-[1.02] transition-transform">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.hint}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {activityCards.map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.hint}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeInUp}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Tezkor harakatlar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
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

        <motion.div variants={fadeInUp} className="grid lg:grid-cols-[1.2fr,0.8fr] gap-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Profil holati</h2>
                <p className="text-sm text-slate-400">Asosiy maydonlar to'ldirilganini tekshiring.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Profilni ochish
              </button>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {profileChecklist.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    item.done
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-white mb-1">Kabinet ma'lumoti</h2>
            <p className="text-sm text-slate-400 mb-4">Sizning hisobingiz bo'yicha qisqa ko'rinish.</p>
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Display name</p>
                <p className="text-white font-medium">{getUserDisplayName(currentUser, 'Foydalanuvchi')}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Reyting</p>
                <p className="text-white font-medium">{getUserPrimaryRating(currentUser).toFixed(1)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Taklif qilayotgan skill</p>
                <p className="text-white font-medium">
                  {toArray(currentUser?.skills_offered).length > 0
                    ? toArray(currentUser?.skills_offered).join(', ')
                    : "Hozircha yo'q"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">O'rganmoqchi skill</p>
                <p className="text-white font-medium">
                  {toArray(currentUser?.skills_wanted).length > 0
                    ? toArray(currentUser?.skills_wanted).join(', ')
                    : "Hozircha yo'q"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Tavsiya etilgan mentorlar
            </h2>
            <button
              onClick={() => navigate('/barter')}
              className="text-sm text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              Barter bo'limi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recommendedUsers.length > 0 ? recommendedUsers.map((candidate) => {
              const avatarSrc = getUserAvatarSrc(candidate);
              const displayName = getUserDisplayName(candidate, 'Mutaxassis');
              const skills = [...toArray(candidate.skills_offered), ...toArray(candidate.skills_wanted)]
                .filter(Boolean)
                .slice(0, 3);

              return (
                <div key={candidate.id} className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        getUserAvatarInitial(candidate, 'M')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-white">{displayName}</h3>
                        {candidate.is_kyc_verified && (
                          <span className="px-2 py-0.5 rounded-full text-xs border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                            Tasdiqlangan
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                        {candidate.bio || "Bu mutaxassis bilan barter yoki mentorlik boshlash mumkin."}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {skills.length > 0 ? skills.map((skill) => (
                          <span
                            key={`${candidate.id}-${skill}`}
                            className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300"
                          >
                            {skill}
                          </span>
                        )) : (
                          <span className="text-xs text-slate-500">Skill ma'lumoti yo'q</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/barter')}
                      className="btn-secondary text-sm shrink-0"
                    >
                      Ochish
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="glass-card p-6 text-center">
                <p className="text-slate-400">Skilli ko'rinadigan mentorlar hozircha topilmadi.</p>
                <button onClick={() => navigate('/profile')} className="btn-secondary mt-3 text-sm">
                  Profilni to'ldirish
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              So&apos;nggi ochiq ishlar
            </h2>
            <button
              onClick={() => navigate('/jobs')}
              className="text-sm text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              Barchasi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentJobs.length > 0 ? recentJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{job.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-1">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>{getUserDisplayName(job.owner, 'Mijoz')}</span>
                      {job.owner?.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.owner.location}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                      <span className="text-emerald-400 font-semibold text-sm">
                        {formatJobBudget(job)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getJobStatusMeta(job.status).bg} ${getJobStatusMeta(job.status).color} ${getJobStatusMeta(job.status).border}`}>
                        {getJobStatusMeta(job.status).label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                </div>
              </div>
            )) : (
              <div className="glass-card p-6 text-center">
                <p className="text-slate-400">Hozircha ishlar topilmadi</p>
                <button onClick={() => navigate('/jobs')} className="btn-secondary mt-3 text-sm">
                  Ishlarni ko&apos;rish
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-400" />
              So&apos;nggi suhbatlar
            </h2>
            <button
              onClick={() => navigate('/chat')}
              className="text-sm text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              Barchasi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="glass-card overflow-hidden">
            {recentRooms.length > 0 ? recentRooms.map((room, index) => {
              const peer = getRoomPeer(room, currentUserId);
              const roomName = getRoomDisplayName(room, currentUserId);
              const avatarSrc = getUserAvatarSrc(peer);
              const avatarInitial = getUserAvatarInitial(peer, roomName.charAt(0).toUpperCase() || 'S');

              return (
                <div
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.id}`)}
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${
                    index < recentRooms.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={roomName} className="w-full h-full object-cover" />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-medium text-white truncate text-sm">{roomName}</h4>
                      <span className="text-[11px] text-slate-500">
                        {room.last_message?.created_at
                          ? formatRelativeTime(room.last_message.created_at)
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {getRoomPreview(room)}
                    </p>
                  </div>
                  {Number(room.unread_count || 0) > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                      {room.unread_count > 9 ? '9+' : room.unread_count}
                    </span>
                  )}
                </div>
              );
            }) : (
              <div className="p-6 text-center">
                <p className="text-slate-400 text-sm">Suhbatlar hali yo&apos;q</p>
              </div>
            )}
          </div>
        </motion.div>

        {recentSessions.length > 0 && (
          <motion.div variants={fadeInUp}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Yaqin sessiyalar
              </h2>
              <button
                onClick={() => navigate('/barter')}
                className="text-sm text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
              >
                Barchasi <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const partner = getSessionPartner(session, currentUserId);
                const partnerName = getUserDisplayName(partner, 'Hamkor');
                const statusClassName = getSessionStatusMeta(session.status);
                const roomId = getChatRoomId(session);

                return (
                  <div key={session.id} className="glass-card p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-white truncate">{session.topic || 'Barter sessiyasi'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${statusClassName}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{partnerName}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {session.scheduled_time
                            ? new Date(session.scheduled_time).toLocaleString('uz-UZ', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : "Vaqt belgilanmagan"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {roomId && (
                          <button
                            type="button"
                            onClick={() => navigate(buildSessionChatRoute(session))}
                            className="btn-secondary inline-flex items-center gap-2 text-sm"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                          </button>
                        )}
                        {roomId && ['CONFIRMED', 'IN_PROGRESS'].includes(session.status) && (
                          <button
                            type="button"
                            onClick={() => navigate(buildSessionVideoRoute(session))}
                            className="btn-primary inline-flex items-center gap-2 text-sm"
                          >
                            <Video className="w-4 h-4" />
                            Video
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {recentMentorships.length > 0 && (
          <motion.div variants={fadeInUp}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Mentorlik holati
              </h2>
              <button
                onClick={() => navigate('/barter')}
                className="text-sm text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
              >
                Barchasi <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentMentorships.map((item) => {
                const partner = getMentorshipPartner(item, currentUserId);
                const partnerName = getUserDisplayName(partner, 'Mentor');
                const statusClassName = getMentorshipStatusMeta(item.status);

                return (
                  <div key={item.id} className="glass-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-white truncate">{partnerName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${statusClassName}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                          {item.message || 'Mentorlik so‘rovi'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {Number(item.duration_months || 0) > 0
                            ? `${item.duration_months} oy`
                            : 'Davomiylik ko‘rsatilmagan'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/barter')}
                        className="btn-secondary inline-flex items-center gap-2 text-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                        Ochish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardPage;
