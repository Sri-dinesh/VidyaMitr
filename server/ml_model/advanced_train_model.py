import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from xgboost import XGBClassifier
import joblib
import warnings
warnings.filterwarnings('ignore')

RANDOM_STATE = 42
TEST_SIZE = 0.2
CV_FOLDS = 3
N_ITER_SEARCH = 20 
MODEL_OUTPUT_PATH = 'recommendation_engine_extreme.pkl'

print("=" * 80)
print("ADVANCED ML TRAINING PIPELINE - XGBoost with Feature Engineering")
print("=" * 80)
print(f"Configuration:")
print(f"  - Random State: {RANDOM_STATE}")
print(f"  - Test Size: {TEST_SIZE * 100}%")
print(f"  - Cross-Validation Folds: {CV_FOLDS}")
print(f"  - Hyperparameter Search Iterations: {N_ITER_SEARCH}")
print("=" * 80)

# STEP 1: DATA LOADING & MERGING
print("\n" + "=" * 80)
print("STEP 1: Loading and Merging Datasets")
print("=" * 80)

try:
    students_df = pd.read_csv('datasets/students_large.csv')
    resources_df = pd.read_csv('datasets/resources_large.csv')
    interactions_df = pd.read_csv('datasets/interactions_large.csv')

    print(f"✓ Loaded students.csv: {students_df.shape[0]} rows, {students_df.shape[1]} columns")
    print(f"✓ Loaded resources.csv: {resources_df.shape[0]} rows, {resources_df.shape[1]} columns")
    print(f"✓ Loaded interactions.csv: {interactions_df.shape[0]} rows, {interactions_df.shape[1]} columns")

    merged_df = interactions_df.merge(
        students_df[['student_id', 'grade_level', 'preferred_format', 'baseline_score']], 
        on='student_id', 
        how='left'
    )

    merged_df = merged_df.merge(
        resources_df[['resource_id', 'subject', 'target_grade', 'difficulty_level', 'format', 'duration_minutes']], 
        on='resource_id', 
        how='left'
    )

    print(f"✓ Merged dataset: {merged_df.shape[0]} rows, {merged_df.shape[1]} columns")

    initial_rows = len(merged_df)
    merged_df = merged_df.dropna(subset=['feedback_label'])
    dropped_rows = initial_rows - len(merged_df)
    print(f"✓ Dropped {dropped_rows} rows with missing feedback_label")
    print(f"✓ Final dataset: {merged_df.shape[0]} rows")

    missing_counts = merged_df.isnull().sum()
    if missing_counts.sum() > 0:
        print(f"\nWarning: Missing values detected:")
        print(missing_counts[missing_counts > 0])
        merged_df['baseline_score'].fillna(merged_df['baseline_score'].median(), inplace=True)
        merged_df['duration_minutes'].fillna(merged_df['duration_minutes'].median(), inplace=True)
        merged_df['completion_rate'].fillna(0, inplace=True)
        print("✓ Missing values filled with median/default values")

except FileNotFoundError as e:
    print(f"Error: Could not find CSV files. Make sure you're in the ml_model directory.")
    print(f"   {str(e)}")
    exit(1)
except Exception as e:
    print(f"Error during data loading: {str(e)}")
    exit(1)

# STEP 2: ADVANCED FEATURE ENGINEERING
print("\n" + "=" * 80)
print("STEP 2: Advanced Feature Engineering")
print("=" * 80)

merged_df['format_match'] = (merged_df['preferred_format'] == merged_df['format']).astype(int)
print("✓ Created 'format_match': Binary flag (1 if preferred_format == format, else 0)")

merged_df['score_duration_ratio'] = merged_df['baseline_score'] / (merged_df['duration_minutes'] + 1)  
print("✓ Created 'score_duration_ratio': baseline_score / duration_minutes")

