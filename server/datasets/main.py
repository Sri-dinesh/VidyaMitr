import pandas as pd
import random
import uuid

# --- CONFIGURATION ---
NUM_STUDENTS = 1000
NUM_RESOURCES = 200
NUM_INTERACTIONS = 5000

GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]
FORMATS = ["video", "text"]
SUBJECTS = ["Mathematics", "Science", "English", "Social Studies"]
DIFFICULTIES = ["Beginner", "Medium", "Advanced"]
INTENTS = ["Board Prep", "Daily Revision", "Homework Help"]
CONFIDENCES = ["Weak", "Average", "Strong"]

# Realistic Indian EdTech Data
FIRST_NAMES = ["Aarav", "Priya", "Rahul", "Ananya", "Rohan", "Sneha", "Karan", "Diya", "Aditya", "Kavya"]
LAST_NAMES = ["Sharma", "Patel", "Reddy", "Singh", "Kumar", "Gupta", "Desai", "Joshi", "Rao", "Nair"]

RESOURCE_PREFIXES = {
    "Beginner": ["NCERT Foundation", "Basics of", "Introduction to", "Step-by-Step"],
    "Medium": ["Concept Guide:", "Standard Revision:", "Chapter Summary:"],
    "Advanced": ["Olympiad Prep:", "Advanced Problem Solving:", "Board Exam Masterclass:"]
}

print("Generating Realistic Synthetic Data...")

# --- 1. GENERATE STUDENTS (Now with Names!) ---
students_data = []
for _ in range(NUM_STUDENTS):
    students_data.append({
        "student_id": f"stu_{uuid.uuid4().hex[:8]}",
        "name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
        "grade_level": random.choice(GRADES),
        "preferred_format": random.choice(FORMATS),
        "baseline_score": random.randint(40, 100)
    })
df_students = pd.DataFrame(students_data)

# --- 2. GENERATE RESOURCES (Now with Titles & URLs!) ---
resources_data = []
for _ in range(NUM_RESOURCES):
    grade = random.choice(GRADES)
    subject = random.choice(SUBJECTS)
    difficulty = random.choice(DIFFICULTIES)
    format_type = random.choice(FORMATS)
    
    # Create a realistic title
    prefix = random.choice(RESOURCE_PREFIXES[difficulty])
    title = f"{prefix} {grade} {subject} ({format_type.capitalize()})"
    
    resources_data.append({
        "resource_id": f"res_{uuid.uuid4().hex[:8]}",
        "title": title,
        "subject": subject,
        "target_grade": grade,
        "difficulty_level": difficulty,
        "format": format_type,
        "duration_minutes": random.choice([15, 30, 45, 60, 90, 120]),
        "url": f"https://example.com/learn/{subject.lower()}/{grade.replace(' ', '').lower()}"
    })
df_resources = pd.DataFrame(resources_data)

# --- 3. GENERATE INTERACTIONS (The ML Training Data) ---
# (This keeps the exact same smart logic from before so the ML model can learn)
interactions_data = []
for _ in range(NUM_INTERACTIONS):
    student = random.choice(students_data)
    valid_resources = df_resources[df_resources['target_grade'] == student['grade_level']]
    
    if valid_resources.empty:
        resource = random.choice(resources_data) 
    else:
        resource = valid_resources.sample(1).iloc[0].to_dict()

    intent = random.choice(INTENTS)
    confidence = random.choice(CONFIDENCES)
    
    # ML Bias Logic
    if confidence == "Weak" and resource["difficulty_level"] == "Advanced":
        feedback = "Too Hard"
        completion = random.randint(10, 40)
    elif confidence == "Strong" and resource["difficulty_level"] == "Beginner":
        feedback = "Too Slow"
        completion = random.randint(30, 80)
    elif (confidence == "Weak" and resource["difficulty_level"] == "Beginner") or \
         (confidence == "Average" and resource["difficulty_level"] == "Medium") or \
         (confidence == "Strong" and resource["difficulty_level"] == "Advanced"):
        feedback = "Perfect"
        completion = random.randint(80, 100)
    elif student["preferred_format"] != resource["format"]:
        feedback = random.choices(["Too Hard", "Too Slow", "Perfect"], weights=[0.4, 0.4, 0.2])[0]
        completion = random.randint(40, 85)
    else:
        feedback = random.choice(["Too Hard", "Too Slow", "Perfect"])
        completion = random.randint(50, 95)

    interactions_data.append({
        "interaction_id": f"int_{uuid.uuid4().hex[:12]}",
        "student_id": student["student_id"],
        "resource_id": resource["resource_id"],
        "intent_goal": intent,
        "current_confidence": confidence,
        "completion_rate": completion,
        "feedback_label": feedback
    })

df_interactions = pd.DataFrame(interactions_data)

# --- 4. EXPORT TO CSV ---
df_students.to_csv("students.csv", index=False)
df_resources.to_csv("resources.csv", index=False)
df_interactions.to_csv("interactions.csv", index=False)

print(f"Success! Exported realistic data with names and titles.")