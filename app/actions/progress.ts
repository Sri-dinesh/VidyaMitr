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

    // Mark resource as complete
    const { data: progressData, error: progressError } = await supabase
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

    // Check if user completed all resources in their current path
    const certificateResult = await checkAndGenerateCertificate(user.id);

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
  userId: string
): Promise<{ generated: boolean; certificateId?: string }> {
  try {
    const supabase = await createClient();

    // Get user's current learning path
    const { data: paths, error: pathError } = await supabase
      .from('user_learning_paths')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (pathError || !paths || paths.length === 0) {
      return { generated: false };
    }

    const currentPath = paths[0];
    const resourceIds = currentPath.resource_ids;

    // Get completed resources
    const { data: completedProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('resource_id')
      .eq('user_id', userId)
      .eq('completed', true)
      .in('resource_id', resourceIds);

    if (progressError) {
      return { generated: false };
    }

    const completedIds = completedProgress?.map((p) => p.resource_id) || [];

    // Check if all resources are completed
    const allCompleted = resourceIds.every((id: string) => completedIds.includes(id));

    if (!allCompleted) {
      console.log(
        `Progress: ${completedIds.length}/${resourceIds.length} resources completed`
      );
      return { generated: false };
    }

    // All resources completed! Generate certificate
    console.log('🎉 All resources completed! Generating certificate...');

    // Get user details
    const { data: userProfile } = await supabase
      .from('users')
      .select('name, grade_level')
      .eq('id', userId)
      .single();

    if (!userProfile) {
      return { generated: false };
    }

    // Check if certificate already exists for this path
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('id')
      .eq('user_id', userId)
      .eq('subject', currentPath.subject)
      .eq('goal', currentPath.goal)
      .single();

    if (existingCert) {
      console.log('Certificate already exists');
      return { generated: false, certificateId: existingCert.id };
    }

    // Generate new certificate
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        subject: currentPath.subject,
        goal: currentPath.goal,
        resources_completed: resourceIds.length,
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