difficulty_map = {'Beginner': 1, 'Medium': 2, 'Advanced': 3}
confidence_map = {'Weak': 1, 'Average': 2, 'Strong': 3}
merged_df['difficulty_numeric'] = merged_df['difficulty_level'].map(difficulty_map).fillna(2)
merged_df['confidence_numeric'] = merged_df['current_confidence'].map(confidence_map).fillna(2)
merged_df['difficulty_confidence_gap'] = abs(merged_df['difficulty_numeric'] - merged_df['confidence_numeric'])
print("✓ Created 'difficulty_confidence_gap': Absolute difference between difficulty and confidence levels")

merged_df['completion_efficiency'] = merged_df['completion_rate'] / (merged_df['duration_minutes'] + 1)
print("✓ Created 'completion_efficiency': completion_rate / duration_minutes")

merged_df['grade_match'] = (merged_df['grade_level'] == merged_df['target_grade']).astype(int)
print("✓ Created 'grade_match': Binary flag (1 if grade_level == target_grade, else 0)")

merged_df['engagement_score'] = (merged_df['baseline_score'] * merged_df['completion_rate']) / 100
print("✓ Created 'engagement_score': (baseline_score * completion_rate) / 100")

print(f"\n✓ Total engineered features: 6")
print(f"✓ New dataset shape: {merged_df.shape}")

# STEP 3: FEATURE SELECTION & PREPROCESSING PIPELINE
print("\n" + "=" * 80)
print("STEP 3: Feature Selection & Preprocessing Pipeline")
print("=" * 80)

feature_columns = [
    'grade_level',
    'preferred_format',
    'baseline_score',
    'intent_goal',
    'current_confidence',
    'difficulty_level',
    'format',
    'subject',
    'duration_minutes',
    'completion_rate',
    'format_match',
    'score_duration_ratio',
    'difficulty_confidence_gap',
    'completion_efficiency',
    'grade_match',
    'engagement_score',
]

X = merged_df[feature_columns].copy()
y = merged_df['feedback_label'].copy()

print(f"✓ Features (X): {X.shape[0]} rows, {X.shape[1]} columns")
print(f"✓ Target (y): {y.shape[0]} samples")
print(f"\nTarget distribution:")
print(y.value_counts())
print(f"\nTarget percentages:")
print(y.value_counts(normalize=True) * 100)

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)
print(f"\n✓ Target encoded: {label_encoder.classes_}")
print(f"  Mapping: {dict(enumerate(label_encoder.classes_))}")

numerical_features = [
    'baseline_score',
    'duration_minutes',
    'completion_rate',
    'format_match',
    'score_duration_ratio',
    'difficulty_confidence_gap',
    'completion_efficiency',
    'grade_match',
    'engagement_score',
]

categorical_features = [
    'grade_level',
    'preferred_format',
    'intent_goal',
    'current_confidence',
    'difficulty_level',
    'format',
    'subject',
]

print(f"\n✓ Numerical features ({len(numerical_features)}): {numerical_features}")
print(f"✓ Categorical features ({len(categorical_features)}): {categorical_features}")

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numerical_features),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
    ],
    remainder='drop'
)

print("✓ Preprocessing pipeline created:")
print("  - StandardScaler for numerical features")
print("  - OneHotEncoder for categorical features (handle_unknown='ignore')")

# STEP 4: TRAIN-TEST SPLIT
print("\n" + "=" * 80)
print("STEP 4: Train-Test Split")
print("=" * 80)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y_encoded
)

print(f"✓ Train set: {X_train.shape[0]} samples ({(1-TEST_SIZE)*100:.0f}%)")
print(f"✓ Test set: {X_test.shape[0]} samples ({TEST_SIZE*100:.0f}%)")

train_dist = pd.Series(y_train).value_counts(normalize=True) * 100
test_dist = pd.Series(y_test).value_counts(normalize=True) * 100
print(f"\nTrain set distribution:")
for idx, pct in train_dist.items():
    print(f"  {label_encoder.classes_[idx]}: {pct:.2f}%")
