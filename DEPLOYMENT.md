# SkillSwap AI Deployment

## Tavsiya etilgan arxitektura

- Frontend: `app.example.com`
- API: `api.example.com` yoki shu domen ichida `/api/`
- WebSocket: `wss://api.example.com` yoki shu domen ichida `/ws/`
- HTTPS: majburiy
- Video call: TURN server tavsiya etiladi

Eng qulay variant: frontend va backendni bitta `Nginx` orqali reverse proxy qilish. Shunda frontend `VITE_API_URL=/api/v1` bilan ishlayveradi va mixed-content muammo kamayadi.

## Sizda tayyor bo'lishi kerak

1. Domen yoki subdomainlar.
2. Linux server yoki VPS.
3. Backend production holatda ishlashi.
4. SSL sertifikat (`Let's Encrypt` yoki Cloudflare orqali).
5. Backend uchun CORS, CSRF, media upload va WebSocket production sozlamalari.
6. Video call uchun TURN server yoki kamida ICE server endpoint.
7. Payment ishlatsa, production payment kalitlari.

## Frontend build

```bash
npm install
npm run build
```

Production build `dist/` ichiga chiqadi. Shu papkani serverga deploy qilasiz.

## Environment

### 1. Bitta domen ichida reverse proxy ishlatsangiz

`.env.production`:

```bash
VITE_API_URL=/api/v1
VITE_WS_URL=
```

### 2. API alohida domenda bo'lsa

`.env.production`:

```bash
VITE_API_URL=https://api.example.com/api/v1
VITE_WS_URL=wss://api.example.com
```

## Nginx

Repo ichida namunaviy [nginx.conf](./nginx.conf) bor. Uni domen, SSL va server pathlaringizga moslab ishlatasiz.

Muhim joylar:

- `try_files $uri $uri/ /index.html;`
  React Router refreshda 404 bo'lmasligi uchun.
- `/api/` proxy
  Frontenddan backend API ga.
- `/ws/` proxy
  Chat, notifications va signaling uchun.
- `sw.js` va `site.webmanifest`
  `no-cache` bilan beriladi.

## Backend checklist

- `https://api...` ishlashi kerak.
- WebSocket `wss://` ishlashi kerak.
- CORS frontend domenga ruxsat bergan bo'lishi kerak.
- Auth cookie yoki JWT policy productionga mos bo'lishi kerak.
- Media fayllar `https` orqali ochilishi kerak.
- Video call ICE/TURN endpoint ishlashi kerak.
- Upload limitlar backend va Nginxda mos bo'lishi kerak.

## Release checklist

1. `npm run lint`
2. `npm run build`
3. Login
4. Register
5. Password reset
6. Dashboard
7. Jobs list/detail
8. Barter request/session
9. Chat room ochish
10. Chat message yuborish
11. File upload
12. Notifications
13. Profile update
14. Portfolio upload
15. Subscription / payment flow
16. Video call test
17. PWA install
18. Mobile Chrome va desktop Chrome smoke test
19. Route refresh test: `/chat`, `/profile`, `/video`
20. Production loglarni tekshirish

Amaliy testlar uchun [SMOKE_TEST.md](./SMOKE_TEST.md) ni ishlating.

## PWA

Loyiha endi:

- `site.webmanifest`
- `service worker`
- `offline fallback`
- install prompt

ga ega. Telefoningizda Chrome orqali saytni ochib, `Install app` yoki `Add to Home Screen` bilan o'rnatish mumkin.

## Tavsiya

Release qilishdan oldin staging domen oching:

- `staging-app.example.com`
- `staging-api.example.com`

Avval stagingda tekshirib, keyin productionga chiqing.
