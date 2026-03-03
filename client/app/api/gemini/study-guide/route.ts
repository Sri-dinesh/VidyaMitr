import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { subject, grade_level, topic } = await request.json();

    if (!subject || !grade_level || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, grade_level, topic' },
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
Your task is to create a comprehensive, structured study guide for exam preparation.

IMPORTANT CONSTRAINTS:
- Target audience: Indian students in ${grade_level}
- Use age-appropriate language and examples relevant to Indian curriculum
- Structure your response in clear markdown format
- Include practical examples from everyday Indian context
- Focus on CBSE/ICSE curriculum standards

REQUIRED STRUCTURE:
# ${topic} - Study Guide

## Overview
[Brief introduction to the topic - 2-3 sentences]

## Key Concepts
- [Concept 1]: [Clear explanation]
- [Concept 2]: [Clear explanation]
- [Concept 3]: [Clear explanation]

## Important Formulas/Rules
[List all relevant formulas, laws, or rules with explanations]

## Step-by-Step Examples
[Provide 2-3 solved examples with detailed steps]

## Practice Questions
1. [Easy question]
2. [Medium question]
3. [Challenging question]

## Quick Revision Points
- [Key point 1]
- [Key point 2]
- [Key point 3]

## Common Mistakes to Avoid
- [Mistake 1]
- [Mistake 2]

Generate a study guide for: ${subject} - ${topic} for ${grade_level} students.`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      content: text,
      metadata: {
        subject,
        grade_level,
        topic,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate study guide. Please try again.' },
      { status: 500 }
    );
  }
}
