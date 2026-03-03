'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DiagnosticQuiz from '@/components/DiagnosticQuiz';
import { useAppStore } from '@/store/useAppStore';
import { Brain, Sparkles, TrendingUp, Target, Clock, Award, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PersonalizedPath {
  introduction: string;
  currentLevel: string;
  strengthAreas: string[];
  improvementAreas: string[];
  learningObjectives: string[];
  detailedRoadmap: {
    week: string;
    title: string;
    topics: string[];
    skills: string[];
    activities: string[];
    milestone: string;
  }[];
  resources: any[];
  success: boolean;
}

export default function DiagnosticPage() {
  const router = useRouter();
  const { user, setIntent } = useAppStore();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [pathData, setPathData] = useState<PersonalizedPath | null>(null);

  useEffect(() => {
    if (!user.id) {
      router.push('/login');
    }
  }, [user.id, router]);

  const subjects = [
    'Mathematics',
    'Science',
    'English',
    'Social Studies',
    'Hindi',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
  ];

  const handleStartDiagnostic = () => {
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }
    setShowQuiz(true);
  };

  const handleQuizComplete = (data: PersonalizedPath) => {
    setPathData(data);
  };

  const handleStartLearning = () => {
    // Set intent with diagnostic results
    setIntent({
      subject: selectedSubject,
      goal: 'Master the subject',
      confidence: pathData?.currentLevel.includes('beginner') ? 'Low' : 'Medium',
    });

    // Navigate to learning path
    router.push('/path');
  };

  if (!user.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8"
>
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-full mb-4">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">AI-Powered Diagnostic Assessment</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Take a quick diagnostic quiz and get a personalized learning path tailored to your current knowledge level
            </p>
          </div>

          {/* Subject Selection (if quiz not started) */}
          {!showQuiz && !pathData && (
            <Card className="border-2 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-2xl">Choose Your Subject</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Select the subject you want to learn
                  </label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-full h-12 text-lg">
                      <SelectValue placeholder="Choose a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject} className="text-lg">
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Personalized</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Path tailored to your current level
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Quick</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Only 5-7 minutes to complete
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">AI-Powered</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Smart recommendations by Gemini
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleStartDiagnostic}
                  disabled={!selectedSubject}
                  size="lg"
                  className="w-full gap-2"
                >
                  <Brain className="w-5 h-5" />
                  Begin Diagnostic Assessment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Diagnostic Quiz */}
          {showQuiz && !pathData && (
            <DiagnosticQuiz
              subject={selectedSubject}
              grade={user.grade_level || 'Class 10'}
              userId={user.id}
              onComplete={handleQuizComplete}
            />
          )}

          {/* Personalized Path Results */}
          {pathData && (
            <div className="space-y-6">
              {/* Introduction */}
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Your Personalized Learning Path</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Based on your diagnostic assessment results
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {pathData.introduction}
                  </p>
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">Current Level Assessment:</p>
                    <p className="text-gray-700">{pathData.currentLevel}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths and Improvement Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">Your Strengths</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pathData.strengthAreas.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Improvement Areas */}
                <Card className="border-2 border-orange-200 bg-orange-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-600" />
                      <CardTitle className="text-lg">Focus Areas</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pathData.improvementAreas.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Learning Objectives */}
              <Card className="border-2 border-indigo-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-indigo-600" />
                    <CardTitle className="text-xl">Your Learning Objectives</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {pathData.learningObjectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-indigo-600">{idx + 1}</span>
                        </div>
                        <span className="text-gray-700 flex-1">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Detailed Roadmap */}
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    <CardTitle className="text-xl">Your Detailed 8-Week Roadmap</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    A week-by-week breakdown of topics, skills, and activities
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {pathData.detailedRoadmap.map((phase, idx) => (
                      <div
                        key={idx}
                        className="relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200"
                      >
                        {/* Week Badge */}
                        <div className="absolute -top-3 -left-3 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">{idx + 1}</span>
                        </div>

                        {/* Header */}
                        <div className="mb-4 pl-8">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{phase.title}</h3>
                            <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full whitespace-nowrap">
                              {phase.week}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Focus: {phase.topics[0]}</p>
                        </div>

                        {/* Topics */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Topics to Cover
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {phase.topics.map((topic, tIdx) => (
                              <li key={tIdx} className="text-gray-700 text-sm flex items-start gap-2">
                                <span className="text-purple-600 mt-1">•</span>
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Skills to Develop
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {phase.skills.map((skill, sIdx) => (
                              <li key={sIdx} className="text-gray-700 text-sm flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{skill}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Activities */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Practice Activities
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {phase.activities.map((activity, aIdx) => (
                              <li key={aIdx} className="text-gray-700 text-sm flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{activity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Milestone */}
                        <div className="mt-4 p-3 bg-white rounded-lg border-2 border-purple-300">
                          <h4 className="text-sm font-semibold text-purple-900 mb-1 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Milestone
                          </h4>
                          <p className="text-sm text-gray-700">{phase.milestone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resources Preview */}
              {pathData.resources && pathData.resources.length > 0 && (
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Award className="w-6 h-6 text-blue-600" />
                      <CardTitle className="text-xl">
                        Recommended Resources ({pathData.resources.length})
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      We've curated {pathData.resources.length} resources specifically matched to your level
                    </p>
                    <div className="space-y-2">
                      {pathData.resources.slice(0, 3).map((resource, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <p className="font-medium text-gray-900">{resource.title}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {resource.difficulty}
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {resource.format}
                            </span>
                          </div>
                        </div>
                      ))}
                      {pathData.resources.length > 3 && (
                        <p className="text-sm text-gray-500 text-center pt-2">
                          + {pathData.resources.length - 3} more resources
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  size="lg"
                >
                  Back to Dashboard
                </Button>
                <Button
                  onClick={handleStartLearning}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <TrendingUp className="w-5 h-5" />
                  Start Your Learning Journey
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
