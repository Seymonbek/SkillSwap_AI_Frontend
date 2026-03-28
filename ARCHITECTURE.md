# SkillSwap AI Frontend Architecture

## Hozirgi tuzilma

Loyiha FSD yo'nalishiga yaqin qurilgan, lekin amalda `pages + entities + shared` markazli SPA sifatida ishlaydi.

```text
src/
├── app/
│   ├── App.jsx                # Root routing, layouts, route lazy loading
│   └── styles/                # Global CSS
├── entities/
│   ├── barter/
│   ├── chat/
│   ├── dispute/
│   ├── job/
│   ├── notification/
│   └── user/                  # Zustand storelar va domain state
├── pages/
│   ├── auth/
│   ├── barter/
│   ├── chat/
│   ├── contracts/
│   ├── dashboard/
│   ├── disputes/
│   ├── home/
│   ├── jobs/
│   ├── notifications/
│   ├── profile/
│   ├── search/
│   ├── subscriptions/
│   ├── video/
│   └── wallet/                # Route-level page komponentlari
└── shared/
    ├── api/                   # Axios client, service layer, WebSocket helper
    ├── hooks/                 # Reusable hooks
    ├── lib/                   # Utility/helper funksiyalar
    └── ui/                    # Shared UI komponentlari
```

## Routing

- Barcha route'lar `src/app/App.jsx` ichida jamlangan.
- Protected route'lar `localStorage` dagi `access_token` orqali tekshiriladi.
- Sahifalar `React.lazy` bilan yuklanadi, shu sabab ilk bundle kichraygan.

## State va data oqimi

- API chaqiriqlari `src/shared/api/` orqali o'tadi.
- Domain state asosan `Zustand` store'larda saqlanadi.
- Ayrim page'lar hali ham service layer'ni to'g'ridan-to'g'ri chaqiradi; bu amaldagi arxitekturaning muhim xususiyati.

## Asosiy modul kesimlari

- `auth`: login, register, password reset, 2FA
- `jobs`: ish e'lonlari, proposal, contract oqimlari
- `barter`: skill exchange, mentorlik, session management
- `chat`: room, message, file upload, WebSocket
- `video`: WebRTC va signal oqimi
- `profile`: me/profile detail, portfolio, review, skill test
- `notifications`: polling + WebSocket asosida bildirishnoma

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Eslatma

- Hozircha `npm test` yoki `test:e2e` scriptlari yo'q.
- `src_backup/` tarixiy nusxa sifatida qolgan va lint jarayonidan chiqarilgan.
