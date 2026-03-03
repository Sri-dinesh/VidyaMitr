# ML-Powered Recommendation Engine

## Overview

The `generatePersonalizedPath` function is an intelligent recommendation engine that combines Supabase database queries with Machine Learning predictions to provide personalized learning resource recommendations.

## Features

✅ **ML-Powered Scoring** - Uses local FastAPI ML server for intelligent predictions  
✅ **Graceful Fallback** - Falls back to rule-based sorting if ML API is unavailable  
✅ **Type-Safe** - Full TypeScript support with comprehensive interfaces  
✅ **Performance Optimized** - Limits candidates and uses parallel ML scoring  
✅ **Robust Error Handling** - Handles timeouts, network errors, and edge cases  
✅ **Detailed Logging** - Console logs for debugging and monitoring  

---

## Usage

### Basic Usage

```typescript
import { generatePersonalizedPath } from '@/app/actions/recommend';

// In your component or page
const result = await generatePersonalizedPath(userProfile, intentData);

if (result.success) {
  console.log('Recommendations:', result.resources);
  console.log('ML Enabled:', result.mlEnabled);
} else {
  console.error('Error:', result.error);
}
```

### Example with Real Data

```typescript
const userProfile = {
  id: 'user-123',
  name: 'Rahul Kumar',
  grade_level: 'Class 9',
  preferred_format: 'video',
  avatar_selection: 'tech_bot',
};

const intentData = {
  subject: 'Mathematics',
  goal: 'Board Prep',
  confidence: 'Average',
};

const result = await generatePersonalizedPath(userProfile, intentData);
```

---

## Input Parameters

### `userProfile: UserState`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string \| null | No | User ID |
| `name` | string \| null | No | User name |
| `grade_level` | GradeLevel \| null | **Yes** | Student's grade (Class 6-10) |
| `preferred_format` | PreferredFormat \| null | No | Preferred format (video/text) |
| `avatar_selection` | AvatarSelection \| null | No | Selected avatar |

### `intentData: IntentState`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string \| null | **Yes** | Subject (Mathematics/Science) |
| `goal` | string \| null | No | Learning goal (Board Prep/Homework Help/Daily Revision) |
| `confidence` | string \| null | **Yes** | Confidence level (Weak/Average/Strong) |

---

## Response Format

### Success Response

```typescript
{
  success: true,
  resources: [
    {
      id: "res_123",
      title: "Algebra Fundamentals",
      subject: "Mathematics",
      target_grade: "Class 9",
      difficulty: "Medium",
      format: "video",
      url: "https://...",
      estimated_time: "30 minutes",
      tags: ["algebra", "equations"],
      created_at: "2024-01-01T00:00:00Z",
      
      // ML Enrichment (if ML API is available)
      ml_prediction: {
        predicted_feedback: "Perfect",
        confidence_scores: {
          Perfect: 47.68,
          "Too Hard": 16.10,
          "Too Slow": 36.22
        }
      },
      ml_score: 47.68
    },
    // ... more resources
  ],
  mlEnabled: true  // Indicates if ML scoring was successful
}
```

### Error Response

```typescript
{
  success: false,
  error: "Failed to fetch learning resources. Please try again."
}
```

---

## How It Works

### Step 1: Validation
- Validates required fields (grade_level, subject, confidence)
- Returns error if validation fails

### Step 2: Supabase Query
- Fetches candidate resources from database
- Filters by:
  - `target_grade` = user's grade level
  - `subject` = selected subject
  - `difficulty` = adaptive based on confidence level
- Limits to 10 candidates for performance

### Step 3: ML Scoring
- For each resource, constructs ML API payload
- Sends POST request to `http://127.0.0.1:8000/api/predict`
- Enriches resources with ML predictions
- Handles timeouts (5 seconds) and errors gracefully

### Step 4: Sorting & Filtering
- **ML Mode**: Sorts by "Perfect" predictions first, then by confidence score
- **Fallback Mode**: Sorts by preferred format match, then difficulty
- Returns top 5 resources

---

## ML API Integration

### Request Format

```json
{
  "grade_level": "Class 9",
  "preferred_format": "video",
  "baseline_score": 75,
  "intent_goal": "Board Prep",
  "current_confidence": "Average",
  "difficulty_level": "Medium",
  "format": "video",
  "subject": "Mathematics",
  "duration_minutes": 30,
  "completion_rate": 0
}
```

### Response Format

```json
{
  "predicted_feedback": "Perfect",
  "confidence_scores": {
    "Perfect": 47.68,
    "Too Hard": 16.10,
    "Too Slow": 36.22
  }
}
```

---

## Configuration

### Constants (in `recommend.ts`)

```typescript
const ML_API_URL = 'http://127.0.0.1:8000/api/predict';
const ML_API_TIMEOUT = 5000; // 5 seconds
const MAX_CANDIDATES = 10;   // Limit for ML scoring
const TOP_RESULTS = 5;       // Number of recommendations to return
```

### Modifying Configuration

To change these values, edit the constants at the top of `app/actions/recommend.ts`:

```typescript
// Increase timeout for slower networks
const ML_API_TIMEOUT = 10000; // 10 seconds

// Return more recommendations
const TOP_RESULTS = 10;

// Score more candidates (may be slower)
const MAX_CANDIDATES = 20;
```

---

## Adaptive Difficulty Filtering

The engine automatically adjusts difficulty based on confidence level:

