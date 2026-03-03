# VidyaMitr Server - ML Model & Backend

> Machine Learning recommendation engine and backend services for VidyaMitr

## Overview

The VidyaMitr server contains the machine learning model and backend services that power the adaptive learning recommendations. Built with Python and XGBoost for intelligent resource matching.



## Project Structure

```
server/
├── ml_model/              # Machine Learning Model
│   ├── model.pkl         # Trained XGBoost model
│   ├── train.py          # Model training script
│   ├── predict.py        # Prediction script
│   └── evaluate.py       # Model evaluation
│
├── datasets/              # Training Data
│   ├── resources.csv     # Resource dataset
│   ├── user_profiles.csv # User profile data
│   └── interactions.csv  # User-resource interactions
│
├── api/                   # Backend API (Optional)
│   └── recommend.py      # Recommendation endpoint
│
└── requirements.txt       # Python dependencies
```



## Machine Learning Model

### XGBoost Recommendation Engine

The core ML model uses XGBoost (Extreme Gradient Boosting) to predict the best learning resources for each student.

**Model Performance**:
- **Accuracy**: 70%
- **Training Data**: 1000+ user-resource interactions
- **Features**: Grade level, subject, difficulty, format preferences
- **Output**: Ranked list of recommended resources

### Features Used

1. **User Features**
   - Grade level (6-10)
   - Preferred learning format (video/text)
   - Subject interest
   - Learning pace

2. **Resource Features**
   - Subject category
   - Difficulty level (Beginner/Medium/Advanced)
   - Content format (video/article/interactive)
   - Estimated time
   - Tags and keywords

3. **Interaction Features**
   - Completion rate
   - Time spent
   - Feedback ratings
   - Quiz scores



## Setup

### Prerequisites

- Python 3.8+
- pip or conda

### Installation

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Dependencies

```txt
xgboost==2.0.0
pandas==2.0.0
numpy==1.24.0
scikit-learn==1.3.0
joblib==1.3.0
```



## Model Training

### Training the Model

```bash
cd ml_model
python train.py
```

**Training Process**:
1. Load datasets from `datasets/`
2. Feature engineering and preprocessing
3. Train-test split (80-20)
4. XGBoost model training
5. Model evaluation
6. Save trained model to `model.pkl`

### Training Configuration

```python
# XGBoost parameters
params = {
    'objective': 'binary:logistic',
    'max_depth': 6,
    'learning_rate': 0.1,
    'n_estimators': 100,
    'subsample': 0.8,
    'colsample_bytree': 0.8
}
```



## Model Evaluation

### Evaluation Metrics

```bash
python evaluate.py
```

**Metrics**:
- **Accuracy**: 70%
- **Precision**: 0.72
- **Recall**: 0.68
- **F1-Score**: 0.70
- **AUC-ROC**: 0.75

### Feature Importance

Top features influencing recommendations:
1. Subject match (35%)
2. Difficulty level (25%)
3. Grade level (20%)
4. Format preference (15%)
5. Previous interactions (5%)



## Making Predictions

### Prediction Script

```bash
python predict.py --user_id USER_ID --subject SUBJECT
```

**Example**:
```bash
python predict.py --user_id "123" --subject "Mathematics"
```

**Output**:
```json
{
  "recommendations": [
    {
      "resource_id": "abc123",
      "title": "Algebra Basics",
      "confidence": 0.85,
      "reason": "Matches grade level and difficulty"
    },
    {
      "resource_id": "def456",
      "title": "Geometry Introduction",
      "confidence": 0.78,
      "reason": "Similar to completed resources"
    }
  ]
}
```



## Hybrid Recommendation System

The system uses a hybrid approach combining:

### 1. ML-Based Recommendations (Primary)
- XGBoost model predictions
- Personalized based on user profile
- Learns from user interactions

### 2. Rule-Based Fallback (Secondary)
- Used when ML model confidence is low
- Based on curriculum standards
- Ensures quality recommendations

### 3. Content-Based Filtering
- Matches resource tags with user interests
- Subject and difficulty alignment
- Format preference matching


## Datasets

### Resource Dataset (`resources.csv`)

```csv
id,title,subject,grade,difficulty,format,tags,url
1,Algebra Basics,Mathematics,8,Beginner,video,"algebra,equations",https://...
2,Cell Biology,Science,9,Medium,article,"biology,cells",https://...
```

### User Profile Dataset (`user_profiles.csv`)

```csv
user_id,grade_level,preferred_format,subjects,learning_pace
123,8,video,"Mathematics,Science",medium
456,9,text,"English,Social Studies",fast
```

### Interaction Dataset (`interactions.csv`)

```csv
user_id,resource_id,completed,time_spent,rating,timestamp
123,1,true,1200,5,2024-01-15
456,2,false,600,3,2024-01-16
```


## Monitoring

### Model Performance Tracking

Monitor these metrics:
- Prediction accuracy
- Response time
- User engagement with recommendations
- Completion rates

### Logging

```python
import logging

logging.basicConfig(
    filename='model.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Log predictions
logging.info(f'Prediction made for user {user_id}: {prediction}')
```

## Security

### Data Privacy

- User data anonymized
- No PII in training data
- Secure model storage
- Encrypted data transmission

### Model Security

- Model versioning
- Access control
- Input validation
- Output sanitization


## Documentation

### Model Documentation

- **Algorithm**: XGBoost (Gradient Boosting)
- **Type**: Supervised Learning (Classification)
- **Input**: User profile + Resource features
- **Output**: Recommendation scores (0-1)


## Troubleshooting

### Common Issues

1. **Model Loading Error**
   - Check `model.pkl` exists
   - Verify Python version compatibility
   - Reinstall dependencies

2. **Low Accuracy**
   - Collect more training data
   - Tune hyperparameters
   - Add more features

3. **Slow Predictions**
   - Optimize feature extraction
   - Use model caching
   - Consider model compression


## Future Improvements

### Planned Enhancements

1. **Deep Learning Model**
   - Neural network for better accuracy
   - Embedding-based recommendations

2. **Real-Time Learning**
   - Online learning updates
   - Continuous model improvement

3. **Multi-Modal Recommendations**
   - Combine text, video, and interaction data
   - Cross-subject recommendations

4. **Explainable AI**
   - SHAP values for interpretability
   - Recommendation explanations