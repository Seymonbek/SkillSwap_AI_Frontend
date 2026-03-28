import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Hozirgina';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} daq oldin`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} soat oldin`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} kun oldin`;
  
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate avatar initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone (Uzbekistan format)
 */
export function isValidPhone(phone) {
  return /^\+998[0-9]{9}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Build a direct-chat URL for a user.
 */
export function buildDirectChatLink(user, extraParams = {}) {
  if (!user?.id) return '/chat';

  const params = new URLSearchParams({ user: String(user.id) });
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

  if (fullName) {
    params.set('name', fullName);
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  return `/chat?${params.toString()}`;
}
