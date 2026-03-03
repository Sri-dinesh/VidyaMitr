"""
VidyaMitr ML Prediction API - Lightweight Version
=================================================
FastAPI serverless-compatible API without heavy dependencies (xgboost, sklearn).
Implements rule-based prediction logic that mimics the ML model.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict
import random

app = FastAPI(
    title="VidyaMitr ML Prediction API",
    description="Machine Learning microservice for personalized learning recommendations (Lightweight)",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://vidya-mitr.vercel.app/", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StudentState(BaseModel):
    """Input schema for prediction endpoint."""
    grade_level: str = Field(..., description="Student's grade level (e.g., 'Class 9')")
    preferred_format: str = Field(..., description="Preferred learning format ('video' or 'text')")
    baseline_score: int = Field(..., ge=0, le=100, description="Student's baseline performance score (0-100)")
    intent_goal: str = Field(..., description="Learning goal (e.g., 'Board Prep', 'Homework Help', 'Daily Revision')")
    current_confidence: str = Field(..., description="Current confidence level ('Weak', 'Average', or 'Strong')")
    difficulty_level: str = Field(..., description="Resource difficulty ('Beginner', 'Medium', or 'Advanced')")
    format: str = Field(..., description="Resource format ('video' or 'text')")
    subject: str = Field(..., description="Subject area (e.g., 'Mathematics', 'Science')")
    duration_minutes: int = Field(..., ge=0, description="Resource duration in minutes")
    completion_rate: int = Field(default=0, ge=0, le=100, description="Percentage of resource completed (0-100)")
    target_grade: str = Field(default="", description="Resource target grade (e.g., 'Class 9')")


class PredictionResponse(BaseModel):
    """Output schema for prediction endpoint."""
    predicted_feedback: str = Field(..., description="Predicted feedback label")
    confidence_scores: Dict[str, float] = Field(..., description="Confidence percentages for each class")


def calculate_features(data: Dict) -> Dict:
    """Calculate engineered features from input data."""
    features = data.copy()

    # Format match
    features['format_match'] = int(data['preferred_format'] == data['format'])

    # Score to duration ratio
    features['score_duration_ratio'] = data['baseline_score'] / (data['duration_minutes'] + 1)

    # Difficulty-confidence gap
    difficulty_map = {'Beginner': 1, 'Medium': 2, 'Advanced': 3}
    confidence_map = {'Weak': 1, 'Average': 2, 'Strong': 3}
    difficulty_numeric = difficulty_map.get(data['difficulty_level'], 2)
    confidence_numeric = confidence_map.get(data['current_confidence'], 2)
    features['difficulty_confidence_gap'] = abs(difficulty_numeric - confidence_numeric)

    # Completion efficiency
    features['completion_efficiency'] = data['completion_rate'] / (data['duration_minutes'] + 1)

    # Grade match
    features['grade_match'] = int(data['grade_level'] == data.get('target_grade', ''))

    # Engagement score
    features['engagement_score'] = (data['baseline_score'] * data['completion_rate']) / 100

    return features


def rule_based_predict(features: Dict) -> tuple:
    """
    Rule-based prediction that mimics the trained ML model logic.
    Returns (predicted_label, confidence_scores).
    """
    # Initialize scores for each class
    scores = {"Perfect": 33.33, "Too Hard": 33.33, "Too Slow": 33.34}

    difficulty = features['difficulty_level']
    confidence = features['current_confidence']
    format_match = features['format_match']
    grade_match = features['grade_match']
    completion_rate = features['completion_rate']
    baseline_score = features['baseline_score']
    diff_conf_gap = features['difficulty_confidence_gap']

    # Rule 1: Difficulty-Confidence mismatch
    if confidence == "Weak" and difficulty == "Advanced":
        scores["Too Hard"] += 25
        scores["Perfect"] -= 15
        scores["Too Slow"] -= 10
    elif confidence == "Strong" and difficulty == "Beginner":
        scores["Too Slow"] += 25
        scores["Perfect"] -= 15
        scores["Too Hard"] -= 10
    elif (confidence == "Weak" and difficulty == "Beginner") or \
         (confidence == "Average" and difficulty == "Medium") or \
         (confidence == "Strong" and difficulty == "Advanced"):
        scores["Perfect"] += 20
        scores["Too Hard"] -= 10
        scores["Too Slow"] -= 10

    # Rule 2: Format mismatch penalty
    if format_match == 0:
        scores["Perfect"] -= 10
        scores["Too Hard"] += 5
        scores["Too Slow"] += 5
    else:
        scores["Perfect"] += 10

    # Rule 3: Grade match
    if grade_match == 1:
        scores["Perfect"] += 15
        scores["Too Hard"] -= 5
        scores["Too Slow"] -= 5
    else:
        scores["Too Hard"] += 10

    # Rule 4: Completion rate indicates engagement
    if completion_rate >= 80:
        scores["Perfect"] += 15
        scores["Too Hard"] -= 10
    elif completion_rate <= 40:
        scores["Too Hard"] += 15
        scores["Perfect"] -= 10
    elif completion_rate >= 60:
        scores["Perfect"] += 5

    # Rule 5: Baseline score correlation
    if baseline_score >= 80 and difficulty == "Advanced":
        scores["Perfect"] += 10
    elif baseline_score <= 50 and difficulty == "Advanced":
        scores["Too Hard"] += 15
    elif baseline_score >= 80 and difficulty == "Beginner":
        scores["Too Slow"] += 15

    # Rule 6: Difficulty-confidence gap
    if diff_conf_gap == 0:
        scores["Perfect"] += 15
    elif diff_conf_gap >= 2:
        scores["Too Hard"] += 10 if confidence == "Weak" else 0
        scores["Too Slow"] += 10 if confidence == "Strong" else 0

    # Normalize scores to percentages
    total = sum(scores.values())
    for key in scores:
        scores[key] = round((scores[key] / total) * 100, 2)

    # Get prediction
    predicted = max(scores, key=scores.get)

    return predicted, scores


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "VidyaMitr ML Prediction API",
        "version": "1.1.0 (Lightweight)",
        "model_loaded": True,
        "model_type": "Rule-Based Engine"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "model_status": "loaded",
        "model_type": "Rule-Based Prediction Engine"
    }


@app.post("/api/predict", response_model=PredictionResponse)
async def predict_feedback(student_state: StudentState):
    """
    Main prediction endpoint using rule-based logic.
    """
    try:
        # Convert to dict and calculate features
        input_dict = student_state.dict()
        features = calculate_features(input_dict)

        # Make prediction
        prediction, confidence_scores = rule_based_predict(features)

        return PredictionResponse(
            predicted_feedback=prediction,
            confidence_scores=confidence_scores
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_light:app", host="0.0.0.0", port=8000, reload=True)
