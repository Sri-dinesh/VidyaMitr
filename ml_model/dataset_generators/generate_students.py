import pandas as pd
import numpy as np
import uuid
from faker import Faker

NUM_STUDENTS = 5000
fake = Faker('en_IN') 

GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]
FORMATS = ["video", "text"]
FORMAT_PROBABILITIES = [0.7, 0.3] 

print(f"Generating {NUM_STUDENTS} advanced student records...")

raw_scores = np.random.normal(loc=68, scale=15, size=NUM_STUDENTS)
realistic_scores = np.clip(raw_scores, 20, 100).astype(int)

students_data = []

for i in range(NUM_STUDENTS):
    students_data.append({
        "student_id": f"stu_{uuid.uuid4().hex[:8]}",
        "name": fake.name(),
        "grade_level": np.random.choice(GRADES),
        "preferred_format": np.random.choice(FORMATS, p=FORMAT_PROBABILITIES),
        "baseline_score": realistic_scores[i]
    })

df_students = pd.DataFrame(students_data)

df_students.to_csv("students.csv", index=False)

print("\Success! Exported advanced realistic data to 'students.csv'.")
print("Data Profile:")
print(f"- Total Records: {len(df_students)}")
print(f"- Average Baseline Score: {df_students['baseline_score'].mean():.1f}")
print(f"- Video Preference Rate: {(df_students['preferred_format'] == 'video').mean() * 100:.1f}%")