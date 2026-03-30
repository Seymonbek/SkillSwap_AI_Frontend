const JOB_BOOKMARKS_KEY = 'jobs:bookmarks';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeParticipant = (value) => {
  if (!value || typeof value !== 'object') return null;

  return {
    id: value.id,
    email: value.email || '',
    first_name: value.first_name || '',
    last_name: value.last_name || '',
    avatar: value.avatar || value.avatar_url || null,
    avatar_url: value.avatar_url || value.avatar || null,
    location: value.location || '',
    freelance_rating: toNumber(value.freelance_rating ?? value.rating, 0),
    rating: toNumber(value.rating ?? value.freelance_rating, 0),
    is_verified: Boolean(value.is_verified),
  };
};

export const normalizeJobSkills = (job = {}) =>
  toArray(job.skills_required ?? job.required_skills)
    .map((skill) => {
      if (typeof skill === 'string') return skill.trim();
      if (typeof skill?.name === 'string') return skill.name.trim();
      return '';
    })
    .filter(Boolean);

export const normalizeJob = (job = {}) => {
  const owner = normalizeParticipant(job.owner || job.client_detail || job.client);
  const skills = normalizeJobSkills(job);
  const budget = job.budget ?? job.budget_min ?? job.budget_max ?? null;
  const budgetMin = job.budget_min ?? job.budget ?? null;
  const budgetMax = job.budget_max ?? job.budget ?? null;
  const proposalsCount = toNumber(job.proposals_count, 0);

  return {
    ...job,
    owner,
    client_detail: owner,
    skills_required: skills,
    required_skills: skills,
    budget,
    budget_min: budgetMin,
    budget_max: budgetMax,
    proposals_count: proposalsCount,
  };
};

export const normalizeJobs = (jobs = []) => toArray(jobs).map((job) => normalizeJob(job));

export const normalizeProposal = (proposal = {}) => {
  const freelancer = normalizeParticipant(proposal.freelancer_detail || proposal.freelancer);

  return {
    ...proposal,
    freelancer,
    freelancer_detail: freelancer,
    proposed_price: proposal.proposed_price ?? null,
  };
};

export const normalizeProposals = (proposals = []) =>
  toArray(proposals).map((proposal) => normalizeProposal(proposal));

export const extractPaginatedData = (payload) => {
  const hasPagination =
    payload &&
    typeof payload === 'object' &&
    Array.isArray(payload.results);

  const items = hasPagination ? payload.results : toArray(payload);

  return {
    items,
    pagination: {
      count: hasPagination ? toNumber(payload.count, items.length) : items.length,
      next: hasPagination ? payload.next || null : null,
      previous: hasPagination ? payload.previous || null : null,
    },
  };
};

export const getJobStatusMeta = (status) => {
  const statusMap = {
    OPEN: {
      label: 'Ochiq',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    DRAFT: {
      label: 'Qoralama',
      color: 'text-slate-300',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
    },
    IN_PROGRESS: {
      label: 'Jarayonda',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    COMPLETED: {
      label: 'Tugallangan',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    CANCELLED: {
      label: 'Bekor qilingan',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    REJECTED: {
      label: 'Rad etilgan',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    ACCEPTED: {
      label: 'Qabul qilingan',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    PENDING: {
      label: 'Kutilmoqda',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  };

  return statusMap[status] || statusMap.OPEN;
};

export const formatMoney = (value, fallback = '0') => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return fallback;
  return amount.toLocaleString('en-US', { maximumFractionDigits: amount % 1 === 0 ? 0 : 2 });
};

export const formatJobBudget = (job) => {
  const normalizedJob = normalizeJob(job);
  const min = normalizedJob.budget_min;
  const max = normalizedJob.budget_max;

  if (min !== null && max !== null) {
    if (Number(min) === Number(max)) {
      return `$${formatMoney(min)}`;
    }

    return `$${formatMoney(min)} - $${formatMoney(max)}`;
  }

  if (min !== null) return `$${formatMoney(min)}`;
  if (max !== null) return `$${formatMoney(max)}`;

  return 'Kelishiladi';
};

export const buildJobFormState = (job = {}) => {
  const normalizedJob = normalizeJob(job);

  return {
    title: normalizedJob.title || '',
    description: normalizedJob.description || '',
    budget: normalizedJob.budget ?? '',
    deadline: normalizedJob.deadline ? String(normalizedJob.deadline).slice(0, 10) : '',
    required_skills: normalizedJob.skills_required.join(', '),
  };
};

export const buildJobPayload = (form = {}) => ({
  title: String(form.title || '').trim(),
  description: String(form.description || '').trim(),
  budget: form.budget === '' || form.budget === null || form.budget === undefined ? undefined : Number(form.budget),
  deadline: form.deadline || undefined,
  required_skills: String(form.required_skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean),
});

export const getBookmarkedJobIds = () => {
  if (typeof window === 'undefined') return [];

  try {
    const value = window.localStorage.getItem(JOB_BOOKMARKS_KEY);
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const isJobBookmarked = (jobId) => getBookmarkedJobIds().includes(jobId);

export const toggleJobBookmark = (jobId) => {
  if (typeof window === 'undefined') return [];

  const existing = getBookmarkedJobIds();
  const next = existing.includes(jobId)
    ? existing.filter((id) => id !== jobId)
    : [...existing, jobId];

  window.localStorage.setItem(JOB_BOOKMARKS_KEY, JSON.stringify(next));
  return next;
};
