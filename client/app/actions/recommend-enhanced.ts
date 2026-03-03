'use server';

import { createClient } from '@/utils/supabase/server';
import type { UserState, IntentState } from '@/store/useAppStore';
import type { Resource } from '@/types/database.types';

// Import original functions
// Note: These functions are not exported from recommend.ts
// This file appears to be an alternative implementation that's not currently in use

// Re-define types locally since they're not exported
interface EnrichedResource extends Resource {
  ml_prediction?: {
    predicted_feedback: string;
    confidence_score: number;
  };
  relevance_score?: number;
}

interface MLPredictionRequest {
  grade_level: string;
  preferred_format: string;
  subject: string;
  confidence: string;
  resources: Array<{
    id: string;
    title: string;
    difficulty: string;
    format: string;
  }>;
}

interface MLPredictionResponse {
  recommendations: Array<{
    resource_id: string;
    predicted_feedback: string;
    confidence_score: number;
  }>;
}

// Stub implementations for functions not exported from recommend.ts
async function scoreResourcesWithML(
  resources: Resource[],
  userProfile: UserState,
  intentData: IntentState
): Promise<EnrichedResource[]> {
  // This is a stub - the actual implementation would call the ML API
  return resources as EnrichedResource[];
}

function sortResourcesByML(resources: EnrichedResource[]): EnrichedResource[] {
  // Sort by ML prediction confidence score
  return resources.sort((a, b) => {
    const scoreA = a.ml_prediction?.confidence_score || 0;
    const scoreB = b.ml_prediction?.confidence_score || 0;
    return scoreB - scoreA;
  });
}

function fallbackSort(resources: EnrichedResource[], userProfile: UserState): EnrichedResource[] {
  // Simple fallback sorting by difficulty and format preference
  return resources.sort((a, b) => {
    if (userProfile.preferred_format && a.format === userProfile.preferred_format) return -1;
    if (userProfile.preferred_format && b.format === userProfile.preferred_format) return 1;
    return 0;
  });
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RecommendationResult {
  success: boolean;
  resources?: EnrichedResource[];
  error?: string;
  mlEnabled?: boolean;
  cached?: boolean;
  pathId?: string;
}

interface CachedPath {
  id: string;
  resource_ids: string[];
  predicted_difficulty: string | null;
  ml_enabled: boolean;
  created_at: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_CANDIDATES = 10;
const TOP_RESULTS = 5;
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

// ============================================================================
// CACHING FUNCTIONS
// ============================================================================

/**
 * Check if a cached learning path exists for this user/subject/goal combination
 */
async function getCachedPath(
  userId: string,
  subject: string,
  goal: string,
  confidence: string
): Promise<CachedPath | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_learning_paths')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .eq('goal', goal)
      .eq('confidence_level', confidence)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if cache is still valid (within 24 hours)
    const createdAt = new Date(data.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > CACHE_EXPIRY_HOURS) {
      console.log('⏰ Cache expired, will generate new path');
      return null;
    }

    console.log('✅ Found cached learning path');
    return {
      id: data.id,
      resource_ids: data.resource_ids,
      predicted_difficulty: data.predicted_difficulty,
      ml_enabled: data.ml_enabled,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error fetching cached path:', error);
    return null;
  }
}

/**
 * Save learning path to cache
 */
async function saveLearningPath(
  userId: string,
  subject: string,
  goal: string,
  confidence: string,
  resourceIds: string[],
  predictedDifficulty: string | null,
  mlEnabled: boolean
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_learning_paths')
      .upsert(
        {
          user_id: userId,
          subject,
          goal,
          confidence_level: confidence,
          resource_ids: resourceIds,
          predicted_difficulty: predictedDifficulty,
          ml_enabled: mlEnabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,subject,goal,confidence_level',
        }
      )
      .select('id')
      .single();

    if (error) {
      console.error('Error saving learning path:', error);
      return null;
    }

    console.log('💾 Learning path saved to cache');
    return data.id;
  } catch (error) {
    console.error('Error saving learning path:', error);
    return null;
  }
}

/**
 * Fetch resources by IDs
 */
async function getResourcesByIds(resourceIds: string[]): Promise<Resource[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .in('id', resourceIds);

  if (error || !data) {
    console.error('Error fetching resources by IDs:', error);
    return [];
  }

  // Maintain the order from resourceIds
  const orderedResources = resourceIds
    .map((id) => data.find((r) => r.id === id))
    .filter((r): r is Resource => r !== undefined);

  return orderedResources;
}

// ============================================================================
// MAIN RECOMMENDATION ENGINE WITH CACHING
// ============================================================================

/**
 * Generate personalized learning path with caching
 * 
 * This function:
 * 1. Checks for cached path first
 * 2. If cache miss, generates new recommendations
 * 3. Saves new path to cache
 * 4. Returns top-ranked resources
 */
