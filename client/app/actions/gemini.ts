'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface MLResource {
  id: string;
  title: string;
  type: string;
  url?: string;
}

interface WeeklyRoadmap {
  week: string;
  theme: string;
  topics: string[];
  action_item: string;
  recommended_resource: string;
}

interface PathRoadmap {
  roadmap: WeeklyRoadmap[];
  success: boolean;
}

/**
 * TASK 1: Adaptive Learning Path with Highly Specific 4-Week Roadmap
 * Generates a curriculum-aligned study plan using Gemini 1.5 Flash with JSON mode
 */
export async function generatePathRoadmap(
  subject: string,
  grade: string,
  level: string,
  mlResources: MLResource[]
): Promise<PathRoadmap> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const resourceTitles = mlResources.map((r) => r.title).join('\n- ');
    
    const prompt = `You are an expert Indian Curriculum (CBSE/ICSE) tutor. Create a highly specific 4-week study roadmap for a ${grade} student studying ${subject} at a ${level} level.

They are assigned these resources:
- ${resourceTitles}

CRITICAL REQUIREMENTS:
- Return a strict JSON array of exactly 4 objects (one per week)
- NO generic terms like "Basic Concepts" or "Introduction"
- Use REAL syllabus topics from CBSE/ICSE curriculum for ${subject} ${grade}
- Each week must have a specific theme from the actual curriculum
- Match recommended_resource to the EXACT title from the provided resources list

Schema:
[
  {
    "week": "Week 1",
    "theme": "Real Syllabus Topic (e.g., Atomic Structure, Photosynthesis, Algebraic Expressions)",
    "topics": ["Specific Subtopic 1", "Specific Subtopic 2", "Specific Subtopic 3"],
    "action_item": "Specific practice task related to the theme",
    "recommended_resource": "Exact matching title from provided resources"
  }
]

Example for Class 10 Science:
[
  {
    "week": "Week 1",
    "theme": "Chemical Reactions and Equations",
    "topics": ["Balancing Chemical Equations", "Types of Chemical Reactions", "Oxidation and Reduction"],
    "action_item": "Practice balancing 20 chemical equations and identify reaction types",
    "recommended_resource": "Chemistry Fundamentals: Reactions"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const parsed = JSON.parse(text);
    
    // Validate structure
    if (Array.isArray(parsed) && parsed.length === 4) {
      return {
        roadmap: parsed,
        success: true,
      };
    }

    throw new Error('Invalid roadmap structure');
  } catch (error) {
    console.error('Error generating path roadmap:', error);
    
    // Hardcoded fallback - curriculum-specific
    const fallbackRoadmaps: Record<string, WeeklyRoadmap[]> = {
      'Mathematics': [
        {
          week: 'Week 1',
          theme: 'Real Numbers and Number Systems',
          topics: ['Euclid\'s Division Algorithm', 'Fundamental Theorem of Arithmetic', 'Rational and Irrational Numbers'],
          action_item: 'Solve 15 problems on HCF and LCM using Euclid\'s algorithm',
          recommended_resource: mlResources[0]?.title || 'Mathematics Foundation Course',
        },
        {
          week: 'Week 2',
          theme: 'Polynomials and Algebraic Expressions',
          topics: ['Degree of Polynomials', 'Zeroes of Polynomials', 'Relationship between Zeroes and Coefficients'],
          action_item: 'Practice finding zeroes of quadratic polynomials graphically',
          recommended_resource: mlResources[1]?.title || 'Algebra Mastery Guide',
        },
        {
          week: 'Week 3',
          theme: 'Linear Equations in Two Variables',
          topics: ['Graphical Method of Solution', 'Algebraic Methods', 'Substitution and Elimination'],
          action_item: 'Solve 10 word problems using simultaneous equations',
          recommended_resource: mlResources[2]?.title || 'Linear Equations Practice',
        },
        {
          week: 'Week 4',
          theme: 'Quadratic Equations',
          topics: ['Standard Form', 'Factorization Method', 'Quadratic Formula', 'Nature of Roots'],
          action_item: 'Complete 20 quadratic equation problems using different methods',
          recommended_resource: mlResources[0]?.title || 'Advanced Mathematics',
        },
      ],
      'Science': [
        {
          week: 'Week 1',
          theme: 'Chemical Reactions and Equations',
          topics: ['Balancing Chemical Equations', 'Types of Chemical Reactions', 'Oxidation and Reduction'],
          action_item: 'Practice balancing 20 chemical equations and identify reaction types',
          recommended_resource: mlResources[0]?.title || 'Chemistry Fundamentals',
        },
        {
          week: 'Week 2',
          theme: 'Acids, Bases and Salts',
          topics: ['pH Scale', 'Neutralization Reactions', 'Common Properties of Acids and Bases'],
          action_item: 'Conduct pH testing experiments and document observations',
          recommended_resource: mlResources[1]?.title || 'Chemistry Lab Guide',
        },
        {
          week: 'Week 3',
          theme: 'Metals and Non-Metals',
          topics: ['Physical Properties', 'Chemical Properties', 'Reactivity Series', 'Corrosion'],
          action_item: 'Create a reactivity series chart with real-world examples',
          recommended_resource: mlResources[2]?.title || 'Materials Science',
        },
        {
          week: 'Week 4',
          theme: 'Carbon and its Compounds',
          topics: ['Covalent Bonding', 'Versatile Nature of Carbon', 'Homologous Series', 'Functional Groups'],
          action_item: 'Draw structural formulas for 15 organic compounds',
          recommended_resource: mlResources[0]?.title || 'Organic Chemistry Basics',
        },
      ],
    };

    const subjectKey = Object.keys(fallbackRoadmaps).find(key => 
      subject.toLowerCase().includes(key.toLowerCase())
    );

    return {
      roadmap: subjectKey ? fallbackRoadmaps[subjectKey] : [
        {
          week: 'Week 1',
          theme: `Foundational Concepts in ${subject}`,
          topics: ['Core Principles', 'Key Terminology', 'Basic Applications'],
          action_item: `Review and summarize main concepts from assigned ${subject} resources`,
          recommended_resource: mlResources[0]?.title || 'Introduction to ' + subject,
        },
        {
          week: 'Week 2',
          theme: `Intermediate Topics in ${subject}`,
          topics: ['Advanced Concepts', 'Problem-Solving Techniques', 'Real-World Applications'],
          action_item: 'Complete practice exercises from recommended resources',
          recommended_resource: mlResources[1]?.title || subject + ' Practice Guide',
        },
        {
          week: 'Week 3',
          theme: `Applied ${subject} Skills`,
          topics: ['Practical Applications', 'Case Studies', 'Critical Thinking'],
          action_item: 'Work through case studies and application problems',
          recommended_resource: mlResources[2]?.title || 'Applied ' + subject,
        },
        {
          week: 'Week 4',
          theme: `Mastery and Assessment in ${subject}`,
          topics: ['Comprehensive Review', 'Test Preparation', 'Advanced Problem Sets'],
          action_item: 'Complete full-length practice test and review weak areas',
          recommended_resource: mlResources[0]?.title || subject + ' Mastery',
        },
      ],
      success: false,
    };
  }
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizResult {
  questions: QuizQuestion[];
  success: boolean;
}

/**
 * TASK 2: Structured AI Quiz System with Escalation
 * Generates exactly 3 MCQs using Gemini with JSON mode
 */
export async function generateQuiz(
  subject: string,
  topic: string
): Promise<QuizResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are an expert Indian curriculum (CBSE/ICSE) educator. Generate a quiz for ${subject} on the topic: ${topic}.

Create exactly 3 multiple choice questions that test conceptual understanding.

Return a JSON array with this exact schema:
[
  {
    "question": "Clear, specific question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]

CRITICAL REQUIREMENTS:
- Exactly 3 questions
- Each question must have exactly 4 options
- correctAnswer must be the EXACT TEXT of one of the options (not an index)
- Questions should test understanding and application, not just recall
- Use curriculum-appropriate language for Indian students
- Include real-world applications where possible

Example:
[
  {
    "question": "In a chemical reaction, if the pH decreases from 7 to 3, what can you conclude?",
    "options": [
      "The solution has become more acidic",
      "The solution has become more basic",
      "The solution remains neutral",
      "The pH scale is not applicable"
    ],
    "correctAnswer": "The solution has become more acidic"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const parsed = JSON.parse(text);
    
    // Validate structure
    if (Array.isArray(parsed) && parsed.length === 3) {
      // Validate each question
      const validQuestions = parsed.every(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        q.correctAnswer &&
        q.options.includes(q.correctAnswer)
      );

      if (validQuestions) {
        return {
          questions: parsed,
          success: true,
        };
      }
    }

    throw new Error('Invalid quiz structure');
  } catch (error) {
    console.error('Error generating quiz:', error);
    
    // Curriculum-specific fallback questions
    return {
      questions: [
        {
          question: `Which of the following best describes the fundamental principle of ${topic}?`,
          options: [
            'A systematic approach to understanding core concepts through observation and analysis',
            'Memorizing facts without understanding their applications',
            'Skipping foundational concepts to reach advanced topics quickly',
            'Avoiding practical applications and focusing only on theory',
          ],
          correctAnswer: 'A systematic approach to understanding core concepts through observation and analysis',
        },
        {
          question: `When applying ${topic} concepts to solve problems, what is the most effective strategy?`,
          options: [
            'Guessing answers without working through the problem',
            'Breaking down the problem, applying relevant concepts, and verifying the solution',
            'Only reading examples without attempting practice problems',
            'Memorizing solutions to specific problems without understanding the method',
          ],
          correctAnswer: 'Breaking down the problem, applying relevant concepts, and verifying the solution',
        },
        {
          question: `How does ${topic} relate to real-world applications in ${subject}?`,
          options: [
            'It has no practical applications outside the classroom',
            'It only applies to theoretical scenarios in textbooks',
            'It provides essential tools for solving practical problems and understanding natural phenomena',
            'It is only useful for passing examinations',
          ],
          correctAnswer: 'It provides essential tools for solving practical problems and understanding natural phenomena',
        },
      ],
      success: false,
    };
  }
}
