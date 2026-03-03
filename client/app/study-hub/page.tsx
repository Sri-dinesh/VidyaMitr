'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, BookOpen, HelpCircle, Sparkles, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SUBJECTS } from '@/lib/constants/subjects';

interface StudyGuideForm {
  subject: string;
  topic: string;
}

interface DoubtForm {
  question: string;
  subject: string;
}

export default function StudyHubPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [studyGuideContent, setStudyGuideContent] = useState<string | null>(null);
  const [studyGuideLoading, setStudyGuideLoading] = useState(false);
  const [doubtAnswer, setDoubtAnswer] = useState<{ question: string; answer: string } | null>(null);
  const [doubtLoading, setDoubtLoading] = useState(false);

  const {
    register: registerStudyGuide,
    handleSubmit: handleSubmitStudyGuide,
    setValue: setStudyGuideValue,
    watch: watchStudyGuide,
    formState: { errors: studyGuideErrors },
  } = useForm<StudyGuideForm>({
    defaultValues: {
      subject: 'Mathematics',
      topic: '',
    },
  });

  const {
    register: registerDoubt,
    handleSubmit: handleSubmitDoubt,
    setValue: setDoubtValue,
    watch: watchDoubt,
    reset: resetDoubt,
  } = useForm<DoubtForm>({
    defaultValues: {
      question: '',
      subject: 'Mathematics',
    },
  });

  useEffect(() => {
    if (!user.id) {
      router.push('/login');
    }
  }, [user.id, router]);

  const onGenerateStudyGuide = async (data: StudyGuideForm) => {
    if (!data.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setStudyGuideLoading(true);
    setStudyGuideContent(null);

    try {
      const response = await fetch('/api/gemini/study-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: data.subject,
          grade_level: user.grade_level || 'Class 9',
          topic: data.topic,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate study guide');
      }

      setStudyGuideContent(result.content);
      toast.success('Study guide generated successfully!');
    } catch (error) {
      console.error('Study guide error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate study guide');
    } finally {
      setStudyGuideLoading(false);
    }
  };

  const onResolveDoubt = async (data: DoubtForm) => {
    if (!data.question.trim()) {
      toast.error('Please enter your question');
      return;
    }

    setDoubtLoading(true);
    setDoubtAnswer(null);

    try {
      const response = await fetch('/api/gemini/resolve-doubt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: data.question,
          subject: data.subject,
          grade_level: user.grade_level || 'Class 9',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resolve doubt');
      }

      setDoubtAnswer({
        question: result.question,
        answer: result.answer,
      });
      toast.success('Doubt resolved!');
    } catch (error) {
      console.error('Doubt resolution error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resolve doubt');
    } finally {
      setDoubtLoading(false);
    }
  };

  const handleDownloadStudyGuide = () => {
    if (!studyGuideContent) return;

    const blob = new Blob([studyGuideContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-guide-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Study guide downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.back()} variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <Sparkles className="w-10 h-10 text-indigo-600" />
                  AI Study Hub
                </h1>
                <p className="text-gray-600 mt-1">
                  Powered by Google Gemini - Your AI learning assistant
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="study-guide" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="study-guide" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Generate Study Guide
              </TabsTrigger>
              <TabsTrigger value="resolve-doubt" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Resolve a Doubt
              </TabsTrigger>
            </TabsList>

            {/* Study Guide Generator Tab */}
            <TabsContent value="study-guide" className="space-y-6 mt-6">
              <Card className="border-2 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Study Guide Generator
                  </CardTitle>
                  <CardDescription>
                    Generate comprehensive study guides for any topic in your syllabus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitStudyGuide(onGenerateStudyGuide)} className="space-y-4">
                    {/* Subject Selection */}
                    <div className="space-y-2">
                      <label htmlFor="study-subject" className="text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <Select
                        value={watchStudyGuide('subject')}
                        onValueChange={(value) => setStudyGuideValue('subject', value)}
                      >
                        <SelectTrigger id="study-subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {SUBJECTS.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.icon} {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Topic Input */}
                    <div className="space-y-2">
                      <label htmlFor="topic" className="text-sm font-medium text-gray-700">
                        Topic
                      </label>
                      <Input
                        id="topic"
                        type="text"
                        placeholder="e.g., Newton's Laws of Motion, Photosynthesis, Algebra..."
                        {...registerStudyGuide('topic', { required: true })}
                      />
                      <p className="text-xs text-gray-500">
                        Enter the specific topic you want to study
                      </p>
                    </div>

                    {/* Generate Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2"
                      disabled={studyGuideLoading}
                    >
                      {studyGuideLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gemini is analyzing the syllabus...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Study Guide
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Study Guide Output */}
              {studyGuideLoading && (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-8">
                    <div className="space-y-4 animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-5/6" />
                      <div className="h-4 bg-gray-200 rounded w-4/6" />
                      <div className="h-8 bg-gray-200 rounded w-2/3 mt-6" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {studyGuideContent && !studyGuideLoading && (
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-green-900">Your Study Guide</CardTitle>
                      <Button
                        onClick={handleDownloadStudyGuide}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none bg-white rounded-lg p-6">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {studyGuideContent}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Resolve Doubt Tab */}
            <TabsContent value="resolve-doubt" className="space-y-6 mt-6">
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    Knowledge Gap Resolver
                  </CardTitle>
                  <CardDescription>
                    Ask any question and get a comprehensive, structured explanation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitDoubt(onResolveDoubt)} className="space-y-4">
                    {/* Subject Selection */}
                    <div className="space-y-2">
                      <label htmlFor="doubt-subject" className="text-sm font-medium text-gray-700">
                        Subject (Optional)
                      </label>
                      <Select
                        value={watchDoubt('subject')}
                        onValueChange={(value) => setDoubtValue('subject', value)}
                      >
                        <SelectTrigger id="doubt-subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {SUBJECTS.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.icon} {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Question Input */}
                    <div className="space-y-2">
                      <label htmlFor="question" className="text-sm font-medium text-gray-700">
                        What concept are you stuck on?
                      </label>
                      <textarea
                        id="question"
                        rows={6}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., I don't understand how photosynthesis works. Can you explain it with a simple example?"
                        {...registerDoubt('question', { required: true })}
                      />
                      <p className="text-xs text-gray-500">
                        Be specific about what you're confused about
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2"
                      disabled={doubtLoading}
                    >
                      {doubtLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gemini is thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Get Answer
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Doubt Loading State */}
              {doubtLoading && (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-8">
                    <div className="space-y-4 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-5/6" />
                      <div className="h-4 bg-gray-200 rounded w-4/6" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Doubt Answer Display */}
              {doubtAnswer && !doubtLoading && (
                <div className="space-y-4">
                  {/* User's Question */}
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-sm text-blue-900">Your Question</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-800">{doubtAnswer.question}</p>
                    </CardContent>
                  </Card>

                  {/* AI's Answer */}
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        AI Tutor's Explanation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none bg-white rounded-lg p-6">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {doubtAnswer.answer}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ask Another Question Button */}
                  <div className="text-center">
                    <Button
                      onClick={() => {
                        setDoubtAnswer(null);
                        resetDoubt();
                      }}
                      variant="outline"
                      size="lg"
                    >
                      Ask Another Question
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
