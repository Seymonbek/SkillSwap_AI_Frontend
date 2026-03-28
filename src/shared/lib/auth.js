const AUTH_ROUTE_PREFIXES = ['/login', '/register', '/password/reset/confirm'];

let loginRedirectInProgress = false;

const decodeJwtPayload = (token) => {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

export const isTokenValid = (token) => {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 > Date.now();
};

export const hasActiveSession = () => {
  if (typeof window === 'undefined') return false;

  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  return isTokenValid(accessToken) || isTokenValid(refreshToken);
};

export const hasValidAccessToken = () => {
  if (typeof window === 'undefined') return false;

  return isTokenValid(localStorage.getItem('access_token'));
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const isAuthRoute = (pathname = window.location.pathname) =>
  AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export const redirectToLogin = () => {
  clearStoredAuth();

  if (typeof window === 'undefined' || isAuthRoute()) {
    return;
  }

  if (loginRedirectInProgress) {
    return;
  }

  loginRedirectInProgress = true;
  window.location.replace('/login');
};
