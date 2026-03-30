# SkillSwap AI Smoke Test

## Maqsad

Bu checklist release oldidan eng muhim user flowlar ishlayotganini tez tekshirish uchun kerak.

## Browserlar

1. Desktop Chrome
2. Mobile Chrome
3. iPhone bo'lsa Safari orqali installability va basic layout

## Env tekshiruvi

1. `VITE_API_URL` to'g'ri.
2. `VITE_WS_URL` to'g'ri yoki reverse proxy ishlayapti.
3. Frontend `https` bilan ochilyapti.
4. API `https` bilan ishlayapti.
5. WebSocket `wss` bilan ishlayapti.

## Asosiy oqimlar

1. Landing sahifa ochiladi.
2. Register ishlaydi.
3. Login ishlaydi.
4. Refresh qilganda sessiya saqlanadi.
5. Logout ishlaydi.
6. Password reset flow ochiladi.

## App ichidagi oqimlar

1. Dashboard data bilan ochiladi.
2. Jobs list ochiladi.
3. Job detail ochiladi.
4. Barter sahifa ishlaydi.
5. Search sahifa ishlaydi.
6. Profile ochiladi va edit saqlanadi.
7. Portfolio upload ishlaydi.
8. Notifications list keladi.
9. Chat room ochiladi.
10. Chat message yuboriladi.
11. Chat file upload ishlaydi.
12. Contracts sahifasida submission va revision flow ishlaydi.
13. Subscription yoki payment flow backendga uriladi.

## Video va realtime

1. Incoming/outgoing call flow ishlaydi.
2. Kamera va mikrofon ruxsati ishlaydi.
3. WebSocket disconnect bo'lsa reconnect ishlaydi.
4. Screen sharing ishga tushadi.
5. Call tugagach review modal chiqadi.

## PWA

1. `site.webmanifest` ochiladi.
2. `sw.js` 200 bilan keladi.
3. Chrome install prompt chiqadi yoki `Add to Home Screen` mavjud.
4. App install bo'lgach ikonka to'g'ri ko'rinadi.
5. Offline holatda `offline.html` fallback chiqadi.

## Routing

1. `/dashboard` refresh.
2. `/chat` refresh.
3. `/profile` refresh.
4. `/video` refresh.
5. 404 bermasligi kerak.

## Final check

1. `npm run lint`
2. `npm run build`
3. Browser console'da critical error yo'q
4. Network tabda 4xx/5xx asosiy flowlarda yo'q
5. Mixed content error yo'q
