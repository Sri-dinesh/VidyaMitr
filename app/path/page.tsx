'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video, FileText, Clock, TrendingUp, ArrowRight, Sparkles, Share2, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FamilyCompanion from '@/components/FamilyCompanion';
import { useAppStore } from '@/store/useAppStore';
import { generateLearningPath } from '@/app/actions/recommend';
import { generatePathRoadmap } from '@/app/actions/gemini';
import { toast } from 'sonner';
import type { Resource } from '@/types/database.types';

export default function LearningPathPage() {
  const router = useRouter();
  const { user, intent } = useAppStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<Array<{
    week: string;
    theme: string;
    topics: string[];
    action_item: string;
    recommended_resource: string;
  }> | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);

  useEffect(() => {
    // Check if we have the required data
    if (!user.id || !intent.subject) {
      router.push('/dashboard');
      return;
    }

    // Check localStorage first for cached recommendations
    const cacheKey = `recommendations_${user.grade_level}_${intent.subject}_${intent.confidence}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
        
        if (cacheAge < CACHE_DURATION) {
          console.log('📦 Using cached recommendations');
          setResources(parsed.resources || []);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing cached data:', error);
        localStorage.removeItem(cacheKey);
      }
    }

    // Fetch fresh recommendations
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await generateLearningPath(intent, user);

        if (!result.success) {
          setError(result.error || 'Failed to generate learning path');
          setIsLoading(false);
          return;
        }

        const recommendations = result.resources || [];
        setResources(recommendations);

        // Generate AI roadmap after getting resources
        if (recommendations.length > 0 && intent.subject) {
          setIsLoadingRoadmap(true);
          try {
            const roadmapResult = await generatePathRoadmap(
              intent.subject,
              user.grade_level || 'Class 10',
              intent.confidence || 'Medium',
              recommendations.map(r => ({ id: r.id, title: r.title, type: r.format || 'video', url: r.url }))
            );
            setRoadmap(roadmapResult.roadmap);
          } catch (err) {
            console.error('Error generating roadmap:', err);
          } finally {
            setIsLoadingRoadmap(false);
          }
        }

        // Cache the results
        const cacheData = {
          resources: recommendations,
          timestamp: Date.now(),
          metadata: {
            grade: user.grade_level,
            subject: intent.subject,
            confidence: intent.confidence,
            goal: intent.goal,
          }
        };
        
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
          console.log('💾 Cached recommendations for future use');
        } catch (storageError) {
          console.warn('Failed to cache recommendations:', storageError);
        }

      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, intent, router]);

  const handleExportToGoogleClassroom = () => {
    toast.success('Exported to Google Classroom!', {
      description: `Your ${intent.subject} learning path with ${resources.length} resources has been shared.`,
    });
  };

  // Difficulty badge colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Advanced':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="text-center space-y-4">
              <div className="h-10 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse" />
              <div className="h-6 bg-gray-200 rounded-lg w-1/2 mx-auto animate-pulse" />
            </div>

            {/* Avatar Skeleton */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Resource Cards Skeleton */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200 animate-pulse"
              >
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Oops! Something went wrong</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state (no resources found)
  if (resources.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">Your Learning Path</h1>
              <p className="text-gray-600">
                {intent.subject} • {intent.goal} • {intent.confidence} Confidence
              </p>
            </div>

            {/* Family Companion */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
              <FamilyCompanion
                currentSubject={intent.subject || 'General'}
                studentState="idle"
                defaultCompanion="sibling"
              />
            </div>

            {/* Empty State Card */}
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  No Resources Available Yet
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  We're working hard to add more resources for {intent.subject} at your level.
                  Try adjusting your confidence level or exploring other subjects!
                </p>
                <div className="flex gap-4 justify-center pt-4">
                  <Button onClick={() => router.push('/dashboard')} variant="outline">
                    Try Another Subject
                  </Button>
                  <Button onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Success state with resources
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Your Personalized Learning Path</h1>
            <p className="text-gray-600">
              {intent.subject} • {intent.goal} • {intent.confidence} Confidence
            </p>
            <Button 
              onClick={handleExportToGoogleClassroom}
              variant="outline"
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Export to Google Classroom
            </Button>
          </div>

          {/* AI-Powered 4-Week Roadmap */}
          {roadmap && (
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Your 4-Week Study Roadmap</CardTitle>
                    <CardDescription className="text-base">
                      Curriculum-aligned plan for {intent.subject} • {user.grade_level}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {roadmap.map((week, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                            {idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="text-sm font-semibold text-indigo-600 mb-1">
                              {week.week}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {week.theme}
                            </h3>
                          </div>
                          
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              Topics to Cover:
                            </p>
                            <ul className="space-y-1">
                              {week.topics.map((topic, topicIdx) => (
                                <li key={topicIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="text-indigo-500 font-bold mt-0.5">→</span>
                                  <span>{topic}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-sm font-semibold text-purple-900 mb-1">
                              📝 Action Item:
                            </p>
                            <p className="text-sm text-purple-800">
                              {week.action_item}
                            </p>
                          </div>

                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-semibold text-green-900 mb-1">
                              📚 Recommended Resource:
                            </p>
                            <p className="text-sm text-green-800 font-medium">
                              {week.recommended_resource}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isLoadingRoadmap && (
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-600">Generating your personalized study roadmap...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Family Companion */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
            <FamilyCompanion
              currentSubject={intent.subject || 'General'}
              studentState="succeeding"
              defaultCompanion="father"
            />
          </div>

          {/* Learning Path Timeline */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Your Learning Journey ({resources.length} Resources)
              </h2>
            </div>

            {/* Resource Cards */}
            <div className="space-y-4 relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-indigo-200 hidden md:block" />

              {resources.map((resource, index) => {
                const FormatIcon = resource.format === 'video' ? Video : FileText;

                return (
                  <div key={resource.id} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute left-6 top-8 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white hidden md:block z-10" />

                    {/* Resource Card */}
                    <Card
                      className={`
                        border-2 transition-all duration-200
                        hover:shadow-lg hover:border-indigo-300
                        md:ml-16
                        ${index === 0 ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}
                      `}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-indigo-600">
                                Step {index + 1}
                              </span>
                              {index === 0 && (
                                <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                                  Start Here
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-xl">{resource.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {/* Difficulty Badge */}
                          <span
                            className={`
                              px-3 py-1 rounded-full text-sm font-medium border
                              ${getDifficultyColor(resource.difficulty || 'Medium')}
                            `}
                          >
                            {resource.difficulty}
                          </span>

                          {/* Format Badge */}
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                            <FormatIcon className="w-4 h-4" />
                            {resource.format === 'video' ? 'Video' : 'Text'}
                          </span>

                          {/* Estimated Time */}
                          {resource.estimated_time && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {resource.estimated_time}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {resource.tags && resource.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {resource.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Button */}
                        <Link href={`/resource/${resource.id}`}>
                          <Button className="w-full sm:w-auto" size="lg">
                            Start Learning
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="text-center pt-8">
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/dashboard')} variant="outline" size="lg">
                ← Back to Dashboard
              </Button>
              <Button 
                onClick={() => {
                  // Clear cache and refresh
                  const cacheKey = `recommendations_${user.grade_level}_${intent.subject}_${intent.confidence}`;
                  localStorage.removeItem(cacheKey);
                  window.location.reload();
                }}
                variant="ghost" 
                size="lg"
                className="text-gray-500"
              >
                🔄 Refresh Recommendations
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
