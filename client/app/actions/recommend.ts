"use server";

import { createClient } from "@/utils/supabase/server";
import type { UserState, IntentState } from "@/store/useAppStore";
import type { Resource } from "@/types/database.types";

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

export interface EnrichedResource extends Resource {
  ml_prediction?: {
    predicted_feedback: string;
    confidence_scores: {
      Perfect: number;
      "Too Hard": number;
      "Too Slow": number;
    };
  };
  ml_score?: number; // For sorting
}

interface MLPredictionRequest {
  grade_level: string;
  preferred_format: string;
  baseline_score: number;
  intent_goal: string;
  current_confidence: string;
  difficulty_level: string;
  format: string;
  subject: string;
  duration_minutes: number;
  completion_rate: number;
  target_grade: string;
}

interface MLPredictionResponse {
  predicted_feedback: string;
  confidence_scores: {
    Perfect: number;
    "Too Hard": number;
    "Too Slow": number;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const ML_API_URL =
  process.env.ML_API_URL || "http://127.0.0.1:8000/api/predict";
const ML_API_TIMEOUT = 5000; // 5 seconds timeout
const MAX_CANDIDATES = 10; // Limit candidates for ML scoring
const TOP_RESULTS = 5; // Return top 5 recommendations

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse duration string to minutes
 * Handles formats like "20 minutes", "1 hour", "45 min", etc.
 */
function parseDurationToMinutes(duration: string | null): number {
  if (!duration) return 30; // Default to 30 minutes

  const durationLower = duration.toLowerCase();

  // Extract numbers from the string
  const numbers = durationLower.match(/\d+/);
  if (!numbers) return 30;

  const value = parseInt(numbers[0], 10);

  // Check if it's hours
  if (durationLower.includes("hour") || durationLower.includes("hr")) {
    return value * 60;
  }

  // Otherwise assume minutes
  return value;
}

/**
 * Call ML API to get prediction for a single resource
 */
async function getPredictionFromML(
  payload: MLPredictionRequest,
): Promise<MLPredictionResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ML_API_TIMEOUT);

