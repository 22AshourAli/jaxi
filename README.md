# دورك (Dawrk) — Smart Queue Management System

A modern, real-time queue management PWA for barbershops and service businesses. Customers join the queue via a simple form and track their turn live. The admin manages the queue from a secure dashboard with one-click call-next, complete, and no-show actions.

## Features

### 🧑‍🤝‍🧑 Customer Side
- **Book a turn** — enter name & phone, get a ticket number
- **Real-time tracking** — see people ahead, estimated wait, and currently serving number (auto-updates via Supabase Realtime)
- **Browser notifications** — optional alerts when your turn is near (2 ahead) and when it's your turn
- **WhatsApp confirmation** — receive a confirmation message when you book (requires WhatsApp API setup)
- **PWA** — installable on mobile, works offline with service worker
- **Bilingual** — Arabic / English, full RTL support
- **Dark mode** — Light / Dark / System themes
- **Global tracker** — navigate the site freely; a floating badge always shows your active ticket status

### 🔐 Admin Dashboard (`/dashboard`)
- **PIN-protected** — fixed password (default `admin123`, change via `ADMIN_PASSWORD` env)
- **Real-time queue** — live list of waiting customers with ticket numbers and timestamps
- **Call Next** — marks the next waiting customer as "serving" and auto-completes the previous one
- **Complete / No Show** — mark a served customer as done or absent (available on both waiting list and serving card)
- **Add Customer** — manually add customers to the queue (bypasses duplicate check)
- **QR Code** — generate and download a QR code for the join page (PNG / SVG)
- **Theme toggle + Language switcher** — same convenience as the public site

### 🏠 Landing Page
- Hero with shop name, tagline, and animated CTA
- Why Us section (features cards)
- Services list (from database)
- Working hours
- Contact section (WhatsApp link + phone call + location)
- Live queue stats (waiting count + currently serving number)
- Floating ticket tracker for customers with active bookings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Database** | Supabase (PostgreSQL) |
| **Realtime** | Supabase Realtime (Postgres Changes) |
| **Auth** | Cookie-based admin PIN |
| **PWA** | Service Worker + Web Manifest |
| **QR Code** | `qrcode.react` |
| **Charts** | Recharts (analytics) |
| **Testing** | Playwright (E2E) |
| **Hosting** | Vercel |

## Project Structure

```
src/
├── actions/
│   ├── admin-auth.ts       # Server actions: admin login/logout/check
│   ├── notifications.ts    # Server actions: send WhatsApp messages
│   └── queue.ts            # Server actions: call-next, complete, no-show, add customer
├── app/
│   ├── [locale]/
│   │   ├── _components/    # Dashboard SimpleLogin + QueueManagement
│   │   ├── dashboard/      # Protected admin pages
│   │   ├── join/           # Customer booking page
│   │   └── page.tsx        # Landing page
│   ├── layout.tsx          # Root layout (fonts, theme script, SW registration)
│   └── not-found.tsx       # 404 page
├── components/
│   ├── customer/           # JoinForm, TicketTracker, QueueEntryView
│   ├── dashboard/          # DashboardHeader, QueueList
│   ├── landing/            # LandingQueueStatus
│   ├── providers/          # ThemeProvider
│   └── shared/             # Header, Footer logic, ThemeToggle
├── hooks/                  # useNotification, useDictionary
├── lib/
│   ├── dictionaries/       # i18n translations (en.json, ar.json)
│   ├── i18n/               # Locale config, middleware
│   ├── notifications/      # WhatsApp message builder
│   └── supabase/           # Client & server Supabase instances
└── middleware.ts            # i18n redirect + admin path handling
```

## Environment Variables

Create a `.env.local` file:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin (optional, defaults to "admin123")
ADMIN_PASSWORD=your-secure-password

# WhatsApp (optional — needed for WhatsApp notifications)
WHATSAPP_API_TOKEN=your-token
WHATSAPP_PHONE_ID=your-phone-id
```

## Database Setup

Run this migration in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  working_hours JSONB,
  avg_service_time INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  price DECIMAL(10,2),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) NOT NULL,
  ticket_number INT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS customer_name TEXT;
```

Enable Realtime on the `queue_entries` table:
1. Go to your Supabase dashboard → Database → Replication
2. Enable replication for the `queue_entries` table

## Getting Started

```bash
npm install
cp .env.example .env.local  # fill in your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run E2E Tests

```bash
npm run test:e2e
```

## Deployment (Vercel)

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add the environment variables (all from `.env.local`)
4. Deploy — Vercel auto-detects Next.js
5. Your app is live at `https://your-app.vercel.app`

The admin dashboard is at `https://your-app.vercel.app/en/dashboard`.

Generate a QR code for the join page from the dashboard → Settings → QR Code.

## WhatsApp Integration

To enable WhatsApp notifications:
1. Create a Meta Business account and get a WhatsApp Business API token
2. Set `WHATSAPP_API_TOKEN` and `WHATSAPP_PHONE_ID` in your environment
3. The system sends confirmations on booking and turn-called alerts

Without these env vars, the app works normally — WhatsApp status will show "Sending..." instead of "Sent".

## License

MIT
