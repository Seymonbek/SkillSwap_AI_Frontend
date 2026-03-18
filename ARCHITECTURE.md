# SkillSwap AI Frontend - Unicorn Architecture

## 🏗️ Feature-Sliced Design (FSD) Architecture

```
src/
├── 📱 app/                    # Application layer
│   ├── providers/             # App providers (Router, QueryClient, etc.)
│   ├── router/                # Routing configuration
│   ├── store/                 # Root store setup
│   └── styles/                # Global styles
│
├── 🧩 entities/               # Business entities
│   ├── user/                  # User entity
│   ├── chat/                  # Chat entity
│   ├── video-call/            # Video call entity
│   ├── job/                   # Job entity
│   ├── mentorship/            # Mentorship entity
│   └── barter/                # Barter session entity
│
├── ⚡ features/               # User features (use cases)
│   ├── auth/                  # Authentication
│   ├── chat-messaging/        # Chat messaging
│   ├── video-calling/         # Video calling
│   ├── job-management/        # Job CRUD
│   ├── mentorship-flow/       # Mentorship workflow
│   ├── ai-services/           # AI features
│   └── payments/              # Payment processing
│
├── 🧱 widgets/                 # Complex UI blocks
│   ├── chat-widget/           # Full chat widget
│   ├── video-widget/          # Video call widget
│   ├── job-card/              # Job card with actions
│   └── user-profile/          # User profile widget
│
├── 🎨 shared/                  # Shared resources
│   ├── api/                     # API layer
│   ├── ui/                      # UI Kit (Atomic Design)
│   │   ├── atoms/               # Buttons, Inputs, Icons
│   │   ├── molecules/           # Form fields, Cards
│   │   ├── organisms/           # Headers, Sidebars
│   │   └── templates/           # Page layouts
│   ├── lib/                     # Utilities & hooks
│   └── config/                  # App configuration
│
└── 📄 pages/                   # Page components
    ├── auth/
    ├── dashboard/
    ├── chat/
    ├── video/
    └── freelance/
```

## 🎯 Design Principles

1. **Feature-Sliced Design**: Har bir feature o'z domain'ini boshqaradi
2. **Atomic Design System**: UI komponentlar atom-molekula-organizm-templat hierarhiyasida
3. **Explicit Architecture**: Har bir modul o'z maqsadini aniq bildiadi
4. **Low Coupling**: Modullar bir-biridan mustaqil
5. **High Cohesion**: Bog'liq kodlar bir joyda

## 🚀 Getting Started

```bash
npm install
npm run dev
```

## 🧪 Testing

```bash
npm test           # Unit tests
npm run test:e2e   # E2E tests
```

## 📚 Documentation

- [Architecture Decision Records](./docs/adr/)
- [Component Library](./src/shared/ui/)
- [API Documentation](./src/shared/api/)
