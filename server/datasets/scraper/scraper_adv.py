import pandas as pd
import uuid
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# --- FULL SUBJECT LIST ---
SUBJECTS = [
    "Mathematics", "Science", "English", "Hindi", "Social Science", 
    "Physics", "Chemistry", "Biology", "History", "Geography", 
    "Civics", "Economics", "Sanskrit", "Computer Science", 
    "Information Technology", "Environmental Science", "General Knowledge"
]
GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]
BOARDS = ["CBSE", "ICSE", "SSC"]
DIFFICULTIES = ["Beginner", "Medium", "Advanced"]

# --- SELENIUM SETUP ---
chrome_options = Options()
chrome_options.add_argument("--start-maximized")
# We keep the window visible to solve any CAPTCHAs manually if they appear
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

resources = []

def scrape_youtube(query, board, grade, subject):
    """Scrapes top 3 videos for a specific query."""
    search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
    driver.get(search_url)
    time.sleep(2) # Allow JS to load
    
    videos = driver.find_elements(By.CSS_SELECTOR, "a#video-title")[:3]
    for v in videos:
        title = v.get_attribute("title")
        link = v.get_attribute("href")
        if link:
            resources.append({
                "resource_id": f"res_{uuid.uuid4().hex[:8]}",
                "title": title,
                "board": board,
                "subject": subject,
                "target_grade": grade,
                "difficulty_level": random.choice(DIFFICULTIES),
                "format": "video",
                "duration_minutes": random.randint(15, 45),
                "url": link
            })

def scrape_google_pdf(query, board, grade, subject):
    """Scrapes top 2 PDF links for a specific query."""
    search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}+filetype:pdf"
    driver.get(search_url)
    time.sleep(random.uniform(2, 4))
    
    # Check for Captcha
    if "sorry/index" in driver.current_url:
        print(f"!!! CAPTCHA detected for {query}. Please solve it in the browser.")
        input("Press Enter after solving...")

    results = driver.find_elements(By.CSS_SELECTOR, "div.yuRUbf a")[:2]
    for r in results:
        link = r.get_attribute("href")
        try:
            title = r.find_element(By.TAG_NAME, "h3").text
        except:
            title = f"{board} {grade} {subject} Notes"
            
        if link and (".pdf" in link.lower() or "drive.google" in link):
            resources.append({
                "resource_id": f"res_{uuid.uuid4().hex[:8]}",
                "title": title,
                "board": board,
                "subject": subject,
                "target_grade": grade,
                "difficulty_level": random.choice(["Beginner", "Medium"]),
                "format": "text",
                "duration_minutes": random.randint(10, 30),
                "url": link
            })

# --- MAIN EXECUTION LOOP ---
try:
    for board in BOARDS:
        for grade in GRADES:
            for subject in SUBJECTS:
                print(f"Scraping: {board} | {grade} | {subject}...")
                
                # 1. Scrape Video Data
                yt_query = f"{board} {grade} {subject} full chapter explanation"
                scrape_youtube(yt_query, board, grade, subject)
                
                # 2. Scrape PDF Data
                pdf_query = f"{board} {grade} {subject} revision notes"
                scrape_google_pdf(pdf_query, board, grade, subject)
                
                # Save checkpoint every 50 records to avoid data loss
                if len(resources) % 50 == 0:
                    pd.DataFrame(resources).to_csv("resources_checkpoint.csv", index=False)
                    print(f"--- Checkpoint Saved: {len(resources)} records ---")

finally:
    # Final Export
    df = pd.DataFrame(resources)
    df.to_csv("final_resources_500.csv", index=False)
    driver.quit()
    print(f"Done! Generated {len(df)} records in final_resources_500.csv")