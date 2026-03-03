'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface DiagnosticQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface DiagnosticQuizResult {
  questions: DiagnosticQuestion[];
  success: boolean;
}

/**
 * Generate a diagnostic quiz to assess student's current knowledge level
 */
export async function generateDiagnosticQuiz(
  subject: string,
  grade: string
): Promise<DiagnosticQuizResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are an expert Indian curriculum (CBSE/ICSE) educator. Generate a diagnostic quiz for ${subject} for ${grade} students.

Create exactly 5 multiple choice questions that assess different knowledge levels and topics.

Return a JSON array with this exact schema:
[
  {
    "question": "Clear, specific question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "easy",
    "topic": "Specific topic name"
  }
]

CRITICAL REQUIREMENTS:
- Exactly 5 questions
- Mix of difficulty levels: 2 easy, 2 medium, 1 hard
- Each question must have exactly 4 options
- correctAnswer is the index (0-3) of the correct option
- Cover different topics within ${subject}
- Questions should test understanding and application
- Use curriculum-appropriate language for Indian students

Example for Class 10 Science:
[
  {
    "question": "What is the pH value of a neutral solution at 25°C?",
    "options": ["0", "7", "14", "1"],
    "correctAnswer": 1,
    "difficulty": "easy",
    "topic": "Acids, Bases and Salts"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const parsed = JSON.parse(text);
    
    // Validate structure
    if (Array.isArray(parsed) && parsed.length === 5) {
      const validQuestions = parsed.every(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3 &&
        q.difficulty &&
        q.topic
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
    console.error('Error generating diagnostic quiz:', error);
    
    // Curriculum-specific fallback questions
    const fallbackQuestions: Record<string, DiagnosticQuestion[]> = {
      'Mathematics': [
        {
          question: 'What is the value of √144?',
          options: ['10', '11', '12', '13'],
          correctAnswer: 2,
          difficulty: 'easy',
          topic: 'Square Roots',
        },
        {
          question: 'If 2x + 5 = 15, what is the value of x?',
          options: ['3', '5', '7', '10'],
          correctAnswer: 1,
          difficulty: 'easy',
          topic: 'Linear Equations',
        },
        {
          question: 'What is the area of a circle with radius 7 cm? (Use π = 22/7)',
          options: ['44 cm²', '88 cm²', '154 cm²', '308 cm²'],
          correctAnswer: 2,
          difficulty: 'medium',
          topic: 'Mensuration',
        },
        {
          question: 'If the sum of two numbers is 50 and their difference is 10, what are the numbers?',
          options: ['25 and 25', '30 and 20', '35 and 15', '40 and 10'],
          correctAnswer: 1,
          difficulty: 'medium',
          topic: 'Simultaneous Equations',
        },
        {
          question: 'What is the value of sin²θ + cos²θ for any angle θ?',
          options: ['0', '1', '2', 'Depends on θ'],
          correctAnswer: 1,
          difficulty: 'hard',
          topic: 'Trigonometry',
        },
      ],
      'Science': [
        {
          question: 'What is the pH value of a neutral solution?',
          options: ['0', '7', '14', '1'],
          correctAnswer: 1,
          difficulty: 'easy',
          topic: 'Acids and Bases',
        },
        {
          question: 'Which gas is produced when metals react with acids?',
          options: ['Oxygen', 'Hydrogen', 'Carbon dioxide', 'Nitrogen'],
          correctAnswer: 1,
          difficulty: 'easy',
          topic: 'Chemical Reactions',
        },
        {
          question: 'What is the SI unit of electric current?',
          options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
          correctAnswer: 1,
          difficulty: 'medium',
          topic: 'Electricity',
        },
        {
          question: 'In which part of the cell does photosynthesis occur?',
          options: ['Nucleus', 'Mitochondria', 'Chloroplast', 'Ribosome'],
          correctAnswer: 2,
          difficulty: 'medium',
          topic: 'Life Processes',
        },
        {
          question: 'What is the relationship between frequency (f) and wavelength (λ) of light? (c = speed of light)',
          options: ['f = c × λ', 'f = c / λ', 'f = λ / c', 'f = c + λ'],
          correctAnswer: 1,
          difficulty: 'hard',
          topic: 'Light - Reflection and Refraction',
        },
      ],
    };

    const subjectKey = Object.keys(fallbackQuestions).find(key => 
      subject.toLowerCase().includes(key.toLowerCase())
    );

    return {
      questions: subjectKey ? fallbackQuestions[subjectKey] : [
        {
          question: `What is a fundamental concept in ${subject}?`,
          options: [
            'Understanding core principles through systematic study',
            'Memorizing facts without context',
            'Skipping foundational topics',
            'Avoiding practice problems',
          ],
          correctAnswer: 0,
          difficulty: 'easy',
          topic: 'Fundamentals',
        },
        {
          question: `How should you approach learning ${subject}?`,
          options: [
            'Rush through materials quickly',
            'Practice regularly and review concepts systematically',
            'Only read theory without practice',
            'Study only before exams',
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          topic: 'Study Methods',
        },
        {
          question: `What helps in mastering ${subject} concepts?`,
          options: [
            'Passive reading only',
            'Avoiding difficult problems',
            'Active problem-solving and consistent practice',
            'Memorizing without understanding',
          ],
          correctAnswer: 2,
          difficulty: 'medium',
          topic: 'Learning Strategies',
        },
        {
          question: `Which approach is most effective for ${subject}?`,
          options: [
            'Learning in isolation without asking questions',
            'Combining theory with practical applications',
            'Focusing only on easy topics',
            'Avoiding challenging concepts',
          ],
          correctAnswer: 1,
          difficulty: 'medium',
          topic: 'Application',
        },
        {
          question: `What demonstrates deep understanding of ${subject}?`,
          options: [
            'Reciting definitions verbatim',
            'Solving only familiar problems',
            'Applying concepts to solve novel problems and explain reasoning',
            'Memorizing solved examples',
          ],
          correctAnswer: 2,
          difficulty: 'hard',
          topic: 'Mastery',
        },
      ],
      success: false,
    };
  }
}

interface PathData {
  confidence: 'Beginner' | 'Medium' | 'Advanced';
  score: number;
  totalQuestions: number;
  strengths: string[];
  weaknesses: string[];
  success: boolean;
}

/**
 * Analyze quiz results and determine student's confidence level
 */
export async function analyzeQuizAndGeneratePath(
  userId: string,
  subject: string,
  grade: string,
  answers: number[],
  questions: DiagnosticQuestion[]
): Promise<PathData> {
  try {
    // Calculate score
    let score = 0;
    const topicPerformance: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q, idx) => {
      const isCorrect = answers[idx] === q.correctAnswer;
      if (isCorrect) score++;

      // Track performance by topic
      if (!topicPerformance[q.topic]) {
        topicPerformance[q.topic] = { correct: 0, total: 0 };
      }
      topicPerformance[q.topic].total++;
      if (isCorrect) topicPerformance[q.topic].correct++;
    });

    // Determine confidence level based on score
    const percentage = (score / questions.length) * 100;
    let confidence: 'Beginner' | 'Medium' | 'Advanced';
    
    if (percentage >= 80) {
      confidence = 'Advanced';
    } else if (percentage >= 50) {
      confidence = 'Medium';
    } else {
      confidence = 'Beginner';
    }

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(topicPerformance).forEach(([topic, perf]) => {
      const topicPercentage = (perf.correct / perf.total) * 100;
      if (topicPercentage >= 75) {
        strengths.push(topic);
      } else if (topicPercentage < 50) {
        weaknesses.push(topic);
      }
    });

    // Save diagnostic results to database
    try {
      const supabase = await createClient();
      await supabase.from('session_logs').insert({
        user_id: userId,
        action_type: 'completed_module',
        details: {
          event_type: 'diagnostic_completed',
          subject,
          grade,
          score,
          total: questions.length,
          percentage,
          confidence,
          strengths,
          weaknesses,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (dbError) {
      console.error('Error saving diagnostic results:', dbError);
      // Continue even if database save fails
    }

    return {
      confidence,
      score,
      totalQuestions: questions.length,
      strengths,
      weaknesses,
      success: true,
    };
  } catch (error) {
    console.error('Error analyzing quiz:', error);
    
    // Return default path data
    return {
      confidence: 'Medium',
      score: 0,
      totalQuestions: questions.length,
      strengths: [],
      weaknesses: [],
      success: false,
    };
  }
}