export async function generatePersonalizedPathWithCache(
  userProfile: UserState,
  intentData: IntentState
): Promise<RecommendationResult> {
  try {
    // ========================================================================
    // STEP 1: VALIDATE INPUT
    // ========================================================================
    if (!intentData.subject || !intentData.confidence || !userProfile.grade_level || !userProfile.id) {
      return {
        success: false,
        error: 'Missing required data. Please complete your profile and intent assessment.',
      };
    }

    console.log('🎯 Generating personalized path for:', {
      userId: userProfile.id,
      grade: userProfile.grade_level,
      subject: intentData.subject,
      confidence: intentData.confidence,
      goal: intentData.goal,
    });

    // ========================================================================
    // STEP 2: CHECK CACHE
    // ========================================================================
    const cachedPath = await getCachedPath(
      userProfile.id,
      intentData.subject,
      intentData.goal || 'Daily Revision',
      intentData.confidence
    );

    if (cachedPath && cachedPath.resource_ids.length > 0) {
      console.log('🚀 Using cached learning path');
      
      // Fetch resources from cache
      const resources = await getResourcesByIds(cachedPath.resource_ids);

      if (resources.length > 0) {
        return {
          success: true,
          resources: resources as EnrichedResource[],
          mlEnabled: cachedPath.ml_enabled,
          cached: true,
          pathId: cachedPath.id,
        };
      }
    }

    // ========================================================================
    // STEP 3: CACHE MISS - FETCH CANDIDATE RESOURCES
    // ========================================================================
    console.log('🔍 Cache miss, generating new path');
    
    const supabase = await createClient();

    let query = supabase
      .from('resources')
      .select('*')
      .eq('target_grade', userProfile.grade_level)
      .eq('subject', intentData.subject)
      .limit(MAX_CANDIDATES);

    // Adaptive difficulty filtering
    if (intentData.confidence === 'Weak') {
      query = query.in('difficulty', ['Beginner', 'Medium']);
    } else if (intentData.confidence === 'Average') {
      query = query.in('difficulty', ['Medium', 'Advanced']);
    } else if (intentData.confidence === 'Strong') {
      query = query.eq('difficulty', 'Advanced');
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error('❌ Database query error:', error);
      return {
        success: false,
        error: 'Failed to fetch learning resources. Please try again.',
      };
    }

    if (!resources || resources.length === 0) {
      console.log('⚠️ No resources found for criteria');
      return {
        success: true,
        resources: [],
        mlEnabled: false,
        cached: false,
      };
    }

    console.log(`✅ Found ${resources.length} candidate resources`);

    // ========================================================================
    // STEP 4: SCORE RESOURCES USING ML API
    // ========================================================================
    let enrichedResources: EnrichedResource[];
    let mlEnabled = false;

    try {
      console.log('🤖 Scoring resources with ML API...');
      enrichedResources = await scoreResourcesWithML(resources, userProfile, intentData);
      
      const mlSuccessCount = enrichedResources.filter(r => r.ml_prediction).length;
      mlEnabled = mlSuccessCount > 0;

      if (mlEnabled) {
        console.log(`✅ ML scoring successful: ${mlSuccessCount}/${resources.length} resources scored`);
      } else {
        console.log('⚠️ ML API unavailable, using fallback sorting');
      }
    } catch (mlError) {
      console.error('❌ ML scoring failed:', mlError);
      enrichedResources = resources as EnrichedResource[];
      mlEnabled = false;
    }

    // ========================================================================
    // STEP 5: SORT AND FILTER RESULTS
    // ========================================================================
    let sortedResources: EnrichedResource[];

    if (mlEnabled) {
      sortedResources = sortResourcesByML(enrichedResources);
      console.log('📊 Resources sorted by ML predictions');
    } else {
      sortedResources = fallbackSort(enrichedResources, userProfile) as EnrichedResource[];
      console.log('📊 Resources sorted by fallback rules');
    }

    const topResources = sortedResources.slice(0, TOP_RESULTS);

    // ========================================================================
    // STEP 6: SAVE TO CACHE
    // ========================================================================
    const resourceIds = topResources.map(r => r.id);
    const predictedDifficulty = mlEnabled && topResources[0]?.ml_prediction
      ? topResources[0].ml_prediction.predicted_feedback
      : null;

    const pathId = await saveLearningPath(
      userProfile.id,
      intentData.subject,
      intentData.goal || 'Daily Revision',
      intentData.confidence,
      resourceIds,
      predictedDifficulty,
      mlEnabled
    );

    console.log(`🎉 Returning top ${topResources.length} recommendations`);

    return {
      success: true,
      resources: topResources,
      mlEnabled,
      cached: false,
      pathId: pathId || undefined,
    };
  } catch (error) {
    console.error('❌ Recommendation engine error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Export for backward compatibility
export { generatePersonalizedPathWithCache as generatePersonalizedPath };
