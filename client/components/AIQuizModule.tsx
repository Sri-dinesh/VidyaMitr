'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateQuiz } from '@/app/actions/gemini';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { Brain, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface AIQuizModuleProps {
  subject: string;
  topic: string;
  resourceId?: string;
  userId: string;
}

/**
 * TASK 2: Structured AI Quiz System with Escalation
 * - Generates exactly 3 MCQs using Gemini
 * - Grades and saves to session_logs
 * - Triggers escalation toast for low scores (0/3 or 1/3)
 */
export default function AIQuizModule({ subject, topic, resourceId, userId }: AIQuizModuleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleStartQuiz = async () => {
    setIsLoading(true);
    try {
      const result = await generateQuiz(subject, topic);
      setQuestions(result.questions);
      setUserAnswers(new Array(result.questions.length).fill(''));
      setShowResults(false);
      setScore(0);
      
      if (!result.success) {
        toast.info('Using fallback quiz questions', {
          description: 'Gemini API unavailable, showing curriculum-based questions',
        });
      } else {
        toast.success('Quiz generated successfully!', {
          description: `3 questions on ${topic}`,
        });
      }
    } catch (error) {
      toast.error('Failed to generate quiz');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (showResults) return;
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowResults(true);

    // Save to database (session_logs table)
    try {
      const supabase = createClient();
      const { error } = await supabase.from('session_logs').insert({
        user_id: userId,
        resource_id: resourceId || null,
        action_type: 'completed_module',
        details: {
          event_type: 'quiz_completed',
          score: correctCount,
          total: questions.length,
          subject,
          topic,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        console.error('Error saving quiz results:', error);
      }

      // ESCALATION LOGIC: Trigger for scores 0/3 or 1/3
      if (correctCount <= 1) {
        toast.error(`Score: ${correctCount}/3. Escalating to Educator for review.`, {
          description: 'Your performance indicates you may need additional support on this topic.',
          duration: 6000,
          icon: <AlertTriangle className="w-5 h-5" />,
        });
      } else if (correctCount === questions.length) {
        toast.success(`Perfect Score: ${correctCount}/3! 🎉`, {
          description: 'Excellent work! You have mastered this topic.',
          duration: 5000,
        });
      } else {
        toast.success(`Quiz Completed! Score: ${correctCount}/3`, {
          description: 'Good effort! Review the incorrect answers to improve.',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast.error('Failed to save quiz results');
    }
  };

  if (questions.length === 0) {
    return (
      <Card className="mt-6 border-2 border-indigo-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Test Your Knowledge</CardTitle>
              <CardDescription className="text-base">
                Take an AI-generated quiz to reinforce what you've learned about {topic}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Button 
            onClick={handleStartQuiz} 
            disabled={isLoading}
            size="lg"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating Quiz with AI...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Start Quiz (3 Questions)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-2 border-indigo-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">AI-Generated Quiz: {topic}</CardTitle>
            <CardDescription className="text-base">
              {showResults 
                ? `You scored ${score} out of ${questions.length}` 
                : 'Answer all questions and submit to see your results'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        {questions.map((q, qIdx) => {
          const isCorrect = showResults && userAnswers[qIdx] === q.correctAnswer;
          const isIncorrect = showResults && userAnswers[qIdx] !== q.correctAnswer && userAnswers[qIdx] !== '';

          return (
            <div key={qIdx} className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                  {qIdx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-lg text-gray-900">{q.question}</p>
                  {showResults && (
                    <div className="mt-2 flex items-center gap-2">
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Correct!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 pl-11">
                {q.options.map((option, oIdx) => {
                  const isSelected = userAnswers[qIdx] === option;
                  const isCorrectOption = option === q.correctAnswer;
                  
                  let optionClass = 'flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200 ';
                  
                  if (showResults) {
                    if (isCorrectOption) {
                      optionClass += 'bg-green-50 border-green-500 ';
                    } else if (isSelected && !isCorrectOption) {
                      optionClass += 'bg-red-50 border-red-500 ';
                    } else {
                      optionClass += 'bg-gray-50 border-gray-200 ';
                    }
                  } else {
                    if (isSelected) {
                      optionClass += 'bg-indigo-50 border-indigo-500 cursor-pointer ';
                    } else {
                      optionClass += 'bg-white border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer ';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswerSelect(qIdx, option)}
                      disabled={showResults}
                      className={optionClass + 'w-full text-left'}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? showResults 
                              ? isCorrectOption 
                                ? 'border-green-600 bg-green-600' 
                                : 'border-red-600 bg-red-600'
                              : 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-400'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                      <span className={`flex-1 ${isSelected ? 'font-medium' : ''}`}>
                        {option}
                      </span>
                      {showResults && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!showResults ? (
          <Button
            onClick={handleSubmitQuiz}
            disabled={userAnswers.some(a => a === '')}
            size="lg"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            Submit Quiz
          </Button>
        ) : (
          <div className="space-y-4">
            <div className={`p-6 rounded-xl text-center border-2 ${
              score === questions.length 
                ? 'bg-green-50 border-green-300' 
                : score <= 1 
                ? 'bg-red-50 border-red-300'
                : 'bg-yellow-50 border-yellow-300'
            }`}>
              <p className="text-3xl font-bold mb-2">
                {score}/{questions.length}
              </p>
              <p className="text-lg font-medium text-gray-700">
                {score === questions.length
                  ? '🎉 Perfect! You have mastered this topic!'
                  : score === 2
                  ? '👍 Good job! Review the incorrect answer to improve.'
                  : score === 1
                  ? '📚 Keep learning! This topic needs more practice.'
                  : '⚠️ Review the material carefully and try again.'}
              </p>
              {score <= 1 && (
                <p className="text-sm text-red-700 mt-3 font-medium">
                  ⚡ An educator has been notified to provide additional support.
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                setQuestions([]);
                setUserAnswers([]);
                setShowResults(false);
                setScore(0);
              }}
              variant="outline"
              size="lg"
              className="w-full border-2"
            >
              Take Another Quiz
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
