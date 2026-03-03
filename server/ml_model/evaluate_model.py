import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import cross_val_score, cross_validate
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("MODEL EVALUATION AND ANALYSIS - XGBoost Edition")
print("=" * 80)

# Load data
print("\n1. Loading datasets...")
students_df = pd.read_csv('datasets/students_large.csv')
resources_df = pd.read_csv('datasets/resources_large.csv')
interactions_df = pd.read_csv('datasets/interactions_large.csv')

print(f"✓ Loaded students.csv: {students_df.shape[0]} rows")
print(f"✓ Loaded resources.csv: {resources_df.shape[0]} rows")
print(f"✓ Loaded interactions.csv: {interactions_df.shape[0]} rows")

# Merge datasets
merged_df = interactions_df.merge(
    students_df[['student_id', 'grade_level', 'preferred_format', 'baseline_score']], 
    on='student_id', how='left'
).merge(
    resources_df[['resource_id', 'subject', 'target_grade', 'difficulty_level', 'format', 'duration_minutes']], 
    on='resource_id', how='left'
)

# Drop rows with missing feedback_label
initial_rows = len(merged_df)
merged_df = merged_df.dropna(subset=['feedback_label'])
dropped_rows = initial_rows - len(merged_df)
print(f"✓ Merged dataset: {len(merged_df)} rows (dropped {dropped_rows} with missing feedback)")

# Fill missing values
merged_df['baseline_score'].fillna(merged_df['baseline_score'].median(), inplace=True)
merged_df['duration_minutes'].fillna(merged_df['duration_minutes'].median(), inplace=True)
merged_df['completion_rate'].fillna(0, inplace=True)

print("\n2. Engineering advanced features...")

merged_df['format_match'] = (merged_df['preferred_format'] == merged_df['format']).astype(int)

merged_df['score_duration_ratio'] = merged_df['baseline_score'] / (merged_df['duration_minutes'] + 1)

difficulty_map = {'Beginner': 1, 'Medium': 2, 'Advanced': 3}
confidence_map = {'Weak': 1, 'Average': 2, 'Strong': 3}
merged_df['difficulty_numeric'] = merged_df['difficulty_level'].map(difficulty_map).fillna(2)
merged_df['confidence_numeric'] = merged_df['current_confidence'].map(confidence_map).fillna(2)
merged_df['difficulty_confidence_gap'] = abs(merged_df['difficulty_numeric'] - merged_df['confidence_numeric'])

merged_df['completion_efficiency'] = merged_df['completion_rate'] / (merged_df['duration_minutes'] + 1)

merged_df['grade_match'] = (merged_df['grade_level'] == merged_df['target_grade']).astype(int)

merged_df['engagement_score'] = (merged_df['baseline_score'] * merged_df['completion_rate']) / 100

print("✓ Created 6 engineered features")

feature_columns = [
    'grade_level', 'preferred_format', 'baseline_score', 'intent_goal',
    'current_confidence', 'difficulty_level', 'format', 'subject',
    'duration_minutes', 'completion_rate',
    'format_match', 'score_duration_ratio', 'difficulty_confidence_gap',
    'completion_efficiency', 'grade_match', 'engagement_score'
]

X = merged_df[feature_columns]
y = merged_df['feedback_label']

print(f"✓ Total samples: {len(X)}")
print(f"✓ Total features: {len(feature_columns)}")

# Load trained model
print("\n3. Loading trained model...")
try:
    model = joblib.load('recommendation_engine_extreme.pkl')
    label_encoder = joblib.load('label_encoder.pkl')
    model_type = "XGBoost"
    print("✓ Advanced XGBoost model loaded successfully")
    print(f"✓ Label encoder classes: {label_encoder.classes_}")
    
    y_encoded = label_encoder.transform(y)
    use_encoded = True
    
except FileNotFoundError:
    model = joblib.load('recommendation_engine.pkl')
    label_encoder = None
    model_type = "Random Forest"
    y_encoded = y
    use_encoded = False
    print("✓ Random Forest model loaded successfully")
    print("Note: Using legacy model without engineered features")
    
    # Use only original features for Random Forest
    feature_columns = feature_columns[:10]
    X = merged_df[feature_columns]

print(f"✓ Model type: {model_type}")

# Cross-validation
print("\n4. Performing 5-Fold Cross-Validation...")
print("   (This may take a few minutes...)")
cv_scores = cross_val_score(model, X, y_encoded, cv=5, scoring='accuracy', n_jobs=-1)

