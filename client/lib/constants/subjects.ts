export const SUBJECTS = [
  // Core Subjects
  { value: 'Mathematics', label: 'Mathematics', icon: '🔢' },
  { value: 'Science', label: 'Science', icon: '🔬' },
  { value: 'English', label: 'English', icon: '📚' },
  { value: 'Hindi', label: 'Hindi', icon: '🇮🇳' },
  { value: 'Social Science', label: 'Social Science', icon: '🌍' },
  
  // Science Branches (Class 9-10)
  { value: 'Physics', label: 'Physics', icon: '⚛️' },
  { value: 'Chemistry', label: 'Chemistry', icon: '🧪' },
  { value: 'Biology', label: 'Biology', icon: '🧬' },
  
  // Social Science Branches
  { value: 'History', label: 'History', icon: '📜' },
  { value: 'Geography', label: 'Geography', icon: '🗺️' },
  { value: 'Civics', label: 'Civics (Political Science)', icon: '⚖️' },
  { value: 'Economics', label: 'Economics', icon: '💰' },
  
  // Languages
  { value: 'Sanskrit', label: 'Sanskrit', icon: '🕉️' },
  { value: 'Regional Language', label: 'Regional Language', icon: '🗣️' },
  
  // Additional Subjects
  { value: 'Computer Science', label: 'Computer Science', icon: '💻' },
  { value: 'Information Technology', label: 'Information Technology', icon: '🖥️' },
  { value: 'Environmental Science', label: 'Environmental Science', icon: '🌱' },
  { value: 'Moral Science', label: 'Moral Science', icon: '📖' },
  { value: 'General Knowledge', label: 'General Knowledge', icon: '🧠' },
] as const;

export type SubjectValue = typeof SUBJECTS[number]['value'];

export const SUBJECT_CATEGORIES = {
  core: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'],
  sciences: ['Physics', 'Chemistry', 'Biology'],
  socialSciences: ['History', 'Geography', 'Civics', 'Economics'],
  languages: ['Hindi', 'Sanskrit', 'Regional Language'],
  technical: ['Computer Science', 'Information Technology'],
  others: ['Environmental Science', 'Moral Science', 'General Knowledge'],
} as const;
