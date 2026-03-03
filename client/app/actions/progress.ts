'use server';

import { createClient } from '@/utils/supabase/server';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProgressResult {
  success: boolean;
  completed?: boolean;
  certificateGenerated?: boolean;
  certificateId?: string;
  error?: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  subject: string;
  goal: string;
  resources_completed: number;
  issued_date: string;
  certificate_data: {
    student_name: string;
    grade_level: string;
    completion_date: string;
  };
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Mark a resource as complete for the current user
 */
export async function markResourceAsComplete(
  resourceId: string,
  timeSpentMinutes: number = 0
): Promise<ProgressResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Use admin client for RLS bypass
    const { createAdminClient } = await import('@/utils/supabase/admin');
    const adminClient = createAdminClient();

    // Mark resource as complete using admin client
    const { data: progressData, error: progressError } = await adminClient
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          resource_id: resourceId,
          completed: true,
          completion_date: new Date().toISOString(),
          time_spent_minutes: timeSpentMinutes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,resource_id',
        }
      )
      .select()
      .single();

    if (progressError) {
      console.error('Error marking resource as complete:', progressError);
      return {
        success: false,
        error: 'Failed to update progress',
      };
    }

    console.log('✅ Resource marked as complete');

    // Get resource details to pass subject to certificate generation
    const { data: resourceData } = await supabase
      .from('resources')
      .select('subject')
      .eq('id', resourceId)
      .single();

    // Check if user completed all resources in their current path
    const certificateResult = await checkAndGenerateCertificate(
      user.id,
      resourceData?.subject
    );

    return {
      success: true,
      completed: true,
      certificateGenerated: certificateResult.generated,
      certificateId: certificateResult.certificateId,
    };
  } catch (error) {
    console.error('Error in markResourceAsComplete:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get user's progress for a specific resource
 */
export async function getResourceProgress(resourceId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting resource progress:', error);
    return null;
  }
}

/**
 * Get all completed resources for current user
 */
export async function getCompletedResources() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('*, resources(*)')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('completion_date', { ascending: false });

    if (error) {
      console.error('Error fetching completed resources:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCompletedResources:', error);
    return [];
  }
}

// ============================================================================
// CERTIFICATE GENERATION
// ============================================================================

/**
 * Check if user completed all resources in their path and generate certificate
 */
async function checkAndGenerateCertificate(
  userId: string,
  subject?: string
): Promise<{ generated: boolean; certificateId?: string }> {
  try {
    const supabase = await createClient();
    
    // Use admin client for RLS bypass
    const { createAdminClient } = await import('@/utils/supabase/admin');
    const adminClient = createAdminClient();

    // Get user's learning path for this subject
    const pathQuery = supabase
      .from('user_learning_paths')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (subject) {
      pathQuery.eq('subject', subject);
    }
    
    const { data: paths } = await pathQuery.limit(1);

    // Get completed resources for this subject
    const progressQuery = adminClient
      .from('user_progress')
      .select('resource_id, resources!inner(subject)')
      .eq('user_id', userId)
      .eq('completed', true);
    
    if (subject) {
      progressQuery.eq('resources.subject', subject);
    }
    
    const { data: completedProgress } = await progressQuery;
    const completedCount = completedProgress?.length || 0;

    let shouldGenerateCertificate = false;
    let certificateSubject = subject || 'General Studies';
    let goal = 'Learning Milestone';
    let totalResources = completedCount;

    if (paths && paths.length > 0) {
      // Has learning path - check if all resources completed
      const currentPath = paths[0];
      const resourceIds = currentPath.resource_ids || [];
      const completedIds = completedProgress?.map((p) => p.resource_id) || [];
      const allCompleted = resourceIds.every((id: string) => completedIds.includes(id));

      if (allCompleted) {
        shouldGenerateCertificate = true;
        certificateSubject = currentPath.subject;
        goal = currentPath.goal || 'Course Completion';
        totalResources = resourceIds.length;
      }
    } else {
      // No learning path - generate certificate after 3 resources in this subject
      if (completedCount >= 3) {
        shouldGenerateCertificate = true;
        totalResources = completedCount;
      }
    }

    if (!shouldGenerateCertificate) {
      console.log(`Progress in ${certificateSubject}: ${completedCount} resources completed`);
      return { generated: false };
    }

    // All resources completed! Generate certificate
    console.log(`🎉 Generating certificate for ${certificateSubject}...`);

    // Get user details
    const { data: userProfile } = await supabase
      .from('users')
      .select('name, grade_level')
      .eq('id', userId)
      .single();

    if (!userProfile) {
      return { generated: false };
    }

    // Check if certificate already exists for this subject
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('id')
      .eq('user_id', userId)
      .eq('subject', certificateSubject)
      .single();

    if (existingCert) {
      console.log('Certificate already exists');
      return { generated: false, certificateId: existingCert.id };
    }

    // Generate new certificate using admin client
    const { data: certificate, error: certError } = await adminClient
      .from('certificates')
      .insert({
        user_id: userId,
        subject: certificateSubject,
        goal: goal,
        resources_completed: totalResources,
        issued_date: new Date().toISOString(),
        certificate_data: {
          student_name: userProfile.name,
          grade_level: userProfile.grade_level,
          completion_date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
      })
      .select()
      .single();

    if (certError) {
      console.error('Error generating certificate:', certError);
      return { generated: false };
    }

    console.log('✅ Certificate generated successfully!');
    return { generated: true, certificateId: certificate.id };
  } catch (error) {
    console.error('Error in checkAndGenerateCertificate:', error);
    return { generated: false };
  }
}

/**
 * Get user's certificates
 */
export async function getUserCertificates(): Promise<Certificate[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .order('issued_date', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserCertificates:', error);
    return [];
  }
}

/**
 * Get a specific certificate by ID
 */
export async function getCertificateById(certificateId: string): Promise<Certificate | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching certificate:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCertificateById:', error);
    return null;
  }
}

// ============================================================================
// QUIZ RESULTS
// ============================================================================

/**
 * Save quiz results to session_logs
 */
export async function saveQuizResults(params: {
  userId: string;
  resourceId?: string;
  subject: string;
  topic: string;
  score: number;
  total: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Use admin client for RLS bypass
    const { createAdminClient } = await import('@/utils/supabase/admin');
    const adminClient = createAdminClient();

    const { error } = await adminClient.from('session_logs').insert({
      user_id: params.userId,
      resource_id: params.resourceId || null,
      action_type: 'completed_module',
      details: {
        event_type: 'quiz_completed',
        score: params.score,
        total: params.total,
        subject: params.subject,
        topic: params.topic,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('Error saving quiz results:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in saveQuizResults:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