print(f"\nCross-Validation Results:")
print(f"  - Fold 1: {cv_scores[0]:.4f} ({cv_scores[0]*100:.2f}%)")
print(f"  - Fold 2: {cv_scores[1]:.4f} ({cv_scores[1]*100:.2f}%)")
print(f"  - Fold 3: {cv_scores[2]:.4f} ({cv_scores[2]*100:.2f}%)")
print(f"  - Fold 4: {cv_scores[3]:.4f} ({cv_scores[3]*100:.2f}%)")
print(f"  - Fold 5: {cv_scores[4]:.4f} ({cv_scores[4]*100:.2f}%)")
print(f"\n  Mean Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
print(f"  Std Deviation: {cv_scores.std():.4f}")

# Detailed cross-validation with multiple metrics
print("\n5. Multi-Metric Cross-Validation...")
scoring = ['accuracy', 'precision_macro', 'recall_macro', 'f1_macro']
cv_results = cross_validate(model, X, y_encoded, cv=5, scoring=scoring, n_jobs=-1)

print(f"\nAverage Scores Across 5 Folds:")
print(f"  - Accuracy:  {cv_results['test_accuracy'].mean():.4f} (+/- {cv_results['test_accuracy'].std() * 2:.4f})")
print(f"  - Precision: {cv_results['test_precision_macro'].mean():.4f} (+/- {cv_results['test_precision_macro'].std() * 2:.4f})")
print(f"  - Recall:    {cv_results['test_recall_macro'].mean():.4f} (+/- {cv_results['test_recall_macro'].std() * 2:.4f})")
print(f"  - F1-Score:  {cv_results['test_f1_macro'].mean():.4f} (+/- {cv_results['test_f1_macro'].std() * 2:.4f})")

# Analyze predictions by category
print("\n6. Analyzing Predictions by Category...")
predictions_encoded = model.predict(X)

if use_encoded and label_encoder is not None:
    predictions = label_encoder.inverse_transform(predictions_encoded)
else:
    predictions = predictions_encoded

# By grade level
print("\n  Accuracy by Grade Level:")
for grade in sorted(X['grade_level'].unique()):
    mask = X['grade_level'] == grade
    if mask.sum() > 0:
        grade_accuracy = (predictions[mask] == y[mask]).mean()
        sample_count = mask.sum()
        print(f"    - {grade}: {grade_accuracy:.4f} ({grade_accuracy*100:.2f}%) - {sample_count} samples")

# By difficulty level
print("\n  Accuracy by Difficulty Level:")
for difficulty in ['Beginner', 'Medium', 'Advanced']:
    mask = X['difficulty_level'] == difficulty
    if mask.sum() > 0:
        diff_accuracy = (predictions[mask] == y[mask]).mean()
        sample_count = mask.sum()
        print(f"    - {difficulty}: {diff_accuracy:.4f} ({diff_accuracy*100:.2f}%) - {sample_count} samples")

# By subject
print("\n  Accuracy by Subject:")
for subject in sorted(X['subject'].unique()):
    mask = X['subject'] == subject
    if mask.sum() > 0:
        subj_accuracy = (predictions[mask] == y[mask]).mean()
        sample_count = mask.sum()
        print(f"    - {subject}: {subj_accuracy:.4f} ({subj_accuracy*100:.2f}%) - {sample_count} samples")

# By confidence level
print("\n  Accuracy by Student Confidence Level:")
for confidence in ['Weak', 'Average', 'Strong']:
    mask = X['current_confidence'] == confidence
    if mask.sum() > 0:
        conf_accuracy = (predictions[mask] == y[mask]).mean()
        sample_count = mask.sum()
        print(f"    - {confidence}: {conf_accuracy:.4f} ({conf_accuracy*100:.2f}%) - {sample_count} samples")

# Error analysis
print("\n7. Error Analysis...")
errors = predictions != y
error_rate = errors.mean()
print(f"\n  Overall Error Rate: {error_rate:.4f} ({error_rate*100:.2f}%)")
print(f"  Overall Accuracy: {(1-error_rate):.4f} ({(1-error_rate)*100:.2f}%)")

print("\n  Most Common Misclassifications:")
misclass_df = pd.DataFrame({
    'actual': y[errors],
    'predicted': predictions[errors]
})
misclass_counts = misclass_df.groupby(['actual', 'predicted']).size().sort_values(ascending=False)
print(misclass_counts.head(5).to_string())

print("\n8. Detailed Classification Report...")
print("-" * 80)
print(classification_report(y, predictions, zero_division=0))

print("-" * 80)
print("Confusion Matrix:")
print("-" * 80)
cm = confusion_matrix(y, predictions)
class_labels = sorted(y.unique())
cm_df = pd.DataFrame(
    cm,
    index=[f'Actual: {label}' for label in class_labels],
    columns=[f'Predicted: {label}' for label in class_labels]
)
print(cm_df)

print("\n9. Prediction Confidence Analysis...")
probabilities = model.predict_proba(X)
max_probs = probabilities.max(axis=1)

print(f"\n  Average Confidence: {max_probs.mean():.4f} ({max_probs.mean()*100:.2f}%)")
print(f"  Median Confidence: {np.median(max_probs):.4f} ({np.median(max_probs)*100:.2f}%)")
print(f"  Min Confidence: {max_probs.min():.4f} ({max_probs.min()*100:.2f}%)")
print(f"  Max Confidence: {max_probs.max():.4f} ({max_probs.max()*100:.2f}%)")

correct_mask = predictions == y
print(f"\n  Average Confidence (Correct Predictions): {max_probs[correct_mask].mean():.4f} ({max_probs[correct_mask].mean()*100:.2f}%)")
print(f"  Average Confidence (Incorrect Predictions): {max_probs[~correct_mask].mean():.4f} ({max_probs[~correct_mask].mean()*100:.2f}%)")

print("\n  Confidence Distribution:")
for threshold in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]:
    count = (max_probs >= threshold).sum()
    pct = count / len(max_probs) * 100
    print(f"    - Confidence >= {threshold:.1f}: {count} predictions ({pct:.2f}%)")

