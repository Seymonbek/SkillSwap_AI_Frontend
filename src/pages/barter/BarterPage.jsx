import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { barterService, authService } from '@/shared/api';
import {
  GraduationCap, Search, Star, MapPin, MessageSquare,
  CheckCircle2, XCircle, Clock, ChevronRight,
  BookOpen, Users, X, Send, Sparkles, Wand2, Loader2,
  Brain, Target, Video, Calendar
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
  const [requestForm, setRequestForm] = useState({ message: '', duration_months: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('mentors');

  // AI Matchmaking
  const [matchmakingForm, setMatchmakingForm] = useState({ known_skills: '', desired_skills: '' });
  const [findingMatch, setFindingMatch] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [matchError, setMatchError] = useState('');

  useEffect(() => {
    fetchMentors();
    fetchRequests();
    fetchSessions();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await authService.searchUsers({ min_barter_rating: 3 });
      setMentors(res.data?.results || res.data || []);
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
    try {
      await barterService.createMentorship({
        mentor: selectedMentor.id,
        message: requestForm.message,
        duration_months: requestForm.duration_months,
      });
      setShowRequestModal(false);
      setRequestForm({ message: '', duration_months: 1 });
      fetchRequests();
    } catch (err) {
      console.error('Send request error:', err);
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

  const filteredMentors = mentors.filter((mentor) => {
    const q = searchQuery.toLowerCase();
    return (
      mentor.first_name?.toLowerCase().includes(q) ||
      mentor.last_name?.toLowerCase().includes(q) ||
      mentor.user?.first_name?.toLowerCase().includes(q) ||
      mentor.user?.last_name?.toLowerCase().includes(q) ||
      mentor.skills?.some((skill) => (typeof skill === 'string' ? skill : skill.name || '').toLowerCase().includes(q))
    );
  });

  const tabs = [
    { id: 'mentors', label: 'Mentorlar', icon: GraduationCap },
    { id: 'requests', label: "So'rovlar", icon: Clock, badge: requests.filter(r => r.status === 'PENDING').length },
    { id: 'sessions', label: 'Sessiyalar', icon: Calendar, badge: sessions.length },
  ];

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="blob-bg">
        <div className="blob blob-2" style={{ width: '400px', height: '400px', opacity: 0.15 }} />
      </div>

      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white"><span className="neon-text">Barter Ta&apos;lim</span></h1>
            <p className="text-slate-400">Ko&apos;nikmalaringizni almashing va yangi bilimlar oling</p>
          </div>
          <button onClick={() => setShowMatchmaking(true)} className="btn-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Moslashtirish
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeInUp} className="flex gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
                activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'glass-card text-slate-400 hover:text-slate-200'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{tab.badge}</span>}
            </button>
          ))}
        </motion.div>

        {/* Mentors Tab */}
        {activeTab === 'mentors' && (
          <>
            <motion.div variants={fadeInUp} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mentor qidirish..." className="glass-input w-full pl-12 py-4" />
            </motion.div>

            <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 text-center">
                <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-xl font-bold text-white">{mentors.length}</h4>
                <p className="text-slate-400 text-sm">Mentorlar</p>
              </div>
              <div className="glass-card p-4 text-center">
                <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <h4 className="text-xl font-bold text-white">{sessions.length}</h4>
                <p className="text-slate-400 text-sm">Sessiyalar</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Star className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <h4 className="text-xl font-bold text-white">{requests.length}</h4>
                <p className="text-slate-400 text-sm">So&apos;rovlar</p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-4">
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="glass-card p-6 h-40 animate-pulse" />)
              ) : filteredMentors.length > 0 ? (
                filteredMentors.map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor}
                    onRequest={() => { setSelectedMentor(mentor); setShowRequestModal(true); }} />
                ))
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
                <RequestCard key={request.id} request={request}
                  onAccept={() => handleRespondToRequest(request.id, 'accept')}
                  onReject={() => handleRespondToRequest(request.id, 'reject')} />
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
              sessions.map((session) => (
                <div key={session.id} className="glass-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{session.topic || session.skill || `Sessiya #${session.id}`}</h4>
                        <p className="text-sm text-slate-400 mt-1">
                          Mentor: {session.mentor_name || session.mentor?.first_name || 'N/A'}
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
                        <button onClick={() => navigate(`/video?room=${session.room_id}`)}
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                          <Video className="w-3 h-3" /> Qo&apos;shilish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
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
              className="glass-card w-full max-w-lg">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {selectedMentor?.first_name || selectedMentor?.user?.first_name} ga so&apos;rov
                </h2>
                <button onClick={() => setShowRequestModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSendRequest} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Davomiyligi (oy)</label>
                  <div className="flex gap-2">
                    {[1, 3, 6, 12].map((month) => (
                      <button key={month} type="button" onClick={() => setRequestForm({ ...requestForm, duration_months: month })}
                        className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                          requestForm.duration_months === month ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}>
                        {month} oy
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Xabar</label>
                  <textarea value={requestForm.message} onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    placeholder="Nima o'rganmoqchisiz?" rows={4} className="glass-input w-full resize-none" />
                </div>
                <div className="flex gap-3 pt-4">
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
    </div>
  );
};

const MentorCard = ({ mentor, onRequest }) => {
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

          <div className="flex flex-wrap gap-2 mt-3">
            {(mentor.skills || mentor.skills_offered || []).slice(0, 5).map((skill, i) => (
              <span key={i} className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-400 border border-white/5">
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))}
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
            <button onClick={onRequest} className="btn-primary px-4 py-2 text-sm">So&apos;rov yuborish</button>
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

const RequestCard = ({ request, onAccept, onReject }) => {
  const statusConfig = {
    PENDING: { label: "Kutilmoqda", color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ACCEPTED: { label: "Qabul qilindi", color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    REJECTED: { label: "Rad etildi", color: 'text-red-400', bg: 'bg-red-500/10' },
  };
  const config = statusConfig[request.status] || statusConfig.PENDING;
  const mentorName = request.mentor?.first_name || request.mentor?.user?.first_name || '';
  const mentorLastName = request.mentor?.last_name || request.mentor?.user?.last_name || '';

  return (
    <div className="glass-card p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {mentorName.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-white">{mentorName} {mentorLastName}</h4>
              <p className="text-slate-400 text-sm flex items-center gap-1">
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
        </div>
      </div>
    </div>
  );
};

export default BarterPage;
