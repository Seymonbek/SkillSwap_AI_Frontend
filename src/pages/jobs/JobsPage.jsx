import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/shared/api/api';
import { useToast } from '@/shared/ui/providers/ToastProvider';
import { Card, CardContent, CardHeader, CardFooter } from '@/shared/ui/molecules/Card';
import { Button } from '@/shared/ui/atoms/Button';
import { Typography } from '@/shared/ui/atoms/Typography';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { Modal } from '@/shared/ui/organisms/Modal';
import { FormField } from '@/shared/ui/molecules/FormField';
import { cn, formatNumber, truncateText } from '@/shared/lib/utils';
import {
  Search, Filter, Plus, Briefcase, Clock, DollarSign,
  ChevronRight, Bookmark, Sparkles, TrendingUp, Zap
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export const JobsPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', budget: '', deadline: '', required_skills: '',
  });

  useEffect(() => { fetchJobs(); }, [filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await api.get(`/freelance/jobs/${params}`);
      setJobs(res.data.results || []);
    } catch (err) {
      showError('Ishlarni yuklashda xatolik');
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
        required_skills: createForm.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        status: 'OPEN',
      };

      await api.post('/freelance/jobs/', payload);
      success('Ish muvaffaqiyatli yaratildi!');
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', budget: '', deadline: '', required_skills: '' });
      fetchJobs();
    } catch (err) {
      showError('Ish yaratishda xatolik');
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filters = [
    { value: 'all', label: 'Hammasi', count: jobs.length },
    { value: 'OPEN', label: 'Ochiq', color: 'bg-emerald-500' },
    { value: 'IN_PROGRESS', label: 'Jarayonda', color: 'bg-amber-500' },
    { value: 'COMPLETED', label: 'Tugallangan', color: 'bg-blue-500' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 space-y-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <Typography.H3 className="text-gradient">Ishlar</Typography.H3>
          <Typography.Small muted className="flex items-center gap-1">
            <Briefcase size={14} />
            {jobs.length} ta ish mavjud
          </Typography.Small>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Ish yaratish
          </Button>
        </motion.div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ishlarni qidirish..."
          className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-800/50 border border-white/[0.08] 
                     text-slate-200 placeholder:text-slate-500
                     focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                     transition-all duration-200"
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((filter) => (
          <motion.button
            key={filter.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterStatus(filter.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              filterStatus === filter.value
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'glass-card text-slate-400 hover:text-slate-200'
            )}
          >
            {filter.color && filterStatus === filter.value && (
              <span className={cn('w-2 h-2 rounded-full', filter.color)} />
            )}
            {filter.label}
            {filter.count !== undefined && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                {filter.count}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <motion.div variants={containerVariants} className="space-y-4">
          <AnimatePresence>
            {filteredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <Briefcase size={40} className="text-slate-600" />
          </div>
          <Typography.Small muted className="block mb-2">Ishlar topilmadi</Typography.Small>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus size={16} />}
          >
            Ish yaratish
          </Button>
        </motion.div>
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
            <Button loading={creating} onClick={handleCreateJob}>
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
            placeholder="React, Node.js, Python"
            value={createForm.required_skills}
            onChange={(e) => setCreateForm({ ...createForm, required_skills: e.target.value })}
            helper="Vergul bilan ajrating"
          />
        </form>
      </Modal>
    </motion.div>
  );
};

// Enhanced Job Card
const JobCard = ({ job }) => {
  const navigate = useNavigate();

  const statusConfig = {
    OPEN: { variant: 'success', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    IN_PROGRESS: { variant: 'warning', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    COMPLETED: { variant: 'default', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    CANCELLED: { variant: 'danger', icon: null, color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const config = statusConfig[job.status] || statusConfig.OPEN;
  const StatusIcon = config.icon;

  return (
    <Card hover gradient glow onClick={() => navigate(`/jobs/${job.id}`)} className="cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Status & Date */}
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant={config.variant}
                className={cn('flex items-center gap-1', config.bg)}
              >
                {StatusIcon && <StatusIcon size={12} />}
                {job.status}
              </Badge>
              <Typography.Small muted className="flex items-center gap-1">
                <Clock size={12} />
                {new Date(job.created_at).toLocaleDateString('uz-UZ')}
              </Typography.Small>
            </div>

            {/* Title & Description */}
            <Typography.H4 className="text-lg mb-2 line-clamp-1">{job.title}</Typography.H4>
            <Typography.Small muted className="line-clamp-2 mb-3">
              {truncateText(job.description, 100)}
            </Typography.Small>

            {/* Skills */}
            {job.required_skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {job.required_skills.slice(0, 4).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-800/80 rounded-lg text-xs text-slate-400 border border-white/[0.04]"
                  >
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 4 && (
                  <span className="px-2 py-1 text-xs text-slate-500">
                    +{job.required_skills.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm">
              {job.budget && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <DollarSign size={14} />
                  {formatNumber(job.budget)}
                </span>
              )}
              {job.deadline && (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={14} />
                  {new Date(job.deadline).toLocaleDateString('uz-UZ')}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); }}
              className="p-2 rounded-xl glass-card text-slate-500 hover:text-emerald-400"
            >
              <Bookmark size={18} />
            </motion.button>
            <ChevronRight size={20} className="text-slate-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
