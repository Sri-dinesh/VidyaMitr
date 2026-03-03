import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

/**
 * Admin Layout - Protects all /admin routes
 * 
 * Security:
 * 1. Checks if user is authenticated
 * 2. Verifies user has is_admin = true in profiles table
 * 3. Redirects unauthorized users to dashboard
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Step 1: Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in - redirect to login page
    redirect('/login');
  }

  // Step 2: Check if user has admin role
  const { data: user_profile, error } = await supabase
    .from('users')
    .select('is_admin, name, grade_level')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    redirect('/dashboard');
  }

  // Step 3: Verify admin status
  if (!user_profile?.is_admin) {
    console.warn(`Unauthorized admin access attempt by: ${user.email}`);
    redirect('/dashboard');
  }

  // User is authenticated and authorized - render admin content
  return <>{children}</>;
}