| Confidence | Difficulty Levels Shown |
|------------|------------------------|
| **Weak** | Beginner, Medium |
| **Average** | Medium, Advanced |
| **Strong** | Advanced only |

This ensures students are challenged appropriately without being overwhelmed.

---

## Fallback Behavior

If the ML API is unavailable (server down, timeout, error), the engine automatically falls back to rule-based sorting:

1. **Primary Sort**: Resources matching user's preferred format come first
2. **Secondary Sort**: By difficulty level (Beginner → Medium → Advanced)

The response includes `mlEnabled: false` to indicate fallback mode was used.

---

## Error Handling

### Network Errors
- Timeout after 5 seconds
- Graceful fallback to rule-based sorting
- Logs error to console

### Database Errors
- Returns error response with user-friendly message
- Logs detailed error to console

### Validation Errors
- Returns error response immediately
- Provides specific error message

---

## Performance Considerations

### Optimization Strategies

1. **Candidate Limiting**: Only fetches 10 resources from database
2. **Parallel ML Scoring**: Uses `Promise.all()` for concurrent API calls
3. **Timeout Protection**: 5-second timeout prevents hanging requests
4. **Early Returns**: Validates input before expensive operations

### Expected Performance

- **Database Query**: ~50-100ms
- **ML Scoring (10 resources)**: ~500-1000ms (parallel)
- **Total Response Time**: ~1-2 seconds

---

## Debugging

### Enable Detailed Logging

The function includes comprehensive console logs:

```
🎯 Generating personalized path for: { grade: 'Class 9', subject: 'Mathematics', ... }
✅ Found 10 candidate resources
🤖 Scoring resources with ML API...
✅ ML scoring successful: 10/10 resources scored
📊 Resources sorted by ML predictions
🎉 Returning top 5 recommendations
```

### Common Issues

#### ML API Not Responding
```
⚠️ ML API unavailable, using fallback sorting
```
**Solution**: Ensure FastAPI server is running on `http://127.0.0.1:8000`

#### No Resources Found
```
⚠️ No resources found for criteria
```
**Solution**: Check if resources exist in database for the grade/subject combination

#### Database Error
```
❌ Database query error: [error details]
```
**Solution**: Check Supabase connection and table schema

---

## Testing

### Manual Testing

```typescript
// Test with ML API available
const result1 = await generatePersonalizedPath(
  { grade_level: 'Class 9', preferred_format: 'video', ... },
  { subject: 'Mathematics', confidence: 'Average', goal: 'Board Prep' }
);

console.log('ML Enabled:', result1.mlEnabled); // Should be true
console.log('Resources:', result1.resources?.length); // Should be 5 or less

// Test with ML API unavailable (stop the FastAPI server)
const result2 = await generatePersonalizedPath(
  { grade_level: 'Class 9', preferred_format: 'video', ... },
  { subject: 'Mathematics', confidence: 'Average', goal: 'Board Prep' }
);

console.log('ML Enabled:', result2.mlEnabled); // Should be false
console.log('Fallback worked:', result2.success); // Should be true
```

---

## Integration Example

### In a Next.js Page

```typescript
// app/path/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { generatePersonalizedPath } from '@/app/actions/recommend';
import { useAppStore } from '@/store/useAppStore';
import type { EnrichedResource } from '@/app/actions/recommend';

export default function LearningPathPage() {
  const { user, intent } = useAppStore();
  const [resources, setResources] = useState<EnrichedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [mlEnabled, setMlEnabled] = useState(false);

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      const result = await generatePersonalizedPath(user, intent);
      
      if (result.success && result.resources) {
        setResources(result.resources);
        setMlEnabled(result.mlEnabled || false);
      }
      
      setLoading(false);
    }

    loadRecommendations();
  }, [user, intent]);

  if (loading) return <div>Loading recommendations...</div>;

  return (
    <div>
      <h1>Your Personalized Learning Path</h1>
      {mlEnabled && (
        <p className="text-green-600">
          ✨ AI-powered recommendations enabled
        </p>
      )}
      
      {resources.map((resource) => (
        <div key={resource.id} className="resource-card">
          <h2>{resource.title}</h2>
          <p>Difficulty: {resource.difficulty}</p>
          <p>Format: {resource.format}</p>
          
          {resource.ml_prediction && (
            <div className="ml-insights">
              <p>Prediction: {resource.ml_prediction.predicted_feedback}</p>
              <p>Confidence: {resource.ml_prediction.confidence_scores.Perfect}%</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Migration Guide

### From Old `generateLearningPath`

The old function is still available for backward compatibility:

```typescript
// Old way (still works)
const result = await generateLearningPath(intentData, userProfile);

// New way (recommended)
const result = await generatePersonalizedPath(userProfile, intentData);
```

**Note**: Parameter order is swapped in the new function!

---

## Future Enhancements

Potential improvements for future versions:

1. **Caching**: Cache ML predictions to reduce API calls
2. **Batch Scoring**: Score multiple resources in a single API call
3. **A/B Testing**: Compare ML vs rule-based recommendations
4. **User Feedback Loop**: Use actual feedback to retrain model
5. **Real-time Updates**: WebSocket connection for live recommendations
6. **Personalized Baseline**: Calculate user-specific baseline scores

---

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify ML API is running: `curl http://127.0.0.1:8000/health`
3. Check Supabase connection and table schema
4. Review this documentation for configuration options

---

## License

Part of the VidyaMitr AI-Powered Personalized Learning Platform.
