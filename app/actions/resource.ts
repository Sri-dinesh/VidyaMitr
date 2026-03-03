'use server';

import { createClient } from '@/utils/supabase/server';
import type { Resource } from '@/types/database.types';

export interface ResourceResult {
  success: boolean;
  resource?: Resource;
  error?: string;
}

export interface FeedbackResult {
  success: boolean;
  recommendedResource?: Resource;
  message?: string;
  error?: string;
}

export interface ProgressionResult {
  success: boolean;
  nextResource?: Resource;
  message?: string;
  error?: string;
}

/**
 * Fetch a single resource by ID
 */
export async function getResourceById(resourceId: string): Promise<ResourceResult> {
  try {
    const supabase = await createClient();

    const { data: resource, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (error) {
      console.error('Error fetching resource:', error);
      return {
        success: false,
        error: 'Resource not found',
      };
    }

    return {
      success: true,
      resource,
    };
  } catch (error) {
    console.error('Unexpected error fetching resource:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Handle user feedback on a resource
 * Test Case 2: If "Too Slow" is clicked, recommend a faster-paced, higher-difficulty resource
 */
export async function handleFeedback(
  userId: string,
  resourceId: string,
  feedbackType: 'too_slow' | 'too_hard' | 'perfect'
): Promise<FeedbackResult> {
  try {
    const supabase = await createClient();

    // Log the feedback in session_logs
    const { error: logError } = await supabase.from('session_logs').insert({
      user_id: userId,
      action_type: 'resource_feedback',
      resource_id: resourceId,
      details: { feedbackType },
    });

    if (logError) {
      console.error('Error logging feedback:', logError);
      // Don't fail the entire operation if logging fails
    }

    // Handle "Too Slow" feedback - recommend faster pace
    if (feedbackType === 'too_slow') {
      // Get the current resource to understand context
      const { data: currentResource } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single();

      if (currentResource) {
        // Find a higher difficulty resource in the same subject
        const { data: fasterResource } = await supabase
          .from('resources')
          .select('*')
          .eq('subject', currentResource.subject)
          .eq('target_grade', currentResource.target_grade)
          .in('difficulty', ['Medium', 'Advanced'])
          .neq('id', resourceId)
          .limit(1)
          .single();

        return {
          success: true,
          recommendedResource: fasterResource || undefined,
          message: 'Adjusted to faster pace as per your feedback',
        };
      }
    }

    // Handle "Too Hard" feedback
    if (feedbackType === 'too_hard') {
      return {
        success: true,
        message: 'We have noted this. Consider reviewing foundational concepts first.',
      };
    }

    // Handle "Perfect" feedback
    return {
      success: true,
      message: 'Great! Keep up the excellent work!',
    };
  } catch (error) {
    console.error('Error handling feedback:', error);
    return {
      success: false,
      error: 'Failed to process feedback',
    };
  }
}

/**
 * Handle progression when user marks resource as 80% complete
 * Test Case 3: Display next resource with enrollment link and certificate eligibility
 */
export async function handleProgression(
  userId: string,
  currentResourceId: string
): Promise<ProgressionResult> {
  try {
    const supabase = await createClient();

    // Log the completion in session_logs
    const { error: logError } = await supabase.from('session_logs').insert({
      user_id: userId,
      action_type: 'completed_module',
      resource_id: currentResourceId,
      details: { completion_percentage: 80 },
    });

    if (logError) {
      console.error('Error logging progression:', logError);
    }

    // Get the current resource to find the next logical step
    const { data: currentResource } = await supabase
      .from('resources')
      .select('*')
      .eq('id', currentResourceId)
      .single();

    if (!currentResource) {
      return {
        success: false,
        error: 'Current resource not found',
      };
    }

    // Find the next logical resource (higher difficulty in same subject)
    const difficultyOrder = { Beginner: 1, Medium: 2, Advanced: 3 };
    const currentDifficultyLevel =
      difficultyOrder[currentResource.difficulty as keyof typeof difficultyOrder] || 1;

    // Get next difficulty level
    const nextDifficulties = Object.entries(difficultyOrder)
      .filter(([_, level]) => level > currentDifficultyLevel)
      .map(([diff]) => diff);

    let nextResource = null;

    if (nextDifficulties.length > 0) {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('subject', currentResource.subject)
        .eq('target_grade', currentResource.target_grade)
        .in('difficulty', nextDifficulties)
        .neq('id', currentResourceId)
        .order('difficulty', { ascending: true })
        .limit(1)
        .single();

      nextResource = data;
    }

    // If no higher difficulty found, find any other resource in the same subject
    if (!nextResource) {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('subject', currentResource.subject)
        .eq('target_grade', currentResource.target_grade)
        .neq('id', currentResourceId)
        .limit(1)
        .single();

      nextResource = data;
    }

    return {
      success: true,
      nextResource: nextResource || undefined,
      message: 'Congratulations on completing this module!',
    };
  } catch (error) {
    console.error('Error handling progression:', error);
    return {
      success: false,
      error: 'Failed to process progression',
    };
  }
}
