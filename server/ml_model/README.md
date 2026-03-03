# AI-Powered Personalized Learning Platform - ML Model

## Overview
This machine learning model predicts how students will react to educational resources based on their profile, learning goals, and resource characteristics. The model classifies feedback into three categories:
- **Perfect**: Resource is well-suited for the student
- **Too Hard**: Resource is too challenging
- **Too Slow**: Resource is too easy or slow-paced

## Model Architecture
- **Algorithm**: Random Forest Classifier
- **Framework**: scikit-learn (Classical ML)
- **Features**: 10 input features (3 numerical, 7 categorical)
- **Target**: 3-class classification (Perfect, Too Hard, Too Slow)
- **Accuracy**: ~70% on test set

## Project Structure
```
ml_model/
├── train_model.py           # Main training script
├── predict.py               # Inference/prediction script
├── requirements.txt         # Python dependencies
├── recommendation_engine.pkl # Trained model (generated)
├── students.csv             # Student profiles dataset
├── resources.csv            # Educational resources dataset
├── interactions.csv         # Student-resource interactions dataset
└── README.md               # This file
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup
1. Navigate to the ml_model directory:
```bash
cd ml_model
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Training the Model
Run the training script to train a new model:
```bash
python train_model.py
```

**Output:**
- Trained model saved as `recommendation_engine.pkl`
- Training metrics and evaluation results printed to console
- Model achieves ~70% accuracy on test set

### Making Predictions
Use the inference script to make predictions:
```bash
python predict.py
```

Or integrate into your application:
```python
import pandas as pd
import joblib

# Load the trained model
model = joblib.load('recommendation_engine.pkl')

# Prepare input data
input_data = pd.DataFrame([{
    'grade_level': 'Class 9',
    'preferred_format': 'video',
    'baseline_score': 75,
    'intent_goal': 'Board Prep',
    'current_confidence': 'Average',
    'difficulty_level': 'Medium',
    'format': 'video',
    'subject': 'Mathematics',
    'duration_minutes': 30,
    'completion_rate': 85
}])

# Make prediction
prediction = model.predict(input_data)[0]
probabilities = model.predict_proba(input_data)[0]

print(f"Predicted Feedback: {prediction}")
```

## Features

### Input Features (10 total)

#### Student Features (4)
1. **grade_level** (Categorical): Student's current grade (Class 6-10)
2. **preferred_format** (Categorical): Preferred learning format (video/text)
3. **baseline_score** (Numerical): Student's baseline performance score (0-100)
4. **current_confidence** (Categorical): Current confidence level (Weak/Average/Strong)

#### Resource Features (4)
5. **subject** (Categorical): Subject area (Mathematics/Science)
6. **difficulty_level** (Categorical): Resource difficulty (Beginner/Medium/Advanced)
7. **format** (Categorical): Resource format (video/text)
8. **duration_minutes** (Numerical): Resource duration in minutes

#### Interaction Features (2)
9. **intent_goal** (Categorical): Learning goal (Board Prep/Homework Help/Daily Revision)
10. **completion_rate** (Numerical): Percentage of resource completed (0-100)

### Target Variable
- **feedback_label** (Categorical): Student feedback on resource
  - Perfect (45.12% of data)
  - Too Slow (28.66% of data)
  - Too Hard (26.22% of data)

## Model Performance

### Overall Metrics
- **Test Accuracy**: 69.90%
- **Macro Average F1-Score**: 0.67
- **Weighted Average F1-Score**: 0.70

### Per-Class Performance
| Class | Precision | Recall | F1-Score | Support |
|-------|-----------|--------|----------|---------|
| Perfect | 0.81 | 0.83 | 0.82 | 451 |
| Too Hard | 0.60 | 0.57 | 0.58 | 262 |
| Too Slow | 0.60 | 0.61 | 0.61 | 287 |

### Feature Importance
Top 5 most important features:
1. **completion_rate** (60.56%) - Most influential predictor
2. **baseline_score** (12.31%)
3. **current_confidence_Strong** (8.82%)
4. **current_confidence_Weak** (4.95%)
5. **current_confidence_Average** (2.16%)

## Technical Details

### Preprocessing Pipeline
1. **Numerical Features**: Standardized using StandardScaler
   - baseline_score
   - duration_minutes
   - completion_rate

2. **Categorical Features**: One-hot encoded with unknown value handling
   - grade_level
   - preferred_format
   - intent_goal
   - current_confidence
   - difficulty_level
   - format
   - subject

### Model Configuration
```python
RandomForestClassifier(
    n_estimators=100,
    class_weight='balanced',  # Handles class imbalance
    random_state=42,
    n_jobs=-1,               # Uses all CPU cores
    max_depth=15,
    min_samples_split=10,
    min_samples_leaf=4
)
```

### Data Split
- **Training Set**: 80% (4,000 samples)
- **Test Set**: 20% (1,000 samples)
- **Stratification**: Maintains class distribution in both sets

## Dataset Information

### students.csv (1,000 students)
- Student profiles with grade level, preferences, and baseline scores
- Covers Class 6-10 students
- Mix of video and text format preferences

### resources.csv (171 resources)
- Educational resources for CBSE, ICSE, and SSC boards
- Mathematics and Science subjects
- Various difficulty levels and formats

### interactions.csv (5,000 interactions)
- Historical student-resource interactions
- Includes completion rates and feedback labels
- Balanced across different learning goals

## Model Limitations
1. **Accuracy**: 70% accuracy means 30% of predictions may be incorrect
2. **Data Dependency**: Performance depends on quality and representativeness of training data
3. **Feature Coverage**: Limited to 10 features; additional context may improve predictions
4. **Class Imbalance**: "Perfect" class is more prevalent (45%) than others

## Future Improvements
1. **Feature Engineering**: Add temporal features, learning patterns, time-of-day
2. **Model Ensemble**: Combine multiple models for better predictions
3. **Hyperparameter Tuning**: Use GridSearchCV or RandomizedSearchCV
4. **Deep Learning**: Explore neural networks for complex pattern recognition
5. **Real-time Learning**: Implement online learning for continuous model updates
6. **Explainability**: Add SHAP values for better prediction interpretability

## Integration Example

### Flask API Endpoint
```python
from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)
model = joblib.load('recommendation_engine.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    input_df = pd.DataFrame([data])
    prediction = model.predict(input_df)[0]
    probabilities = model.predict_proba(input_df)[0]
    
    return jsonify({
        'prediction': prediction,
        'confidence': {
            label: float(prob) 
            for label, prob in zip(model.classes_, probabilities)
        }
    })

if __name__ == '__main__':
    app.run(debug=True)
```

## License
This project is part of the AI-Powered Personalized Learning Platform prototype.

## Contact
For questions or issues, please refer to the main project documentation.
