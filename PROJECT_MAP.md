# PROJECT MAP — دورك (Dawrk)

## [TECH_STACK]

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Framework | Next.js | 16.2.6 | App Router, Turbopack default, React 19.2 |
| Language | TypeScript | 5.x | Strict mode, type safety |
| Styling | Tailwind CSS | 4.x | CSS variables, dark mode, zero-runtime |
| Database | Supabase (Postgres) | — | Realtime, Auth, hosted |
| Realtime | Supabase Realtime | — | Live queue updates via Postgres changes |
| Auth | Supabase Auth | — | Phone OTP, RLS |
| PWA | Native (manifest.ts + sw.js) | — | No external PWA libs (Turbopack + webpack conflict avoided) |
| i18n | Custom (proxy + dictionaries) | — | Next.js 16 official pattern, no deps |
| Charts | Recharts | 3.8.1 | Analytics dashboard |
| QR | qrcode.react | 4.2.0 | Client-side SVG QR |
| Icons | lucide-react | 1.16.0 | Tree-shakeable |
| Notifications | Web Push API + web-push | 3.6.7 | Browser push + WhatsApp Cloud API |
| Hosting | Vercel | — | Free tier, ISR, Edge |
| Fonts | Noto Sans Arabic + Inter | — | Google Fonts, RTL + Latin |

## [SYSTEM_FLOW]

```
┌─────────────────────────────────────────────────────┐
│                    Customer Flow                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Scan QR ──> /[locale]/                              │
│       │        Select Service                        │
│       │        Enter Phone (optional)                │
│       │        Press "Get My Turn"                   │
│       └──> INSERT queue_entries                      │
│                │                                     │
│                ▼                                     │
│         /[locale]/queue/[shopId]                     │
│         ┌───────────────────────┐                    │
│         │  Ticket #42           │                    │
│         │  3 people ahead       │                    │
│         │  ~60 min wait         │                    │
│         │  [Notify Me] [Leave]  │                    │
│         └───────────────────────┘                    │
│                │                                     │
│                ▼ (Realtime subscription)             │
│         Status updates live                          │
│         Browser notification when ≈ 2 ahead          │
│         WhatsApp message (if phone provided)         │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   Barber Flow                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Login ──> /[locale]/dashboard                       │
│       │     Phone + OTP (Supabase Auth)              │
│       └──> /[locale]/dashboard/[shopId]              │
│                │                                     │
│                ▼                                     │
│         ┌───────────────────────┐                    │
│         │  Queue Management    │                    │
│         │  [#42 Waiting]  [✓][✗]│                    │
│         │  [#43 Waiting]  [✓][✗]│                    │
│         │  [Call Next]         │                    │
│         └───────────────────────┘                    │
│                │                                     │
│                ├──> Analytics (Recharts)             │
│                │    ┌──────────────────┐             │
│                │    │ Peak Hours Chart │             │
│                │    │ Daily Stats      │             │
│                │    │ Avg Wait Time    │             │
│                │    └──────────────────┘             │
│                │                                     │
│                └──> Settings                         │
│                     ┌──────────────────┐             │
│                     │ Services CRUD    │             │
│                     │ Working Hours    │             │
│                     └──────────────────┘             │
└─────────────────────────────────────────────────────┘
```

## [ARCHITECTURE]