print(f"\nTest set distribution:")
for idx, pct in test_dist.items():
    print(f"  {label_encoder.classes_[idx]}: {pct:.2f}%")

# STEP 5: STATE-OF-THE-ART MODELING (XGBoost with Hyperparameter Tuning)
print("\n" + "=" * 80)
print("STEP 5: XGBoost Model with Hyperparameter Tuning")
print("=" * 80)

xgb_classifier = XGBClassifier(
    objective='multi:softprob', 
    num_class=len(label_encoder.classes_),
    random_state=RANDOM_STATE,
    eval_metric='mlogloss',
    use_label_encoder=False,
    verbosity=0
)

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', xgb_classifier)
])

# Define hyperparameter search space
param_distributions = {
    'classifier__max_depth': [3, 4, 5, 6, 7, 8],
    'classifier__learning_rate': [0.01, 0.05, 0.1, 0.15, 0.2],
    'classifier__n_estimators': [100, 200, 300, 400, 500],
    'classifier__min_child_weight': [1, 3, 5, 7],
    'classifier__gamma': [0, 0.1, 0.2, 0.3],
    'classifier__subsample': [0.6, 0.7, 0.8, 0.9, 1.0],
    'classifier__colsample_bytree': [0.6, 0.7, 0.8, 0.9, 1.0],
    'classifier__reg_alpha': [0, 0.01, 0.1, 1],
    'classifier__reg_lambda': [0, 0.01, 0.1, 1],
}

print(f"✓ Hyperparameter search space defined:")
print(f"  - max_depth: {param_distributions['classifier__max_depth']}")
print(f"  - learning_rate: {param_distributions['classifier__learning_rate']}")
print(f"  - n_estimators: {param_distributions['classifier__n_estimators']}")
print(f"  - min_child_weight: {param_distributions['classifier__min_child_weight']}")
print(f"  - gamma: {param_distributions['classifier__gamma']}")
print(f"  - subsample: {param_distributions['classifier__subsample']}")
print(f"  - colsample_bytree: {param_distributions['classifier__colsample_bytree']}")
print(f"  - reg_alpha: {param_distributions['classifier__reg_alpha']}")
print(f"  - reg_lambda: {param_distributions['classifier__reg_lambda']}")

# Perform randomized search with cross-validation
print(f"\n🔍 Starting RandomizedSearchCV with {N_ITER_SEARCH} iterations and {CV_FOLDS}-fold CV...")
print("   This may take several minutes. Progress will be shown below.")
print("-" * 80)

random_search = RandomizedSearchCV(
    pipeline,
    param_distributions=param_distributions,
    n_iter=N_ITER_SEARCH,
    cv=CV_FOLDS,
    scoring='f1_macro',  
    n_jobs=-1, 
    random_state=RANDOM_STATE,
    verbose=2, 
    return_train_score=True
)

# Fit the model
random_search.fit(X_train, y_train)

print("-" * 80)
print("✓ Hyperparameter tuning completed!")

best_params = random_search.best_params_
best_score = random_search.best_score_

print(f"\Best Parameters Found:")
for param, value in best_params.items():
    print(f"  {param}: {value}")

print(f"\n✓ Best Cross-Validation F1-Score (macro): {best_score:.4f} ({best_score*100:.2f}%)")

best_model = random_search.best_estimator_

# STEP 6: EVALUATION ON TEST SET
print("\n" + "=" * 80)
print("STEP 6: Model Evaluation on Test Set")
print("=" * 80)

y_pred_encoded = best_model.predict(X_test)
y_pred_proba = best_model.predict_proba(X_test)

y_pred = label_encoder.inverse_transform(y_pred_encoded)
y_test_original = label_encoder.inverse_transform(y_test)

accuracy = accuracy_score(y_test_original, y_pred)
f1_macro = f1_score(y_test_original, y_pred, average='macro')
f1_weighted = f1_score(y_test_original, y_pred, average='weighted')

