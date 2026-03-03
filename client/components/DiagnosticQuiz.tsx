'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { generateDiagnosticQuiz, analyzeQuizAndGeneratePath } from '@/app/actions/diagnostic-quiz';
import { toast } from 'sonner';
import { Loader2, Brain, CheckCircle, XCircle } from 'lucide-react';

interface DiagnosticQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface DiagnosticQuizProps {
  subject: string;
  grade: string;
  userId: string;
  onComplete: (pathData: any) => void;
}

export default function DiagnosticQuiz({ subject, grade, userId, onComplete }: DiagnosticQuizProps) {
  const [stage, setStage] = useState<'intro' | 'quiz' | 'analyzing' | 'complete'>('intro');
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartQuiz = async () => {
    setIsLoading(true);
    try {
      const result = await generateDiagnosticQuiz(subject, grade);
      setQuestions(result.questions);
      setAnswers(new Array(result.questions.length).fill(-1));
      setStage('quiz');
      
      if (!result.success) {
        toast.info('Using diagnostic assessment questions');
      }
    } catch (error) {
      toast.error('Failed to generate diagnostic quiz');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      toast.error('Please select an answer');
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitQuiz(newAnswers);
    }
  };

  const handleSubmitQuiz = async (finalAnswers: number[]) => {
    setStage('analyzing');
    
    try {
      const pathData = await analyzeQuizAndGeneratePath(
        userId,
        subject,
        grade,
        finalAnswers,
        questions
      );

      setStage('complete');
      onComplete(pathData);
      
      if (!pathData.success) {
        toast.info('Generated personalized path with default recommendations');
      } else {
        toast.success('Your personalized learning path is ready!');
      }
    } catch (error) {
      console.error('Error analyzing quiz:', error);
      toast.error('Failed to generate learning path');
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Intro Stage
  if (stage === 'intro') {
    return (
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Diagnostic Assessment</CardTitle>
              <CardDescription className="text-base">
                Let's understand your current level in {subject}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border-2 border-indigo-200">
              <h3 className="font-semibold text-gray-900 mb-2">What to expect:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>5 carefully designed questions to assess your knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Questions cover different topics and difficulty levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Takes approximately 5-7 minutes to complete</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>AI will generate a personalized learning path based on your results</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Tip:</strong> Answer honestly to get the most accurate personalized recommendations. 
                There are no wrong answers - this helps us understand where you are in your learning journey!
              </p>
            </div>
          </div>

          <Button 
            onClick={handleStartQuiz} 
            disabled={isLoading}
            size="lg"
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Assessment...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Start Diagnostic Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Quiz Stage
  if (stage === 'quiz') {
    const currentQ = questions[currentQuestion];
    
    return (
      <Card className="border-2 border-indigo-200">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Question {currentQuestion + 1} of {questions.length}
              </CardTitle>
              <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                {currentQ.difficulty.charAt(0).toUpperCase() + currentQ.difficulty.slice(1)}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Topic: {currentQ.topic}</p>
              <p className="text-lg font-medium text-gray-900">{currentQ.question}</p>
            </div>

            <div className="space-y-3">
              {currentQ.options.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAnswer === idx
                      ? 'bg-indigo-50 border-indigo-500'
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={selectedAnswer === idx}
                    onChange={() => handleAnswerSelect(idx)}
                    className="w-5 h-5 mt-0.5 text-indigo-600"
                  />
                  <span className="flex-1 text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              {currentQuestion + 1} / {questions.length} completed
            </p>
            <Button 
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
              size="lg"
              className="gap-2"
            >
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Assessment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Analyzing Stage
  if (stage === 'analyzing') {
    return (
      <Card className="border-2 border-indigo-200">
        <CardContent className="p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Analyzing Your Results...</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Our AI is evaluating your responses and creating a personalized learning path 
              tailored specifically to your strengths and areas for improvement.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
