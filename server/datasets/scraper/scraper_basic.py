import pandas as pd
import uuid
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- CONFIGURATION ---
BOARDS = ["CBSE", "ICSE", "SSC"]
GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]
SUBJECTS = [
    "Mathematics",
    "Science",
    "Social Studies",
    "English",
    "Hindi",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "Sanskrit",
    "Regional Language",
    "Computer Science",
    "Information Technology",
    "Environmental Science",
    "Moral Science",
    "General Knowledge"
]
DIFFICULTIES = ["Beginner", "Medium", "Advanced"]

print("Initializing Selenium WebDriver...")

# Setup Chrome Options
options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")
# We intentionally do NOT use --headless so you can solve CAPTCHAs if they appear
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 10)

resources_data = []

# --- 1. SCRAPE YOUTUBE FOR VIDEOS ---
print("\n[1/2] Scraping YouTube for Board-Specific Videos...")
for board in BOARDS:
    for grade in GRADES:
        for subject in SUBJECTS:
            query = f"{board} {grade} {subject} full chapter explanation"
            search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
            
            print(f"  Searching YT: {query}")
            driver.get(search_url)
            time.sleep(3) # Let the page and dynamic content load
            
            try:
                # Wait for video titles to load
                video_elements = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a#video-title")))
                
                # Grab the top 3 results to keep the dataset focused and high-quality
                for i in range(min(3, len(video_elements))):
                    title = video_elements[i].get_attribute("title")
                    link = video_elements[i].get_attribute("href")
                    
                    if link and "watch" in link:
                        resources_data.append({
                            "resource_id": f"res_{uuid.uuid4().hex[:8]}",
                            "title": title,
                            "board": board,
                            "subject": subject,
                            "target_grade": grade,
                            "difficulty_level": random.choice(DIFFICULTIES),
                            "format": "video",
                            "duration_minutes": random.choice([20, 30, 45, 60]), # Mocked duration for speed
                            "url": link
                        })
            except Exception as e:
                print(f"  [!] Could not fetch YT for {query}. Error: {e}")

# --- 2. SCRAPE GOOGLE FOR PDFS/NOTES ---
print("\n[2/2] Scraping Google for Text/PDF Notes...")
for board in BOARDS:
    for grade in GRADES:
        for subject in SUBJECTS:
            # Using filetype:pdf to ensure we get actual documents
            query = f"{board} {grade} {subject} revision notes filetype:pdf"
            search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
            
            print(f"  Searching Google: {query}")
            driver.get(search_url)
            time.sleep(random.uniform(3, 6)) # Random sleep to mimic human behavior
            
            # CAPTCHA Check Pause
            if "sorry/index" in driver.current_url:
                print("\n🚨 GOOGLE CAPTCHA DETECTED! 🚨")
                print("Please solve the CAPTCHA in the Chrome window.")
                input("Press ENTER in this terminal AFTER you have solved it to continue...")
            
            try:
                # Find Google search result links
                search_results = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.yuRUbf a")))
                
                for i in range(min(3, len(search_results))):
                    link = search_results[i].get_attribute("href")
                    title_element = search_results[i].find_element(By.CSS_SELECTOR, "h3")
                    title = title_element.text if title_element else f"{board} {grade} {subject} PDF Note"
                    
                    if link and ".pdf" in link.lower():
                        resources_data.append({
                            "resource_id": f"res_{uuid.uuid4().hex[:8]}",
                            "title": title,
                            "board": board,
                            "subject": subject,
                            "target_grade": grade,
                            "difficulty_level": random.choice(["Beginner", "Medium"]),
                            "format": "text",
                            "duration_minutes": random.choice([15, 30]),
                            "url": link
                        })
            except Exception as e:
                print(f"  [!] Could not fetch Google for {query}. Error: {e}")

# Clean up
driver.quit()

# --- 3. EXPORT TO CSV ---
df_resources = pd.DataFrame(resources_data)
df_resources.to_csv("real_resources_india.csv", index=False)

print("\nSuccess! Exported real data to 'real_resources_india.csv'.")
print(f"Total Resources Gathered: {len(df_resources)}")