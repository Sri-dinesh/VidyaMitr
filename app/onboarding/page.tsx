'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Compass, GraduationCap, Loader2, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { completeOnboarding } from '@/app/actions/user';
import { onboardingSchema, type OnboardingFormData } from '@/lib/validations/onboarding';
import type { AvatarSelection, PreferredFormat } from '@/types/database.types';

const avatarOptions = [
  {
    value: 'tech_bot' as AvatarSelection,
    name: 'Tech Bot',
    icon: Bot,
    description: 'Your tech-savvy learning companion',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    hoverBg: 'hover:bg-blue-100',
    ringColor: 'ring-blue-500',
  },
  {
    value: 'explorer' as AvatarSelection,
    name: 'Explorer',
    icon: Compass,
    description: 'Adventure through learning together',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    hoverBg: 'hover:bg-purple-100',
    ringColor: 'ring-purple-500',
  },
  {
    value: 'mentor' as AvatarSelection,
    name: 'Mentor',
    icon: GraduationCap,
    description: 'Your wise guide on this journey',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    hoverBg: 'hover:bg-indigo-100',
    ringColor: 'ring-indigo-500',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      grade_level: undefined,
      preferred_format: undefined,
      avatar_selection: undefined,
    },
  });

  const watchedValues = watch();
  const progress = step === 1 ? 50 : 100;

  // Check if step 1 is complete
  const isStep1Complete =
    watchedValues.name &&
    watchedValues.name.length >= 2 &&
    watchedValues.grade_level &&
    watchedValues.preferred_format;

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);

    try {
      const result = await completeOnboarding(data);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      if (result.success && result.user) {
        // Update Zustand store
        setUser(result.user);
        toast.success('Profile completed! Welcome to VidyaMitra! 🎉');

        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to VidyaMitra! 🎓</h1>
          <p className="text-gray-600">Let's personalize your learning experience</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {step} of 2
            </span>
            <span className="text-sm text-gray-500">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="shadow-xl">
            <CardContent className="p-8">
              {/* Step 1: Profile Basics */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Tell us about yourself
                    </h2>
                    <p className="text-sm text-gray-600">
                      This helps us customize your learning journey
                    </p>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      What's your name? <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      {...register('name')}
                      className="text-lg py-6"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Grade Level Select */}
                  <div className="space-y-2">
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                      Which grade are you in? <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={watchedValues.grade_level}
                      onValueChange={(value) =>
                        setValue('grade_level', value as OnboardingFormData['grade_level'])
                      }
                    >
                      <SelectTrigger className="text-lg py-6">
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Class 6">Class 6</SelectItem>
                        <SelectItem value="Class 7">Class 7</SelectItem>
                        <SelectItem value="Class 8">Class 8</SelectItem>
                        <SelectItem value="Class 9">Class 9</SelectItem>
                        <SelectItem value="Class 10">Class 10</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.grade_level && (
                      <p className="text-sm text-red-600">{errors.grade_level.message}</p>
                    )}
                  </div>

                  {/* Preferred Format */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      How do you prefer to learn? <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setValue('preferred_format', 'video')}
                        className={`
                          relative p-6 rounded-xl border-2 transition-all duration-200
                          ${
                            watchedValues.preferred_format === 'video'
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-offset-2'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={`
                            w-12 h-12 rounded-full flex items-center justify-center
                            ${
                              watchedValues.preferred_format === 'video'
                                ? 'bg-indigo-600'
                                : 'bg-gray-200'
                            }
                          `}
                          >
                            <Video
                              className={`w-6 h-6 ${
                                watchedValues.preferred_format === 'video'
                                  ? 'text-white'
                                  : 'text-gray-600'
                              }`}
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">Videos</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Visual & interactive
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setValue('preferred_format', 'text')}
                        className={`
                          relative p-6 rounded-xl border-2 transition-all duration-200
                          ${
                            watchedValues.preferred_format === 'text'
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-offset-2'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={`
                            w-12 h-12 rounded-full flex items-center justify-center
                            ${
                              watchedValues.preferred_format === 'text'
                                ? 'bg-indigo-600'
                                : 'bg-gray-200'
                            }
                          `}
                          >
                            <FileText
                              className={`w-6 h-6 ${
                                watchedValues.preferred_format === 'text'
                                  ? 'text-white'
                                  : 'text-gray-600'
                              }`}
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">Notes</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Reading & writing
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                    {errors.preferred_format && (
                      <p className="text-sm text-red-600">{errors.preferred_format.message}</p>
                    )}
                  </div>

                  {/* Next Button */}
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Complete}
                    className="w-full py-6 text-lg"
                    size="lg"
                  >
                    Continue to Avatar Selection →
                  </Button>
                </div>
              )}

              {/* Step 2: Avatar Selection */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Choose your learning companion
                    </h2>
                    <p className="text-sm text-gray-600">
                      Your companion will guide you throughout your journey
                    </p>
                  </div>

                  {/* Avatar Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {avatarOptions.map((avatar) => {
                      const Icon = avatar.icon;
                      const isSelected = watchedValues.avatar_selection === avatar.value;

                      return (
                        <button
                          key={avatar.value}
                          type="button"
                          onClick={() => setValue('avatar_selection', avatar.value as any)}
                          className={`
                            relative p-6 rounded-xl border-2 transition-all duration-200
                            transform hover:scale-105
                            ${
                              isSelected
                                ? `${avatar.borderColor} ${avatar.bgColor} ring-2 ${avatar.ringColor} ring-offset-2 scale-105`
                                : `border-gray-200 ${avatar.hoverBg} hover:border-gray-300`
                            }
                          `}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div
                              className={`
                              w-16 h-16 rounded-full flex items-center justify-center
                              ${isSelected ? `bg-${avatar.color}-600` : 'bg-gray-200'}
                              transition-colors duration-200
                            `}
                            >
                              <Icon
                                className={`w-8 h-8 ${
                                  isSelected ? 'text-white' : 'text-gray-600'
                                }`}
                              />
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-gray-900">{avatar.name}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {avatar.description}
                              </p>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className={`w-6 h-6 rounded-full bg-${avatar.color}-600 flex items-center justify-center`}>
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
                  {errors.avatar_selection && (
                    <p className="text-sm text-red-600 text-center">
                      {errors.avatar_selection.message}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                      className="flex-1 py-6 text-lg"
                      size="lg"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!watchedValues.avatar_selection || isSubmitting}
                      className="flex-1 py-6 text-lg"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        'Complete Setup 🎉'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          You can always change these settings later in your profile
        </p>
      </div>
    </div>
  );
}
