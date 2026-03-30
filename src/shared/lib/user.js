import { getApiOrigin } from '@/shared/api/api';

const OFFERED_SKILL_PREFIX = '[O]';
const WANTED_SKILL_PREFIX = '[W]';
const UZBEK_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
];

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
};

const toNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const parseTaggedSkills = (skills = [], prefix) =>
  toArray(skills)
    .filter((skill) => typeof skill === 'string' && skill.startsWith(prefix))
    .map((skill) => skill.replace(prefix, '').trim())
    .filter(Boolean);

export const normalizeSkillList = (skills = [], prefix) => {
  const normalizedSkills = toArray(skills)
    .map((skill) => {
      if (typeof skill === 'string') return skill.trim();
      if (typeof skill?.name === 'string') return skill.name.trim();
      return '';
    })
    .filter(Boolean);

  if (normalizedSkills.length > 0) {
    return normalizedSkills;
  }

  return parseTaggedSkills(skills, prefix);
};

export const getUserDisplayName = (user, fallback = 'Foydalanuvchi') => {
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fullName) return fullName;
  if (user?.email) return user.email;
  if (user?.username) return user.username;

  return fallback;
};

const rewriteMediaUrlToApiOrigin = (value) => {
  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return value;

  try {
    const currentUrl = new URL(value);
    if (!currentUrl.pathname.startsWith('/media/')) {
      return value;
    }

    const apiUrl = new URL(apiOrigin);
    if (currentUrl.origin === apiUrl.origin) {
      return value;
    }

    return new URL(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`, apiOrigin).toString();
  } catch {
    return value;
  }
};

export const appendAssetVersion = (value, version) => {
  if (!value || !version) return value;

  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : getApiOrigin() || 'http://localhost';
    const nextUrl = new URL(value, baseOrigin);
    nextUrl.searchParams.set('v', String(version));
    return nextUrl.toString();
  } catch {
    return value;
  }
};

export const normalizeAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return null;

  let nextValue = value.trim();
  if (!nextValue) return null;

  if (nextValue.startsWith('//')) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    nextValue = `${protocol}${nextValue}`;
  } else if (nextValue.startsWith('http://') || nextValue.startsWith('https://')) {
    nextValue = rewriteMediaUrlToApiOrigin(nextValue);
  } else if (
    !nextValue.startsWith('http://') &&
    !nextValue.startsWith('https://') &&
    !nextValue.startsWith('data:') &&
    !nextValue.startsWith('blob:')
  ) {
    const apiOrigin = getApiOrigin();
    if (apiOrigin) {
      nextValue = new URL(nextValue, apiOrigin).toString();
    }
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && nextValue.startsWith('http://')) {
    try {
      const url = new URL(nextValue);
      url.protocol = 'https:';
      nextValue = url.toString();
    } catch {
      return nextValue;
    }
  }

  return nextValue;
};

export const getUserAvatarInitial = (user, fallback = 'U') => {
  const displayName = getUserDisplayName(user, '').trim();
  if (displayName) {
    return displayName.charAt(0).toUpperCase();
  }

  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return fallback;
};

export const getUserAvatarSrc = (user) => {
  const normalizedUrl = normalizeAssetUrl(user?.avatar_url || user?.avatar || null);
  return appendAssetVersion(normalizedUrl, user?.avatar_version);
};

export const getUserPrimaryRating = (user) =>
  toNumber(user?.primary_rating ?? user?.freelance_rating ?? user?.rating ?? user?.barter_rating, 0);

export const getUserTokenBalance = (user) =>
  toNumber(
    user?.token_balance ??
      user?.wallet_summary?.time_tokens ??
      user?.wallet?.time_tokens ??
      user?.wallet_balance ??
      user?.balance ??
      user?.tokens,
    0
  );

export const normalizePortfolioProject = (project = {}) => {
  const projectUrl = project.project_url || project.url || '';
  const aiScore = project.ai_score ?? project.ai_rating ?? null;

  return {
    ...project,
    project_url: projectUrl,
    url: projectUrl,
    ai_score: aiScore,
    ai_rating: aiScore,
    is_verified: Boolean(project.is_verified ?? project.verified),
    technologies: Array.isArray(project.technologies) ? project.technologies : [],
  };
};

export const normalizePortfolioProjects = (projects = []) =>
  toArray(projects).map((project) => normalizePortfolioProject(project));

export const normalizeSkillTest = (test = {}) => {
  const score = test.score ?? null;
  const passed =
    typeof test.passed === 'boolean'
      ? test.passed
      : typeof test.status === 'string'
        ? test.status.toUpperCase() === 'PASSED'
        : null;

  let status = typeof test.status === 'string' ? test.status.toUpperCase() : '';
  if (!status) {
    if (passed === true) status = 'PASSED';
    else if (passed === false) status = 'FAILED';
    else if (score !== null) status = 'COMPLETED';
    else status = 'PENDING';
  }

  return {
    ...test,
    score,
    passed,
    status,
  };
};

export const normalizeSkillTests = (skillTests = []) =>
  toArray(skillTests).map((skillTest) => normalizeSkillTest(skillTest));

export const normalizeReview = (review = {}) => ({
  ...review,
  rating: Math.min(5, Math.max(0, toNumber(review.rating, 0))),
});

export const normalizeReviews = (reviews = []) =>
  toArray(reviews).map((review) => normalizeReview(review));

export const normalizeUser = (data = {}) => {
  const skillsOffered = normalizeSkillList(data.skills_offered, OFFERED_SKILL_PREFIX);
  const skillsWanted = normalizeSkillList(data.skills_wanted, WANTED_SKILL_PREFIX);
  const taggedSkills = Array.isArray(data.skills) ? data.skills : [];

  const normalizedOffered =
    skillsOffered.length > 0 ? skillsOffered : parseTaggedSkills(taggedSkills, OFFERED_SKILL_PREFIX);
  const normalizedWanted =
    skillsWanted.length > 0 ? skillsWanted : parseTaggedSkills(taggedSkills, WANTED_SKILL_PREFIX);

  return {
    ...data,
    avatar_url: normalizeAssetUrl(data.avatar_url || data.avatar || null),
    avatar: normalizeAssetUrl(data.avatar || data.avatar_url || null),
    skills_offered: normalizedOffered,
    skills_wanted: normalizedWanted,
    portfolio_projects: normalizePortfolioProjects(data.portfolio_projects),
    skill_tests: normalizeSkillTests(data.skill_tests),
    primary_rating: getUserPrimaryRating(data),
    token_balance: getUserTokenBalance(data),
    display_name: getUserDisplayName(data),
    is_verified_profile: Boolean(data.is_kyc_verified || data.is_verified),
  };
};

export const formatProfileDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.getDate();
  const month = UZBEK_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};
