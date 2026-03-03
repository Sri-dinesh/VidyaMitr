# VidyaMitra - AI-Powered Personalized Learning Platform

An AI-driven web-based platform that analyzes student profiles, assesses learning needs, and provides customized recommendations for courses and resources tailored for high school students (Class 6 to Class 10).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (to be added in Phase 2)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **State Management**: Zustand (to be added in Phase 2)
- **Validation**: Zod
- **Forms**: react-hook-form
- **Icons**: lucide-react
- **Package Manager**: pnpm

## Project Status

### ✅ Phase 1: Project Initialization, Architecture & Supabase Auth Setup (COMPLETED)

**Completed Tasks:**

1. **Next.js & Dependency Initialization**
   - ✅ Initialized Next.js 16 with TypeScript, Tailwind CSS, and ESLint
   - ✅ Installed all required dependencies
   - ✅ Set up absolute imports (`@/*`) mapping

2. **Supabase Database Schema & RLS**
   - ✅ Created `users` table with proper columns and constraints
   - ✅ Created `resources` table with proper columns and constraints
   - ✅ Created `session_logs` table with proper columns and constraints
   - ✅ Enabled Row Level Security (RLS) on all tables
   - ✅ Implemented RLS policies for secure data access
   - ✅ Created database indexes for optimized queries

3. **Authentication Implementation**
   - ✅ Created Supabase client utilities (`utils/supabase/server.ts` and `client.ts`)
   - ✅ Built Next.js Middleware for route protection
   - ✅ Created Server Actions for `signUpWithEmail` and `signInWithEmail`
   - ✅ Implemented automatic user profile creation on signup
   - ✅ Built `/login` and `/signup` pages with clean UI
   - ✅ Protected routes: `/dashboard`, `/path`, `/resource`, `/admin`, `/onboarding`

**Database Schema:**

- **users**: Stores user profiles with grade level, format preferences, and avatar selection
- **resources**: Contains learning resources with subject, difficulty, format, and tags
- **session_logs**: Tracks user interactions, feedback, and progress for analytics

**Environment Setup:**

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables (see `.env.example`)

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── actions/
│   │   └── auth.ts          # Server actions for authentication
│   ├── dashboard/           # Protected dashboard route
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── onboarding/          # Onboarding flow (Phase 3)
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── types/
│   └── database.types.ts    # TypeScript types for database schema
├── utils/
│   └── supabase/
│       ├── client.ts        # Supabase client for browser
│       └── server.ts        # Supabase client for server
├── middleware.ts            # Route protection middleware
└── [config files]
```

## Next Steps

### Phase 2: Global State (Zustand) & Core UI Component Library
- Set up Zustand store for user and intent state
- Initialize shadcn/ui and create base components
- Build the AvatarCompanion component

### Phase 3: Frictionless Onboarding Flow
- Build profile setup forms with Zod validation
- Create avatar selection UI
- Implement onboarding completion flow

### Phase 4-7: Dashboard, Recommendation Engine, Learning Resources, Admin Portal
- See `PLAN.md` for detailed phase breakdown

## Documentation

- [PLAN.md](./PLAN.md) - Detailed phase-by-phase implementation guide
- [PRD.txt](./PRD.txt) - Product Requirements Document

## License

ISC
