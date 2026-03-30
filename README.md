# SkillSwap AI Frontend

SkillSwap AI Frontend is the React single-page application for the SkillSwap platform. It brings together authentication, freelance workflows, barter and mentorship sessions, chat, video calls, notifications, wallet flows, subscriptions, and profile management into one client application.

This repository is the user-facing frontend only. It consumes the SkillSwap backend API and WebSocket services.

## What This App Includes

- Email/password login with optional 2FA verification
- JWT-based protected routes with automatic access-token refresh
- Freelance job browsing and job detail flows
- Barter and mentorship discovery plus session lifecycle screens
- Real-time chat and call-related UI
- Notification polling plus WebSocket-driven live updates
- Wallet, contract, dispute, subscription, profile, and search pages

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- Zustand
- Axios
- Framer Motion
- Lucide React

## Prerequisites

- Node.js 20+
- npm 10+
- Running SkillSwap backend API

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.development.example .env.development.local
```

For local development against the current backend, use `.env.development.local`. For real production deployment, use `.env.production` or same-origin reverse proxy with the values from `.env.example`.

3. Start the development server:

```bash
npm run dev
```

4. Open the app:

```text
http://localhost:5173
```

## Environment Variables

Create `.env.development.local` for local work, or `.env.production` for deployment.

```bash
VITE_API_URL=http://13.50.109.251:8000/api/v1
VITE_WS_URL=ws://13.50.109.251:8000
VITE_DEBUG_WS=false
VITE_DEBUG_RTC=false
```

### Variable Reference

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `VITE_API_URL` | Recommended | Base URL for REST API requests | `/api/v1` or `https://api.example.com/api/v1` |
| `VITE_WS_URL` | Optional | Base URL for WebSocket connections | `wss://api.example.com` |
| `VITE_DEBUG_WS` | Optional | Enables chat/notification WebSocket debug logs in development | `true` |
| `VITE_DEBUG_RTC` | Optional | Enables video/call debug logs in development | `true` |

### Notes

- If `VITE_WS_URL` is not set, the app derives the WebSocket origin from `VITE_API_URL`.
- Production deploy uchun reverse proxy ishlatsangiz, `.env.example` dagi `/api/v1` varianti qulay.
- Only variables prefixed with `VITE_` are exposed to the browser.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Script Details

- `npm run dev`: starts the Vite development server on port `5173`
- `npm run build`: creates a production build in `dist/`
- `npm run preview`: serves the built output locally for validation
- `npm run lint`: runs ESLint against the source tree

## Project Structure

```text
src/
├── app/               # App shell, routing, global layout, providers
├── entities/          # Zustand stores and domain state modules
├── pages/             # Route-level page components
└── shared/
    ├── api/           # Axios client, service layer, WebSocket helper
    ├── hooks/         # Reusable hooks
    ├── lib/           # Utilities and auth helpers
    └── ui/            # Shared UI primitives and layout components
```

### Main Route Areas

- `auth`: login, register, password reset confirmation
- `dashboard`: signed-in landing page
- `jobs`: freelance listings and detail views
- `barter`: barter and mentorship session flows
- `chat`: conversations and live messaging
- `video`: call UI and barter session completion flow
- `notifications`: notification center
- `profile`: self and public profile screens
- `wallet`: token and wallet management
- `contracts`, `disputes`, `subscriptions`, `search`

## Architecture Summary

The frontend uses a practical `app + pages + entities + shared` structure:

- `app` owns routing and global shell behavior
- `pages` own route-level composition and view logic
- `entities` own domain-specific state through Zustand stores
- `shared/api` centralizes HTTP and WebSocket setup
- `shared/lib/auth.js` contains auth/session helpers used across the app

Additional architectural notes live in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Authentication and Session Model

The frontend uses JWT authentication with `access_token` and `refresh_token` stored in `localStorage`.

### Current Behavior

- Protected routes allow entry when there is an active access or refresh token
- Access tokens expire quickly and are refreshed automatically through Axios interceptors
- Refresh token rotation is supported and the latest rotated refresh token is persisted
- Login and 2FA verification both store tokens and fetch the current user profile
- Logging out clears `access_token`, `refresh_token`, and cached user data

### Important Storage Keys

- `access_token`
- `refresh_token`
- `user`

