'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { onboardingSchema, type OnboardingFormData } from '@/lib/validations/onboarding';

export async function completeOnboarding(data: OnboardingFormData) {
  try {
    // Validate data
    const validatedData = onboardingSchema.parse(data);

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Not authenticated' };
    }

    // Update user profile in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: validatedData.name,
        grade_level: validatedData.grade_level,
        preferred_format: validatedData.preferred_format,
        avatar_selection: validatedData.avatar_selection,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return { error: 'Failed to update profile. Please try again.' };
    }

    // Revalidate paths
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard');

    // Return success with user data for Zustand update
    return {
      success: true,
      user: {
        id: user.id,
        name: validatedData.name,
        grade_level: validatedData.grade_level,
        preferred_format: validatedData.preferred_format,
        avatar_selection: validatedData.avatar_selection,
      },
    };
  } catch (error) {
    console.error('Onboarding error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function updateUserProfile(data: {
  name: string;
  email?: string;
  grade_level: string;
  preferred_format: string;
  family_companion: string;
}) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Not authenticated' };
    }

    const currentEmail = user.email;
    const emailChanged = data.email && currentEmail !== data.email;

    // Update email in auth if changed and provided
    if (emailChanged && data.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (emailError) {
        console.error('Email update error:', emailError);
        return { error: 'Failed to update email. Please try again.' };
      }
    }

    // Update user profile in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: data.name,
        grade_level: data.grade_level,
        preferred_format: data.preferred_format,
        avatar_selection: data.family_companion, // Store family companion in avatar_selection field
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { error: 'Failed to update profile. Please try again.' };
    }

    // Revalidate paths
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard');
    revalidatePath('/settings');

    // Return success with user data for Zustand update
    return {
      success: true,
      emailChanged: !!emailChanged,
      user: {
        id: user.id,
        name: data.name,
        grade_level: data.grade_level,
        preferred_format: data.preferred_format,
        avatar_selection: data.family_companion, // Map to avatar_selection for compatibility
      },
    };
  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
