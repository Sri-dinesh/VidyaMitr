import pandas as pd
import random
import uuid

print("Loading existing students and new resources...")
students_df = pd.read_csv("students.csv")
resources_df = pd.read_csv("resources_large.csv")

students_data = students_df.to_dict('records')
resources_data = resources_df.to_dict('records')

NUM_INTERACTIONS = 5000
INTENTS = ["Board Prep", "Daily Revision", "Homework Help"]
CONFIDENCES = ["Weak", "Average", "Strong"]

print("Generating 5000 new interactions with the updated 900 resources...")
interactions_data = []

for _ in range(NUM_INTERACTIONS):
    student = random.choice(students_data)
    
    valid_resources = [r for r in resources_data if r['target_grade'] == student['grade_level']]
    resource = random.choice(valid_resources) if valid_resources else random.choice(resources_data)

    intent = random.choice(INTENTS)
    confidence = random.choice(CONFIDENCES)
    
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
df_interactions.to_csv("interactions.csv", index=False)

print("Success! New interactions.csv generated. You are ready to train.")