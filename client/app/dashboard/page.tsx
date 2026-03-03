import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FamilyCompanion, { FloatingFamilyCompanion } from '@/components/FamilyCompanion';
import { SubjectGrid } from '@/components/SubjectGrid';
import { signOut } from '@/app/actions/auth';
import type { AvatarSelection } from '@/types/database.types';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile not complete, redirect to onboarding
  if (!profile?.grade_level || !profile?.avatar_selection) {
    redirect('/onboarding');
  }

  // Generate personalized greeting
  const greetings = [
    `Welcome back, ${profile.name}! What do you want to learn today?`,
    `Hi ${profile.name}! Ready to explore something new?`,
    `Hey ${profile.name}! Let's make today productive!`,
    `Hello ${profile.name}! Time to level up your skills!`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-indigo-600">VidyaMitra</h1>
              <span className="text-sm text-gray-500 hidden sm:inline">
                {profile.grade_level}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Link
                href="/study-hub"
                className="rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Study Hub
              </Link>
              <Link
                href="/settings"
                className="rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 transition-colors"
              >
                Settings
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Diagnostic Quiz CTA */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">New: AI-Powered Diagnostic Assessment</h3>
                </div>
                <p className="text-indigo-100 text-lg">
                  Take a quick 5-minute quiz and get a personalized learning path tailored to your exact knowledge level
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">✨ AI-Powered</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">⚡ 5 Minutes</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">🎯 Personalized</span>
                </div>
              </div>
              <Link
                href="/diagnostic"
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Start Diagnostic Quiz
              </Link>
            </div>
          </div>

          {/* Section Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">
              Or Choose Your Subject Directly
            </h2>
            <p className="text-gray-600">
              Select a subject to start your personalized learning journey
            </p>
          </div>

          {/* Subject Grid */}
          <SubjectGrid />

          {/* Quick Stats (Optional Enhancement) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Courses Started</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                  <p className="text-sm text-gray-600">Progress</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile.preferred_format === 'video' ? 'Videos' : 'Notes'}
                  </p>
                  <p className="text-sm text-gray-600">Preferred Format</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Family Companion */}
      <FloatingFamilyCompanion 
        studentState="idle"
        defaultCompanion="mother"
      />
    </div>
  );
}