### Practical Session Rule

In the current backend configuration, access tokens live for 5 minutes and refresh tokens live for 1 day. That means:

- users usually stay signed in when returning after a short gap such as 1 to 2 hours
- if the app has been inactive long enough for the refresh token to expire, users must log in again

## API and WebSocket Integration

### REST API

All REST calls go through `src/shared/api/api.js` and the service modules under `src/shared/api/`.

Service groups currently include:

- `authService`
- `freelanceService`
- `barterService`
- `chatService`
- `notificationsService`
- `paymentsService`
- `searchService`
- `subscriptionsService`
- `adminService`
- `commonService`
- `disputeService`

### WebSocket Endpoints Used by the UI

The frontend expects these backend WebSocket endpoints:

- `/ws/notifications/`
- `/ws/chat/:room_id/`
- `/ws/call/:room_id/`

The app sends the current JWT access token as a `token` query parameter for WebSocket authentication.

### Notifications

Notifications currently use a hybrid strategy:

- unread count polling every 30 seconds
- WebSocket push for real-time notification events
- automatic reconnect for unexpected socket closures

## Development Workflow

### Recommended Local Flow

1. Start the backend API locally
2. Set `VITE_API_URL` and `VITE_WS_URL`
3. Run `npm run dev`
4. Open `http://localhost:5173`
5. Run `npm run lint` before committing
6. Run `npm run build` before deployment or handoff

### Linting

ESLint is configured through `eslint.config.js`.

Ignored folders:

- `dist`
- `src_backup`

## Build and Deployment

### Production Build

```bash
npm run build
```

Build output is written to:

```text
dist/
```

### Preview Build Locally

```bash
npm run preview
```

### Deployment Checklist

Before deploying, verify:

- `VITE_API_URL` points to the correct backend base path
- `VITE_WS_URL` points to the correct `ws://` or `wss://` origin
- backend CORS allows the frontend origin
- backend JWT/WebSocket authentication is working
- `npm run build` succeeds without errors
- service worker and manifest are being served correctly

### Hosting Options

The app can be deployed to any static hosting provider that serves the `dist/` directory, such as:

- Nginx
- Vercel
- Netlify
- Cloudflare Pages
- S3 + CDN

For production release steps, Nginx reverse proxy, PWA, and server checklist, open [DEPLOYMENT.md](./DEPLOYMENT.md).

## Validation and Quality Checks

Recommended verification commands:

```bash
npm run lint
npm run build
```

Current repository status:

- lint script exists
- production build works
- there is no frontend unit or e2e test suite configured in `package.json`

## Known Implementation Notes

- Routes are now lazy-loaded in `src/app/App.jsx` to reduce initial bundle cost
- The app includes a service worker, offline fallback, and install prompt for PWA-style installation
- `src_backup/` is a historical copy and is not part of the active app
- API schema references are available in `api.yaml`, but the backend remains the source of truth for API behavior

## Troubleshooting

### The app keeps redirecting to login

Check:

- `VITE_API_URL` is correct
- backend JWT refresh endpoint is reachable
- browser storage still contains `refresh_token`
- backend clock and server time are correct

### WebSocket does not connect

Check:

- `VITE_WS_URL` is correct
- backend ASGI server is running
- the WebSocket origin is not blocked by proxy or SSL configuration
- the access token is still valid when the socket is opened

### Route refresh returns 404 on the server

Check that your web server has SPA fallback enabled, for example `try_files $uri $uri/ /index.html;` in Nginx.

### Chrome does not show install prompt

Check:

- the app is served over `https`
- `site.webmanifest` is reachable
- `sw.js` is registered without errors
- the site has been visited enough for Chrome to consider it installable

### API requests fail with CORS errors

Check backend `CORS_ALLOWED_ORIGINS` and confirm it includes the frontend domain.

### Login works but data pages fail later

Check that refresh-token rotation is handled correctly and that the latest `refresh_token` is being stored after `/auth/jwt/refresh/`.

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [SMOKE_TEST.md](./SMOKE_TEST.md)
- [api.yaml](./api.yaml)

## Maintainer Notes

If you update routing, auth behavior, environment variables, or major feature areas, update this README in the same change. It should stay aligned with the real application rather than becoming a generic project summary.
