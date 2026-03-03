import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  let resource: any = null;
  
  try {
    const { question, resource: requestResource, conversationHistory } = await request.json();
    resource = requestResource; // Store for use in catch block

    if (!question || !resource) {
      return NextResponse.json(
        { error: 'Question and resource information are required' },
        { status: 400 }
      );
    }

    // Build context from resource information
    const resourceContext = `
RESOURCE CONTEXT:
- Title: ${resource.title}
- Subject: ${resource.subject}
- Difficulty Level: ${resource.difficulty}
- Format: ${resource.format}
- Duration: ${resource.estimated_time || 'Not specified'}
- Tags: ${resource.tags?.join(', ') || 'None'}
- URL: ${resource.url}

This is a ${resource.format === 'video' ? 'video lesson' : 'text-based resource'} about ${resource.subject} at ${resource.difficulty} level.
`;

    // Build conversation history for context
    const historyContext = conversationHistory && conversationHistory.length > 0
      ? `\nRECENT CONVERSATION:\n${conversationHistory.map((msg: any) => 
          `${msg.type === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`
        ).join('\n')}\n`
      : '';

    // Create the prompt
    const prompt = `You are an AI study assistant helping a student understand a specific learning resource. You should:

1. **Be contextual**: Always relate your answers to the specific resource the student is studying
2. **Be educational**: Explain concepts clearly and provide examples
3. **Be encouraging**: Maintain a supportive and positive tone
4. **Be concise**: Keep responses focused and not too lengthy
5. **Be adaptive**: Adjust explanations based on the difficulty level (${resource.difficulty})

${resourceContext}${historyContext}

STUDENT QUESTION: ${question}

Please provide a helpful, educational response that specifically relates to this resource. If the question is about concepts not covered in this resource, gently redirect the student back to the current material while still being helpful.

Format your response in markdown for better readability.`;

    // Get AI response
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    return NextResponse.json({
      answer,
      resource: {
        title: resource.title,
        subject: resource.subject,
      },
    });

  } catch (error) {
    console.error('Error in resource help API:', error);
    
    // Provide a fallback response using the stored resource info
    const resourceSubject = resource?.subject || 'subject';
    const fallbackResponse = `I'm having trouble connecting to my AI systems right now. Here are some general tips for studying this ${resourceSubject} resource:

1. **Take notes** on key concepts as you go through the material
2. **Pause and reflect** on what you've learned every few minutes
3. **Ask specific questions** about parts you don't understand
4. **Practice** applying the concepts if possible
5. **Review** the material again after some time

Please try asking your question again, or refer directly to the resource content for now.`;

    return NextResponse.json({
      answer: fallbackResponse,
      error: 'AI service temporarily unavailable',
    });
  }
}