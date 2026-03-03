# VidyaMitr Client - Next.js Frontend

> Modern, responsive frontend for the VidyaMitr adaptive learning platform



## Overview

The VidyaMitr client is a Next.js 16 application that provides an intuitive, AI-powered learning experience for students. Built with TypeScript, Tailwind CSS, and shadcn/ui components.



## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm run build
pnpm start
```



## Project Structure

```
client/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions (API logic)
│   │   ├── admin.ts       # Admin operations
│   │   ├── auth.ts        # Authentication
│   │   ├── gemini.ts      # AI/LLM operations
│   │   ├── progress.ts    # Progress tracking
│   │   ├── resource.ts    # Resource management
│   │   └── user.ts        # User operations
│   │
│   ├── api/               # API Routes
│   │   ├── diagnose/      # Diagnostic quiz API
│   │   └── gemini/        # Gemini AI endpoints
│   │
│   ├── (pages)/           # Application pages
│   │   ├── admin/         # Admin dashboard
│   │   ├── certificates/  # Certificates page
│   │   ├── dashboard/     # Student dashboard
│   │   ├── diagnostic/    # Diagnostic quiz
│   │   ├── login/         # Login page
│   │   ├── onboarding/    # Onboarding flow
│   │   ├── path/          # Learning path
│   │   ├── resource/      # Resource viewer
│   │   ├── settings/      # User settings
│   │   ├── signup/        # Signup page
│   │   └── study-hub/     # AI Study Hub
│   │
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
│
├── components/            # React Components
│   ├── ui/               # shadcn/ui components
│   ├── AIQuizModule.tsx  # AI quiz system
│   ├── AvatarCompanion.tsx # Avatar companion
│   ├── Certificate.tsx   # Certificate generator
│   ├── DiagnosticQuiz.tsx # Diagnostic quiz
│   ├── FamilyCompanion.tsx # Family dashboard
│   ├── LMSIntegrationPanel.tsx # LMS integration
│   ├── ResourceChatbot.tsx # AI chatbot
│   ├── SubjectGrid.tsx   # Subject selection
│   └── VideoPlayer.tsx   # Video player
│
├── lib/                   # Utilities
│   ├── constants/        # Constants and configs
│   ├── utils/            # Helper functions
│   └── validations/      # Zod schemas
│
├── store/                 # State Management
│   └── useAppStore.ts    # Zustand store
│
├── types/                 # TypeScript Types
│   └── database.types.ts # Database types
│
├── utils/                 # Utilities
│   └── supabase/         # Supabase clients
│       ├── admin.ts      # Admin client (service role)
│       ├── client.ts     # Browser client
│       └── server.ts     # Server client
│
├── scripts/               # Setup scripts
│   ├── create-progress-tables.sql
│   ├── seed-demo-resources.sql
│   └── SETUP_PROGRESS_TRACKING.md
│
└── middleware.ts          # Route protection
```



## Key Features

### Pages

1. **Authentication**
   - `/login` - User login
   - `/signup` - User registration
   - Protected routes with middleware

2. **Onboarding**
   - `/onboarding` - Profile setup
   - Grade level, subject, and avatar selection

3. **Dashboard**
   - `/dashboard` - Main student dashboard
   - Subject selection and progress overview

4. **Learning**
   - `/path` - Adaptive learning path with 4-week roadmap
   - `/resource/[id]` - Resource viewer with AI chatbot
   - `/diagnostic` - Diagnostic quiz for assessment

5. **Study Hub**
   - `/study-hub` - AI-powered study assistance
   - Doubt resolution and study guides

6. **Progress**
   - `/certificates` - View earned certificates
   - `/settings` - User settings and preferences

7. **Admin**
   - `/admin` - Admin dashboard
   - User management and LMS integration

### Components

- **AIQuizModule**: Auto-generated quizzes with Gemini AI
- **AvatarCompanion**: Interactive avatar system
- **DiagnosticQuiz**: Initial assessment quiz
- **ResourceChatbot**: AI chatbot for resource help
- **FamilyCompanion**: Parent dashboard view
- **LMSIntegrationPanel**: LMS integration UI

### Server Actions

All API logic is in `app/actions/`:
- `auth.ts` - Login, signup, session management
- `gemini.ts` - AI operations (roadmap, quiz generation)
- `progress.ts` - Progress tracking and certificates
- `resource.ts` - Resource operations and feedback
- `user.ts` - User profile management
- `admin.ts` - Admin operations



## Environment Variables

Required variables in `.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini AI
GEMINI_API_KEY=your_gemini_key

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```



## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Forms**: react-hook-form + Zod
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 1.5 Flash
- **Icons**: lucide-react



## Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:turbo        # Start with Turbopack

# Build
pnpm build            # Production build
pnpm start            # Start production server

# Linting
pnpm lint             # Run ESLint

# Type Checking
pnpm type-check       # Run TypeScript compiler
```

## Security

### Authentication
- Supabase Auth with email/password
- Protected routes via middleware
- Session management with cookies

### Row-Level Security (RLS)
- Database-level security policies
- User-specific data access
- Admin client for server operations

### Best Practices
- Environment variables for secrets
- Server actions for sensitive operations
- Input validation with Zod
- Type safety with TypeScript



## Database Schema

### Core Tables

1. **users** - User profiles
   - id, name, grade_level, preferred_format
   - avatar_selection, is_admin

2. **resources** - Learning resources
   - id, title, subject, difficulty
   - format, url, tags

3. **session_logs** - Activity tracking
   - id, user_id, action_type
   - resource_id, details

4. **user_progress** - Progress tracking
   - id, user_id, resource_id
   - completed, completion_date

5. **user_learning_paths** - Learning paths
   - id, user_id, subject
   - resource_ids, goal

6. **certificates** - Certificates
   - id, user_id, subject
   - resources_completed, certificate_data

