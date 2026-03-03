import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { question, subject, grade_level } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const systemPrompt = `You are an expert tutor for Indian high school students (Class 6-10).
Your task is to provide a single, comprehensive, structured explanation to resolve a student's doubt.

IMPORTANT CONSTRAINTS:
- Target audience: Indian students (${grade_level || 'Class 6-10'})
- Use age-appropriate language and examples relevant to Indian context
- Provide ONE complete answer - do NOT ask follow-up questions
- Do NOT engage in conversational back-and-forth
- Structure your response in clear markdown format
- Use practical examples from everyday Indian life

REQUIRED STRUCTURE:
# Understanding: [Topic/Concept]

## The Concept Explained
[Clear, simple explanation of the core concept in 2-3 paragraphs]

## Real-World Analogy
[Provide a relatable analogy using Indian context - cricket, festivals, daily life, etc.]

## Detailed Example
[Provide a step-by-step worked example with clear explanations]

## Key Points to Remember
- [Important point 1]
- [Important point 2]
- [Important point 3]

## Common Confusion Cleared
[Address common misconceptions related to this topic]

Student's Question: "${question}"
${subject ? `Subject: ${subject}` : ''}

Provide a complete, structured explanation that fully resolves this doubt.`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      question,
      answer: text,
      metadata: {
        subject: subject || 'General',
        grade_level: grade_level || 'Class 6-10',
        answered_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve doubt. Please try again.' },
      { status: 500 }
    );
  }
}
