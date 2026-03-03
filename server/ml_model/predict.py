import pandas as pd
import joblib
import warnings
warnings.filterwarnings('ignore')

# LOAD MODEL AND LABEL ENCODER
print("Loading trained model...")
try:
    model = joblib.load('recommendation_engine_extreme.pkl')
    label_encoder = joblib.load('label_encoder.pkl')
    model_type = "XGBoost"
    print(f"✓ {model_type} model loaded successfully!")
    print(f"✓ Label encoder loaded: {label_encoder.classes_}\n")
except FileNotFoundError:
    # Fallback to Random Forest
    model = joblib.load('recommendation_engine.pkl')
    label_encoder = None
    model_type = "Random Forest"
    print(f"✓ {model_type} model loaded successfully!\n")

# EXAMPLE PREDICTION
print("=" * 80)
print("EXAMPLE PREDICTION")
print("=" * 80)

sample_data = pd.DataFrame([{
    'grade_level': 'Class 9',
    'preferred_format': 'video',
    'baseline_score': 75,
    'intent_goal': 'Board Prep',
    'current_confidence': 'Average',
    'difficulty_level': 'Medium',
    'format': 'video',
    'subject': 'Mathematics',
    'duration_minutes': 30,
    'completion_rate': 85,
    'target_grade': 'Class 9'  
}])

print("\nStudent Profile:")
print(f"  - Grade: {sample_data['grade_level'].values[0]}")
print(f"  - Baseline Score: {sample_data['baseline_score'].values[0]}")
print(f"  - Preferred Format: {sample_data['preferred_format'].values[0]}")
print(f"  - Current Confidence: {sample_data['current_confidence'].values[0]}")

print("\nResource Details:")
print(f"  - Subject: {sample_data['subject'].values[0]}")
print(f"  - Difficulty: {sample_data['difficulty_level'].values[0]}")
print(f"  - Format: {sample_data['format'].values[0]}")
print(f"  - Duration: {sample_data['duration_minutes'].values[0]} minutes")
print(f"  - Target Grade: {sample_data['target_grade'].values[0]}")

print("\nInteraction:")
print(f"  - Intent: {sample_data['intent_goal'].values[0]}")
print(f"  - Completion Rate: {sample_data['completion_rate'].values[0]}%")

if model_type == "XGBoost":
    print("\n" + "-" * 80)
    print("Engineering Advanced Features...")
    print("-" * 80)
    
    sample_data['format_match'] = (sample_data['preferred_format'] == sample_data['format']).astype(int)
    print(f"✓ format_match: {sample_data['format_match'].values[0]}")
    
    sample_data['score_duration_ratio'] = sample_data['baseline_score'] / (sample_data['duration_minutes'] + 1)
    print(f"✓ score_duration_ratio: {sample_data['score_duration_ratio'].values[0]:.4f}")
    
    difficulty_map = {'Beginner': 1, 'Medium': 2, 'Advanced': 3}
    confidence_map = {'Weak': 1, 'Average': 2, 'Strong': 3}
    difficulty_numeric = difficulty_map.get(sample_data['difficulty_level'].values[0], 2)
    confidence_numeric = confidence_map.get(sample_data['current_confidence'].values[0], 2)
    sample_data['difficulty_confidence_gap'] = abs(difficulty_numeric - confidence_numeric)
    print(f"✓ difficulty_confidence_gap: {sample_data['difficulty_confidence_gap'].values[0]}")
    
    sample_data['completion_efficiency'] = sample_data['completion_rate'] / (sample_data['duration_minutes'] + 1)
    print(f"✓ completion_efficiency: {sample_data['completion_efficiency'].values[0]:.4f}")
    
    sample_data['grade_match'] = (sample_data['grade_level'] == sample_data['target_grade']).astype(int)
    print(f"✓ grade_match: {sample_data['grade_match'].values[0]}")
    
    sample_data['engagement_score'] = (sample_data['baseline_score'] * sample_data['completion_rate']) / 100
    print(f"✓ engagement_score: {sample_data['engagement_score'].values[0]:.2f}")

# MAKE PREDICTION
print("\n" + "-" * 80)
print("Making Prediction...")
print("-" * 80)

prediction_encoded = model.predict(sample_data)[0]
prediction_proba = model.predict_proba(sample_data)[0]

# Decode prediction if using XGBoost
if label_encoder is not None:
    prediction = label_encoder.inverse_transform([prediction_encoded])[0]
    class_labels = label_encoder.classes_
else:
    prediction = prediction_encoded
    class_labels = model.classes_

print("\n" + "=" * 80)
print("PREDICTION RESULT")
print("=" * 80)
print(f"\n✓ Predicted Feedback: {prediction}")
print(f"\nConfidence Scores:")
for label, prob in zip(class_labels, prediction_proba):
    bar_length = int(prob * 50)  # Scale to 50 characters
    bar = "█" * bar_length + "░" * (50 - bar_length)
    print(f"  {label:12s} {bar} {prob*100:6.2f}%")

print("\n" + "-" * 80)
print("Interpretation:")
print("-" * 80)
if prediction == "Perfect":
    print("✓ This resource is well-suited for the student!")
    print("  The difficulty level matches their confidence and learning goals.")
elif prediction == "Too Hard":
    print("This resource might be too challenging for the student.")
    print("  Consider recommending an easier resource first.")
elif prediction == "Too Slow":
    print("This resource might be too easy for the student.")
    print("  Consider recommending a more advanced resource.")

max_confidence = max(prediction_proba) * 100
if max_confidence >= 80:
    print(f"\n✓ High confidence prediction ({max_confidence:.1f}%) - Very reliable!")
elif max_confidence >= 60:
    print(f"\n✓ Moderate confidence prediction ({max_confidence:.1f}%) - Fairly reliable.")
else:
    print(f"\n Low confidence prediction ({max_confidence:.1f}%) - Use with caution.")

print("\n" + "=" * 80)
print(f"✓ Prediction completed successfully using {model_type} model!")
print("=" * 80)
