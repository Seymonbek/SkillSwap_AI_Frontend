import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/shared/api';
import {
  Mail, Phone, MapPin, Calendar, Star, Briefcase,
  Award, LogOut, ChevronRight, Camera, Edit3,
  Wallet, Shield, Bell, X, Check, Loader2,
  Code, TrendingUp, BookOpen, Crown, FileText,
  AlertTriangle, Plus, AlertCircle, QrCode
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [skillTests, setSkillTests] = useState([]);

  // 2FA
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState('');

  // Portfolio modal
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', url: '', image: null });
  const [portfolioSaving, setPortfolioSaving] = useState(false);

  // Avatar
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPortfolio();
    fetchReviews();
    fetchSkillTests();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authService.getMe();
      const offered = Array.isArray(res.data.skills_offered) ? res.data.skills_offered : [];
      const wanted = Array.isArray(res.data.skills_wanted) ? res.data.skills_wanted : [];
      
      const userData = {
        ...res.data,
        skills_offered: offered,
        skills_wanted: wanted,
      };
      setUser(userData);
      setEditForm({
        ...userData,
        skills_offered: offered.join(', '),
        skills_wanted: wanted.join(', '),
      });
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await authService.getPortfolio();
      setPortfolio(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch portfolio error:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await authService.getReviews();
      setReviews(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch reviews error:', err);
    }
  };

  const fetchSkillTests = async () => {
    try {
      const res = await authService.getSkillTests();
      setSkillTests(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Fetch skill tests error:', err);
    }
  };

  // Avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await authService.updateMe(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Profile edit save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const offeredSkills = (editForm.skills_offered || '').split(',').map(s => s.trim()).filter(Boolean);
      const wantedSkills = (editForm.skills_wanted || '').split(',').map(s => s.trim()).filter(Boolean);

      const saveData = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
        location: editForm.location,
        bio: editForm.bio,
        skills_offered: offeredSkills,
        skills_wanted: wantedSkills,
      };
      const res = await authService.updateMe(saveData);
      setUser({
        ...res.data,
        skills_offered: (res.data.skills || []).filter(s => typeof s === 'string' && s.startsWith('[O]')).map(s => s.replace('[O]', '')),
        skills_wanted: (res.data.skills || []).filter(s => typeof s === 'string' && s.startsWith('[W]')).map(s => s.replace('[W]', '')),
      });
      localStorage.setItem('user', JSON.stringify(res.data));
      setShowEditModal(false);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  // 2FA setup
  const handle2FASetup = async () => {
    setShow2FAModal(true);
    setTwoFAError('');
    setTwoFACode('');
    try {
      const res = await authService.setup2FA();
      setQrData(res.data);
    } catch (err) {
      setTwoFAError(err.response?.data?.detail || 'Xatolik yuz berdi');
    }
  };

  const handle2FAConfirm = async (e) => {
    e.preventDefault();
    if (!twoFACode || twoFACode.length !== 6) {
      setTwoFAError('6 raqamli kodni kiriting');
      return;
    }
    setTwoFALoading(true);
    setTwoFAError('');
    try {
      await authService.verify2FA({ code: twoFACode });
      setUser(prev => ({ ...prev, is_two_factor_enabled: true }));
      setShow2FAModal(false);
    } catch (err) {
      setTwoFAError(err.response?.data?.detail || "Kod noto'g'ri");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FADisable = async () => {
    try {
      await authService.disable2FA();
      setUser(prev => ({ ...prev, is_two_factor_enabled: false }));
    } catch (err) {
      console.error('Disable 2FA error:', err);
    }
  };

  // Portfolio add
  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    setPortfolioSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', portfolioForm.title);
      formData.append('description', portfolioForm.description);
      if (portfolioForm.url) formData.append('url', portfolioForm.url);
      if (portfolioForm.image) formData.append('image', portfolioForm.image);
      const res = await authService.addPortfolioItem(formData);
      setPortfolio(prev => [res.data, ...prev]);
      setShowPortfolioModal(false);
      setPortfolioForm({ title: '', description: '', url: '', image: null });
    } catch (err) {
      console.error('Add portfolio error:', err);
    } finally {
      setPortfolioSaving(false);
    }
  };

  const handleDeletePortfolio = async (id) => {
    try {
      await authService.deletePortfolioItem(id);
      setPortfolio(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete portfolio error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { icon: Briefcase, label: "Mening ishlarim", gradient: 'from-blue-500 to-cyan-500', onClick: () => navigate('/jobs') },
    { icon: Wallet, label: "Hamyon", gradient: 'from-emerald-500 to-teal-500', onClick: () => navigate('/wallet') },
    { icon: FileText, label: 'Shartnomalar', gradient: 'from-pink-500 to-rose-500', onClick: () => navigate('/contracts') },
    { icon: Crown, label: 'Obuna', gradient: 'from-amber-500 to-orange-500', onClick: () => navigate('/subscriptions') },
    { icon: Shield, label: 'Xavfsizlik (2FA)', gradient: 'from-violet-500 to-purple-500', onClick: () => user?.is_two_factor_enabled ? handle2FADisable() : handle2FASetup() },
    { icon: AlertTriangle, label: 'Nizolar', gradient: 'from-red-500 to-pink-500', onClick: () => navigate('/disputes') },
    { icon: Bell, label: 'Bildirishnomalar', gradient: 'from-cyan-500 to-blue-500', onClick: () => navigate('/notifications') },
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="glass-card h-64 animate-pulse" />
        <div className="glass-card h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.15 }} />
      </div>

      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Profile Header Card */}
        <motion.div variants={fadeInUp}>
          <div className="glass-card relative overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            <div className="p-6 relative">
              <div className="flex flex-col items-center -mt-16">
                {/* Avatar with upload */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-50" />
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar"
                      className="relative w-32 h-32 rounded-full object-cover border-4 border-slate-900 shadow-2xl" />
                  ) : (
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-slate-900 shadow-2xl">
                      {user?.first_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-slate-800 rounded-full border border-slate-700 shadow-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : <Camera className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-white">{user?.first_name} {user?.last_name}</h2>
                <p className="text-slate-400">{user?.email}</p>
                {user?.bio && <p className="text-slate-300 text-sm mt-2 text-center max-w-md">{user.bio}</p>}

                <div className="flex items-center gap-2 mt-3">
                  {user?.is_verified && (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20 flex items-center gap-1">
                      <Shield className="w-4 h-4" /> Tasdiqlangan
                    </span>
                  )}
                  {user?.is_two_factor_enabled && (
                    <span className="px-3 py-1 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium border border-violet-500/20 flex items-center gap-1">
                      <QrCode className="w-4 h-4" /> 2FA
                    </span>
                  )}
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowEditModal(true)} className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
                    <Edit3 className="w-4 h-4" /> Tahrirlash
                  </button>
                  <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300">
                    <LogOut className="w-4 h-4" /> Chiqish
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                <StatBox icon={Briefcase} value={user?.total_jobs || '0'} label="Ishlar" color="text-blue-400" />
                <StatBox icon={Wallet} value={user?.balance || user?.tokens || '0'} label="Balans" color="text-emerald-400" />
                <StatBox icon={Star} value={user?.rating || '0.0'} label="Reyting" color="text-amber-400" />
                <StatBox icon={BookOpen} value={portfolio.length} label="Portfolio" color="text-violet-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skills */}
        {(user?.skills_offered?.length > 0 || user?.skills_wanted?.length > 0) && (
          <motion.div variants={fadeInUp} className="glass-card p-6">
            {user?.skills_offered?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">O&apos;rgataman</h4>
                <div className="flex flex-wrap gap-2">
                  {user.skills_offered.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm rounded-full border border-emerald-500/20">
                      {typeof s === 'string' ? s : s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {user?.skills_wanted?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">O&apos;rganmoqchiman</h4>
                <div className="flex flex-wrap gap-2">
                  {user.skills_wanted.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full border border-blue-500/20">
                      {typeof s === 'string' ? s : s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={fadeInUp} className="flex gap-2">
          {[
            { id: 'info', label: "Ma'lumotlar", icon: Award },
            { id: 'portfolio', label: 'Portfolio', icon: Code, badge: portfolio.length },
            { id: 'reviews', label: 'Sharhlar', icon: Star, badge: reviews.length },
            { id: 'skills', label: 'Skill Test', icon: TrendingUp, badge: skillTests.length },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-white/5'
              }`}>
              <tab.icon className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">{tab.label}</span>
              {tab.badge > 0 && <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">{tab.badge}</span>}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div variants={fadeInUp}>
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Ma&apos;lumotlar</h3>
                </div>
                <div className="space-y-4">
                  <InfoRow icon={Mail} label="Email" value={user?.email} />
                  <InfoRow icon={Phone} label="Telefon" value={user?.phone || "Qo'shilmagan"} />
                  <InfoRow icon={MapPin} label="Joylashuv" value={user?.location || "Ko'rsatilmagan"} />
                  <InfoRow icon={Calendar} label="Qo'shilgan" value={user?.date_joined ? new Date(user.date_joined).toLocaleDateString('uz-UZ') : '-'} />
                </div>
              </motion.div>
            )}

            {activeTab === 'portfolio' && (
              <motion.div key="portfolio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <button onClick={() => setShowPortfolioModal(true)} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Loyiha qo&apos;shish
                </button>
                {portfolio.length === 0 ? (
                  <div className="glass-card p-6 text-center">
                    <Code className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Portfolio bo&apos;sh</p>
                  </div>
                ) : (
                  portfolio.map((item) => (
                    <div key={item.id} className="glass-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm underline mt-1 block">
                              Loyihani ko&apos;rish
                            </a>
                          )}
                          <div className="flex gap-2 mt-2">
                            {item.technologies?.map((tech) => (
                              <span key={tech} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">{tech}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {item.ai_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400" />
                              <span className="text-sm text-slate-300">{item.ai_rating}</span>
                            </div>
                          )}
                          <button onClick={() => handleDeletePortfolio(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="glass-card p-6 text-center">
                    <Star className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Sharhlar yo&apos;q</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="glass-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 inline ${i < review.rating ? 'text-amber-400' : 'text-slate-600'}`} />
                          ))}
                        </div>
                        <div>
                          <p className="text-slate-300">{review.comment}</p>
                          <p className="text-sm text-slate-500 mt-1">{new Date(review.created_at).toLocaleDateString('uz-UZ')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {skillTests.length === 0 ? (
                  <div className="glass-card p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Skill testlar yo&apos;q</p>
                  </div>
                ) : (
                  skillTests.map((test) => (
                    <div key={test.id} className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{test.skill_name}</h4>
                          <p className="text-sm text-slate-400">{test.status}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          test.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' :
                          test.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {test.score || test.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Menu */}
        <motion.div variants={fadeInUp}>
          <div className="glass-card overflow-hidden">
            {menuItems.map((item, index) => (
              <button key={item.label} onClick={item.onClick}
                className={`w-full flex items-center justify-between p-4 transition-all hover:bg-white/5 ${
                  index !== menuItems.length - 1 ? 'border-b border-white/5' : ''
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.gradient} shadow-lg`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-slate-200">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <h2 className="text-xl font-bold text-white">Profilni tahrirlash</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ism</label>
                  <input type="text" value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Familiya</label>
                  <input type="text" value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                  <textarea value={editForm.bio || ''} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="glass-input w-full h-24 resize-none" placeholder="O'zingiz haqingizda..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Telefon</label>
                  <input type="tel" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Joylashuv</label>
                  <input type="text" value={editForm.location || ''} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">O&apos;rgatadigan ko&apos;nikmalar (vergul bilan)</label>
                  <input type="text" value={Array.isArray(editForm.skills_offered) ? editForm.skills_offered.join(', ') : editForm.skills_offered || ''}
                    onChange={(e) => setEditForm({ ...editForm, skills_offered: e.target.value })} className="glass-input w-full" placeholder="React, Python, Design" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">O&apos;rganmoqchi bo&apos;lgan ko&apos;nikmalar</label>
                  <input type="text" value={Array.isArray(editForm.skills_wanted) ? editForm.skills_wanted.join(', ') : editForm.skills_wanted || ''}
                    onChange={(e) => setEditForm({ ...editForm, skills_wanted: e.target.value })} className="glass-input w-full" placeholder="AI, ML, DevOps" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-4 h-4" /> Saqlash</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2FA Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">2FA Yoqish</h2>
                <button onClick={() => setShow2FAModal(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                {twoFAError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-red-400 text-sm">{twoFAError}</p>
                  </div>
                )}
                {qrData && (
                  <div className="text-center">
                    {qrData.qr_code && <img src={qrData.qr_code} alt="QR code" className="w-48 h-48 mx-auto rounded-xl bg-white p-2" />}
                    {qrData.secret && (
                      <div className="mt-4">
                        <p className="text-slate-400 text-sm mb-1">Maxfiy kalit:</p>
                        <code className="text-emerald-400 text-sm bg-slate-800 px-3 py-1 rounded">{qrData.secret}</code>
                      </div>
                    )}
                  </div>
                )}
                <form onSubmit={handle2FAConfirm} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">6 raqamli kod</label>
                    <input type="text" maxLength={6} value={twoFACode} onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                      className="glass-input w-full text-center text-2xl tracking-widest" placeholder="000000" />
                  </div>
                  <button type="submit" disabled={twoFALoading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                    {twoFALoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tasdiqlash'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Portfolio Modal */}
      <AnimatePresence>
        {showPortfolioModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Loyiha qo&apos;shish</h2>
                <button onClick={() => setShowPortfolioModal(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddPortfolio} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nomi</label>
                  <input type="text" value={portfolioForm.title} onChange={e => setPortfolioForm({ ...portfolioForm, title: e.target.value })} className="glass-input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tavsif</label>
                  <textarea value={portfolioForm.description} onChange={e => setPortfolioForm({ ...portfolioForm, description: e.target.value })} className="glass-input w-full h-20 resize-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL (ixtiyoriy)</label>
                  <input type="url" value={portfolioForm.url} onChange={e => setPortfolioForm({ ...portfolioForm, url: e.target.value })} className="glass-input w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rasm (ixtiyoriy)</label>
                  <input type="file" accept="image/*" onChange={e => setPortfolioForm({ ...portfolioForm, image: e.target.files[0] })} className="glass-input w-full" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPortfolioModal(false)} className="btn-secondary flex-1 py-3">Bekor qilish</button>
                  <button type="submit" disabled={portfolioSaving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {portfolioSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Qo&apos;shish</>}
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

const StatBox = ({ icon: Icon, value, label, color }) => (
  <div className="text-center">
    <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xl font-bold">{value}</span>
    </div>
    <p className="text-slate-400 text-sm">{label}</p>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-slate-500" />
    </div>
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  </div>
);

export default ProfilePage;
