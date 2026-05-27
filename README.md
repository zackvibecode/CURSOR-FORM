# WhatsLead — WhatsApp Lead Form SaaS MVP

Collect customer leads directly to WhatsApp with a no-code form builder.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL)
- **@dnd-kit** (drag-and-drop form builder)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial.sql` via the SQL Editor
3. Enable Google OAuth in Authentication → Providers
4. Add redirect URL: `http://localhost:3000/auth/callback`

### 3. Environment variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Landing page with templates, FAQ, testimonials
- Google OAuth login
- Dashboard to manage forms
- Drag-and-drop form builder (8+ field types)
- Public form pages at `/f/[slug]`
- Submit leads via WhatsApp `wa.me` deep link
- Preview modal (mobile/desktop)
- Copy share link

## Project Structure

```
src/
├── app/                    # Next.js pages & API routes
├── components/
│   ├── landing/            # Marketing page sections
│   ├── builder/            # Form builder UI
│   ├── dashboard/          # Dashboard components
│   ├── form/               # Public form renderer
│   └── ui/                 # Reusable UI components
└── lib/                    # Utilities, Supabase, schemas
```

## Deploy

Deploy to Vercel and set environment variables. Update Supabase redirect URLs for production domain.
