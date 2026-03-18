import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/api';
import { Card, CardContent, CardHeader } from '@/shared/ui/molecules/Card';
import { Button } from '@/shared/ui/atoms/Button';
import { Avatar } from '@/shared/ui/atoms/Avatar';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { ListItem } from '@/shared/ui/molecules/ListItem';
import { Modal } from '@/shared/ui/organisms/Modal';
import { FormField } from '@/shared/ui/molecules/FormField';
import { cn } from '@/shared/lib/utils';
import { 
  User, Mail, Phone, MapPin, Calendar, Star, Briefcase, 
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

  useEffect(() => {
    fetchProfile();
  }, []);

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
    { icon: Briefcase, label: 'Mening ishlarim', onClick: () => navigate('/jobs') },
    { icon: Wallet, label: 'To\'lovlar', onClick: () => {} },
    { icon: Shield, label: 'Xavfsizlik', onClick: () => {} },
    { icon: Bell, label: 'Bildirishnomalar', onClick: () => navigate('/notifications') },
    { icon: Settings, label: 'Sozlamalar', onClick: () => {} },
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header Card */}
      <Card className="relative overflow-hidden">
        {/* Cover Image Placeholder */}
        <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-600" />
        
        <CardContent className="p-4">
          <div className="flex flex-col items-center -mt-12">
            <div className="relative">
              <Avatar
                src={user?.avatar}
                name={user?.first_name || user?.email}
                size="2xl"
                className="border-4 border-slate-900"
              />
              <button className="absolute bottom-0 right-0 p-1.5 bg-slate-800 rounded-full border border-slate-700">
                <Camera size={14} className="text-slate-400" />
              </button>
            </div>
            
            <Typography.H3 className="mt-3 text-center">
              {user?.first_name} {user?.last_name}
            </Typography.H3>
            <Typography.Small muted className="text-center">
              {user?.email}
            </Typography.Small>
            
            {user?.is_verified && (
              <Badge variant="primary" className="mt-2">
                <Shield size={12} className="mr-1" />
                Tasdiqlangan
              </Badge>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit3 size={14} />}
                onClick={() => setShowEditModal(true)}
              >
                Tahrirlash
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<LogOut size={14} />}
                onClick={handleLogout}
              >
                Chiqish
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
            <div className="text-center">
              <Typography.H4>12</Typography.H4>
              <Typography.Small muted>Ishlar</Typography.Small>
            </div>
            <div className="text-center">
              <Typography.H4>48</Typography.H4>
              <Typography.Small muted>Bog'lanish</Typography.Small>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Typography.H4>4.9</Typography.H4>
                <Star size={14} className="text-amber-400 fill-amber-400" />
              </div>
              <Typography.Small muted>Reyting</Typography.Small>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <Typography.H4>Ma'lumotlar</Typography.H4>
        </CardHeader>
        <CardContent className="space-y-3">
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

      {/* Menu */}
      <Card className="p-0">
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              'w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors',
              index !== menuItems.length - 1 && 'border-b border-slate-800'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <item.icon size={18} className="text-slate-400" />
              </div>
              <span className="font-medium text-slate-200">{item.label}</span>
            </div>
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        ))}
      </Card>

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

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-slate-500" />
    </div>
    <div>
      <Typography.Small muted className="block">{label}</Typography.Small>
      <span className="text-slate-200">{value}</span>
    </div>
  </div>
);
