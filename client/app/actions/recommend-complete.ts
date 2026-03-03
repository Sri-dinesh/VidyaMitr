"use server";

/**
 * Two-Stage Recommendation Pipeline
 * ==================================
 * Stage 1: Candidate Generation (Supabase Query)
 * Stage 2: AI Scoring (FastAPI ML Model)
 * Stage 3: Ranking & Filtering
 * Stage 4: Return Top Results
 */

import { createClient } from "@/utils/supabase/server";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserProfile {
  grade_level: string;
  preferred_format?: string;
  baseline_score?: number;
}

export interface IntentData {
  subject: string;
  goal: string;
  confidence: "Weak" | "Average" | "Strong";
}

export interface Resource {
  id: string;
  title: string;
  subject: string;
  target_grade: string;
  difficulty: string;
  format: string;
  url: string;
  estimated_time: string;
  tags?: string[];
  board?: string;
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
  ml_score?: number;
}

export interface RecommendationResult {
  success: boolean;
  resources?: EnrichedResource[];
  error?: string;
  mlEnabled?: boolean;
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
const ML_API_TIMEOUT = 5000; // 5 seconds
const MAX_CANDIDATES = 15; // Limit candidates for ML scoring
const TOP_RESULTS = 5; // Return top 5 recommendations

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse duration string to minutes
 */
function parseDurationToMinutes(duration: string): number {
  if (!duration) return 30;

  const durationLower = duration.toLowerCase();
  const numbers = durationLower.match(/\d+/);

  if (!numbers) return 30;

  const value = parseInt(numbers[0], 10);

  if (durationLower.includes("hour") || durationLower.includes("hr")) {
    return value * 60;
  }

  return value;
}

/**
 * Call ML API for a single resource
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
 * Score resources using ML API (Stage 2)
 */
async function scoreResourcesWithML(
  resources: Resource[],
  userProfile: UserProfile,
  intentData: IntentData,
): Promise<EnrichedResource[]> {
  const baseline_score = userProfile.baseline_score || 75;
  const preferred_format = userProfile.preferred_format || "video";

  // Create prediction requests for all resources in parallel
  const predictionPromises = resources.map(async (resource) => {
    const payload: MLPredictionRequest = {
      grade_level: userProfile.grade_level,
      preferred_format: preferred_format,
      baseline_score: baseline_score,
      intent_goal: intentData.goal,
      current_confidence: intentData.confidence,
      difficulty_level: resource.difficulty,
      format: resource.format,
      subject: resource.subject,
      duration_minutes: parseDurationToMinutes(resource.estimated_time),
      completion_rate: 0, // New resource, not yet started
      target_grade: resource.target_grade,
    };

    const prediction = await getPredictionFromML(payload);

    // Enrich resource with ML prediction
    const enrichedResource: EnrichedResource = {
      ...resource,
      ml_prediction: prediction || undefined,
      ml_score: prediction ? prediction.confidence_scores.Perfect : 0,
    };

    return enrichedResource;
  });

  // Wait for all predictions to complete
  const enrichedResources = await Promise.all(predictionPromises);

  return enrichedResources;
}

/**
 * Sort resources by ML predictions (Stage 3)
 * Priority: "Perfect" predictions first, sorted by confidence score descending
 */
function sortResourcesByML(resources: EnrichedResource[]): EnrichedResource[] {
  return resources.sort((a, b) => {
    const aPrediction = a.ml_prediction?.predicted_feedback;
    const bPrediction = b.ml_prediction?.predicted_feedback;
    const aScore = a.ml_score || 0;
    const bScore = b.ml_score || 0;

    // "Perfect" predictions come first
    if (aPrediction === "Perfect" && bPrediction !== "Perfect") return -1;
    if (aPrediction !== "Perfect" && bPrediction === "Perfect") return 1;

    // If both are "Perfect" or both are not, sort by confidence score descending
    return bScore - aScore;
  });
}

/**
 * Fallback sorting when ML is unavailable
 */
function fallbackSort(
  resources: Resource[],
  userProfile: UserProfile,
  intentData: IntentData,
): Resource[] {
  const preferred_format = userProfile.preferred_format || "video";

  return resources.sort((a, b) => {
    // Prioritize resources matching user's preferred format
    const aMatchesFormat = a.format === preferred_format;
    const bMatchesFormat = b.format === preferred_format;

    if (aMatchesFormat && !bMatchesFormat) return -1;
    if (!aMatchesFormat && bMatchesFormat) return 1;

    // Map confidence to difficulty preference
    const difficultyOrder: Record<string, number> = {
      Beginner: 1,
      Medium: 2,
      Advanced: 3,
    };

    const targetDifficulty =
      intentData.confidence === "Weak"
        ? 1
        : intentData.confidence === "Average"
          ? 2
          : 3;

    const aDiff = Math.abs(
      (difficultyOrder[a.difficulty] || 2) - targetDifficulty,
    );
    const bDiff = Math.abs(
      (difficultyOrder[b.difficulty] || 2) - targetDifficulty,
    );

    return aDiff - bDiff;
  });
}

// ============================================================================
// MAIN RECOMMENDATION FUNCTION
// ============================================================================

/**
 * Generate personalized learning path using two-stage pipeline
 *
 * Stage 1: Candidate Generation (Supabase)
 * Stage 2: AI Scoring (FastAPI ML Model)
 * Stage 3: Ranking & Filtering
 * Stage 4: Return Top Results
 */
export async function generatePersonalizedPath(
  userProfile: UserProfile,
  intentData: IntentData,
): Promise<RecommendationResult> {
  try {
    // ========================================================================
    // VALIDATION
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
    // STAGE 1: CANDIDATE GENERATION (Supabase Query)
    // ========================================================================
    console.log("📊 Stage 1: Fetching candidates from Supabase...");

    const supabase = await createClient();

    let query = supabase
      .from("resources")
      .select("*")
      .eq("target_grade", userProfile.grade_level)
      .eq("subject", intentData.subject)
      .limit(MAX_CANDIDATES);

    // Adaptive difficulty filtering based on confidence level
    if (intentData.confidence === "Weak") {
      query = query.in("difficulty", ["Beginner", "Medium"]);
    } else if (intentData.confidence === "Average") {
      query = query.in("difficulty", ["Beginner", "Medium", "Advanced"]);
    } else if (intentData.confidence === "Strong") {
      query = query.in("difficulty", ["Medium", "Advanced"]);
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
    // STAGE 2: AI SCORING (FastAPI ML Model)
    // ========================================================================
    let enrichedResources: EnrichedResource[];
    let mlEnabled = false;

    try {
      console.log("🤖 Stage 2: Scoring resources with ML API...");
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
      console.log("⚠️ Falling back to rule-based sorting");
      mlEnabled = false;
      enrichedResources = resources.map((r) => ({ ...r }));
    }

    // ========================================================================
    // STAGE 3: RANKING & FILTERING
    // ========================================================================
    console.log("🔄 Stage 3: Ranking and filtering...");

    let rankedResources: EnrichedResource[];

    if (mlEnabled) {
      // Sort by ML predictions
      rankedResources = sortResourcesByML(enrichedResources);

      // Optional: Filter out "Too Hard" predictions for weak students
      if (intentData.confidence === "Weak") {
        const beforeFilter = rankedResources.length;
        rankedResources = rankedResources.filter(
          (r) => r.ml_prediction?.predicted_feedback !== "Too Hard",
        );
        const filtered = beforeFilter - rankedResources.length;
        if (filtered > 0) {
          console.log(`   Filtered out ${filtered} "Too Hard" resources`);
        }
      }
    } else {
      // Fallback sorting
      rankedResources = fallbackSort(resources, userProfile, intentData);
    }

    // ========================================================================
    // STAGE 4: RETURN TOP RESULTS
    // ========================================================================
    const topResources = rankedResources.slice(0, TOP_RESULTS);

    console.log(`✅ Returning top ${topResources.length} resources`);
    console.log(
      "   Top 3 predictions:",
      topResources.slice(0, 3).map((r) => ({
        title: r.title.substring(0, 50) + "...",
        prediction: r.ml_prediction?.predicted_feedback || "N/A",
        score: r.ml_score?.toFixed(2) || "N/A",
      })),
    );

    return {
      success: true,
      resources: topResources,
      mlEnabled,
    };
  } catch (error) {
    console.error("❌ Fatal error in recommendation pipeline:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
