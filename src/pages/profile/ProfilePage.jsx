import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/shared/api';
import { buildDirectChatLink } from '@/shared/lib/utils';
import {
  formatProfileDate,
  getUserAvatarInitial,
  getUserAvatarSrc,
  getUserDisplayName,
  getUserPrimaryRating,
  getUserTokenBalance,
  normalizePortfolioProject,
  normalizePortfolioProjects,
  normalizeReviews,
  normalizeSkillTest,
  normalizeSkillTests,
  normalizeUser,
} from '@/shared/lib/user';
import { useToast } from '@/shared/ui/providers/useToast';
import { useAuthStore } from '@/entities/user/model/store';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Code,
  Crown,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  RefreshCw,
  Shield,
  Star,
  Trash2,
  TrendingUp,
  UserCircle2,
  Wallet,
  X,
  AlertTriangle,
  Clock3,
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

const createEmptyPortfolioForm = () => ({
  title: '',
  description: '',
  project_url: '',
});

const getStoredUserSnapshot = () => {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? normalizeUser(JSON.parse(rawUser)) : null;
  } catch {
    return null;
  }
};

const createEditForm = (user = {}) => ({
  first_name: user.first_name || '',
  last_name: user.last_name || '',
  bio: user.bio || '',
  location: user.location || '',
  availability: user.availability || '',
  skills_offered: Array.isArray(user.skills_offered) ? user.skills_offered.join(', ') : '',
  skills_wanted: Array.isArray(user.skills_wanted) ? user.skills_wanted.join(', ') : '',
});

const getApiErrorMessage = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;

  const nonFieldErrors = err?.response?.data?.non_field_errors;
  if (Array.isArray(nonFieldErrors) && nonFieldErrors[0]) return nonFieldErrors[0];

  const responseData = err?.response?.data;
  if (responseData && typeof responseData === 'object') {
    const messages = Object.values(responseData)
      .flat()
      .filter(Boolean)
      .map((value) => (typeof value === 'string' ? value : ''))
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  if (err?.code === 'ERR_NETWORK') {
    return "Server bilan bog'lanib bo'lmadi.";
  }

  return fallback;
};

const createInfoRows = (user, isOwnProfile) => {
  const rows = [
    { icon: MapPin, label: 'Joylashuv', value: user?.location || null, ownOnly: false },
    { icon: Clock3, label: 'Mavjudlik', value: user?.availability || null, ownOnly: false },
    {
      icon: Calendar,
      label: "Qo'shilgan sana",
      value: formatProfileDate(user?.date_joined),
      ownOnly: false,
    },
    {
      icon: Calendar,
      label: "So'nggi faollik",
      value: isOwnProfile ? formatProfileDate(user?.last_activity) : null,
      ownOnly: true,
    },
  ];

  return rows.filter((row) => row.value && (!row.ownOnly || isOwnProfile));
};

