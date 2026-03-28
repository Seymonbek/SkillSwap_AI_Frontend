import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { barterService, authService } from '@/shared/api';
import { buildDirectChatLink } from '@/shared/lib/utils';
import {
  GraduationCap, Search, Star, MapPin, MessageSquare,
  CheckCircle2, XCircle, Clock,
  BookOpen, Users, X, Send, Sparkles, Wand2, Loader2, RefreshCw,
  Brain, Target, Calendar, Edit3, Check
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const ACTIVE_REQUEST_STATUSES = ['PENDING', 'NEGOTIATING', 'ACCEPTED'];
const ACTIVE_SESSION_STATUSES = ['PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'];
const REQUEST_STATUS_CONFIG = {
  PENDING: { label: "Kutilmoqda", color: 'text-amber-400', bg: 'bg-amber-500/10' },
  NEGOTIATING: { label: "Kelishilmoqda", color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ACCEPTED: { label: "Qabul qilindi", color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  REJECTED: { label: "Rad etildi", color: 'text-red-400', bg: 'bg-red-500/10' },
  COMPLETED: { label: "Yakunlandi", color: 'text-slate-300', bg: 'bg-slate-700/50' },
  CANCELLED: { label: "Bekor qilindi", color: 'text-slate-300', bg: 'bg-slate-700/50' },
};
const SESSION_STATUS_CONFIG = {
  PENDING: { label: "Kutilmoqda", color: 'text-amber-400', bg: 'bg-amber-500/10' },
  SCHEDULED: { label: "Rejalashtirilgan", color: 'text-blue-400', bg: 'bg-blue-500/10' },
  CONFIRMED: { label: "Tasdiqlangan", color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  IN_PROGRESS: { label: "Jarayonda", color: 'text-violet-400', bg: 'bg-violet-500/10' },
  COMPLETED: { label: "Yakunlangan", color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  CANCELLED: { label: "Bekor qilingan", color: 'text-slate-300', bg: 'bg-slate-700/50' },
};
const getId = (value) => value?.id ?? value ?? null;
const toArray = (value) => Array.isArray(value) ? value : [];
const toSkillName = (skill) => typeof skill === 'string' ? skill : skill?.name || '';
const formatDateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatTimeForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};
const getFullName = (user, fallback = 'Foydalanuvchi') => {
  const firstName = user?.first_name || user?.user?.first_name || '';
  const lastName = user?.last_name || user?.user?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || `${fallback}${user?.id ? ` #${user.id}` : ''}`;
};
const formatApiError = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;

  if (typeof data === 'string') {
    return data;
  }

  const directMessage =
    data.detail ||
    data.error ||
    data.non_field_errors?.[0] ||
    data.mentor?.[0] ||
    data.topic?.[0] ||
    data.scheduled_time?.[0];

  if (directMessage) {
    return directMessage;
  }

  const firstFieldError = Object.values(data).find((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return typeof value === 'string' && value.trim();
  });

  if (Array.isArray(firstFieldError)) {
    return firstFieldError[0];
  }

  if (typeof firstFieldError === 'string' && firstFieldError.trim()) {
    return firstFieldError;
  }

  return fallback;
};
const shouldLogBarterError = (error) =>
  error?.response?.status !== 401 &&
  error?.message !== 'No valid refresh token';
const formatScheduleSlot = (slot) => {
  if (!slot) return '';
  const date = new Date(slot);
  if (!Number.isNaN(date.getTime())) {
    return `${date.toLocaleDateString('uz-UZ')} ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return String(slot);
};
const getChatRoomId = (item) => item?.chat_room_id || item?.chat_room?.id || item?.chat_room || null;
const buildChatRoute = (roomId, extraParams = {}) => {
  if (!roomId) return null;
  const params = new URLSearchParams();

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  return params.toString() ? `/chat/${roomId}?${params.toString()}` : `/chat/${roomId}`;
};
const buildVideoRoute = (roomId, extraParams = {}) => {
  if (!roomId) return null;
  const params = new URLSearchParams({ room: String(roomId) });

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  return `/video?${params.toString()}`;
};
const getSessionPartnerMeta = (session, currentUserId) => {
  const mentorId = getId(session?.mentor_detail) || getId(session?.mentor);
  const studentId = getId(session?.student_detail) || getId(session?.student);
  const isMentor = currentUserId && String(mentorId) === String(currentUserId);
  const partner = isMentor ? session?.student_detail : session?.mentor_detail;
  const partnerId = isMentor ? studentId : mentorId;

  return {
    isMentor,
    partner,
    partnerId,
  };
};
const buildSessionChatLink = (session, currentUserId) => {
  if (!session?.id) return null;

  const roomId = getChatRoomId(session);
  if (roomId) {
    return buildChatRoute(roomId, { session: session.id });
  }

  const { partner, partnerId } = getSessionPartnerMeta(session, currentUserId);
  if (!partnerId) {
    return null;
  }

  return buildDirectChatLink({
    id: partnerId,
    first_name: partner?.first_name || partner?.user?.first_name,
    last_name: partner?.last_name || partner?.user?.last_name,
  }, { session: session.id });
};
const buildSessionVideoLink = (session) => {
  if (!session?.id) return null;

  const roomId = getChatRoomId(session);
  if (!roomId) {
    return null;
  }

  return buildVideoRoute(roomId, { session: session.id });
};
const normalizeMatchRecord = (match) => {
  const user = match?.user || match?.mentor_detail || match?.mentor || match?.candidate || match;

  return {
    ...match,
    user,
    matching_skills: toArray(
      match?.matching_skills || match?.shared_skills || match?.matched_skills
    ),
    score: match?.score ?? match?.match_score ?? match?.rating ?? user?.barter_rating ?? null,
    reason: match?.reason || match?.explanation || '',
  };
};
const normalizeMatchmakingResponse = (payload) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return { matches: payload.map(normalizeMatchRecord) };
  }

  const directMatches = payload.matches || payload.results || payload.recommendations || payload.candidates;
  if (Array.isArray(directMatches)) {
    return {
      ...payload,
      matches: directMatches.map(normalizeMatchRecord),
    };
  }

  if (payload.user || payload.mentor_detail || payload.mentor || payload.candidate) {
    return {
      ...payload,
      matches: [normalizeMatchRecord(payload)],
    };
  }

  if (typeof payload === 'string') {
    return { message: payload, matches: [] };
  }

  return {
    ...payload,
    matches: [],
  };
};

export const BarterPage = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestForm, setRequestForm] = useState({ message: '', duration_months: 1, date: '', time: '', duration_minutes: 60 });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('mentors');
  const [requestType, setRequestType] = useState('mentor'); // 'single' or 'mentor'
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', duration: 60 });
  const [negotiationForm, setNegotiationForm] = useState({ date: '', time: '' });
  const [currentUserId, setCurrentUserId] = useState(null);

  // AI Matchmaking
  const [matchmakingForm, setMatchmakingForm] = useState({ skills_i_have: '', skills_i_want: '' });
  const [findingMatch, setFindingMatch] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [matchError, setMatchError] = useState('');
  // User skills (Barter Announcement)
  const [myOffered, setMyOffered] = useState([]);
  const [myWanted, setMyWanted] = useState([]);
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillsForm, setSkillsForm] = useState({ offered: '', wanted: '' });
  const [savingSkills, setSavingSkills] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const actionLockRef = useRef(new Set());
  const openMatchmakingModal = () => {
    setMatchmakingForm((prev) => ({
      skills_i_have: prev.skills_i_have || myOffered.join(', '),
      skills_i_want: prev.skills_i_want || myWanted.join(', '),
    }));
    setShowMatchmaking(true);
  };

  useEffect(() => {
    const init = async () => {
      const meId = await fetchMySkills();
      setLoading(true);
      await Promise.all([fetchMentors(meId), fetchRequests(), fetchSessions()]);
      setLoading(false);
    };
    init();
  }, []);

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setSelectedMentor(null);
    setRequestType('mentor');
    setRequestForm({ message: '', duration_months: 1, date: '', time: '', duration_minutes: 60 });
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedRequest(null);
    setScheduleForm({ date: '', time: '', duration: 60 });
  };

  const closeNegotiationModal = () => {
    setShowNegotiationModal(false);
    setSelectedRequest(null);
    setNegotiationForm({ date: '', time: '' });
  };

  const isPastDateTime = (date, time) => {
    if (!date || !time) return false;
    return new Date(`${date}T${time}`).getTime() <= Date.now();
  };

  const fetchMySkills = async () => {
    try {
      const res = await authService.getMe();
      setCurrentUserId(res.data.id);
      localStorage.setItem('user', JSON.stringify(res.data));
      const offered = toArray(res.data.skills_offered);
      const wanted = toArray(res.data.skills_wanted);
      setMyOffered(offered);
      setMyWanted(wanted);
      setSkillsForm({ offered: offered.join(', '), wanted: wanted.join(', ') });
      return res.data.id; // return ID for fetchMentors
    } catch (err) {
      if (shouldLogBarterError(err)) {
        console.error('Fetch skills error:', err);
      }
      return null;
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const offeredSkills = skillsForm.offered.split(',').map(s => s.trim()).filter(Boolean);
      const wantedSkills = skillsForm.wanted.split(',').map(s => s.trim()).filter(Boolean);
      const res = await authService.updateMe({ skills_offered: offeredSkills, skills_wanted: wantedSkills });
      localStorage.setItem('user', JSON.stringify(res.data));
      setMyOffered(offeredSkills);
      setMyWanted(wantedSkills);
      setEditingSkills(false);
      setSuccessMsg("Ko'nikmalar saqlandi.");
      await refreshBarterData(activeTab, currentUserId);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save skills error:', err);
      setErrorMsg(formatApiError(err, "Ko'nikmalarni saqlab bo'lmadi"));
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSavingSkills(false);
    }
  };

  const fetchMentors = async (meId) => {
    try {
      const res = await authService.searchUsers({});
      const allUsers = res.data?.results || res.data || [];
      // Faqat ko'nikmasi bor va o'zi bo'lmagan foydalanuvchilarni ko'rsatish
      const filtered = allUsers.filter(u => {
        const hasSkills = toArray(u.skills_offered).length > 0 || toArray(u.skills_wanted).length > 0;
        const isNotMe = meId ? (u.id !== meId) : true;
        return hasSkills && isNotMe;
      });
      setMentors(filtered);
    } catch (err) {
      console.error('Fetch mentors error:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await barterService.getMentorships();
      setRequests(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await barterService.getSessions();
      const data = res.data?.results || res.data || [];
      setSessions(data);
      return data;
    } catch (err) {
      console.error('Fetch sessions error:', err);
      return [];
    }
  };

  const handleFindMatch = async () => {
    if (!matchmakingForm.skills_i_have.trim() || !matchmakingForm.skills_i_want.trim()) {
      setMatchError("Iltimos, ikkala maydonni to'ldiring");
      return;
    }
    setFindingMatch(true);
    setMatchError('');
    setMatchResult(null);
    try {
      const res = await barterService.findMatch({
        skills_i_have: matchmakingForm.skills_i_have,
        skills_i_want: matchmakingForm.skills_i_want,
      });
      setMatchResult(normalizeMatchmakingResponse(res.data));
    } catch (err) {
      setMatchError(formatApiError(err, 'AI moslashtirish xatolik yuz berdi'));
    } finally {
      setFindingMatch(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (requestType === 'single' && isPastDateTime(requestForm.date, requestForm.time)) {
      setErrorMsg("Sessiya vaqti hozirgi vaqtdan keyin bo'lishi kerak");
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (requestType === 'single') {
        // Bir martalik dars — to'g'ridan-to'g'ri sessiya yaratish
        const scheduled_time = new Date(`${requestForm.date}T${requestForm.time}`).toISOString();
        await barterService.createSession({
          mentor: selectedMentor.id,
          topic: requestForm.message || 'Bir martalik dars',
          scheduled_time: scheduled_time,
          duration_minutes: requestForm.duration_minutes,
        });
        await refreshBarterData('sessions');
        setSuccessMsg('Dars muvaffaqiyatli rejalashtirildi! ✅');
      } else {
        // Uzoq muddatli mentorlik
        await barterService.createMentorship({
          mentor: selectedMentor.id,
          message: requestForm.message || 'Mentorlik bo\'yicha yordam so\'rayman',
          duration_months: requestForm.duration_months,
        });
        await refreshBarterData('requests');
        setSuccessMsg("So'rov muvaffaqiyatli yuborildi! ✅");
      }
      closeRequestModal();
      // Auto-hide success message after 4 seconds
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Send request error:', err);
      const detail = formatApiError(err, 'Xatolik yuz berdi') || JSON.stringify(err.response?.data);
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const refreshBarterData = async (nextTab, meId = currentUserId, showLoader = true) => {
    if (showLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    await Promise.all([fetchMentors(meId), fetchRequests(), fetchSessions()]);
    if (nextTab) {
      setActiveTab(nextTab);
    }
    setRefreshing(false);
    setLoading(false);
  };

  const handleRespondToRequest = async (id, action) => {
    const request = requests.find((item) => item.id === id);
    if (action === 'accept' && toArray(request?.proposed_schedule).length === 0) {
      setErrorMsg("Qabul qilishdan oldin kamida bitta vaqt kelishilgan bo'lishi kerak");
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }
    setActionLoading(`${action}:${id}`);
    try {
      if (action === 'accept') {
        await barterService.acceptMentorship(id, request);
        setSuccessMsg("Mentorlik so'rovi qabul qilindi.");
      } else {
        await barterService.rejectMentorship(id, request);
        setSuccessMsg("Mentorlik so'rovi rad etildi.");
      }
      await fetchRequests();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Respond error:', err);
      const detail = formatApiError(err, 'So\'rovni yangilab bo\'lmadi');
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setActionLoading('');
    }
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    if (isPastDateTime(scheduleForm.date, scheduleForm.time)) {
      setErrorMsg("Sessiya vaqti hozirgi vaqtdan keyin bo'lishi kerak");
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }
    setSubmitting(true);
    try {
      const scheduled_time = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString();
      await barterService.createSession({
        mentor: getId(selectedRequest.mentor_detail) || getId(selectedRequest.mentor),
        topic: "Mentorship sessiyasi",
        scheduled_time: scheduled_time,
        duration_minutes: scheduleForm.duration
      });
      closeScheduleModal();
      await refreshBarterData('sessions');
      setSuccessMsg('Sessiya muvaffaqiyatli belgilandi.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Schedule error:', err);
      const detail = formatApiError(err, 'Sessiyani belgilab bo\'lmadi') || JSON.stringify(err.response?.data);
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNegotiateMentorship = async (e) => {
    e.preventDefault();
    if (!selectedRequest) {
      return;
    }

    if (isPastDateTime(negotiationForm.date, negotiationForm.time)) {
      setErrorMsg("Taklif qilinayotgan vaqt hozirgi vaqtdan keyin bo'lishi kerak");
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    setSubmitting(true);
    setActionLoading(`negotiate:${selectedRequest.id}`);
    try {
      const proposedSchedule = [new Date(`${negotiationForm.date}T${negotiationForm.time}`).toISOString()];
      await barterService.negotiateMentorship(selectedRequest.id, {
        ...selectedRequest,
        proposed_schedule: proposedSchedule,
      });
      closeNegotiationModal();
      await fetchRequests();
      setSuccessMsg("Taklif qilingan vaqt yuborildi.");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Negotiate mentorship error:', err);
      const detail = formatApiError(err, "Vaqtni kelishib bo'lmadi");
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSubmitting(false);
      setActionLoading('');
    }
  };

  const handleSessionAction = async (sessionId, action) => {
    const actionKey = `${action}:${sessionId}`;
    if (actionLockRef.current.has(actionKey)) {
      return;
    }

    actionLockRef.current.add(actionKey);
    setActionLoading(actionKey);

    try {
      const session = sessions.find((item) => item.id === sessionId);
      if (!session) {
        throw new Error('Session topilmadi');
      }
      const mentorId = getId(session.mentor_detail) || getId(session.mentor);
      const isMentor = currentUserId && String(mentorId) === String(currentUserId);

      if (action === 'complete' && session.status !== 'IN_PROGRESS') {
        setErrorMsg('Faqat boshlangan sessiyani yakunlash mumkin.');
        setTimeout(() => setErrorMsg(''), 5000);
        return;
      }

      if (action === 'complete' && !isMentor) {
        setErrorMsg('Sessiyani faqat mentor yakunlay oladi.');
        setTimeout(() => setErrorMsg(''), 5000);
        return;
      }

      if (action === 'confirm') {
        await barterService.confirmSession(sessionId, session);
        setSuccessMsg('Sessiya tasdiqlandi.');
      } else if (action === 'start') {
        await barterService.startSession(sessionId, session);
        setSuccessMsg('Sessiya boshlandi.');
      } else if (action === 'complete') {
        await barterService.completeSession(sessionId, session);
        setSuccessMsg('Sessiya yakunlandi.');
      } else if (action === 'cancel') {
        await barterService.cancelSession(sessionId, session);
        setSuccessMsg('Sessiya bekor qilindi.');
      }
      const refreshedSessions = await fetchSessions();
      const latestSession = Array.isArray(refreshedSessions)
        ? refreshedSessions.find((item) => item.id === sessionId) || session
        : session;

      if (action === 'start') {
        const sessionVideoLink = buildSessionVideoLink(latestSession);
        const sessionChatLink = buildSessionChatLink(latestSession, currentUserId);

        if (sessionVideoLink) {
          navigate(sessionVideoLink);
        } else if (sessionChatLink) {
          navigate(sessionChatLink);
        } else {
          setErrorMsg("Sessiya uchun video yoki chat xonasi topilmadi");
          setTimeout(() => setErrorMsg(''), 5000);
        }
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      if (err?.response?.status === 400) {
        await fetchSessions();
      }
      const detail = formatApiError(err, 'Sessiya action bajarilmadi');
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      actionLockRef.current.delete(actionKey);
      setActionLoading('');
    }
  };

  const handleMentorshipLifecycle = async (requestId, action) => {
    setActionLoading(`${action}:${requestId}`);
    try {
      const request = requests.find((item) => item.id === requestId);
      if (action === 'complete') {
        await barterService.completeMentorship(requestId, request);
        setSuccessMsg('Mentorlik yakunlandi.');
      } else if (action === 'cancel') {
        await barterService.cancelMentorship(requestId, request);
        setSuccessMsg('Mentorlik bekor qilindi.');
      }
      await fetchRequests();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Mentorship action error:', err);
      const detail = formatApiError(err, 'Mentorlik action bajarilmadi');
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setActionLoading('');
    }
  };

  const filteredMentors = mentors.filter((mentor) => {
    const q = searchQuery.toLowerCase();
    return (
      mentor.first_name?.toLowerCase().includes(q) ||
      mentor.last_name?.toLowerCase().includes(q) ||
      mentor.user?.first_name?.toLowerCase().includes(q) ||
      mentor.user?.last_name?.toLowerCase().includes(q) ||
      toArray(mentor.skills_offered).some(s => toSkillName(s).toLowerCase().includes(q)) ||
      toArray(mentor.skills_wanted).some(s => toSkillName(s).toLowerCase().includes(q))
    );
  });
  const sortedRequests = [...requests].sort((a, b) => {
    const priority = (item) => {
      if (item.status === 'NEGOTIATING') return 0;
      if (item.status === 'PENDING') return 1;
      if (item.status === 'ACCEPTED') return 2;
      if (item.status === 'COMPLETED') return 4;
      return 3;
    };
    return priority(a) - priority(b) || new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
  const sortedSessions = [...sessions].sort((a, b) => {
    const getTime = (item) => new Date(item.scheduled_time || item.created_at || 0).getTime();
    const aActive = ACTIVE_SESSION_STATUSES.includes(a.status) ? 0 : 1;
    const bActive = ACTIVE_SESSION_STATUSES.includes(b.status) ? 0 : 1;
    return aActive - bActive || getTime(a) - getTime(b);
  });
  const activeRequestsCount = requests.filter((request) => ACTIVE_REQUEST_STATUSES.includes(request.status)).length;
  const activeSessionsCount = sessions.filter((session) => ACTIVE_SESSION_STATUSES.includes(session.status)).length;
  const upcomingSessionsCount = sessions.filter((session) => {
    if (!ACTIVE_SESSION_STATUSES.includes(session.status) || !session.scheduled_time) return false;
    return new Date(session.scheduled_time).getTime() > Date.now();
  }).length;

  const tabs = [
    { id: 'mentors', label: 'Mentorlar', icon: GraduationCap },
    { id: 'requests', label: "So'rovlar", icon: Clock, badge: activeRequestsCount },
    { id: 'sessions', label: 'Sessiyalar', icon: Calendar, badge: activeSessionsCount || sessions.length },
  ];
  const normalizedMatchResult = normalizeMatchmakingResponse(matchResult);

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Toast notifications */}
      <AnimatePresence>
        {successMsg && (
          <Motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[60] bg-emerald-500/90 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md border border-emerald-400/20">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium text-sm">{successMsg}</span>
          </Motion.div>
        )}
        {errorMsg && (
          <Motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[60] bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md border border-red-400/20">
            <XCircle className="w-5 h-5" />
            <span className="font-medium text-sm">{errorMsg}</span>
          </Motion.div>
        )}
      </AnimatePresence>

      <div className="blob-bg">
        <div className="blob blob-2" style={{ width: '400px', height: '400px', opacity: 0.15 }} />
      </div>

      <Motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <Motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white"><span className="neon-text">Barter Ta&apos;lim</span></h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">Ko&apos;nikmalaringizni almashing va yangi bilimlar oling</p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={() => refreshBarterData(activeTab)}
              disabled={refreshing || loading}
              className="btn-secondary flex items-center gap-2 justify-center px-4"
            >
              <RefreshCw className={`w-4 h-4 ${(refreshing || loading) ? 'animate-spin' : ''}`} />
              Yangilash
            </button>
            <button onClick={openMatchmakingModal} className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center">
              <Brain className="w-4 h-4" />
              AI Moslashtirish
            </button>
          </div>
        </Motion.div>

        {/* Tabs */}
        <Motion.div variants={fadeInUp} className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'glass-card text-slate-400 hover:text-slate-200'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{tab.badge}</span>}
            </button>
          ))}
        </Motion.div>

        {/* My Barter Card - Skills Announcement */}
        <Motion.div variants={fadeInUp} className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" /> Mening ko&apos;nikmalarim
            </h3>
            {!editingSkills ? (
              <button onClick={() => setEditingSkills(true)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                <Edit3 className="w-4 h-4" /> Tahrirlash
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingSkills(false)} className="text-sm text-slate-400 hover:text-white">Bekor</button>
                <button onClick={handleSaveSkills} disabled={savingSkills}
                  className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium">
                  {savingSkills ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Saqlash</>}
                </button>
              </div>
            )}
          </div>

          {!editingSkills ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1.5">O&apos;rgataman (Men bilaman):</p>
                {myOffered.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {myOffered.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">Hali ko&apos;nikmalar qo&apos;shilmagan. &quot;Tahrirlash&quot; tugmasini bosing.</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">O&apos;rganmoqchiman:</p>
                {myWanted.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {myWanted.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">Hali ko&apos;nikmalar qo&apos;shilmagan.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Men bilaman (vergul bilan):</label>
                <input type="text" value={skillsForm.offered} onChange={(e) => setSkillsForm({ ...skillsForm, offered: e.target.value })}
                  className="glass-input w-full text-sm" placeholder="React, Python, Design..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">O&apos;rganmoqchiman (vergul bilan):</label>
                <input type="text" value={skillsForm.wanted} onChange={(e) => setSkillsForm({ ...skillsForm, wanted: e.target.value })}
                  className="glass-input w-full text-sm" placeholder="AI, ML, DevOps..." />
              </div>
            </div>
          )}
        </Motion.div>

        {/* Mentors Tab */}
        {activeTab === 'mentors' && (
          <>
            <Motion.div variants={fadeInUp} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mentor qidirish..." className="glass-input w-full pl-12 py-4" />
            </Motion.div>

            <Motion.div variants={fadeInUp} className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="glass-card p-3 sm:p-4 text-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mx-auto mb-1 sm:mb-2" />
                <h4 className="text-lg sm:text-xl font-bold text-white">{mentors.length}</h4>
                <p className="text-slate-400 text-xs sm:text-sm">Mentorlar</p>
              </div>
              <div className="glass-card p-3 sm:p-4 text-center">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                <h4 className="text-lg sm:text-xl font-bold text-white">{upcomingSessionsCount}</h4>
                <p className="text-slate-400 text-xs sm:text-sm">Yaqin sessiya</p>
              </div>
              <div className="glass-card p-3 sm:p-4 text-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mx-auto mb-1 sm:mb-2" />
                <h4 className="text-lg sm:text-xl font-bold text-white">{activeRequestsCount}</h4>
                <p className="text-slate-400 text-xs sm:text-sm">Faol so&apos;rov</p>
              </div>
            </Motion.div>

            <Motion.div variants={fadeInUp} className="space-y-4">
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="glass-card p-6 h-40 animate-pulse" />)
              ) : filteredMentors.length > 0 ? (
                filteredMentors.map((mentor) => {
                  const isRequested = requests.some(r => {
                    const mId = getId(r.mentor_detail) || getId(r.mentor);
                    const sId = getId(r.student_detail) || getId(r.student);
                    return String(sId) === String(currentUserId) && String(mId) === String(mentor.id) && ACTIVE_REQUEST_STATUSES.includes(r.status);
                  }) || sessions.some(s => {
                    const mentorId = getId(s.mentor_detail) || getId(s.mentor);
                    const studentId = getId(s.student_detail) || getId(s.student);
                    return String(studentId) === String(currentUserId) && String(mentorId) === String(mentor.id) && ACTIVE_SESSION_STATUSES.includes(s.status);
                  });
                  return (
                    <MentorCard key={mentor.id} mentor={mentor} isRequested={isRequested}
                      onRequest={() => { setSelectedMentor(mentor); setShowRequestModal(true); }} />
                  );
                })
              ) : (
                <div className="text-center py-16">
                  <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Mentorlar topilmadi</p>
                </div>
              )}
            </Motion.div>
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <Motion.div variants={fadeInUp} className="space-y-4">
            {requests.length > 0 ? (
              sortedRequests.map((request) => (
                <RequestCard key={request.id} request={request} currentUserId={currentUserId}
                  actionLoading={actionLoading}
                  onAccept={() => handleRespondToRequest(request.id, 'accept')}
                  onReject={() => handleRespondToRequest(request.id, 'reject')}
                  onNegotiate={() => {
                    const slot = toArray(request.proposed_schedule)[0];
                    setSelectedRequest(request);
                    setNegotiationForm({
                      date: formatDateForInput(slot),
                      time: formatTimeForInput(slot),
                    });
                    setShowNegotiationModal(true);
                  }}
                  onOpenChat={() => {
                    const chatRoomId = getChatRoomId(request);
                    if (chatRoomId) {
                      navigate(buildChatRoute(chatRoomId));
                      return;
                    }

                    const mentorId = getId(request.mentor_detail) || getId(request.mentor);
                    const studentId = getId(request.student_detail) || getId(request.student);
                    const isReceived = currentUserId && String(mentorId) === String(currentUserId);
                    const partner = isReceived ? request.student_detail : request.mentor_detail;
                    const partnerId = isReceived ? studentId : mentorId;

                    if (partnerId) {
                      navigate(buildDirectChatLink({
                        id: partnerId,
                        first_name: partner?.first_name || partner?.user?.first_name,
                        last_name: partner?.last_name || partner?.user?.last_name,
                      }));
                      return;
                    }

                    setErrorMsg("Bu mentorlik uchun chat xonasi topilmadi");
                    setTimeout(() => setErrorMsg(''), 5000);
                  }}
                  onSchedule={() => {
                    const slot = toArray(request.proposed_schedule)[0];
                    setSelectedRequest(request);
                    setScheduleForm({
                      date: formatDateForInput(slot),
                      time: formatTimeForInput(slot),
                      duration: 60,
                    });
                    setShowScheduleModal(true);
                  }}
                  onComplete={() => handleMentorshipLifecycle(request.id, 'complete')}
                  onCancel={() => handleMentorshipLifecycle(request.id, 'cancel')} />
              ))
            ) : (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">So&apos;rovlar yo&apos;q</p>
              </div>
            )}
          </Motion.div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <Motion.div variants={fadeInUp} className="space-y-4">
            {sessions.length > 0 ? (
              sortedSessions.map((session) => {
                const mentorId = getId(session.mentor_detail) || getId(session.mentor);
                const isMentor = String(mentorId) === String(currentUserId);
                const partner = isMentor ? session.student_detail : session.mentor_detail;
                const partnerName = getFullName(partner);
                const scheduledAt = session.scheduled_time ? new Date(session.scheduled_time) : null;
                const canConfirm = ['PENDING', 'SCHEDULED'].includes(session.status) && isMentor && scheduledAt && scheduledAt > new Date();
                const canStart = ['CONFIRMED', 'SCHEDULED'].includes(session.status) && scheduledAt && scheduledAt <= new Date(Date.now() + 15 * 60 * 1000);
                const canComplete = session.status === 'IN_PROGRESS' && isMentor;
                const sessionChatLink = buildSessionChatLink(session, currentUserId);
                const sessionVideoLink = buildSessionVideoLink(session);
                const statusConfig = SESSION_STATUS_CONFIG[session.status] || SESSION_STATUS_CONFIG.PENDING;

                return (
                  <div key={session.id} className="glass-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-emerald-400 mb-1 font-medium bg-emerald-500/10 inline-block px-2 py-0.5 rounded-full">
                            {isMentor ? 'Siz o\'rgatasiz' : 'Siz o\'rganasiz'}
                          </p>
                          <h4 className="font-medium text-white">{session.topic || session.skill || `Sessiya #${session.id}`}</h4>
                          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                            <Users className="w-4 h-4" /> {partnerName}
                          </p>
                        {scheduledAt && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {scheduledAt.toLocaleDateString('uz-UZ')} {scheduledAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <div className="flex flex-wrap justify-end gap-2">
                        {sessionChatLink && ACTIVE_SESSION_STATUSES.includes(session.status) && (
                          <button
                            onClick={() => navigate(sessionChatLink)}
                            className="px-3 py-1.5 bg-violet-500/10 text-violet-300 rounded-lg text-xs font-medium hover:bg-violet-500/20 transition-colors"
                          >
                            Chat
                          </button>
                        )}
                        {sessionVideoLink && ['CONFIRMED', 'SCHEDULED', 'IN_PROGRESS'].includes(session.status) && (
                          <button
                            onClick={() => navigate(sessionVideoLink)}
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            Video
                          </button>
                        )}
                        {canConfirm && (
                          <button
                            onClick={() => handleSessionAction(session.id, 'confirm')}
                            disabled={actionLoading === `confirm:${session.id}`}
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors"
                          >
                            {actionLoading === `confirm:${session.id}` ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
                          </button>
                        )}
                        {canStart && (
                          <button
                            onClick={() => handleSessionAction(session.id, 'start')}
                            disabled={actionLoading === `start:${session.id}`}
                            className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors"
                          >
                            {actionLoading === `start:${session.id}` ? 'Boshlanmoqda...' : 'Boshlash'}
                          </button>
                        )}
                        {canComplete && (
                          <button
                            onClick={() => handleSessionAction(session.id, 'complete')}
                            disabled={actionLoading === `complete:${session.id}`}
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            {actionLoading === `complete:${session.id}` ? 'Yakunlanmoqda...' : 'Yakunlash'}
                          </button>
                        )}
                        {['PENDING', 'SCHEDULED', 'CONFIRMED'].includes(session.status) && (
                          <button
                            onClick={() => handleSessionAction(session.id, 'cancel')}
                            disabled={actionLoading === `cancel:${session.id}`}
                            className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
                          >
                            {actionLoading === `cancel:${session.id}` ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
                          </button>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Sessiyalar yo&apos;q</h3>
                <p className="text-slate-400">Mentor bilan sessiya boshlash uchun so&apos;rov yuboring</p>
              </div>
            )}
          </Motion.div>
        )}
      </Motion.div>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {selectedMentor?.first_name || selectedMentor?.user?.first_name} ga so&apos;rov
                </h2>
                <button onClick={closeRequestModal} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSendRequest} className="p-6 space-y-5">
                {/* Session Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Dars turi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setRequestType('single')}
                      className={`py-3 rounded-xl font-medium transition-all text-sm ${requestType === 'single' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-slate-800 text-slate-400'}`}>
                      ⚡ Bir martalik dars
                    </button>
                    <button type="button" onClick={() => setRequestType('mentor')}
                      className={`py-3 rounded-xl font-medium transition-all text-sm ${requestType === 'mentor' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-slate-800 text-slate-400'}`}>
                      📚 Uzoq muddatli
                    </button>
                  </div>
                </div>

                {requestType === 'single' ? (
                  <>
                    {/* One-time session fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Sana</label>
                        <input type="date" required value={requestForm.date} onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
                          className="glass-input w-full text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Vaqt</label>
                        <input type="time" required value={requestForm.time} onChange={(e) => setRequestForm({ ...requestForm, time: e.target.value })}
                          className="glass-input w-full text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Davomiyligi</label>
                      <div className="flex gap-2">
                        {[30, 60, 90, 120].map((m) => (
                          <button key={m} type="button" onClick={() => setRequestForm({ ...requestForm, duration_minutes: m })}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${requestForm.duration_minutes === m ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {m} daq
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>  
                    {/* Mentorship fields */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Davomiyligi (oy)</label>
                      <div className="flex gap-2">
                        {[1, 3, 6, 12].map((month) => (
                          <button key={month} type="button" onClick={() => setRequestForm({ ...requestForm, duration_months: month })}
                            className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${requestForm.duration_months === month ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                            {month} oy
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Xabar</label>
                  <textarea value={requestForm.message} onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    placeholder={requestType === 'single' ? "Qaysi mavzu bo'yicha dars olmoqchisiz?" : "Nima o'rganmoqchisiz?"}
                    rows={3} className="glass-input w-full resize-none" required={requestType === 'mentor'} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeRequestModal} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Yuborish</>}
                  </button>
                </div>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Matchmaking Modal */}
      <AnimatePresence>
        {showMatchmaking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-lg">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">AI Moslashtirish</h2>
                </div>
                <button onClick={() => { setShowMatchmaking(false); setMatchResult(null); setMatchError(''); }}
                  className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-slate-400 text-sm">
                  AI sizning ko&apos;nikmalaringiz asosida eng mos mentorni topadi
                </p>

                {matchError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{matchError}</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Bilgan ko&apos;nikmalarim (vergul bilan)
                  </label>
                  <input type="text" value={matchmakingForm.skills_i_have}
                    onChange={e => setMatchmakingForm({ ...matchmakingForm, skills_i_have: e.target.value })}
                    className="glass-input w-full" placeholder="Python, React, Design" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    O&apos;rganmoqchi bo&apos;lganlarim (vergul bilan)
                  </label>
                  <input type="text" value={matchmakingForm.skills_i_want}
                    onChange={e => setMatchmakingForm({ ...matchmakingForm, skills_i_want: e.target.value })}
                    className="glass-input w-full" placeholder="AI, DevOps, Mobile" />
                </div>

                <button onClick={handleFindMatch} disabled={findingMatch}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {findingMatch ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI qidirmoqda...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Mos mentorni topish
                    </>
                  )}
                </button>

                {/* Match Result */}
                {normalizedMatchResult && (
                  <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="h-px bg-white/10" />

                    {normalizedMatchResult.matches?.length > 0 ? (
                      normalizedMatchResult.matches.map((match, i) => (
                        <div key={i} className="glass-card p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                              {match.user?.first_name?.charAt(0).toUpperCase() || match.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{match.user?.first_name || match.name} {match.user?.last_name || ''}</h4>
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-amber-400">{match.score || match.rating || 'N/A'}</span>
                                <span className="text-slate-500 ml-2">mos kelish</span>
                              </div>
                            </div>
                          </div>

                          {match.matching_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {match.matching_skills.map((s, si) => (
                                <span key={si} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">{s}</span>
                              ))}
                            </div>
                          )}

                          {match.reason && <p className="text-sm text-slate-400 mb-3">{match.reason}</p>}

                          <button onClick={() => {
                            setSelectedMentor(match.user || match.mentor_detail || match);
                            setShowMatchmaking(false);
                            setShowRequestModal(true);
                          }} className="btn-primary w-full py-2 text-sm">
                            So&apos;rov yuborish
                          </button>
                        </div>
                      ))
                    ) : normalizedMatchResult.message ? (
                      <div className="text-center py-4">
                        <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                        <p className="text-slate-300">{normalizedMatchResult.message}</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-slate-400">AI natija bermadi. Boshqa ko&apos;nikmalar bilan sinab ko&apos;ring.</p>
                      </div>
                    )}
                  </Motion.div>
                )}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Session Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" /> Sessiya belgilash
                </h2>
                <button onClick={closeScheduleModal} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleScheduleSession} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Sana</label>
                    <input type="date" required value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                      className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Vaqt</label>
                    <input type="time" required value={scheduleForm.time} onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                      className="glass-input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Davomiyligi (daqiqa)</label>
                  <select value={scheduleForm.duration} onChange={(e) => setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) })}
                    className="glass-input w-full bg-slate-800">
                    <option value={30}>30 daqiqa</option>
                    <option value={60}>60 daqiqa (1 soat)</option>
                    <option value={90}>90 daqiqa (1.5 soat)</option>
                    <option value={120}>120 daqiqa (2 soat)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeScheduleModal} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Belgilash'}
                  </button>
                </div>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mentorship Negotiation Modal */}
      <AnimatePresence>
        {showNegotiationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" /> Vaqt kelishish
                </h2>
                <button onClick={closeNegotiationModal} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleNegotiateMentorship} className="p-6 space-y-5">
                <p className="text-sm text-slate-400">
                  Mentorlik so&apos;rovi uchun qulay vaqt taklif qiling. Bu vaqt keyin qabul qilish uchun ishlatiladi.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Sana</label>
                    <input
                      type="date"
                      required
                      value={negotiationForm.date}
                      onChange={(e) => setNegotiationForm({ ...negotiationForm, date: e.target.value })}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Vaqt</label>
                    <input
                      type="time"
                      required
                      value={negotiationForm.time}
                      onChange={(e) => setNegotiationForm({ ...negotiationForm, time: e.target.value })}
                      className="glass-input w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeNegotiationModal} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Vaqtni yuborish'}
                  </button>
                </div>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MentorCard = ({ mentor, onRequest, isRequested }) => {
  const navigate = useNavigate();
  const name = mentor.first_name || mentor.user?.first_name || '';
  const lastName = mentor.last_name || mentor.user?.last_name || '';
  const location = mentor.location || mentor.user?.location || "Joylashuv ko'rsatilmagan";

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-white">{name} {lastName}</h3>
              <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> {location}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 font-semibold">{mentor.rating || mentor.barter_rating || '—'}</span>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {(() => {
              const offeredAll = Array.isArray(mentor.skills_offered) ? mentor.skills_offered : [];
              const wanted = Array.isArray(mentor.skills_wanted) ? mentor.skills_wanted : [];
              return (
                <>
                  {offeredAll.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">O&apos;rgatadi:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {offeredAll.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs border border-emerald-500/20">
                            {typeof skill === 'string' ? skill : skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {wanted.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">O&apos;rganmoqchi:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {wanted.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs border border-blue-500/20">
                            {typeof skill === 'string' ? skill : skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {offeredAll.length === 0 && wanted.length === 0 && (
                    <p className="text-xs text-slate-500 italic">Ko&apos;nikmalar qo&apos;shilmagan</p>
                  )}
                </>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" /> {mentor.total_students || 0} o&apos;quvchi
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> {mentor.total_sessions || 0} dars
            </span>
          </div>

          <div className="flex gap-3 mt-4">
            {isRequested ? (
              <button disabled className="btn-secondary px-4 py-2 text-sm text-emerald-400 flex items-center gap-2 opacity-100 border-emerald-500/20 bg-emerald-500/10 cursor-default">
                <CheckCircle2 className="w-4 h-4" /> So&apos;rov yuborilgan
              </button>
            ) : (
              <button onClick={onRequest} className="btn-primary px-4 py-2 text-sm">So&apos;rov yuborish</button>
            )}
            <button onClick={() => navigate(buildDirectChatLink({
              id: mentor.id || mentor.user?.id,
              first_name: mentor.first_name || mentor.user?.first_name,
              last_name: mentor.last_name || mentor.user?.last_name,
            }))}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Xabar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestCard = ({ request, onAccept, onReject, onNegotiate, onOpenChat, onSchedule, onComplete, onCancel, currentUserId, actionLoading }) => {
  const config = REQUEST_STATUS_CONFIG[request.status] || REQUEST_STATUS_CONFIG.PENDING;
  
  const mId = getId(request.mentor_detail) || getId(request.mentor);
  const sId = getId(request.student_detail) || getId(request.student);
  const isReceived = currentUserId && String(mId) === String(currentUserId);
  const isStudent = currentUserId && String(sId) === String(currentUserId);
  const partner = isReceived ? request.student_detail : request.mentor_detail;
  const partnerName = getFullName(partner);

  return (
    <div className="glass-card p-4 border-l-4 border-l-violet-500">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {partnerName.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-violet-400 mb-1 font-medium bg-violet-500/10 inline-block px-2 py-0.5 rounded-full">
                {isReceived ? 'Kiruvchi so\'rov' : 'Chiquvchi so\'rov'}
              </p>
              <h4 className="font-semibold text-white">{partnerName}</h4>
              <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> {request.duration_months} oy
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>{config.label}</span>
          </div>
          <p className="text-slate-300 text-sm mt-2">{request.message}</p>
          {request.proposed_schedule?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1">Kelishilgan vaqtlar:</p>
              <div className="flex flex-wrap gap-2">
                {request.proposed_schedule.map((slot, index) => (
                  <span key={`${request.id}-${index}`} className="px-2 py-0.5 bg-white/5 text-slate-300 rounded-full text-xs border border-white/10">
                    {formatScheduleSlot(slot)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(getChatRoomId(request) || getId(partner)) && (
            <div className="flex gap-2 mt-3">
              <button onClick={onOpenChat} className="px-3 py-1.5 bg-violet-500/10 text-violet-300 rounded-lg text-sm font-medium hover:bg-violet-500/20 transition-colors flex items-center gap-1">
                <MessageSquare className="w-4 h-4" /> Chatga o&apos;tish
              </button>
            </div>
          )}
          {isReceived && request.status === 'NEGOTIATING' && toArray(request.proposed_schedule).length === 0 && (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              Bu so&apos;rovni qabul qilishdan oldin vaqt kelishilishi kerak. Backend hozir accept uchun `proposed_schedule` talab qiladi.
            </div>
          )}
          {isReceived && ['PENDING', 'NEGOTIATING'].includes(request.status) && (
            <div className="flex gap-2 mt-3">
              <button onClick={onNegotiate} disabled={actionLoading === `negotiate:${request.id}`} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors">
                {toArray(request.proposed_schedule).length > 0 ? 'Vaqtni yangilash' : 'Vaqt taklif qilish'}
              </button>
              <button onClick={onAccept} disabled={actionLoading === `accept:${request.id}` || toArray(request.proposed_schedule).length === 0} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading === `accept:${request.id}` ? 'Qabul qilinmoqda...' : 'Qabul qilish'}
              </button>
              <button onClick={onReject} disabled={actionLoading === `reject:${request.id}`} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                {actionLoading === `reject:${request.id}` ? 'Rad etilmoqda...' : 'Rad etish'}
              </button>
            </div>
          )}
          {isStudent && ['PENDING', 'NEGOTIATING'].includes(request.status) && onNegotiate && (
            <div className="flex gap-2 mt-3">
              <button onClick={onNegotiate} disabled={actionLoading === `negotiate:${request.id}`} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors">
                {toArray(request.proposed_schedule).length > 0 ? 'Yangi vaqt taklif qilish' : 'Vaqt taklif qilish'}
              </button>
            </div>
          )}
          {request.status === 'ACCEPTED' && isStudent && onSchedule && (
            <div className="flex gap-2 mt-3">
              <button onClick={onSchedule} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Sessiya belgilash
              </button>
            </div>
          )}
          {request.status === 'ACCEPTED' && onComplete && (
            <div className="flex gap-2 mt-3">
              <button onClick={onComplete} disabled={actionLoading === `complete:${request.id}`} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                {actionLoading === `complete:${request.id}` ? 'Yakunlanmoqda...' : 'Mentorlikni yakunlash'}
              </button>
            </div>
          )}
          {isStudent && ['PENDING', 'NEGOTIATING'].includes(request.status) && onCancel && (
            <div className="flex gap-2 mt-3">
              <button onClick={onCancel} disabled={actionLoading === `cancel:${request.id}`} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                {actionLoading === `cancel:${request.id}` ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarterPage;