print(f"\n✓ Test Set Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"✓ Test Set F1-Score (macro): {f1_macro:.4f} ({f1_macro*100:.2f}%)")
print(f"✓ Test Set F1-Score (weighted): {f1_weighted:.4f} ({f1_weighted*100:.2f}%)")

print("\n" + "-" * 80)
print("Classification Report:")
print("-" * 80)
print(classification_report(y_test_original, y_pred, zero_division=0))

# Confusion matrix
print("-" * 80)
print("Confusion Matrix:")
print("-" * 80)
cm = confusion_matrix(y_test_original, y_pred)
cm_df = pd.DataFrame(
    cm,
    index=[f'Actual: {label}' for label in label_encoder.classes_],
    columns=[f'Predicted: {label}' for label in label_encoder.classes_]
)
print(cm_df)

print("\n" + "-" * 80)
print("Top 15 Most Important Features:")
print("-" * 80)

feature_names_num = numerical_features
feature_names_cat = list(
    best_model.named_steps['preprocessor']
    .named_transformers_['cat']
    .get_feature_names_out(categorical_features)
)
all_feature_names = feature_names_num + feature_names_cat

importances = best_model.named_steps['classifier'].feature_importances_
feature_importance_df = pd.DataFrame({
    'feature': all_feature_names,
    'importance': importances
}).sort_values('importance', ascending=False)

print(feature_importance_df.head(15).to_string(index=False))

# STEP 7: EXPORT MODEL
print("\n" + "=" * 80)
print("STEP 7: Exporting Trained Model")
print("=" * 80)

joblib.dump(best_model, MODEL_OUTPUT_PATH)
print(f"✓ Model successfully exported to: {MODEL_OUTPUT_PATH}")
print(f"✓ File size: {joblib.os.path.getsize(MODEL_OUTPUT_PATH) / 1024:.2f} KB")

label_encoder_path = 'label_encoder.pkl'
joblib.dump(label_encoder, label_encoder_path)
print(f"✓ Label encoder saved to: {label_encoder_path}")

# STEP 8: TRAINING SUMMARY
print("\n" + "=" * 80)
print("TRAINING SUMMARY")
print("=" * 80)
print(f"✓ Total samples processed: {len(merged_df)}")
print(f"✓ Training samples: {len(X_train)}")
print(f"✓ Test samples: {len(X_test)}")
print(f"✓ Number of features: {len(feature_columns)}")
print(f"✓ Engineered features: 6")
print(f"✓ Model: XGBoost Classifier")
print(f"✓ Hyperparameter tuning: RandomizedSearchCV ({N_ITER_SEARCH} iterations)")
print(f"✓ Best CV F1-Score: {best_score*100:.2f}%")
print(f"✓ Test Accuracy: {accuracy*100:.2f}%")
print(f"✓ Test F1-Score (macro): {f1_macro*100:.2f}%")
print(f"✓ Model saved as: {MODEL_OUTPUT_PATH}")
print("\n✓ Advanced training pipeline completed successfully!")
print("=" * 80)

# STEP 9: COMPARISON WITH BASELINE
print("\n" + "=" * 80)
print("COMPARISON WITH BASELINE MODEL")
print("=" * 80)
baseline_accuracy = 0.68  
improvement = ((accuracy - baseline_accuracy) / baseline_accuracy) * 100

print(f"Baseline Model (Random Forest): {baseline_accuracy*100:.2f}%")
print(f"Advanced Model (XGBoost): {accuracy*100:.2f}%")
if improvement > 0:
    print(f"✓ Improvement: +{improvement:.2f}% ({accuracy*100 - baseline_accuracy*100:.2f} percentage points)")
else:
    print(f"Change: {improvement:.2f}%")

print("\n" + "=" * 80)
print("TRAINING COMPLETE - MODEL READY FOR DEPLOYMENT")
print("=" * 80)
