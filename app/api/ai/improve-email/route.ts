import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { content, subject } = await request.json();
    
    const prompt = `You are a professional email assistant. Please improve and refine the following email while maintaining its core message and intent.

    Subject: ${subject}
    Content: ${content}

    Please improve both the subject and content of this email by:
    1. Enhancing clarity and professionalism
    2. Fixing any grammar or spelling issues
    3. Improving structure and flow
    4. Making it more concise and direct
    5. Ensuring appropriate tone and etiquette
    6. Maintaining the original message and intent
    
    Important: Format your response exactly as shown below, without any asterisks or special characters:
    SUBJECT: [Your improved subject line]
    CONTENT:
    [Your improved email content]

    Note: Do not add any asterisks, special characters, or formatting symbols to the subject or content.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract subject and content from the response
    const subjectMatch = text.match(/SUBJECT:\s*([^\n]+)/);
    const contentMatch = text.match(/CONTENT:\s*\n([\s\S]+)$/);

    // Clean up the extracted text by removing any asterisks or special characters
    const improvedSubject = subjectMatch?.[1]?.trim().replace(/[\*\[\]]/g, '') || subject;
    const improvedContent = contentMatch?.[1]?.trim().replace(/^[\*\s]+/, '') || text;

    return NextResponse.json({ 
      improvedSubject,
      improvedContent,
    });
  } catch (error) {
    console.error('Error improving email:', error);
    return NextResponse.json(
      { error: 'Failed to improve email' },
      { status: 500 }
    );
  }
} 