const downloadJson = (filename, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getTwoFactorQrImageSrc = (qrCodeValue) => {
  if (!qrCodeValue || typeof qrCodeValue !== 'string') return null;
  if (
    qrCodeValue.startsWith('data:image/') ||
    qrCodeValue.startsWith('http://') ||
    qrCodeValue.startsWith('https://')
  ) {
    return qrCodeValue;
  }

  if (qrCodeValue.startsWith('otpauth://')) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrCodeValue)}`;
  }

  return null;
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { id: routeProfileId } = useParams();
  const toast = useToast();
  const authUser = useAuthStore((state) => state.user);
  const syncAuthUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const fallbackUser = authUser || getStoredUserSnapshot();
  const currentUserId = fallbackUser?.id;
  const isOwnProfile = !routeProfileId || String(routeProfileId) === String(currentUserId);

  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [skillTests, setSkillTests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(createEditForm());
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('info');

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrImageFailed, setQrImageFailed] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState('');

  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState(createEmptyPortfolioForm());
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState(null);

  const [showSkillTestModal, setShowSkillTestModal] = useState(false);
  const [skillTestName, setSkillTestName] = useState('');
  const [skillTestSaving, setSkillTestSaving] = useState(false);

  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileAvatarFailed, setProfileAvatarFailed] = useState(false);

  const applyProfileUser = useCallback((nextUser, syncStore = false) => {
    const normalizedUser = normalizeUser(nextUser);
    setUser(normalizedUser);
    setEditForm(createEditForm(normalizedUser));

    if (syncStore) {
      syncAuthUser(normalizedUser);
    }

    return normalizedUser;
  }, [syncAuthUser]);

  const fetchProfile = useCallback(async () => {
    const response = isOwnProfile
      ? await authService.getMe()
      : await authService.getUserByIdSearch(routeProfileId);

    return applyProfileUser(response.data, isOwnProfile);
  }, [applyProfileUser, isOwnProfile, routeProfileId]);

  const fetchPortfolio = useCallback(async () => {
    const response = await authService.getPortfolio();
    const items = normalizePortfolioProjects(response.data?.results || response.data || []);
    setPortfolio(items);
    return items;
  }, []);

  const fetchReviews = useCallback(async () => {
    const receiverId = isOwnProfile ? currentUserId : routeProfileId;
    if (!receiverId) {
      setReviews([]);
      return [];
    }

    const response = await authService.getReviews({ receiver: receiverId });
    const items = normalizeReviews(response.data?.results || response.data || []).filter((review) => (
      String(review.receiver) === String(receiverId)
    ));
    setReviews(items);
    return items;
  }, [currentUserId, isOwnProfile, routeProfileId]);

  const fetchSkillTests = useCallback(async () => {
    const response = await authService.getSkillTests();
    const items = normalizeSkillTests(response.data?.results || response.data || []);
    setSkillTests(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfilePage = async () => {
      setLoading(true);
      setPageError('');

      try {
        const profileData = await fetchProfile();
        if (cancelled) return;

        if (isOwnProfile) {
          setPortfolio(profileData.portfolio_projects || []);
          setSkillTests(profileData.skill_tests || []);
          setReviews([]);

          const [portfolioResult, reviewsResult, skillTestsResult] = await Promise.allSettled([
            fetchPortfolio(),
            fetchReviews(),
            fetchSkillTests(),
          ]);

          if (cancelled) return;

          if (portfolioResult.status === 'rejected') {
            setPortfolio(profileData.portfolio_projects || []);
          }
          if (reviewsResult.status === 'rejected') {
            setReviews([]);
          }
          if (skillTestsResult.status === 'rejected') {
            setSkillTests(profileData.skill_tests || []);
          }
        } else {
          setPortfolio(profileData.portfolio_projects || []);
          setSkillTests(profileData.skill_tests || []);
          setReviews([]);

          try {
            await fetchReviews();
          } catch {
            if (!cancelled) {
              setReviews([]);
            }
          }
        }
      } catch (err) {
        if (cancelled) return;

        const isExpiredSessionError = err?.message === 'No valid refresh token';

        if (!isExpiredSessionError) {
          console.error('Profile load error:', err);
        }

        setUser(null);
        setPortfolio([]);
        setReviews([]);
        setSkillTests([]);
        setPageError(isExpiredSessionError ? '' : getApiErrorMessage(err, "Profil ma'lumotlarini yuklab bo'lmadi."));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfilePage();

    return () => {
      cancelled = true;
    };
  }, [fetchPortfolio, fetchProfile, fetchReviews, fetchSkillTests, isOwnProfile, reloadKey]);

  const tabs = [
    { id: 'info', label: "Ma'lumotlar", icon: Award, visible: true, badge: 0 },
    { id: 'portfolio', label: 'Portfolio', icon: Code, visible: true, badge: portfolio.length },
    { id: 'reviews', label: 'Sharhlar', icon: Star, visible: isOwnProfile || reviews.length > 0, badge: reviews.length },
    { id: 'skills', label: 'Skill Test', icon: TrendingUp, visible: true, badge: skillTests.length },
  ].filter((tab) => tab.visible);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('info');
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    setProfileAvatarFailed(false);
  }, [user?.avatar, user?.avatar_url]);

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };

  const handleAvatarUpload = async (event) => {
    if (!isOwnProfile) return;

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm faylini tanlang.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar rasmi 5MB dan kichik bo'lishi kerak.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await authService.updateMe(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      applyProfileUser({ ...response.data, avatar_version: Date.now() }, true);
      setProfileAvatarFailed(false);
      toast.success('Profil rasmi yangilandi.');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(getApiErrorMessage(err, "Profil rasmini yuklab bo'lmadi."));
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!isOwnProfile) return;

    setSaving(true);

    try {
      const saveData = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        bio: editForm.bio.trim(),
        location: editForm.location.trim(),
        availability: editForm.availability.trim(),
        skills_offered: editForm.skills_offered.split(',').map((item) => item.trim()).filter(Boolean),
        skills_wanted: editForm.skills_wanted.split(',').map((item) => item.trim()).filter(Boolean),
      };

      const response = await authService.updateMe(saveData);
      applyProfileUser(response.data, true);
      setShowEditModal(false);
      toast.success("Profil ma'lumotlari saqlandi.");
    } catch (err) {
      console.error('Save profile error:', err);
      toast.error(getApiErrorMessage(err, "Profilni saqlab bo'lmadi."));
    } finally {
      setSaving(false);
    }
  };

  const handle2FASetup = async () => {
    setShow2FAModal(true);
    setQrData(null);
    setQrImageFailed(false);
    setTwoFACode('');
    setTwoFAError('');
    setTwoFALoading(true);

    try {
      const response = await authService.setup2FA();
      setQrData(response.data);
    } catch (err) {
      setTwoFAError(getApiErrorMessage(err, "2FA sozlamasini olib bo'lmadi."));
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FAConfirm = async (event) => {
    event.preventDefault();

    if (!twoFACode || twoFACode.length !== 6) {
      setTwoFAError('6 raqamli kodni kiriting.');
      return;
    }

    setTwoFALoading(true);
    setTwoFAError('');

    try {
      await authService.verify2FA({ code: twoFACode });
      const nextUser = normalizeUser({ ...user, is_two_factor_enabled: true });
      setUser(nextUser);
      syncAuthUser(nextUser);
      setShow2FAModal(false);
      toast.success('2FA muvaffaqiyatli yoqildi.');
    } catch (err) {
      setTwoFAError(getApiErrorMessage(err, "Tasdiqlash kodi noto'g'ri."));
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FADisable = async () => {
    if (!window.confirm("2FA ni o'chirishni tasdiqlaysizmi?")) {
      return;
    }

    try {
      await authService.disable2FA();
      const nextUser = normalizeUser({ ...user, is_two_factor_enabled: false });
      setUser(nextUser);
      syncAuthUser(nextUser);
      toast.success("2FA o'chirildi.");
    } catch (err) {
      console.error('Disable 2FA error:', err);
      toast.error(getApiErrorMessage(err, "2FA ni o'chirib bo'lmadi."));
    }
  };

  const openCreatePortfolioModal = () => {
    setEditingPortfolioId(null);
    setPortfolioForm(createEmptyPortfolioForm());
    setShowPortfolioModal(true);
  };

  const openEditPortfolioModal = (item) => {
    setEditingPortfolioId(item.id);
    setPortfolioForm({
      title: item.title || '',
      description: item.description || '',
      project_url: item.project_url || '',
    });
    setShowPortfolioModal(true);
  };

  const handlePortfolioSubmit = async (event) => {
    event.preventDefault();
    if (!isOwnProfile) return;

    setPortfolioSaving(true);

    try {
      const payload = {
        title: portfolioForm.title.trim(),
        description: portfolioForm.description.trim(),
        project_url: portfolioForm.project_url.trim(),
      };

      let response;
      if (editingPortfolioId) {
        response = await authService.updatePortfolioItem(editingPortfolioId, payload);
      } else {
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('description', payload.description);
        formData.append('project_url', payload.project_url);
        response = await authService.addPortfolioItem(formData);
      }

      const nextItem = normalizePortfolioProject(response.data);
      setPortfolio((prev) => {
        if (editingPortfolioId) {
          return prev.map((item) => (item.id === editingPortfolioId ? nextItem : item));
        }

        return [nextItem, ...prev];
      });

      setShowPortfolioModal(false);
      setEditingPortfolioId(null);
      setPortfolioForm(createEmptyPortfolioForm());
      toast.success(editingPortfolioId ? 'Portfolio yangilandi.' : "Portfolio loyihasi qo'shildi.");
    } catch (err) {
      console.error('Portfolio submit error:', err);
      toast.error(getApiErrorMessage(err, "Portfolio loyihasini saqlab bo'lmadi."));
    } finally {
      setPortfolioSaving(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    if (!window.confirm("Portfolio loyihasini o'chirishni tasdiqlaysizmi?")) {
      return;
    }

    try {
      await authService.deletePortfolioItem(portfolioId);
      setPortfolio((prev) => prev.filter((item) => item.id !== portfolioId));
      toast.success("Portfolio loyihasi o'chirildi.");
    } catch (err) {
      console.error('Delete portfolio error:', err);
      toast.error(getApiErrorMessage(err, "Portfolio loyihasini o'chirib bo'lmadi."));
    }
  };

  const handleCreateSkillTest = async (event) => {
    event.preventDefault();
    if (!skillTestName.trim()) {
      toast.error("Skill test uchun ko'nikma nomini kiriting.");
      return;
    }

    setSkillTestSaving(true);

    try {
      const response = await authService.createSkillTest({ skill_name: skillTestName.trim() });
      const nextTest = normalizeSkillTest(response.data);
      setSkillTests((prev) => [nextTest, ...prev]);
      setShowSkillTestModal(false);
      setSkillTestName('');
      toast.success('Skill test yaratildi.');
    } catch (err) {
      console.error('Create skill test error:', err);
      toast.error(getApiErrorMessage(err, "Skill test yaratib bo'lmadi."));
    } finally {
      setSkillTestSaving(false);
    }
  };

  const handleExportData = async () => {
    const loadingToastId = toast.loading("Ma'lumotlar eksport qilinmoqda...");

    try {
      const response = await authService.exportUserData();
      const payload = response.data || {};
      const exportDate = new Date().toISOString().slice(0, 10);
      downloadJson(`skillswap-profile-${user?.id || 'me'}-${exportDate}.json`, payload);
      toast.updateToast(loadingToastId, {
        type: 'success',
        message: "Ma'lumotlar yuklab olindi.",
        duration: 4000,
      });
    } catch (err) {
      toast.updateToast(loadingToastId, {
        type: 'error',
        message: getApiErrorMessage(err, "Ma'lumotlarni eksport qilib bo'lmadi."),
        duration: 5000,
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profileAvatarSrc = profileAvatarFailed ? null : getUserAvatarSrc(user);
  const profileAvatarInitial = getUserAvatarInitial(user, 'U');
  const displayName = getUserDisplayName(user);
  const infoRows = createInfoRows(user, isOwnProfile);
  const twoFactorQrImageSrc = getTwoFactorQrImageSrc(qrData?.qr_code || qrData?.qr_code_url);

  const menuItems = [
    { icon: Wallet, label: 'Hamyon', gradient: 'from-emerald-500 to-teal-500', onClick: () => navigate('/wallet') },
    { icon: FileText, label: 'Shartnomalar', gradient: 'from-pink-500 to-rose-500', onClick: () => navigate('/contracts') },
    { icon: Crown, label: 'Obuna', gradient: 'from-amber-500 to-orange-500', onClick: () => navigate('/subscriptions') },
    {
      icon: Shield,
      label: user?.is_two_factor_enabled ? "2FA ni o'chirish" : '2FA ni yoqish',
      gradient: 'from-violet-500 to-purple-500',
      onClick: () => (user?.is_two_factor_enabled ? handle2FADisable() : handle2FASetup()),
    },
    { icon: Download, label: "Ma'lumotlarimni yuklash", gradient: 'from-cyan-500 to-blue-500', onClick: handleExportData },
    { icon: AlertTriangle, label: 'Nizolar', gradient: 'from-red-500 to-pink-500', onClick: () => navigate('/disputes') },
    { icon: Bell, label: 'Bildirishnomalar', gradient: 'from-blue-500 to-indigo-500', onClick: () => navigate('/notifications') },
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="glass-card h-64 animate-pulse" />
        <div className="glass-card h-56 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-4 sm:p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <SectionCard>
            <EmptyState
              icon={UserCircle2}
              title="Profil topilmadi"
              description={pageError || "Bu profil ma'lumotlarini hozircha ko'rsatib bo'lmadi."}
              actionLabel="Qayta urinish"
              onAction={handleRetry}
            />
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.15 }} />
      </div>

      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-6 relative z-10">
        {pageError && (
          <motion.div variants={fadeInUp}>
            <SectionCard className="border border-red-500/20 bg-red-500/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-red-300">Ma&apos;lumotlarning bir qismi yuklanmadi</h3>
                  <p className="text-sm text-red-200/80 mt-1">{pageError}</p>
                </div>
                <button onClick={handleRetry} className="btn-secondary flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Qayta urinish
                </button>
              </div>
            </SectionCard>
          </motion.div>
        )}

        <motion.div variants={fadeInUp}>
          <div className="glass-card relative overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            <div className="p-6 relative">
              <div className="flex flex-col items-center -mt-16">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-50" />
                  {profileAvatarSrc ? (
                    <img
                      src={profileAvatarSrc}
                      alt={displayName}
                      className="relative w-32 h-32 rounded-full object-cover border-4 border-slate-900 shadow-2xl"
                      onError={() => setProfileAvatarFailed(true)}
                    />
                  ) : (
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-slate-900 shadow-2xl">
                      {profileAvatarInitial}
                    </div>
                  )}

                  {isOwnProfile && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute bottom-0 right-0 p-2 bg-slate-800 rounded-full border border-slate-700 shadow-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        {uploadingAvatar ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : <Camera className="w-5 h-5 text-slate-400" />}
                      </button>
                    </>
                  )}
                </div>

                <h1 className="mt-4 w-full max-w-sm px-3 text-center text-xl font-bold leading-tight text-white break-words sm:max-w-md sm:px-0 sm:text-2xl">
                  {displayName}
                </h1>
                {user?.email && isOwnProfile && (
                  <p className="mt-1 w-full max-w-sm break-all px-4 text-center text-sm text-slate-400 sm:max-w-md sm:px-0">
                    {user.email}
                  </p>
                )}
                {user?.bio && (
                  <p className="mt-2 w-full max-w-md break-words px-3 text-center text-sm text-slate-300 sm:px-0">
                    {user.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {user?.is_verified_profile && (
                    <StatusChip icon={Shield} label="KYC tasdiqlangan" tone="success" />
                  )}
                  {user?.is_two_factor_enabled && (
                    <StatusChip icon={QrCode} label="2FA yoqilgan" tone="violet" />
                  )}
                  {user?.availability && (
                    <StatusChip icon={Clock3} label={user.availability} tone="info" />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-5 w-full sm:w-auto">
                  {isOwnProfile ? (
                    <>
                      <button onClick={() => setShowEditModal(true)} className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm">
                        <Edit3 className="w-4 h-4" />
                        Tahrirlash
                      </button>
                      <button onClick={handleLogout} className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300">
                        <LogOut className="w-4 h-4" />
                        Chiqish
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(buildDirectChatLink(user))}
                      className="btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Xabar yozish
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                {isOwnProfile ? (
                  <>
                    <StatBox icon={Wallet} value={getUserTokenBalance(user)} label="Tokenlar" color="text-emerald-400" />
                    <StatBox icon={Star} value={getUserPrimaryRating(user).toFixed(1)} label="Freelance" color="text-amber-400" />
                    <StatBox icon={Award} value={Number(user?.barter_rating || 0).toFixed(1)} label="Barter" color="text-blue-400" />
                    <StatBox icon={TrendingUp} value={user?.streak_days || 0} label="Streak" color="text-violet-400" />
                  </>
                ) : (
                  <>
                    <StatBox icon={Star} value={getUserPrimaryRating(user).toFixed(1)} label="Freelance" color="text-amber-400" />
                    <StatBox icon={Award} value={Number(user?.barter_rating || 0).toFixed(1)} label="Barter" color="text-blue-400" />
                    <StatBox icon={Code} value={portfolio.length} label="Portfolio" color="text-emerald-400" />
                    <StatBox icon={BookOpen} value={skillTests.length} label="Skill Test" color="text-violet-400" />
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {(user?.skills_offered?.length > 0 || user?.skills_wanted?.length > 0) && (
          <motion.div variants={fadeInUp}>
            <SectionCard>
              <div className="grid gap-5 md:grid-cols-2">
                <SkillGroup
                  title="O'rgataman"
                  skills={user.skills_offered}
                  badgeClassName="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                />
                <SkillGroup
                  title="O'rganmoqchiman"
                  skills={user.skills_wanted}
                  badgeClassName="bg-blue-500/10 text-blue-400 border-blue-500/20"
                />
              </div>
            </SectionCard>
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-[132px] sm:min-w-0 sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
              {tab.badge > 0 && <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">{tab.badge}</span>}
            </button>
          ))}
        </motion.div>

        <motion.div variants={fadeInUp}>
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SectionCard>
                  <SectionHeader icon={Award} title="Ma&apos;lumotlar" />
                  {infoRows.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {infoRows.map((row) => (
                        <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={UserCircle2} title="Ma'lumotlar yo'q" description="Bu profil uchun qo'shimcha ma'lumot hozircha kiritilmagan." />
                  )}
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'portfolio' && (
              <motion.div key="portfolio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <SectionCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SectionHeader icon={Code} title="Portfolio" />
                    {isOwnProfile && (
                      <button onClick={openCreatePortfolioModal} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Loyiha qo&apos;shish
                      </button>
                    )}
                  </div>
                </SectionCard>

                {portfolio.length === 0 ? (
                  <SectionCard>
                    <EmptyState
                      icon={Code}
                      title="Portfolio bo'sh"
                      description={isOwnProfile ? "Bir nechta loyihalarni qo'shib profilingizni kuchaytiring." : 'Bu foydalanuvchi hali portfolio joylamagan.'}
                    />
                  </SectionCard>
                ) : (
                  portfolio.map((item) => (
                    <SectionCard key={item.id}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-white text-lg">{item.title}</h4>
                            {item.is_verified && <StatusChip icon={Shield} label="AI tasdiqlagan" tone="success" />}
                            {item.ai_score !== null && item.ai_score !== undefined && (
                              <StatusChip icon={Star} label={`AI: ${item.ai_score}`} tone="warning" />
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-2 whitespace-pre-wrap">{item.description}</p>

                          <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-slate-400">
                            {item.project_url && (
                              <a
                                href={item.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Loyihani ko&apos;rish
                              </a>
                            )}
                            {item.created_at && <span>{formatProfileDate(item.created_at)}</span>}
                          </div>
                        </div>

                        {isOwnProfile && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditPortfolioModal(item)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeletePortfolio(item.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {reviews.length === 0 ? (
                  <SectionCard>
                    <EmptyState
                      icon={Star}
                      title="Sharhlar yo'q"
                      description={isOwnProfile ? "Hozircha sizga yozilgan sharhlar ko'rinmayapti." : 'Bu foydalanuvchi uchun hozircha sharhlar topilmadi.'}
                    />
                  </SectionCard>
                ) : (
                  reviews.map((review) => (
                    <SectionCard key={review.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Stars rating={review.rating} />
                            {review.review_type && (
                              <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                                {review.review_type}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-200 mt-3 whitespace-pre-wrap">{review.comment}</p>
                          {review.created_at && (
                            <p className="text-sm text-slate-500 mt-3">{formatProfileDate(review.created_at)}</p>
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <SectionCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SectionHeader icon={TrendingUp} title="Skill Test" />
                    {isOwnProfile && (
                      <button onClick={() => setShowSkillTestModal(true)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Skill test boshlash
                      </button>
                    )}
                  </div>
                </SectionCard>

                {skillTests.length === 0 ? (
                  <SectionCard>
                    <EmptyState
                      icon={TrendingUp}
                      title="Skill testlar yo'q"
                      description={isOwnProfile ? "Ko'nikmangizni tasdiqlash uchun birinchi skill testni boshlang." : "Bu foydalanuvchida hozircha skill testlar yo'q."}
                    />
                  </SectionCard>
                ) : (
                  skillTests.map((test) => (
                    <SectionCard key={test.id}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{test.skill_name}</h4>
                          <p className="text-sm text-slate-400 mt-1">
                            {test.created_at ? formatProfileDate(test.created_at) : 'Yaratilgan sana mavjud emas'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip
                            icon={TrendingUp}
                            label={test.status}
                            tone={test.status === 'PASSED' ? 'success' : test.status === 'FAILED' ? 'danger' : 'info'}
                          />
                          {test.score !== null && test.score !== undefined && (
                            <StatusChip icon={Award} label={`Ball: ${test.score}`} tone="warning" />
                          )}
                          {test.certificate_url && (
                            <a
                              href={test.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-slate-800 text-slate-200 hover:bg-slate-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Sertifikat
                            </a>
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isOwnProfile && (
          <motion.div variants={fadeInUp}>
            <div className="glass-card overflow-hidden">
              {menuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between p-4 transition-all hover:bg-white/5 ${
                    index !== menuItems.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
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
        )}
      </motion.div>

      {isOwnProfile && (
        <AnimatePresence>
          {showEditModal && (
            <ModalShell title="Profilni tahrirlash" onClose={() => setShowEditModal(false)}>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <FormField label="Ism">
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, first_name: event.target.value }))}
                    className="glass-input w-full"
                  />
                </FormField>
                <FormField label="Familiya">
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, last_name: event.target.value }))}
                    className="glass-input w-full"
                  />
                </FormField>
                <FormField label="Bio">
                  <textarea
                    value={editForm.bio}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, bio: event.target.value }))}
                    className="glass-input w-full h-24 resize-none"
                    placeholder="O'zingiz haqingizda..."
                  />
                </FormField>
                <FormField label="Joylashuv">
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))}
                    className="glass-input w-full"
                    placeholder="Toshkent, Uzbekistan"
                  />
                </FormField>
                <FormField label="Mavjudlik">
                  <input
                    type="text"
                    value={editForm.availability}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, availability: event.target.value }))}
                    className="glass-input w-full"
                    placeholder="Du-Ju, 09:00-18:00"
                  />
                </FormField>
                <FormField label="O'rgatadigan ko'nikmalar">
                  <input
                    type="text"
                    value={editForm.skills_offered}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, skills_offered: event.target.value }))}
                    className="glass-input w-full"
                    placeholder="React, Python, Design"
                  />
                </FormField>
                <FormField label="O'rganmoqchi bo'lgan ko'nikmalar">
                  <input
                    type="text"
                    value={editForm.skills_wanted}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, skills_wanted: event.target.value }))}
                    className="glass-input w-full"
                    placeholder="AI, ML, DevOps"
                  />
                </FormField>
                <ModalActions
                  onCancel={() => setShowEditModal(false)}
                  submitLabel="Saqlash"
                  loading={saving}
                  submitIcon={<Check className="w-4 h-4" />}
                />
              </form>
            </ModalShell>
          )}
        </AnimatePresence>
      )}

      {isOwnProfile && (
        <AnimatePresence>
          {show2FAModal && (
            <ModalShell title="2FA ni sozlash" onClose={() => setShow2FAModal(false)}>
              <div className="p-6 space-y-4">
                {twoFAError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                    {twoFAError}
                  </div>
                )}

                {twoFALoading && !qrData ? (
                  <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    2FA sozlamasi olinmoqda...
                  </div>
                ) : (
                  <>
                    {qrData && (
                      <div className="text-center">
                        {twoFactorQrImageSrc && !qrImageFailed && (
                          <img
                            src={twoFactorQrImageSrc}
                            alt="2FA QR code"
                            className="w-48 h-48 mx-auto rounded-xl bg-white p-2"
                            onError={() => setQrImageFailed(true)}
                          />
                        )}
                        {qrData.secret && (
                          <div className="mt-4">
                            <p className="text-slate-400 text-sm mb-1">Maxfiy kalit</p>
                            <code className="text-emerald-400 text-sm bg-slate-800 px-3 py-1 rounded">{qrData.secret}</code>
                          </div>
                        )}
                        <p className="mt-4 text-sm text-slate-400">
                          QR kod ochilmasa, Google Authenticator yoki boshqa authenticator ilovasiga yuqoridagi kalitni qo&apos;lda kiriting.
                        </p>
                      </div>
                    )}

                    <form onSubmit={handle2FAConfirm} className="space-y-4">
                      <FormField label="6 raqamli kod">
                        <input
                          type="text"
                          maxLength={6}
                          value={twoFACode}
                          onChange={(event) => setTwoFACode(event.target.value.replace(/\D/g, ''))}
                          className="glass-input w-full text-center text-2xl tracking-widest"
                          placeholder="000000"
                        />
                      </FormField>
                      <button type="submit" disabled={twoFALoading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        {twoFALoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-4 h-4" /> Tasdiqlash</>}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </ModalShell>
          )}
        </AnimatePresence>
      )}

      {isOwnProfile && (
        <AnimatePresence>
          {showPortfolioModal && (
            <ModalShell title={editingPortfolioId ? 'Portfolio loyihasini tahrirlash' : "Portfolio loyihasi qo'shish"} onClose={() => setShowPortfolioModal(false)}>
              <form onSubmit={handlePortfolioSubmit} className="p-6 space-y-4">
                <FormField label="Loyiha nomi">
                  <input
                    type="text"
                    value={portfolioForm.title}
                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="glass-input w-full"
                    required
                  />
                </FormField>
                <FormField label="Tavsif">
                  <textarea
                    value={portfolioForm.description}
                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="glass-input w-full h-24 resize-none"
                    required
                  />
                </FormField>
                <FormField label="Loyiha havolasi">
                  <input
                    type="url"
                    value={portfolioForm.project_url}
                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, project_url: event.target.value }))}
                    className="glass-input w-full"
                    placeholder="https://github.com/..."
                    required
                  />
                </FormField>
                <ModalActions
                  onCancel={() => setShowPortfolioModal(false)}
                  submitLabel={editingPortfolioId ? 'Yangilash' : "Qo'shish"}
                  loading={portfolioSaving}
                  submitIcon={editingPortfolioId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                />
              </form>
            </ModalShell>
          )}
        </AnimatePresence>
      )}

      {isOwnProfile && (
        <AnimatePresence>
          {showSkillTestModal && (
            <ModalShell title="Skill test boshlash" onClose={() => setShowSkillTestModal(false)}>
              <form onSubmit={handleCreateSkillTest} className="p-6 space-y-4">
                <FormField label="Ko'nikma nomi">
                  <input
                    type="text"
                    value={skillTestName}
                    onChange={(event) => setSkillTestName(event.target.value)}
                    className="glass-input w-full"
                    placeholder="Masalan: React, Python, UI Design"
                    required
                  />
                </FormField>
                <ModalActions
                  onCancel={() => setShowSkillTestModal(false)}
                  submitLabel="Boshlash"
                  loading={skillTestSaving}
                  submitIcon={<TrendingUp className="w-4 h-4" />}
                />
              </form>
            </ModalShell>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const SectionCard = ({ children, className = '' }) => (
  <div className={`glass-card p-6 ${className}`.trim()}>{children}</div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-lg font-bold text-white">{title}</h3>
  </div>
);

const FormField = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    {children}
  </div>
);

const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

const ModalActions = ({ onCancel, submitLabel, submitIcon, loading }) => (
  <div className="flex gap-3 pt-2">
    <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-3">
      Bekor qilish
    </button>
    <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{submitIcon}{submitLabel}</>}
    </button>
  </div>
);

const SkillGroup = ({ title, skills, badgeClassName }) => (
  <div>
    <h4 className="text-sm font-medium text-slate-400 mb-3">{title}</h4>
    {skills?.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span key={`${title}-${index}`} className={`px-3 py-1 text-sm rounded-full border ${badgeClassName}`}>
            {skill}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-sm text-slate-500">Hozircha ko'rsatilmagan</p>
    )}
  </div>
);

const StatusChip = ({ icon: Icon, label, tone = 'info' }) => {
  const toneClasses = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${toneClasses[tone] || toneClasses.info}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="text-center py-6">
    <Icon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
    <h4 className="text-lg font-semibold text-white">{title}</h4>
    <p className="text-slate-400 mt-2 max-w-md mx-auto">{description}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="btn-secondary mt-4 inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        {actionLabel}
      </button>
    )}
  </div>
);

const Stars = ({ rating = 0 }) => (
  <div className="flex items-center gap-1">
    {[...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
      />
    ))}
  </div>
);

const StatBox = ({ icon: Icon, value, label, color }) => (
  <div className="text-center rounded-2xl bg-white/5 px-3 py-3">
    <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-lg sm:text-xl font-bold">{value}</span>
    </div>
    <p className="text-slate-400 text-xs sm:text-sm">{label}</p>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
    <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-slate-500" />
    </div>
    <div className="min-w-0">
      <p className="text-slate-400 text-xs">{label}</p>
      <span className="text-slate-200 font-medium break-words">{value}</span>
    </div>
  </div>
);

export default ProfilePage;