### Directory Layout
```
src/
├── app/
│   ├── [locale]/                  # i18n routes (ar, en)
│   │   ├── page.tsx               # Landing / QR
│   │   ├── queue/[shopId]/
│   │   │   ├── page.tsx           # Customer ticket view
│   │   │   └── live/page.tsx      # Public live display
│   │   └── dashboard/
│   │       ├── page.tsx           # Phone OTP login
│   │       └── [shopId]/
│   │           ├── page.tsx       # Queue management
│   │           ├── analytics/page.tsx
│   │           └── settings/page.tsx
│   ├── layout.tsx                 # Root (fonts, metadata)
│   ├── manifest.ts                # PWA manifest
│   └── not-found.tsx
├── components/
│   ├── customer/                  # Customer-facing components
│   ├── dashboard/                 # Dashboard components
│   ├── shared/                    # Header, ThemeToggle, etc.
│   └── providers/                 # ThemeProvider
├── hooks/
│   ├── use-dictionary.ts
│   ├── use-realtime-queue.ts
│   └── use-notification.ts
├── lib/
│   ├── supabase/                  # Client, server, admin, types
│   ├── i18n/config.ts             # Locale config
│   ├── dictionaries.ts            # Dict loader (server-only)
│   ├── queue-engine.ts            # Pure queue logic
│   ├── logger.ts                  # Async safe logging
│   ├── constants.ts
│   └── utils.ts                   # cn()
├── proxy.ts                       # i18n redirect (replaces middleware)
└── middleware.ts                   # deprecated but kept for compatibility
```

### Key Decisions
- **No `@serwist/next`**: Requires webpack config, but Next.js 16 uses Turbopack by default. Using native PWA (manifest + push API) instead.
- **No `next-intl`**: Official Next.js 16 i18n pattern is simpler and sufficient.
- **Pure queue engine**: All position/wait-time logic is pure functions (testable, no DB deps).
- **RLS-first security**: Row Level Security on all tables; service role for admin ops only.
- **Server Components where possible**: Pages are RSC, only interactive parts use 'use client'.

### Data Model
```
shops (id, name, phone, avatar_url, avg_service_time, working_hours, created_at)
services (id, shop_id, name, duration_minutes, is_active, sort_order)
queue_entries (id, shop_id, service_id, ticket_number, customer_phone, status, 
               created_at, called_at, completed_at, notification_sent)
subscriptions (id, shop_id, endpoint, p256dh, auth, created_at)
```

### Realtime Flow
```
Client subscribes → Supabase Realtime channel on queue_entries
  → postgres_changes event (INSERT/UPDATE/DELETE)
  → callback refetches data → React re-renders
```

## [ORPHANS & PENDING]

### ✅ Implemented
- [x] Project scaffold (Next.js 16, Tailwind 4, TypeScript)
- [x] React Compiler enabled (`reactCompiler: true`, babel-plugin installed)
- [x] All npm dependencies installed
- [x] Supabase schema (shops, services, queue_entries, subscriptions) + RLS
- [x] Seed data (2 shops, 8 services)
- [x] Database types (TypeScript)
- [x] i18n system (proxy.ts + dictionaries / ar + en)
- [x] Dark/Light mode (next-themes)
- [x] PWA manifest (manifest.ts, SVG icons)
- [x] Service Worker (public/sw.js) + push notifications
- [x] Queue engine (position, wait time, per-service duration)
- [x] Safe async logger
- [x] Customer landing page (QR display)
- [x] Customer queue entry flow (service select → ticket → live status)
- [x] Customer live queue display
- [x] Dashboard login (phone OTP)
- [x] Dashboard queue management (list, call next, complete, no-show)
- [x] Dashboard analytics (charts, stats, CSV export)
- [x] Dashboard settings (services CRUD + working hours editor)
- [x] Real-time subscriptions (Postgres changes)
- [x] WhatsApp Cloud API integration (notifications service + server actions)
- [x] SEO: sitemap.xml, robots.txt, canonical URLs, Open Graph, Twitter cards
- [x] metadataBase for production URLs
- [x] Vercel deployment config (vercel.json)
- [x] CI/CD pipeline (GitHub Actions workflow)
- [x] Security headers (CSP, nosniff, X-Frame-Options)

### ❌ PENDING (Future iterations)
- [ ] E2E tests (Playwright)
- [ ] Performance: Lighthouse score optimization
- [ ] Accessibility: full audit (axe-core)
- [ ] Dashboard: multiple barber support
- [ ] Actual PNG icon generation (SVG → PNG for older browsers)