    const response = await fetch(ML_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`ML API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: MLPredictionResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("ML API request timeout");
      } else {
        console.error("ML API request failed:", error.message);
      }
    }
    return null;
  }
}

/**
 * Score resources using ML API
 */
async function scoreResourcesWithML(
  resources: Resource[],
  userProfile: UserState,
  intentData: IntentState,
): Promise<EnrichedResource[]> {
  const baseline_score = 75; // Default baseline score

  // Create prediction requests for all resources
  const predictionPromises = resources.map(async (resource) => {
    const payload: MLPredictionRequest = {
      grade_level: userProfile.grade_level || "Class 9",
      preferred_format: userProfile.preferred_format || "video",
      baseline_score: baseline_score,
      intent_goal: intentData.goal || "Daily Revision",
      current_confidence: intentData.confidence || "Average",
      difficulty_level: resource.difficulty || "Medium",
      format: resource.format || "video",
      subject: resource.subject,
      duration_minutes: parseDurationToMinutes(resource.estimated_time),
      completion_rate: 0, // New resource, not yet started
      target_grade:
        resource.target_grade || userProfile.grade_level || "Class 9",
    };

    const prediction = await getPredictionFromML(payload);

    // Enrich resource with ML prediction
    const enrichedResource: EnrichedResource = {
      ...resource,
      ml_prediction: prediction || undefined,
      ml_score: prediction
        ? prediction.confidence_scores.Perfect // Use "Perfect" confidence as score
        : 0,
    };

    return enrichedResource;
  });

  // Wait for all predictions to complete
  const enrichedResources = await Promise.all(predictionPromises);

  return enrichedResources;
}

/**
 * Sort resources by ML predictions
 * Priority: "Perfect" predictions first, sorted by confidence score
 */
function sortResourcesByML(resources: EnrichedResource[]): EnrichedResource[] {
  return resources.sort((a, b) => {
    const aPrediction = a.ml_prediction?.predicted_feedback;
    const bPrediction = b.ml_prediction?.predicted_feedback;
    const aScore = a.ml_score || 0;
    const bScore = b.ml_score || 0;

    // Resources with "Perfect" prediction come first
    if (aPrediction === "Perfect" && bPrediction !== "Perfect") return -1;
    if (aPrediction !== "Perfect" && bPrediction === "Perfect") return 1;

    // If both are "Perfect" or both are not, sort by confidence score
    return bScore - aScore;
  });
}

/**
 * Fallback sorting when ML is unavailable
 */
function fallbackSort(
  resources: Resource[],
  userProfile: UserState,
): Resource[] {
  return resources.sort((a, b) => {
    // Prioritize resources matching user's preferred format
    const aMatchesFormat = a.format === userProfile.preferred_format;
    const bMatchesFormat = b.format === userProfile.preferred_format;

    if (aMatchesFormat && !bMatchesFormat) return -1;
    if (!aMatchesFormat && bMatchesFormat) return 1;

    // Secondary sort by difficulty (Beginner -> Medium -> Advanced)
    const difficultyOrder = { Beginner: 1, Medium: 2, Advanced: 3 };
    const aDiff =
      difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 999;
    const bDiff =
      difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 999;

    return aDiff - bDiff;
  });
}

// ============================================================================
// MAIN RECOMMENDATION ENGINE
// ============================================================================

/**
 * Generate personalized learning path using ML-powered recommendations
 *
 * This function:
 * 1. Fetches candidate resources from Supabase
 * 2. Scores them using the local ML API
 * 3. Returns top-ranked resources
 *
 * Falls back to rule-based sorting if ML API is unavailable
 */
export async function generatePersonalizedPath(
  userProfile: UserState,
  intentData: IntentState,
): Promise<RecommendationResult> {
  try {
    // ========================================================================
    // STEP 1: VALIDATE INPUT
    // ========================================================================
    if (
      !intentData.subject ||
      !intentData.confidence ||
      !userProfile.grade_level
    ) {
      return {
        success: false,
        error:
          "Missing required data. Please complete your profile and intent assessment.",
      };
    }

    console.log("🎯 Generating personalized path for:", {
      grade: userProfile.grade_level,
      subject: intentData.subject,
      confidence: intentData.confidence,
      goal: intentData.goal,
    });

    // ========================================================================
    // STEP 2: FETCH CANDIDATE RESOURCES FROM SUPABASE
    // ========================================================================
    const supabase = await createClient();

    let query = supabase
      .from("resources")
      .select("*")
      .eq("target_grade", userProfile.grade_level)
      .eq("subject", intentData.subject)
      .limit(MAX_CANDIDATES); // Limit for faster ML scoring

    // Adaptive difficulty filtering based on confidence level
    if (intentData.confidence === "Weak") {
      query = query.in("difficulty", ["Beginner", "Medium"]);
    } else if (intentData.confidence === "Average") {
      query = query.in("difficulty", ["Medium", "Advanced"]);
    } else if (intentData.confidence === "Strong") {
      query = query.eq("difficulty", "Advanced");
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error("❌ Database query error:", error);
      return {
        success: false,
        error: "Failed to fetch learning resources. Please try again.",
      };
    }

    if (!resources || resources.length === 0) {
      console.log("⚠️ No resources found for criteria");
      return {
        success: true,
        resources: [],
        mlEnabled: false,
      };
    }

    console.log(`✅ Found ${resources.length} candidate resources`);

    // ========================================================================
    // STEP 3: SCORE RESOURCES USING ML API
    // ========================================================================
    let enrichedResources: EnrichedResource[];
    let mlEnabled = false;

    try {
      console.log("🤖 Scoring resources with ML API...");
      enrichedResources = await scoreResourcesWithML(
        resources,
        userProfile,
        intentData,
      );

      // Check if at least one resource got ML predictions
      const mlSuccessCount = enrichedResources.filter(
        (r) => r.ml_prediction,
      ).length;
      mlEnabled = mlSuccessCount > 0;

      if (mlEnabled) {
        console.log(
          `✅ ML scoring successful: ${mlSuccessCount}/${resources.length} resources scored`,
        );
      } else {
        console.log("⚠️ ML API unavailable, using fallback sorting");
      }
    } catch (mlError) {
      console.error("❌ ML scoring failed:", mlError);
      enrichedResources = resources as EnrichedResource[];
      mlEnabled = false;
    }

    // ========================================================================
    // STEP 4: SORT AND FILTER RESULTS
    // ========================================================================
    let sortedResources: EnrichedResource[];

    if (mlEnabled) {
      // Sort by ML predictions
      sortedResources = sortResourcesByML(enrichedResources);
      console.log("📊 Resources sorted by ML predictions");
    } else {
      // Fallback to rule-based sorting
      sortedResources = fallbackSort(
        enrichedResources,
        userProfile,
      ) as EnrichedResource[];
      console.log("📊 Resources sorted by fallback rules");
    }

    // Return top N results
    const topResources = sortedResources.slice(0, TOP_RESULTS);

    console.log(`🎉 Returning top ${topResources.length} recommendations`);

    return {
      success: true,
      resources: topResources,
      mlEnabled,
    };
  } catch (error) {
    console.error("❌ Recommendation engine error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

// ============================================================================
// LEGACY FUNCTION (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use generatePersonalizedPath instead
 */
export async function generateLearningPath(
  intentData: IntentState,
  userProfile: UserState,
): Promise<RecommendationResult> {
  return generatePersonalizedPath(userProfile, intentData);
}
