from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import joblib
from typing import Dict
import uvicorn

app = FastAPI(
    title="VidyaMitr ML Prediction API",
    description="Machine Learning microservice for personalized learning recommendations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  #
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

model = None
label_encoder = None

try:
    print("Loading trained ML model...")
    try:
        model = joblib.load('recommendation_engine_extreme.pkl')
        label_encoder = joblib.load('label_encoder.pkl')
        print("✓ Advanced XGBoost model loaded successfully!")
    except FileNotFoundError:
        model = joblib.load('recommendation_engine.pkl')
        label_encoder = None
        print("✓ Random Forest model loaded successfully!")
    print(f"✓ Model classes: {model.classes_ if hasattr(model, 'classes_') else 'N/A'}")
except Exception as e:
    print(f"✗ ERROR: Failed to load model - {str(e)}")
    print("✗ Make sure 'recommendation_engine.pkl' or 'recommendation_engine_extreme.pkl' exists")
    raise

# PYDANTIC DATA MODELS
class StudentState(BaseModel):
    """
    Input schema for prediction endpoint.
    Matches the exact feature names expected by the trained ML model.
    """
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

    class Config:
        schema_extra = {
            "example": {
                "grade_level": "Class 9",
                "preferred_format": "video",
                "baseline_score": 75,
                "intent_goal": "Board Prep",
                "current_confidence": "Average",
                "difficulty_level": "Medium",
                "format": "video",
                "subject": "Mathematics",
                "duration_minutes": 30,
                "completion_rate": 85,
                "target_grade": "Class 9"
            }
        }


class PredictionResponse(BaseModel):
    """
    Output schema for prediction endpoint.
    Returns the predicted feedback label and confidence scores.
    """
    predicted_feedback: str = Field(..., description="Predicted feedback label")
    confidence_scores: Dict[str, float] = Field(..., description="Confidence percentages for each class")

    class Config:
        schema_extra = {
            "example": {
                "predicted_feedback": "Perfect",
                "confidence_scores": {
                    "Perfect": 47.68,
                    "Too Hard": 16.10,
                    "Too Slow": 36.22
                }
            }
        }

# API ENDPOINTS
@app.get("/")
async def root():
    """
    Health check endpoint.
    Returns API status and model information.
    """
    return {
        "status": "online",
        "service": "VidyaMitr ML Prediction API",
        "version": "1.0.0",
        "model_loaded": model is not None,
        "model_classes": list(model.classes_) if model else None
    }


@app.get("/health")
async def health_check():
    """
    Detailed health check endpoint.
    Verifies model is loaded and ready to serve predictions.
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Service unavailable."
        )
    
    return {
        "status": "healthy",
        "model_status": "loaded",
        "model_classes": list(model.classes_)
    }


@app.post("/api/predict", response_model=PredictionResponse)
async def predict_feedback(student_state: StudentState):
    """
    Main prediction endpoint.
    
    Accepts student-resource interaction data and returns:
    - predicted_feedback: The predicted label ("Perfect", "Too Hard", or "Too Slow")
    - confidence_scores: Confidence percentages for each possible outcome
    
    Args:
        student_state: StudentState object containing all required features
        
    Returns:
        PredictionResponse with prediction and confidence scores
        
    Raises:
        HTTPException: If prediction fails for any reason
    """
    try:
        # Convert Pydantic model to dictionary
        input_dict = student_state.dict()
        
        input_dict['format_match'] = int(input_dict['preferred_format'] == input_dict['format'])
        
        input_dict['score_duration_ratio'] = input_dict['baseline_score'] / (input_dict['duration_minutes'] + 1)
        
        difficulty_map = {'Beginner': 1, 'Medium': 2, 'Advanced': 3}
        confidence_map = {'Weak': 1, 'Average': 2, 'Strong': 3}
        difficulty_numeric = difficulty_map.get(input_dict['difficulty_level'], 2)
        confidence_numeric = confidence_map.get(input_dict['current_confidence'], 2)
        input_dict['difficulty_confidence_gap'] = abs(difficulty_numeric - confidence_numeric)
        
        input_dict['completion_efficiency'] = input_dict['completion_rate'] / (input_dict['duration_minutes'] + 1)
        
        input_dict['grade_match'] = int(input_dict['grade_level'] == input_dict.get('target_grade', ''))
        
        input_dict['engagement_score'] = (input_dict['baseline_score'] * input_dict['completion_rate']) / 100
        
        input_data = pd.DataFrame([input_dict])
        
        prediction = model.predict(input_data)[0]
        
        probabilities = model.predict_proba(input_data)[0]
        
        if label_encoder is not None:
            prediction = label_encoder.inverse_transform([prediction])[0]
            class_labels = label_encoder.classes_
        else:
            class_labels = model.classes_
        
        confidence_scores = {
            label: round(float(prob * 100), 2)
            for label, prob in zip(class_labels, probabilities)
        }
        
        return PredictionResponse(
            predicted_feedback=prediction,
            confidence_scores=confidence_scores
        )
        
    except Exception as e:
        print(f"✗ Prediction error: {str(e)}")
        print(f"✗ Input data: {student_state.dict()}")
        
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True, 
        log_level="info"
    )
