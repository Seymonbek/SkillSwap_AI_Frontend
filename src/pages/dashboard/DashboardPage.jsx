import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/api';
import { Card, CardContent, CardHeader } from '@/shared/ui/molecules/Card';
import { ListItem } from '@/shared/ui/molecules/ListItem';
import { Button } from '@/shared/ui/atoms/Button';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { SearchBar } from '@/shared/ui/molecules/SearchBar';
import { Briefcase, MessageSquare, Users, TrendingUp, Plus, ChevronRight, Star, Video } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch jobs
      const jobsRes = await api.get('/freelance/jobs/');
      setRecentJobs(jobsRes.data.results?.slice(0, 3) || []);

      // Fetch chat rooms
      const chatRes = await api.get('/chat/rooms/');
      setRecentMessages(chatRes.data.slice(0, 3) || []);

      // Stats
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
    { icon: Briefcase, label: 'Faol ishlar', value: stats.activeJobs, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: MessageSquare, label: 'Xabarlar', value: stats.messages, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Users, label: 'Bog\'lanishlar', value: stats.connections, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: TrendingUp, label: 'Daromad', value: `$${stats.earnings}`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome */}
      <div>
        <Typography.H3>Bosh sahifa</Typography.H3>
        <Typography.Small muted>Bugun nima qilmoqchisiz?</Typography.Small>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/jobs')}
          className="flex-col h-auto py-4 gap-2"
        >
          <Briefcase size={24} />
          <span className="text-xs">Ish qidirish</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/chat')}
          className="flex-col h-auto py-4 gap-2"
        >
          <MessageSquare size={24} />
          <span className="text-xs">Xabarlar</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/video')}
          className="flex-col h-auto py-4 gap-2"
        >
          <Video size={24} />
          <span className="text-xs">Video call</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/profile')}
          className="flex-col h-auto py-4 gap-2"
        >
          <Users size={24} />
          <span className="text-xs">Profil</span>
        </Button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} padding="lg" className="text-center">
              <div className={cn('w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center', stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <Typography.H4 className="text-2xl mb-1">{stat.value}</Typography.H4>
              <Typography.Small muted>{stat.label}</Typography.Small>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <Typography.H4>So'nggi ishlar</Typography.H4>
          <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
            Hammasi <ChevronRight size={16} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : recentJobs.length > 0 ? (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <ListItem
                  key={job.id}
                  title={job.title}
                  subtitle={job.description?.slice(0, 60) + '...'}
                  badge={{ text: job.status, variant: job.status === 'OPEN' ? 'success' : 'default' }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Typography.Small muted>Hozircha ishlar yo'q</Typography.Small>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/jobs')}
                className="mt-3"
                leftIcon={<Plus size={16} />}
              >
                Ish yaratish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <Typography.H4>So'nggi xabarlar</Typography.H4>
          <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
            Hammasi <ChevronRight size={16} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : recentMessages.length > 0 ? (
            <div className="space-y-2">
              {recentMessages.map((room) => (
                <ListItem
                  key={room.id}
                  avatar={{ name: room.name, online: room.is_online }}
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
              <Typography.Small muted>Xabarlar yo'q</Typography.Small>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/chat')}
                className="mt-3"
                leftIcon={<MessageSquare size={16} />}
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

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
