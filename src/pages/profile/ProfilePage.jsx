import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/api';
import { Card, CardContent, CardHeader } from '@/shared/ui/molecules/Card';
import { Button } from '@/shared/ui/atoms/Button';
import { Avatar } from '@/shared/ui/atoms/Avatar';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { Modal } from '@/shared/ui/organisms/Modal';
import { FormField } from '@/shared/ui/molecules/FormField';
import { cn } from '@/shared/lib/utils';
import {
  Mail, Phone, MapPin, Calendar, Star, Briefcase,
  Award, Settings, LogOut, ChevronRight, Camera, Edit3,
  Wallet, Shield, Bell
} from 'lucide-react';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/users/me/');
      setUser(res.data);
      setEditForm(res.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.patch('/auth/users/me/', editForm);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setShowEditModal(false);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { icon: Briefcase, label: 'Mening ishlarim', color: 'from-blue-500 to-cyan-500', onClick: () => navigate('/jobs') },
    { icon: Wallet, label: 'To\'lovlar', color: 'from-emerald-500 to-teal-500', onClick: () => { } },
    { icon: Shield, label: 'Xavfsizlik', color: 'from-purple-500 to-pink-500', onClick: () => { } },
    { icon: Bell, label: 'Bildirishnomalar', color: 'from-amber-500 to-orange-500', onClick: () => navigate('/notifications') },
    { icon: Settings, label: 'Sozlamalar', color: 'from-slate-500 to-slate-600', onClick: () => { } },
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header Card */}
      <div>
        <Card gradient className="relative overflow-hidden">
          {/* Animated Cover */}
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <CardContent className="p-4 relative">
            <div className="flex flex-col items-center -mt-16">
              {/* Avatar with glow */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-50" />
                <Avatar
                  src={user?.avatar}
                  name={user?.first_name || user?.email}
                  size="2xl"
                  className="relative border-4 border-slate-900 shadow-2xl"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-slate-800 rounded-full border border-slate-700 shadow-lg">
                  <Camera size={16} className="text-slate-400" />
                </button>
              </div>

              {/* User Info */}
              <Typography.H3 className="mt-4 text-center">
                {user?.first_name} {user?.last_name}
              </Typography.H3>
              <Typography.Small muted className="text-center">
                {user?.email}
              </Typography.Small>

              {user?.is_verified && (
                <Badge
                  variant="primary"
                  className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                >
                  <Shield size={12} className="mr-1" />
                  Tasdiqlangan
                </Badge>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Edit3}
                  onClick={() => setShowEditModal(true)}
                >
                  Tahrirlash
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={LogOut}
                  onClick={handleLogout}
                >
                  Chiqish
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
              <StatBox icon={Briefcase} value="12" label="Ishlar" color="text-blue-400" />
              <StatBox icon={Star} value="48" label="Bog'lanish" color="text-emerald-400" />
              <StatBox
                icon={Star}
                value="4.9"
                label="Reyting"
                color="text-amber-400"
                suffix={<Star size={14} className="text-amber-400 fill-amber-400 ml-0.5" />}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <div>
        <Card gradient>
          <CardHeader icon={Award}>
            <Typography.H4>Ma'lumotlar</Typography.H4>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Mail} label="Email" value={user?.email} />
            <InfoRow icon={Phone} label="Telefon" value={user?.phone || 'Qo\'shilmagan'} />
            <InfoRow icon={MapPin} label="Joylashuv" value={user?.location || 'Ko\'rsatilmagan'} />
            <InfoRow
              icon={Calendar}
              label="Qo'shilgan"
              value={new Date(user?.date_joined).toLocaleDateString('uz-UZ')}
            />
          </CardContent>
        </Card>
      </div>

      {/* Menu */}
      <div>
        <Card className="p-0 overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                'w-full flex items-center justify-between p-4 transition-all hover:bg-slate-800/50',
                index !== menuItems.length - 1 && 'border-b border-white/[0.04]'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-lg',
                  item.color
                )}>
                  <item.icon size={18} className="text-white" />
                </div>
                <span className="font-medium text-slate-200">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          ))}
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Profilni tahrirlash"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Bekor qilish
            </Button>
            <Button loading={saving} onClick={handleSave}>
              Saqlash
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <FormField
            label="Ism"
            value={editForm.first_name || ''}
            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
          />
          <FormField
            label="Familiya"
            value={editForm.last_name || ''}
            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
          />
          <FormField
            label="Telefon"
            value={editForm.phone || ''}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <FormField
            label="Joylashuv"
            value={editForm.location || ''}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};

const StatBox = ({ icon: Icon, value, label, color, suffix }) => (
  <div className="text-center">
    <div className={cn('flex items-center justify-center gap-1 mb-1', color)}>
      <Icon size={16} />
      <Typography.H4 className="text-xl">{value}</Typography.H4>
      {suffix}
    </div>
    <Typography.Small muted>{label}</Typography.Small>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center flex-shrink-0">
      <Icon size={18} className="text-slate-500" />
    </div>
    <div>
      <Typography.Small muted className="block text-xs">{label}</Typography.Small>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  </div>
);
