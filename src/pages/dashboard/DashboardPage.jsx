import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/api';
import { Card, CardContent, CardHeader } from '@/shared/ui/molecules/Card';
import { ListItem } from '@/shared/ui/molecules/ListItem';
import { Button } from '@/shared/ui/atoms/Button';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { cn } from '@/shared/lib/utils';
import {
  Briefcase, MessageSquare, Users, TrendingUp, Plus,
  ChevronRight, Star, Zap, Sparkles, ArrowUpRight, Clock
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeJobs: 0,
    messages: 0,
    connections: 0,
    earnings: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, chatRes] = await Promise.all([
        api.get('/freelance/jobs/'),
        api.get('/chat/rooms/')
      ]);

      setRecentJobs(jobsRes.data.results?.slice(0, 3) || []);
      setRecentMessages(chatRes.data.slice(0, 3) || []);

      setStats({
        activeJobs: jobsRes.data.count || 0,
        messages: chatRes.data.length || 0,
        connections: 12,
        earnings: 0,
      });
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Briefcase,
      label: 'Faol ishlar',
      value: stats.activeJobs,
      trend: '+12%',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => navigate('/jobs')
    },
    {
      icon: MessageSquare,
      label: 'Xabarlar',
      value: stats.messages,
      trend: '+5',
      color: 'from-emerald-500 to-teal-500',
      onClick: () => navigate('/chat')
    },
    {
      icon: Users,
      label: 'Bog\'lanishlar',
      value: stats.connections,
      trend: '+3',
      color: 'from-purple-500 to-pink-500',
      onClick: () => navigate('/profile')
    },
    {
      icon: TrendingUp,
      label: 'Daromad',
      value: `$${stats.earnings}`,
      trend: '0%',
      color: 'from-amber-500 to-orange-500',
      onClick: () => { }
    },
  ];

  const quickActions = [
    { icon: Briefcase, label: 'Ish qidirish', color: 'text-blue-400', onClick: () => navigate('/jobs') },
    { icon: MessageSquare, label: 'Xabarlar', color: 'text-emerald-400', onClick: () => navigate('/chat') },
    { icon: Users, label: 'Profil', color: 'text-purple-400', onClick: () => navigate('/profile') },
    { icon: Star, label: 'Reyting', color: 'text-amber-400', onClick: () => { } },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H3 className="text-gradient">Bosh sahifa</Typography.H3>
          <Typography.Small muted>Bugun nima qilmoqchisiz?</Typography.Small>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-card hover:bg-slate-800/50 transition-colors"
          >
            <action.icon className={cn('w-6 h-6', action.color)} />
            <span className="text-xs font-medium text-slate-300">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              onClick={stat.onClick}
              className="cursor-pointer"
            >
              <Card gradient glow padding="lg">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-lg',
                  stat.color
                )}>
                  <stat.icon className="text-white" size={24} />
                </div>
                <div className="mt-4">
                  <Typography.H4 className="text-2xl font-bold">{stat.value}</Typography.H4>
                  <Typography.Small muted>{stat.label}</Typography.Small>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Recent Jobs */}
      <Card gradient>
        <CardHeader
          icon={Briefcase}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
              Hammasi <ChevronRight size={16} />
            </Button>
          }
        >
          <Typography.H4>So'nggi ishlar</Typography.H4>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : recentJobs.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <ListItem
                  key={job.id}
                  title={job.title}
                  subtitle={job.description?.slice(0, 60) + '...'}
                  badge={{
                    text: job.status,
                    variant: job.status === 'OPEN' ? 'success' : 'default'
                  }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <Briefcase size={32} className="text-slate-600" />
              </div>
              <Typography.Small muted>Hozircha ishlar yo'q</Typography.Small>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/jobs')}
                className="mt-4"
                leftIcon={<Plus size={16} />}
              >
                Ish yaratish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card gradient>
        <CardHeader
          icon={MessageSquare}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
              Hammasi <ChevronRight size={16} />
            </Button>
          }
        >
          <Typography.H4>So'nggi xabarlar</Typography.H4>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((room) => (
                <ListItem
                  key={room.id}
                  avatar={{ name: room.name }}
                  title={room.name}
                  subtitle={room.last_message?.content || 'Xabar yo\'q'}
                  time={room.last_message?.created_at}
                  unread={room.unread_count > 0}
                  onClick={() => navigate(`/chat/${room.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <MessageSquare size={32} className="text-slate-600" />
              </div>
              <Typography.Small muted>Xabarlar yo'q</Typography.Small>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/chat')}
                className="mt-4"
              >
                Chatga o'tish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
