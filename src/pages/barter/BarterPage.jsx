import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { barterService, authService } from '@/shared/api';
import {
  GraduationCap, Search, Star, MapPin, MessageSquare,
  CheckCircle2, XCircle, Clock, ChevronRight,
  BookOpen, Users, X, Send, Sparkles, Wand2, Loader2,
  Brain, Target, Video, Calendar, Edit3, Check, Plus
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export const BarterPage = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', duration: 60 });
  const [currentUserId, setCurrentUserId] = useState(null);

  // AI Matchmaking
  const [matchmakingForm, setMatchmakingForm] = useState({ known_skills: '', desired_skills: '' });
  const [findingMatch, setFindingMatch] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [matchError, setMatchError] = useState('');
  // User skills (Barter Announcement)
  const [myOffered, setMyOffered] = useState([]);
  const [myWanted, setMyWanted] = useState([]);
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillsForm, setSkillsForm] = useState({ offered: '', wanted: '' });
  const [savingSkills, setSavingSkills] = useState(false);

  useEffect(() => {
    const init = async () => {
      const meId = await fetchMySkills();
      fetchMentors(meId);
      fetchRequests();
      fetchSessions();
    };
    init();
  }, []);

  const fetchMySkills = async () => {
    try {
      const res = await authService.getMe();
      setCurrentUserId(res.data.id);
      const offered = Array.isArray(res.data.skills_offered) ? res.data.skills_offered : [];
      const wanted = Array.isArray(res.data.skills_wanted) ? res.data.skills_wanted : [];
      setMyOffered(offered);
      setMyWanted(wanted);
      setSkillsForm({ offered: offered.join(', '), wanted: wanted.join(', ') });
      return res.data.id; // return ID for fetchMentors
    } catch (err) {
      console.error('Fetch skills error:', err);
      return null;
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const offeredSkills = skillsForm.offered.split(',').map(s => s.trim()).filter(Boolean);
      const wantedSkills = skillsForm.wanted.split(',').map(s => s.trim()).filter(Boolean);
      await authService.updateMe({ skills_offered: offeredSkills, skills_wanted: wantedSkills });
      setMyOffered(offeredSkills);
      setMyWanted(wantedSkills);
      setEditingSkills(false);
    } catch (err) {
      console.error('Save skills error:', err);
    } finally {
      setSavingSkills(false);
    }
  };

  const fetchMentors = async (meId) => {
    try {
      setLoading(true);
      const res = await authService.searchUsers({});
      const allUsers = res.data?.results || res.data || [];
      // Faqat ko'nikmasi bor va o'zi bo'lmagan foydalanuvchilarni ko'rsatish
      const filtered = allUsers.filter(u => {
        const hasSkills = (u.skills_offered && u.skills_offered.length > 0) || (u.skills_wanted && u.skills_wanted.length > 0);
        const isNotMe = meId ? (u.id !== meId) : true;
        return hasSkills && isNotMe;
      });
      setMentors(filtered);
    } catch (err) {
      console.error('Fetch mentors error:', err);
    } finally {
      setLoading(false);
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
      setSessions(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch sessions error:', err);
    }
  };

  const handleFindMatch = async () => {
    if (!matchmakingForm.known_skills.trim() || !matchmakingForm.desired_skills.trim()) {
      setMatchError("Iltimos, ikkala maydonni to'ldiring");
      return;
    }
    setFindingMatch(true);
    setMatchError('');
    setMatchResult(null);
    try {
      const res = await barterService.findMatch({
        known_skills: matchmakingForm.known_skills.split(',').map(s => s.trim()).filter(Boolean),
        desired_skills: matchmakingForm.desired_skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setMatchResult(res.data);
    } catch (err) {
      setMatchError(err.response?.data?.detail || 'AI moslashtirish xatolik yuz berdi');
    } finally {
      setFindingMatch(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
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
        fetchSessions();
        setActiveTab('sessions');
        setSuccessMsg('Dars muvaffaqiyatli rejalashtirildi! ✅');
      } else {
        // Uzoq muddatli mentorlik
        await barterService.createMentorship({
          mentor: selectedMentor.id,
          message: requestForm.message,
          duration_months: requestForm.duration_months,
        });
        fetchRequests();
        setActiveTab('requests');
        setSuccessMsg("So'rov muvaffaqiyatli yuborildi! ✅");
      }
      setShowRequestModal(false);
      setRequestForm({ message: '', duration_months: 1, date: '', time: '', duration_minutes: 60 });
      // Auto-hide success message after 4 seconds
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Send request error:', err);
      const detail = err.response?.data?.detail || err.response?.data?.mentor?.[0] || err.response?.data?.non_field_errors?.[0] || JSON.stringify(err.response?.data) || 'Xatolik yuz berdi';
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondToRequest = async (id, action) => {
    try {
      await barterService.acceptMentorship(id, { action });
      fetchRequests();
    } catch (err) {
      console.error('Respond error:', err);
    }
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const scheduled_time = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString();
      await barterService.createSession({
        mentorship: selectedRequest.id,
        topic: "Mentorship sessiyasi",
        scheduled_time: scheduled_time,
        duration_minutes: scheduleForm.duration
      });
      setShowScheduleModal(false);
      fetchSessions();
      setActiveTab('sessions');
    } catch (err) {
      console.error('Schedule error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMentors = mentors.filter((mentor) => {
    const q = searchQuery.toLowerCase();
    return (
      mentor.first_name?.toLowerCase().includes(q) ||
      mentor.last_name?.toLowerCase().includes(q) ||
      mentor.user?.first_name?.toLowerCase().includes(q) ||
      mentor.user?.last_name?.toLowerCase().includes(q) ||
      (mentor.skills_offered || []).some(s => (typeof s === 'string' ? s : s.name || '').toLowerCase().includes(q)) ||
      (mentor.skills_wanted || []).some(s => (typeof s === 'string' ? s : s.name || '').toLowerCase().includes(q))
    );
  });

  const tabs = [
    { id: 'mentors', label: 'Mentorlar', icon: GraduationCap },
    { id: 'requests', label: "So'rovlar", icon: Clock, badge: requests.filter(r => r.status === 'PENDING').length },
    { id: 'sessions', label: 'Sessiyalar', icon: Calendar, badge: sessions.length },
  ];

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Toast notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[60] bg-emerald-500/90 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md border border-emerald-400/20">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium text-sm">{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[60] bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md border border-red-400/20">
            <XCircle className="w-5 h-5" />
            <span className="font-medium text-sm">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="blob-bg">
        <div className="blob blob-2" style={{ width: '400px', height: '400px', opacity: 0.15 }} />
      </div>

      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white"><span className="neon-text">Barter Ta&apos;lim</span></h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">Ko&apos;nikmalaringizni almashing va yangi bilimlar oling</p>
          </div>
          <button onClick={() => setShowMatchmaking(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
            <Brain className="w-4 h-4" />
            AI Moslashtirish
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeInUp} className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full">
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
        </motion.div>

        {/* My Barter Card - Skills Announcement */}
        <motion.div variants={fadeInUp} className="glass-card p-4 sm:p-5">
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
        </motion.div>

        {/* Mentors Tab */}
        {activeTab === 'mentors' && (
          <>
            <motion.div variants={fadeInUp} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mentor qidirish..." className="glass-input w-full pl-12 py-4" />
            </motion.div>

            <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="glass-card p-3 sm:p-4 text-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mx-auto mb-1 sm:mb-2" />
                <h4 className="text-lg sm:text-xl font-bold text-white">{mentors.length}</h4>
                <p className="text-slate-400 text-xs sm:text-sm">Mentorlar</p>
              </div>
              <div className="glass-card p-3 sm:p-4 text-center">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                <h4 className="text-lg sm:text-xl font-bold text-white">{sessions.length}</h4>
                <p className="text-slate-400 text-xs sm:text-sm">Sessiyalar</p>
              </div>
              <div className="glass-card p-3 sm:p-4 text-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mx-auto mb-1 sm:mb-2" />
                <h4 className="text-lg sm:text-xl font-bold text-white">{requests.length}</h4>
                <p className="text-slate-400 text-xs sm:text-sm">So&apos;rovlar</p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-4">
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="glass-card p-6 h-40 animate-pulse" />)
              ) : filteredMentors.length > 0 ? (
                filteredMentors.map((mentor) => {
                  const isRequested = requests.some(r => {
                    const mId = r.mentor?.id || r.mentor;
                    const sId = r.student?.id || r.student;
                    return sId === currentUserId && mId === mentor.id && (r.status === 'PENDING' || r.status === 'ACCEPTED');
                  }) || sessions.some(s => {
                    const pId = s.partner?.id || s.partner;
                    const isMySession = s.status !== 'COMPLETED' && s.status !== 'CANCELLED';
                    return pId === mentor.id && isMySession;
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
            </motion.div>
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <motion.div variants={fadeInUp} className="space-y-4">
            {requests.length > 0 ? (
              requests.map((request) => (
                <RequestCard key={request.id} request={request} currentUserId={currentUserId}
                  onAccept={() => handleRespondToRequest(request.id, 'accept')}
                  onReject={() => handleRespondToRequest(request.id, 'reject')}
                  onSchedule={() => { setSelectedRequest(request); setShowScheduleModal(true); }} />
              ))
            ) : (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">So&apos;rovlar yo&apos;q</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <motion.div variants={fadeInUp} className="space-y-4">
            {sessions.length > 0 ? (
              sessions.map((session) => {
                const isMentor = session.mentor === currentUserId;
                const partner = isMentor ? session.student_detail : session.mentor_detail;
                const partnerName = partner?.first_name || partner?.user?.first_name || `Foydalanuvchi #${partner?.id || '?'}`;

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
                            <Users className="w-4 h-4" /> {partnerName} {partner?.last_name || ''}
                          </p>
                        {session.scheduled_at && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.scheduled_at).toLocaleDateString('uz-UZ')} {new Date(session.scheduled_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        session.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-400' :
                        session.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {session.status}
                      </span>
                      {session.room_id && (
                        <button onClick={() => navigate(`/video?room=${session.room_id}&session=${session.id}`)}
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                          <Video className="w-3 h-3" /> Qo&apos;shilish
                        </button>
                      )}
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
          </motion.div>
        )}
      </motion.div>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {selectedMentor?.first_name || selectedMentor?.user?.first_name} ga so&apos;rov
                </h2>
                <button onClick={() => setShowRequestModal(false)} className="p-2 rounded-lg hover:bg-white/5">
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
                    rows={3} className="glass-input w-full resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Yuborish</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Matchmaking Modal */}
      <AnimatePresence>
        {showMatchmaking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
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
                  <input type="text" value={matchmakingForm.known_skills}
                    onChange={e => setMatchmakingForm({ ...matchmakingForm, known_skills: e.target.value })}
                    className="glass-input w-full" placeholder="Python, React, Design" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    O&apos;rganmoqchi bo&apos;lganlarim (vergul bilan)
                  </label>
                  <input type="text" value={matchmakingForm.desired_skills}
                    onChange={e => setMatchmakingForm({ ...matchmakingForm, desired_skills: e.target.value })}
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
                {matchResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="h-px bg-white/10" />

                    {matchResult.matches?.length > 0 ? (
                      matchResult.matches.map((match, i) => (
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
                            setSelectedMentor(match.user || match);
                            setShowMatchmaking(false);
                            setShowRequestModal(true);
                          }} className="btn-primary w-full py-2 text-sm">
                            So&apos;rov yuborish
                          </button>
                        </div>
                      ))
                    ) : matchResult.message ? (
                      <div className="text-center py-4">
                        <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                        <p className="text-slate-300">{matchResult.message}</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-slate-400">AI natija bermadi. Boshqa ko&apos;nikmalar bilan sinab ko&apos;ring.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Session Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" /> Sessiya belgilash
                </h2>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 rounded-lg hover:bg-white/5">
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
                  <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Belgilash'}
                  </button>
                </div>
              </form>
            </motion.div>
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
            <button onClick={() => navigate(`/chat?user=${mentor.id || mentor.user?.id}`)}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Xabar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestCard = ({ request, onAccept, onReject, onSchedule, currentUserId }) => {
  const statusConfig = {
    PENDING: { label: "Kutilmoqda", color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ACCEPTED: { label: "Qabul qilindi", color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    REJECTED: { label: "Rad etildi", color: 'text-red-400', bg: 'bg-red-500/10' },
  };
  const config = statusConfig[request.status] || statusConfig.PENDING;
  
  const mId = request.mentor?.id || request.mentor;
  const isReceived = currentUserId && (mId === currentUserId);
  const partner = isReceived ? request.student_detail : request.mentor_detail;
  const partnerName = partner?.first_name || partner?.user?.first_name || `Foydalanuvchi #${partner?.id || '?'}`;
  const partnerLastName = partner?.last_name || partner?.user?.last_name || '';

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
              <h4 className="font-semibold text-white">{partnerName} {partnerLastName}</h4>
              <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> {request.duration_months} oy
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>{config.label}</span>
          </div>
          <p className="text-slate-300 text-sm mt-2">{request.message}</p>
          {request.status === 'PENDING' && (
            <div className="flex gap-2 mt-3">
              <button onClick={onAccept} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                Qabul qilish
              </button>
              <button onClick={onReject} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                Rad etish
              </button>
            </div>
          )}
          {request.status === 'ACCEPTED' && onSchedule && (
            <div className="flex gap-2 mt-3">
              <button onClick={onSchedule} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Sessiya belgilash
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarterPage;
