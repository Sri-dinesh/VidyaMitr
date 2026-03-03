'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, User, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { updateUserProfile } from '@/app/actions/user';
import { settingsSchema, type SettingsFormData } from '@/lib/validations/settings';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user.name || '',
      email: '',
      grade_level: user.grade_level || 'Class 6',
      preferred_format: user.preferred_format || 'video',
      family_companion: (user.avatar_selection as any) || 'mother',
    },
  });

  const selectedCompanion = watch('family_companion');
  const selectedFormat = watch('preferred_format');

  useEffect(() => {
    // Redirect if not authenticated
    if (!user.id) {
      router.push('/login');
      return;
    }

    // Pre-fill form with user data
    if (user.name) setValue('name', user.name);
    if (user.grade_level) setValue('grade_level', user.grade_level);
    if (user.preferred_format) setValue('preferred_format', user.preferred_format);
    if (user.avatar_selection) setValue('family_companion', user.avatar_selection as any);
  }, [user, router, setValue]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);

    try {
      const result = await updateUserProfile(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Update Zustand store with new values
      if (result.user) {
        setUser({
          id: user.id,
          name: result.user.name,
          grade_level: result.user.grade_level as any,
          preferred_format: result.user.preferred_format as any,
          avatar_selection: result.user.avatar_selection as any,
        });
      }

      // Show appropriate success message
      if (result.emailChanged) {
        toast.success(
          'Profile updated! If you changed your email, please check your inbox to confirm.'
        );
      } else {
        toast.success('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const companionOptions = [
    {
      value: 'mother',
      label: 'Mom',
      image: 'https://img.icons8.com/external-flat-icons-maxicons/68/external-mother-avatar-flat-icons-maxicons.png',
      description: 'Nurturing & Empathetic support',
      color: 'pink',
    },
    {
      value: 'father',
      label: 'Dad', 
      image: 'https://img.icons8.com/external-flat-icons-maxicons/68/external-father-avatar-flat-icons-maxicons.png',
      description: 'Guiding & Proud mentor',
      color: 'blue',
    },
    {
      value: 'sibling',
      label: 'Sibling',
      image: 'https://img.icons8.com/external-flat-icons-maxicons/68/external-sibling-avatar-flat-icons-maxicons.png',
      description: 'Fun & Challenging companion',
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.back()} variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <SettingsIcon className="w-10 h-10 text-indigo-600" />
                  Settings
                </h1>
                <p className="text-gray-600 mt-1">Manage your profile and learning preferences</p>
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal" className="gap-2">
                  <User className="w-4 h-4" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Learning Preferences
                </TabsTrigger>
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-6 mt-6">
                <Card className="border-2 border-indigo-200">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your name and email address
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        {...register('name')}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email Field - Optional */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address (Optional)
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email (optional)"
                        {...register('email')}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600">{errors.email.message}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Only provide if you want to change your email address
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Learning Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6 mt-6">
                {/* Grade Level */}
                <Card className="border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle>Grade Level</CardTitle>
                    <CardDescription>Select your current grade</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={watch('grade_level')}
                      onValueChange={(value) => setValue('grade_level', value as any)}
                    >
                      <SelectTrigger className="w-full">
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
                      <p className="text-sm text-red-600 mt-2">{errors.grade_level.message}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Preferred Format */}
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle>Preferred Learning Format</CardTitle>
                    <CardDescription>
                      Choose how you like to learn best
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setValue('preferred_format', 'video')}
                        className={`
                          p-6 rounded-xl border-2 transition-all duration-200
                          hover:scale-105 hover:shadow-lg
                          ${
                            selectedFormat === 'video'
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                              : 'border-gray-200 bg-white hover:border-indigo-300'
                          }
                        `}
                      >
                        <div className="text-center space-y-2">
                          <div className="text-4xl">📹</div>
                          <h3 className="font-semibold text-gray-900">Video</h3>
                          <p className="text-sm text-gray-600">
                            Learn through visual content
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setValue('preferred_format', 'text')}
                        className={`
                          p-6 rounded-xl border-2 transition-all duration-200
                          hover:scale-105 hover:shadow-lg
                          ${
                            selectedFormat === 'text'
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                              : 'border-gray-200 bg-white hover:border-indigo-300'
                          }
                        `}
                      >
                        <div className="text-center space-y-2">
                          <div className="text-4xl">📄</div>
                          <h3 className="font-semibold text-gray-900">Text</h3>
                          <p className="text-sm text-gray-600">
                            Learn through reading
                          </p>
                        </div>
                      </button>
                    </div>
                    {errors.preferred_format && (
                      <p className="text-sm text-red-600 mt-2">
                        {errors.preferred_format.message}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Family Companion Selection */}
                <Card className="border-2 border-green-200">
                  <CardHeader>
                    <CardTitle>Family Learning Companion</CardTitle>
                    <CardDescription>
                      Choose your family member who will support your learning journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {companionOptions.map((companion) => (
                        <button
                          key={companion.value}
                          type="button"
                          onClick={() => setValue('family_companion', companion.value as any)}
                          className={`
                            p-6 rounded-xl border-2 transition-all duration-200
                            hover:scale-105 hover:shadow-lg
                            ${
                              selectedCompanion === companion.value
                                ? `border-${companion.color}-500 bg-${companion.color}-50 ring-2 ring-${companion.color}-300`
                                : 'border-gray-200 bg-white hover:border-indigo-300'
                            }
                          `}
                        >
                          <div className="text-center space-y-3">
                            <img 
                              src={companion.image} 
                              alt={companion.label}
                              className="w-16 h-16 mx-auto rounded-full"
                              onError={(e) => {
                                // Fallback to emoji if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLDivElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                            <div 
                              className="text-5xl hidden"
                              style={{ display: 'none' }}
                            >
                              {companion.value === 'mother' ? '👩' : 
                               companion.value === 'father' ? '👨' : '🧑'}
                            </div>
                            <h3 className="font-semibold text-gray-900">{companion.label}</h3>
                            <p className="text-xs text-gray-600">{companion.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.family_companion && (
                      <p className="text-sm text-red-600 mt-2">
                        {errors.family_companion.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="mt-6">
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
