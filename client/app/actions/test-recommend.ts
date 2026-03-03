/**
 * Test Script for Recommendation Engine
 * 
 * This file demonstrates how to test the recommendation engine
 * Run this in a Next.js API route or server component
 */

import { generatePersonalizedPath } from './recommend';
import type { UserState, IntentState } from '@/store/useAppStore';

// ============================================================================
// TEST DATA
// ============================================================================

const testUserProfile: UserState = {
  id: 'test-user-123',
  name: 'Test Student',
  grade_level: 'Class 9',
  preferred_format: 'video',
  avatar_selection: 'tech_bot',
};

const testIntentData: IntentState = {
  subject: 'Mathematics',
  goal: 'Board Prep',
  confidence: 'Average',
};

// ============================================================================
// TEST SCENARIOS
// ============================================================================

export async function testRecommendationEngine() {
  console.log('🧪 Starting Recommendation Engine Tests\n');
  console.log('=' .repeat(70));

  // Test 1: Normal scenario with ML API available
  console.log('\n📝 Test 1: Normal Recommendation Request');
  console.log('-'.repeat(70));
  await testNormalRequest();

  // Test 2: Different confidence levels
  console.log('\n📝 Test 2: Different Confidence Levels');
  console.log('-'.repeat(70));
  await testConfidenceLevels();

  // Test 3: Different subjects
  console.log('\n📝 Test 3: Different Subjects');
  console.log('-'.repeat(70));
  await testDifferentSubjects();

  // Test 4: Missing required fields
  console.log('\n📝 Test 4: Validation Errors');
  console.log('-'.repeat(70));
  await testValidationErrors();

  console.log('\n' + '='.repeat(70));
  console.log('✅ All tests completed!\n');
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testNormalRequest() {
  try {
    const result = await generatePersonalizedPath(
      testUserProfile,
      testIntentData
    );

    console.log('Result:', {
      success: result.success,
      resourceCount: result.resources?.length || 0,
      mlEnabled: result.mlEnabled,
      error: result.error,
    });

    if (result.success && result.resources && result.resources.length > 0) {
      console.log('\n📚 Top Recommendation:');
      const topResource = result.resources[0];
      console.log({
        title: topResource.title,
        difficulty: topResource.difficulty,
        format: topResource.format,
        mlPrediction: topResource.ml_prediction?.predicted_feedback,
        mlScore: topResource.ml_score,
      });
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testConfidenceLevels() {
  const confidenceLevels = ['Weak', 'Average', 'Strong'];

  for (const confidence of confidenceLevels) {
    console.log(`\n  Testing confidence: ${confidence}`);
    
    const result = await generatePersonalizedPath(
      testUserProfile,
      { ...testIntentData, confidence }
    );

    console.log(`  → Resources found: ${result.resources?.length || 0}`);
    
    if (result.resources && result.resources.length > 0) {
      const difficulties = result.resources.map(r => r.difficulty);
      console.log(`  → Difficulties: ${[...new Set(difficulties)].join(', ')}`);
    }
  }
}

async function testDifferentSubjects() {
  const subjects = ['Mathematics', 'Science'];

  for (const subject of subjects) {
    console.log(`\n  Testing subject: ${subject}`);
    
    const result = await generatePersonalizedPath(
      testUserProfile,
      { ...testIntentData, subject }
    );

    console.log(`  → Resources found: ${result.resources?.length || 0}`);
    console.log(`  → ML enabled: ${result.mlEnabled}`);
  }
}

async function testValidationErrors() {
  // Test with missing grade_level
  console.log('\n  Testing missing grade_level:');
  const result1 = await generatePersonalizedPath(
    { ...testUserProfile, grade_level: null },
    testIntentData
  );
  console.log(`  → Success: ${result1.success}`);
  console.log(`  → Error: ${result1.error}`);

  // Test with missing subject
  console.log('\n  Testing missing subject:');
  const result2 = await generatePersonalizedPath(
    testUserProfile,
    { ...testIntentData, subject: null }
  );
  console.log(`  → Success: ${result2.success}`);
  console.log(`  → Error: ${result2.error}`);

  // Test with missing confidence
  console.log('\n  Testing missing confidence:');
  const result3 = await generatePersonalizedPath(
    testUserProfile,
    { ...testIntentData, confidence: null }
  );
  console.log(`  → Success: ${result3.success}`);
  console.log(`  → Error: ${result3.error}`);
}

// ============================================================================
// PERFORMANCE TEST
// ============================================================================

export async function testPerformance() {
  console.log('⚡ Performance Test\n');
  console.log('=' .repeat(70));

  const iterations = 5;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    await generatePersonalizedPath(testUserProfile, testIntentData);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    times.push(duration);

    console.log(`Iteration ${i + 1}: ${duration}ms`);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log('\n📊 Performance Summary:');
  console.log(`  Average: ${avgTime.toFixed(2)}ms`);
  console.log(`  Min: ${minTime}ms`);
  console.log(`  Max: ${maxTime}ms`);
  console.log('=' .repeat(70));
}

// ============================================================================
// EXPORT FOR USE IN API ROUTES
// ============================================================================

/**
 * Example API route handler
 * 
 * Create a file: app/api/test-recommend/route.ts
 * 
 * import { testRecommendationEngine } from '@/app/actions/test-recommend';
 * 
 * export async function GET() {
 *   await testRecommendationEngine();
 *   return Response.json({ message: 'Tests completed. Check console.' });
 * }
 */
