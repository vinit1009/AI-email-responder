import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { emails, subject } = await request.json();
    
    // Format the conversation history
    const conversationHistory = emails.map((email: any) => ({
      role: 'user',
      content: `Email from: ${email.from}\nTo: ${email.to}\nContent: ${email.body}`,
    }));

    // Create the prompt
    const prompt = `You are a professional email assistant. Generate a polite and professional response to the following email thread.
    Subject: ${subject}
    
    Previous emails in the thread (from oldest to newest):
    ${emails.map((email: any) => 
      `From: ${email.from}
       To: ${email.to}
       Content: ${email.body}
       ---`
    ).join('\n')}
    
    Please generate a professional and contextually appropriate response that:
    1. Maintains a professional tone
    2. Addresses all relevant points from the previous emails
    3. It should be complete email and ready to send email
    3. Is concise and direct
    4. Uses appropriate business email etiquette
    5. Includes a proper greeting and sign-off`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error('Error generating reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
} 