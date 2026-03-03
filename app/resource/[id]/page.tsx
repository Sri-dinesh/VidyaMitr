'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, Zap, AlertCircle, CheckCircle, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import FamilyCompanion from '@/components/FamilyCompanion';
import VideoPlayer from '@/components/VideoPlayer';
import ResourceChatbot from '@/components/ResourceChatbot';
import AIQuizModule from '@/components/AIQuizModule';
import { useAppStore } from '@/store/useAppStore';
import { getResourceById, handleFeedback, handleProgression } from '@/app/actions/resource';
import { toast } from 'sonner';
import type { Resource } from '@/types/database.types';

interface ResourcePageProps {
  params: Promise<{ id: string }>;
}

export default function ResourcePage({ params }: ResourcePageProps) {
  const router = useRouter();
  const { user } = useAppStore();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showProgressionDialog, setShowProgressionDialog] = useState(false);
  const [nextResource, setNextResource] = useState<Resource | null>(null);
  const [recommendedResource, setRecommendedResource] = useState<Resource | null>(null);
  const [resourceId, setResourceId] = useState<string>('');
  const [recentFeedback, setRecentFeedback] = useState<'too_slow' | 'too_hard' | 'perfect' | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      const resolvedParams = await params;
      setResourceId(resolvedParams.id);

      if (!user.id) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getResourceById(resolvedParams.id);

        if (!result.success || !result.resource) {
          setError(result.error || 'Resource not found');
          setIsLoading(false);
          return;
        }

        setResource(result.resource);
      } catch (err) {
        console.error('Error fetching resource:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResource();
  }, [params, user.id, router]);

  const onFeedbackClick = async (feedbackType: 'too_slow' | 'too_hard' | 'perfect') => {
    if (!user.id || !resourceId) return;

    setFeedbackLoading(true);
    setRecentFeedback(feedbackType);

    try {
      const result = await handleFeedback(user.id, resourceId, feedbackType);

      if (result.success) {
        toast.success(result.message || 'Feedback recorded!');

        // If "Too Slow" was clicked and we have a recommended resource
        if (feedbackType === 'too_slow' && result.recommendedResource) {
          setRecommendedResource(result.recommendedResource);
        }
      } else {
        toast.error(result.error || 'Failed to record feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const onMarkComplete = async () => {
    if (!user.id || !resourceId) return;

    try {
      const result = await handleProgression(user.id, resourceId);

      if (result.success) {
        setNextResource(result.nextResource || null);
        setShowProgressionDialog(true);
      } else {
        toast.error(result.error || 'Failed to mark as complete');
      }
    } catch (err) {
      console.error('Error marking complete:', err);
      toast.error('An unexpected error occurred');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-1/4 animate-pulse" />
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Resource Not Found</h2>
            <p className="text-gray-600">
              {error || 'The resource you are looking for does not exist or has been removed.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Button */}
          <Button onClick={() => router.back()} variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Learning Path
          </Button>

          {/* Resource Header */}
          <Card className="border-2 border-indigo-200">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{resource.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                      {resource.subject}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {resource.difficulty}
                    </span>
                    {resource.estimated_time && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {resource.estimated_time}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Family Companion */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
            <FamilyCompanion
              currentSubject={resource.subject}
              recentFeedback={recentFeedback}
              studentState="starting"
              defaultCompanion="mother"
            />
          </div>

          {/* Content Viewer */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-0">
              {resource.format === 'video' ? (
                <div className="aspect-video w-full">
                  <VideoPlayer url={resource.url} title={resource.title} className="w-full h-full" />
                </div>
              ) : (
                <div className="p-8 prose prose-lg max-w-none">
                  <div className="text-gray-700 leading-relaxed">
                    {/* For text content, you would render markdown or HTML here */}
                    <p className="text-lg">
                      Access the learning material at:{' '}
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {resource.url}
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resource.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Micro-Feedback System */}
          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-xl">How is this resource working for you?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => onFeedbackClick('too_slow')}
                  disabled={feedbackLoading}
                  variant="outline"
                  size="lg"
                  className="h-auto py-4 flex flex-col gap-2 hover:bg-yellow-50 hover:border-yellow-300"
                >
                  <Zap className="w-6 h-6 text-yellow-600" />
                  <span className="font-semibold">Too Slow</span>
                  <span className="text-xs text-gray-600">I need a faster pace</span>
                </Button>

                <Button
                  onClick={() => onFeedbackClick('too_hard')}
                  disabled={feedbackLoading}
                  variant="outline"
                  size="lg"
                  className="h-auto py-4 flex flex-col gap-2 hover:bg-red-50 hover:border-red-300"
                >
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <span className="font-semibold">Too Hard</span>
                  <span className="text-xs text-gray-600">I need more help</span>
                </Button>

                <Button
                  onClick={() => onFeedbackClick('perfect')}
                  disabled={feedbackLoading}
                  variant="outline"
                  size="lg"
                  className="h-auto py-4 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                >
                  <ThumbsUp className="w-6 h-6 text-green-600" />
                  <span className="font-semibold">Perfect</span>
                  <span className="text-xs text-gray-600">Just right for me</span>
                </Button>
              </div>

              {/* Show recommended resource if "Too Slow" was clicked */}
              {recommendedResource && (
                <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Adjusted to faster pace as per your feedback
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Try this higher-difficulty resource: {recommendedResource.title}
                      </p>
                      <Link href={`/resource/${recommendedResource.id}`}>
                        <Button size="sm" className="gap-2">
                          Jump to Faster Resource
                          <Zap className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progression Button */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Ready to move forward?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Mark this module as complete to unlock your next learning step
                  </p>
                </div>
                <Button onClick={onMarkComplete} size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Mark Complete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Quiz Module */}
          {user.id && (
            <AIQuizModule
              subject={resource.subject}
              topic={resource.title}
              resourceId={resourceId}
              userId={user.id}
            />
          )}
        </div>
      </div>

      {/* Progression Dialog */}
      <Dialog open={showProgressionDialog} onOpenChange={setShowProgressionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-base">
              You've completed 80% of this module. Great progress!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Certificate Eligibility Notice */}
            <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Award className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Certificate Eligibility</h4>
                  <p className="text-sm text-gray-700">
                    Note: Eligible for certificate after completion, estimated time: 8 weeks
                  </p>
                </div>
              </div>
            </div>

            {/* Next Resource Recommendation */}
            {nextResource ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Your Next Learning Step</h4>
                <Card className="border-2 border-indigo-200">
                  <CardHeader>
                    <CardTitle className="text-lg">{nextResource.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {nextResource.difficulty}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {nextResource.format === 'video' ? '📹 Video' : '📄 Text'}
                      </span>
                      {nextResource.estimated_time && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {nextResource.estimated_time}
                        </span>
                      )}
                    </div>

                    {/* Direct Enrollment Link */}
                    <Link href={`/resource/${nextResource.id}`}>
                      <Button size="lg" className="w-full gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Start Next Module (Direct Enrollment)
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <Award className="w-16 h-16 text-yellow-500 mx-auto" />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    🎉 You've Completed All Modules!
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Congratulations! You've successfully completed all resources in this learning path.
                  </p>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button 
                    onClick={() => router.push('/certificates')}
                    className="gap-2 bg-yellow-600 hover:bg-yellow-700"
                    size="lg"
                  >
                    <Award className="w-5 h-5" />
                    View Certificate
                  </Button>
                  <Button 
                    onClick={() => router.push('/dashboard')} 
                    variant="outline"
                    size="lg"
                  >
                    Explore More Subjects
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chatbot */}
      {resource && <ResourceChatbot resource={resource} />}
    </div>
  );
}
