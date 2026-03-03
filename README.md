# VidyaMitr - AI Adaptive Learning Platform

> Personalized learning experiences for Indian students (Classes 6-10) powered by AI and Machine Learning


## Overview

VidyaMitr is an intelligent educational platform that revolutionizes learning for Indian students by providing:

- **Personalized Learning Paths**: ML-powered recommendations using XGBoost
- **Adaptive Curriculum**: AI-generated 4-week roadmaps aligned with CBSE/ICSE standards
- **Intelligent Assessment**: Auto-generated quizzes with educator escalation
- **Multi-Format Resources**: Videos, articles, interactive content, and practice problems
- **Progress Tracking**: Real-time analytics and milestone-based certificates

**Target Audience**: Students in Classes 6-10


## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/VidyaMitr.git
cd VidyaMitr

# Install dependencies
cd client
pnpm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.


## Project Structure

```
VidyaMitr/
├── client/                 # Next.js Frontend Application
│   ├── app/               # App router pages and API routes
│   ├── components/        # React components
│   ├── lib/              # Utilities and helpers
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Supabase clients and utilities
│
├── server/                # Backend & ML Model
│   ├── ml_model/         # XGBoost recommendation engine
│   └── datasets/         # Training data
│
└── documentation/         # Project documentation
```


## Key Features

### Core Features

1. **Intelligent Onboarding**
   - Grade level and subject assessment
   - Learning style preferences
   - Avatar-based companion selection

2. **ML-Powered Recommendations**
   - XGBoost model with 70% accuracy
   - Hybrid approach (ML + rule-based fallback)
   - Real-time resource matching

3. **Adaptive Learning Path**
   - Gemini AI-powered 4-week roadmaps
   - Curriculum-specific topic breakdown
   - Subject-aligned action items

4. **AI Quiz System**
   - Auto-generated MCQs using Gemini 1.5 Flash
   - Instant grading and feedback
   - Automatic educator escalation for low scores

5. **Study Hub**
   - AI chatbot for doubt resolution
   - Study guide generation
   - Resource-specific help

6. **Progress Tracking**
   - Subject-specific progress monitoring
   - Milestone-based certificates
   - Session logs and analytics


## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Forms**: react-hook-form + Zod validation

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **AI/ML**: 
  - Google Gemini 1.5 Flash (LLM)
  - XGBoost (Recommendation Engine)
  - Python 3.x for ML model


## Environment Setup

Create a `.env` file in the `client/` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Optional: Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Where to get keys:**
- Supabase: [Dashboard → Settings → API](https://supabase.com/dashboard)
- Gemini: [Google AI Studio](https://makersuite.google.com/app/apikey)


## Documentation

- **Client README**: `client/README.md` - Frontend documentation
- **Server README**: `server/README.md` - ML model documentation

## Key Metrics

- **ML Model Accuracy**: 70%
- **Routes**: 19 (12 static, 7 dynamic)
- **Build Time**: ~10 seconds
- **TypeScript Coverage**: 100%
- **Security Rating**: Excellent


*Empowering every learner with personalized AI education*
