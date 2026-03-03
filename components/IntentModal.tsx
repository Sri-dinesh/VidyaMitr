'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, BookCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

interface IntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
}

const goalOptions = [
  {
    value: 'Board Exam Prep',
    label: 'Board Exam Prep',
    description: 'Prepare for upcoming exams',
    icon: Target,
  },
  {
    value: 'Concept Revision',
    label: 'Concept Revision',
    description: 'Review and strengthen concepts',
    icon: TrendingUp,
  },
  {
    value: 'Homework Help',
    label: 'Homework Help',
    description: 'Get help with assignments',
    icon: BookCheck,
  },
];

const confidenceOptions = [
  {
    value: 'Weak',
    label: 'Weak',
    description: 'Need to start from basics',
    emoji: '😰',
  },
  {
    value: 'Average',
    label: 'Average',
    description: 'Know some concepts',
    emoji: '😊',
  },
  {
    value: 'Strong',
    label: 'Strong',
    description: 'Confident in this subject',
    emoji: '💪',
  },
];

export function IntentModal({ isOpen, onClose, subject }: IntentModalProps) {
  const router = useRouter();
  const { setIntent } = useAppStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedGoal || !selectedConfidence) {
      toast.error('Please select both goal and confidence level');
      return;
    }

    // Update Zustand store with intent
    setIntent({
      subject,
      goal: selectedGoal,
      confidence: selectedConfidence,
    });

    toast.success(`Great! Let's create your ${subject} learning path!`);

    // Navigate to learning path page
    router.push('/path');
  };

  const handleClose = () => {
    setSelectedGoal(null);
    setSelectedConfidence(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Let's personalize your {subject} journey
          </DialogTitle>
          <DialogDescription>
            Answer these quick questions to get the best learning path for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question 1: Goal */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              What's your goal today?
            </h3>
            <div className="grid gap-3">
              {goalOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedGoal === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedGoal(option.value)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200
                      text-left flex items-start gap-4
                      ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-offset-2'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-indigo-600' : 'bg-gray-200'}
                      `}
                    >
                      <Icon
                        className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Confidence */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              How confident are you feeling in {subject}?
            </h3>
            <div className="grid gap-3">
              {confidenceOptions.map((option) => {
                const isSelected = selectedConfidence === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedConfidence(option.value)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200
                      text-left flex items-start gap-4
                      ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-offset-2'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="text-3xl flex-shrink-0">{option.emoji}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedGoal || !selectedConfidence}
            className="flex-1"
          >
            Create My Learning Path →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
