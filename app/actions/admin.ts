'use server';

import { createClient } from '@/utils/supabase/server';
import type { SessionLog } from '@/types/database.types';

export interface AdminAnalytics {
  totalActiveLearners: number;
  totalModulesCompleted: number;
  feedbackBreakdown: {
    perfect: number;
    too_hard: number;
    too_slow: number;
  };
}

export interface EscalationCase {
  userId: string;
  userName: string;
  gradeLevel: string;
  resourceTitle: string;
  resourceSubject: string;
  feedbackCount: number;
}

export interface AdminDataResult {
  success: boolean;
  analytics?: AdminAnalytics;
  escalations?: EscalationCase[];
  error?: string;
}

/**
 * Check if the current user is an admin
 * Uses database-based role checking (is_admin column in profiles table)
 * Falls back to email whitelist if database check fails
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Primary method: Check is_admin column in users table
    const { data: user_profile, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!error && user_profile) {
      return user_profile.is_admin || false;
    }

    // Fallback method: Email whitelist (for backward compatibility)
    console.warn('Database admin check failed, using email whitelist fallback');
    const adminEmails = [
      'admin@test.com',
      'admin@vidyamitra.com',
      'admin@vidyamitr.com',
      'educator@test.com',
    ];
    
    return adminEmails.includes(user.email || '');
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

/**
 * Fetch analytics data from session_logs
 */
export async function getAdminAnalytics(): Promise<AdminDataResult> {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access',
      };
    }

    const supabase = await createClient();

    // Fetch all session logs
    const { data: logs, error } = await supabase
      .from('session_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching session logs:', error);
      return {
        success: false,
        error: 'Failed to fetch analytics data',
      };
    }

    if (!logs || logs.length === 0) {
      return {
        success: true,
        analytics: {
          totalActiveLearners: 0,
          totalModulesCompleted: 0,
          feedbackBreakdown: {
            perfect: 0,
            too_hard: 0,
            too_slow: 0,
          },
        },
        escalations: [],
      };
    }

    // Calculate analytics
    const uniqueUsers = new Set(logs.map((log) => log.user_id));
    const totalActiveLearners = uniqueUsers.size;

    const completedModules = logs.filter((log) => log.action_type === 'completed_module');
    const totalModulesCompleted = completedModules.length;

    // Feedback breakdown
    const feedbackLogs = logs.filter((log) => log.action_type === 'resource_feedback');
    const feedbackBreakdown = {
      perfect: 0,
      too_hard: 0,
      too_slow: 0,
    };

    feedbackLogs.forEach((log) => {
      const feedbackType = log.details?.feedbackType;
      if (feedbackType === 'perfect') feedbackBreakdown.perfect++;
      else if (feedbackType === 'too_hard') feedbackBreakdown.too_hard++;
      else if (feedbackType === 'too_slow') feedbackBreakdown.too_slow++;
    });

    return {
      success: true,
      analytics: {
        totalActiveLearners,
        totalModulesCompleted,
        feedbackBreakdown,
      },
    };
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Fetch escalation cases (students with >3 "Too Hard" feedback)
 */
export async function getEscalationCases(): Promise<AdminDataResult> {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized access',
      };
    }

    const supabase = await createClient();

    // Fetch all "Too Hard" feedback logs
    const { data: feedbackLogs, error: logsError } = await supabase
      .from('session_logs')
      .select('*')
      .eq('action_type', 'resource_feedback')
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching feedback logs:', logsError);
      return {
        success: false,
        error: 'Failed to fetch escalation data',
      };
    }

    if (!feedbackLogs || feedbackLogs.length === 0) {
      return {
        success: true,
        escalations: [],
      };
    }

    // Filter for "Too Hard" feedback and count by user
    const tooHardFeedback = feedbackLogs.filter(
      (log) => log.details?.feedbackType === 'too_hard'
    );

    // Group by user and count
    const userFeedbackCount: Record<string, { count: number; resourceIds: string[] }> = {};

    tooHardFeedback.forEach((log) => {
      if (!userFeedbackCount[log.user_id]) {
        userFeedbackCount[log.user_id] = { count: 0, resourceIds: [] };
      }
      userFeedbackCount[log.user_id].count++;
      if (log.resource_id && !userFeedbackCount[log.user_id].resourceIds.includes(log.resource_id)) {
        userFeedbackCount[log.user_id].resourceIds.push(log.resource_id);
      }
    });

    // Filter users with more than 3 "Too Hard" feedback
    const escalationUserIds = Object.entries(userFeedbackCount)
      .filter(([_, data]) => data.count > 3)
      .map(([userId, data]) => ({ userId, count: data.count, resourceIds: data.resourceIds }));

    if (escalationUserIds.length === 0) {
      return {
        success: true,
        escalations: [],
      };
    }

    // Fetch user details
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, grade_level')
      .in(
        'id',
        escalationUserIds.map((u) => u.userId)
      );

    if (usersError) {
      console.error('Error fetching user details:', usersError);
      return {
        success: false,
        error: 'Failed to fetch user details',
      };
    }

    // Fetch resource details for the most recent resource each user struggled with
    const resourceIds = escalationUserIds.flatMap((u) => u.resourceIds);
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('id, title, subject')
      .in('id', resourceIds);

    if (resourcesError) {
      console.error('Error fetching resource details:', resourcesError);
    }

    // Build escalation cases
    const escalations: EscalationCase[] = escalationUserIds.map((escalation) => {
      const user = users?.find((u) => u.id === escalation.userId);
      const resource = resources?.find((r) => escalation.resourceIds.includes(r.id));

      return {
        userId: escalation.userId,
        userName: user?.name || 'Unknown',
        gradeLevel: user?.grade_level || 'Unknown',
        resourceTitle: resource?.title || 'Unknown Resource',
        resourceSubject: resource?.subject || 'Unknown',
        feedbackCount: escalation.count,
      };
    });

    return {
      success: true,
      escalations,
    };
  } catch (error) {
    console.error('Error fetching escalation cases:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
