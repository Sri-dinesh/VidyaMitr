'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookCheck, MessageSquare, AlertTriangle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { checkAdminAccess, getAdminAnalytics, getEscalationCases } from '@/app/actions/admin';
import type { AdminAnalytics, EscalationCase } from '@/app/actions/admin';
import LMSIntegrationPanel from '@/components/LMSIntegrationPanel';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [escalations, setEscalations] = useState<EscalationCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const hasAccess = await checkAdminAccess();
      setIsAuthorized(hasAccess);

      if (!hasAccess) {
        setIsLoading(false);
        return;
      }

      // Fetch analytics and escalations
      try {
        const [analyticsResult, escalationsResult] = await Promise.all([
          getAdminAnalytics(),
          getEscalationCases(),
        ]);

        if (analyticsResult.success && analyticsResult.analytics) {
          setAnalytics(analyticsResult.analytics);
        } else {
          setError(analyticsResult.error || 'Failed to load analytics');
        }

        if (escalationsResult.success && escalationsResult.escalations) {
          setEscalations(escalationsResult.escalations);
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  // Unauthorized access
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">
              You do not have permission to access the admin portal.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-1/4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Error Loading Data</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const feedbackChartData = analytics
    ? [
        { name: 'Perfect', value: analytics.feedbackBreakdown.perfect, color: '#10B981' },
        { name: 'Too Hard', value: analytics.feedbackBreakdown.too_hard, color: '#EF4444' },
        { name: 'Too Slow', value: analytics.feedbackBreakdown.too_slow, color: '#F59E0B' },
      ]
    : [];

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-10 h-10 text-indigo-600" />
                Admin Portal
              </h1>
              <p className="text-gray-600 mt-2">
                Analytics, Session Logs, and Educator Escalations
              </p>
            </div>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Active Learners */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Active Learners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">
                  {analytics?.totalActiveLearners || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Unique users in system</p>
              </CardContent>
            </Card>

            {/* Path Completion Rate */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <BookCheck className="w-4 h-4" />
                  Path Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  {analytics
                    ? Math.round(
                        (analytics.totalModulesCompleted /
                          Math.max(analytics.totalActiveLearners, 1)) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {analytics?.totalModulesCompleted || 0} modules completed
                </p>
              </CardContent>
            </Card>

            {/* AI Accuracy Score */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  AI Accuracy Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-600">70%</div>
                <p className="text-xs text-gray-600 mt-1">Random Forest ML model</p>
              </CardContent>
            </Card>

            {/* Active Escalations */}
            <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Active Escalations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600">{escalations.length}</div>
                <p className="text-xs text-gray-600 mt-1">Students needing help</p>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Breakdown Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle>Feedback Distribution</CardTitle>
                <CardDescription>Breakdown of user feedback types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feedbackChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8">
                      {feedbackChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle>Feedback Ratio</CardTitle>
                <CardDescription>Proportional view of feedback types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feedbackChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feedbackChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* LMS Integration Panel */}
          <LMSIntegrationPanel />

          {/* Escalation Hub */}
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    Educator Escalations
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Students who have logged "Too Hard" feedback more than 3 times
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-600">{escalations.length}</div>
                  <p className="text-xs text-gray-600">Cases requiring attention</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {escalations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Escalations Required
                  </h3>
                  <p className="text-gray-600">
                    All students are progressing well. No intervention needed at this time.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border-2 border-red-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-100">
                        <TableHead className="font-bold">Student Name</TableHead>
                        <TableHead className="font-bold">Grade Level</TableHead>
                        <TableHead className="font-bold">Subject</TableHead>
                        <TableHead className="font-bold">Resource</TableHead>
                        <TableHead className="font-bold text-center">
                          Feedback Count
                        </TableHead>
                        <TableHead className="font-bold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {escalations.map((escalation) => (
                        <TableRow key={escalation.userId} className="hover:bg-red-50">
                          <TableCell className="font-medium">{escalation.userName}</TableCell>
                          <TableCell>{escalation.gradeLevel}</TableCell>
                          <TableCell>{escalation.resourceSubject}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {escalation.resourceTitle}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full font-bold">
                              {escalation.feedbackCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 hover:bg-red-100"
                            >
                              Review Case
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}