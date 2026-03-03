'use client';

import { useState } from 'react';
import FamilyCompanion from '@/components/FamilyCompanion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import type { AvatarSelection } from '@/types/database.types';

export default function Phase2DemoPage() {
  const { user, intent, setUser, setIntent, clearSession } = useAppStore();
  const [avatarType, setAvatarType] = useState<AvatarSelection>('tech_bot');
  const [progress, setProgress] = useState(33);

  const handleSetUser = () => {
    setUser({
      id: 'demo-user-123',
      name: 'Demo Student',
      grade_level: 'Class 9',
      preferred_format: 'video',
      avatar_selection: avatarType,
    });
    toast.success('User state updated!');
  };

  const handleSetIntent = () => {
    setIntent({
      subject: 'Mathematics',
      goal: 'Board Exam Prep',
      confidence: 'Average',
    });
    toast.success('Intent state updated!');
  };

  const handleClearSession = () => {
    clearSession();
    toast.info('Session cleared!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Phase 2 Demo: Components & State
          </h1>
          <p className="text-gray-600">
            Testing Zustand Store, shadcn/ui Components, and FamilyCompanion
          </p>
        </div>

        {/* Zustand Store Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Zustand Store Demo</CardTitle>
            <CardDescription>
              Test the global state management with user and intent states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">User State:</h3>
                <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Intent State:</h3>
                <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(intent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSetUser}>Set User</Button>
              <Button onClick={handleSetIntent} variant="secondary">
                Set Intent
              </Button>
              <Button onClick={handleClearSession} variant="destructive">
                Clear Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Companion Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar Companion Component</CardTitle>
            <CardDescription>
              Interactive learning companions with floating animations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Avatar:</label>
              <Select
                value={avatarType}
                onValueChange={(value) => setAvatarType(value as AvatarSelection)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech_bot">Tech Bot</SelectItem>
                  <SelectItem value="explorer">Explorer</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <FamilyCompanion
                studentState="starting"
                defaultCompanion="sibling"
              />
            </div>
          </CardContent>
        </Card>

        {/* shadcn/ui Components Demo */}
        <Card>
          <CardHeader>
            <CardTitle>shadcn/ui Components</CardTitle>
            <CardDescription>
              Button, Input, Select, Dialog, Progress, and Toast components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buttons */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Buttons:</h3>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Input:</h3>
              <Input placeholder="Enter your name..." className="max-w-sm" />
            </div>

            {/* Select */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Select:</h3>
              <Select>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Choose your grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class6">Class 6</SelectItem>
                  <SelectItem value="class7">Class 7</SelectItem>
                  <SelectItem value="class8">Class 8</SelectItem>
                  <SelectItem value="class9">Class 9</SelectItem>
                  <SelectItem value="class10">Class 10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Progress:</h3>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="max-w-sm" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  -10%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProgress(Math.min(100, progress + 10))}
                >
                  +10%
                </Button>
              </div>
            </div>

            {/* Dialog */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Dialog:</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Welcome to VidyaMitra!</DialogTitle>
                    <DialogDescription>
                      This is a modal dialog component. It can be used for intent
                      assessment, confirmations, and more.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-gray-600">
                      Dialog content goes here. You can add forms, buttons, or any
                      other content.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Toast */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Toast Notifications:</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => toast.success('Success! Operation completed.')}
                >
                  Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.error('Error! Something went wrong.')}
                >
                  Error Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info('Info: Here is some information.')}
                >
                  Info Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.warning('Warning! Please be careful.')}
                >
                  Warning Toast
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Color Palette</CardTitle>
            <CardDescription>
              Vibrant, high-contrast colors for Class 6-10 students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-primary" />
                <p className="text-xs font-medium">Primary (Indigo)</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-secondary" />
                <p className="text-xs font-medium">Secondary (Purple)</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-accent" />
                <p className="text-xs font-medium">Accent (Blue)</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-destructive" />
                <p className="text-xs font-medium">Destructive (Red)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button asChild variant="outline">
            <a href="/">← Back to Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