low_conf_threshold = 0.5
low_conf_count = (max_probs < low_conf_threshold).sum()
print(f"\n  Predictions with Confidence < {low_conf_threshold}: {low_conf_count} ({low_conf_count/len(max_probs)*100:.2f}%)")

if hasattr(model, 'named_steps') and hasattr(model.named_steps.get('classifier', None), 'feature_importances_'):
    print("\n10. Feature Importance Analysis...")
    print("-" * 80)
    
    numerical_features = [
        'baseline_score', 'duration_minutes', 'completion_rate',
        'format_match', 'score_duration_ratio', 'difficulty_confidence_gap',
        'completion_efficiency', 'grade_match', 'engagement_score'
    ]
    categorical_features = [
        'grade_level', 'preferred_format', 'intent_goal',
        'current_confidence', 'difficulty_level', 'format', 'subject'
    ]
    
    feature_names_cat = list(
        model.named_steps['preprocessor']
        .named_transformers_['cat']
        .get_feature_names_out(categorical_features)
    )
    all_feature_names = numerical_features + feature_names_cat
    
    importances = model.named_steps['classifier'].feature_importances_
    feature_importance_df = pd.DataFrame({
        'feature': all_feature_names,
        'importance': importances
    }).sort_values('importance', ascending=False)
    
    print("\nTop 20 Most Important Features:")
    print(feature_importance_df.head(20).to_string(index=False))
    
    print("\n\nEngineered Features Importance:")
    engineered_features = [
        'format_match', 'score_duration_ratio', 'difficulty_confidence_gap',
        'completion_efficiency', 'grade_match', 'engagement_score'
    ]
    for feat in engineered_features:
        if feat in feature_importance_df['feature'].values:
            importance = feature_importance_df[feature_importance_df['feature'] == feat]['importance'].values[0]
            print(f"  - {feat}: {importance:.6f} ({importance*100:.2f}%)")

print("\n" + "=" * 80)
print(f"✓ Evaluation completed successfully for {model_type} model!")
print("=" * 80)
print(f"\nSummary:")
print(f"  - Model Type: {model_type}")
print(f"  - Total Samples: {len(X)}")
print(f"  - Total Features: {len(feature_columns)}")
print(f"  - Overall Accuracy: {(1-error_rate)*100:.2f}%")
print(f"  - Mean CV Accuracy: {cv_scores.mean()*100:.2f}%")
print(f"  - Average Confidence: {max_probs.mean()*100:.2f}%")
print("=" * 80)
