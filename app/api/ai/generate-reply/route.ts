import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { emails, subject } = await request.json();
    
    // Format the conversation history with clear sender/receiver distinction
    const formattedEmails = emails.map((email: any) => {
      const fromEmail = email.from.match(/<(.+)>/)?.[1] || email.from;
      const toEmail = email.to.match(/<(.+)>/)?.[1] || email.to;
      
      return {
        type: fromEmail.includes(toEmail) ? 'sent' : 'received',
        from: email.from,
        to: email.to,
        content: email.body,
        timestamp: email.date
      };
    });

    // Create a chronological conversation summary
    const conversationSummary = formattedEmails
      .map((email: any) => 
        `${email.type === 'received' ? 'THEM' : 'YOU'}: ${email.content.split(/(?=On .+wrote:)/)[0].trim()}`
      )
      .join('\n\n');

    // Create the prompt
    const prompt = `You are a professional email assistant. Generate a polite and professional response to the following email thread.
    Subject: ${subject}
    
    Previous conversation (chronological order):
    ${conversationSummary}
    
    Please generate a professional and contextually appropriate response that:
    1. Maintains a professional tone
    2. Addresses all relevant points from the previous emails
    3. Is complete and ready to send
    4. Is concise and direct
    5. Uses appropriate business email etiquette
    6. Includes a proper greeting and sign-off
    
    Note: YOU represents the sender (the person who needs the reply), 
    THEM represents the other participant in the conversation.`;

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