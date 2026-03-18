import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/api';
import { Card, CardContent, CardHeader, CardFooter } from '@/shared/ui/molecules/Card';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { SearchBar } from '@/shared/ui/molecules/SearchBar';
import { Modal } from '@/shared/ui/organisms/Modal';
import { FormField } from '@/shared/ui/molecules/FormField';
import { cn, formatNumber, truncateText } from '@/shared/lib/utils';
import { Search, Filter, Plus, Briefcase, MapPin, Clock, DollarSign, Star, ChevronRight, Bookmark, Share2 } from 'lucide-react';

export const JobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    required_skills: '',
  });

  useEffect(() => {
    fetchJobs();
  }, [filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await api.get(`/freelance/jobs/${params}`);
      setJobs(res.data.results || []);
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        ...createForm,
        budget: createForm.budget ? parseFloat(createForm.budget) : undefined,
        required_skills: createForm.required_skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        status: 'OPEN',
      };

      await api.post('/freelance/jobs/', payload);
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', budget: '', deadline: '', required_skills: '' });
      fetchJobs();
    } catch (err) {
      console.error('Create job error:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filters = [
    { value: 'all', label: 'Hammasi' },
    { value: 'OPEN', label: 'Ochiq' },
    { value: 'IN_PROGRESS', label: 'Jarayonda' },
    { value: 'COMPLETED', label: 'Tugallangan' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography.H3>Ishlar</Typography.H3>
        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          Ish yaratish
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Ishlarni qidirish..."
        />
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                filterStatus === filter.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Briefcase size={48} className="mx-auto mb-4 text-slate-600" />
          <Typography.Small muted>Ishlar topilmadi</Typography.Small>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus size={16} />}
          >
            Ish yaratish
          </Button>
        </Card>
      )}

      {/* Create Job Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yangi ish yaratish"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Bekor qilish
            </Button>
            <Button
              loading={creating}
              onClick={handleCreateJob}
            >
              Yaratish
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <FormField
            label="Sarlavha"
            placeholder="Ish sarlavhasi"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            required
          />
          <FormField
            label="Tavsif"
            placeholder="Ish tavsifi"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Byudjet ($)"
              type="number"
              placeholder="1000"
              value={createForm.budget}
              onChange={(e) => setCreateForm({ ...createForm, budget: e.target.value })}
            />
            <FormField
              label="Muddati"
              type="date"
              value={createForm.deadline}
              onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
            />
          </div>
          <FormField
            label="Kerakli ko'nikmalar"
            placeholder="React, Node.js, Python (vergul bilan ajrating)"
            value={createForm.required_skills}
            onChange={(e) => setCreateForm({ ...createForm, required_skills: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};

// Job Card Component
const JobCard = ({ job }) => {
  const navigate = useNavigate();

  const statusColors = {
    OPEN: 'success',
    IN_PROGRESS: 'warning',
    COMPLETED: 'default',
    CANCELLED: 'danger',
  };

  return (
    <Card hover onClick={() => navigate(`/jobs/${job.id}`)} className="cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusColors[job.status] || 'default'}>
                {job.status}
              </Badge>
              <Typography.Small muted>
                {new Date(job.created_at).toLocaleDateString('uz-UZ')}
              </Typography.Small>
            </div>
            
            <Typography.H4 className="text-lg mb-2">{job.title}</Typography.H4>
            <Typography.Small muted className="line-clamp-2 mb-3">
              {truncateText(job.description, 120)}
            </Typography.Small>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {job.required_skills?.slice(0, 3).map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400"
                >
                  {skill}
                </span>
              ))}
              {job.required_skills?.length > 3 && (
                <span className="px-2 py-1 text-xs text-slate-500">
                  +{job.required_skills.length - 3}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {job.budget && (
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {formatNumber(job.budget)}
                </span>
              )}
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {new Date(job.deadline).toLocaleDateString('uz-UZ')}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <Bookmark size={18} />
            </Button>
            <ChevronRight size={20} className="text-slate-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
