import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { format } from 'date-fns';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { emails, subject, userEmail } = await request.json();
    
    // Sort emails by date in chronological order
    const sortedEmails = [...emails].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Format the conversation history with clear sender/receiver distinction
    const formattedEmails = sortedEmails.map((email: any) => {
      const fromEmail = email.from.match(/<(.+)>/)?.[1] || email.from;
      const toEmail = email.to.match(/<(.+)>/)?.[1] || email.to;
      const isFromMe = fromEmail.includes(userEmail);
      
      return {
        role: isFromMe ? 'SENT' : 'RECEIVED',
        from: email.from,
        to: email.to,
        content: email.body,
        timestamp: email.date,
        isLatest: email === sortedEmails[sortedEmails.length - 1]
      };
    });

    // Get the latest email that needs to be responded to
    const latestEmail = formattedEmails[formattedEmails.length - 1];

    // Create a chronological conversation summary
    const conversationSummary = formattedEmails
      .map((email: any, index: number) => 
        `[${email.role}] ${format(new Date(email.timestamp), 'MMM d, yyyy HH:mm')}
From: ${email.from}
To: ${email.to}
Content: ${email.content.split(/(?=On .+wrote:)/)[0].trim()}
${index === formattedEmails.length - 1 ? '(Latest Message)' : ''}
-------------------`
      )
      .join('\n\n');

    // Create the prompt
    const prompt = `You are a professional email assistant. Generate a polite and professional response to the following email thread.
    
Subject: ${subject}

Email Thread History (in chronological order):
${conversationSummary}

Latest email was ${latestEmail.role === 'SENT' ? 'SENT by you' : 'RECEIVED from the other person'}.

Please generate a professional and contextually appropriate response that:
1. Maintains a professional tone
2. Addresses all relevant points from the latest email
3. Takes into account the full conversation history
4. Is complete and ready to send
5. Is concise and direct
6. Uses appropriate business email etiquette
7. Includes a proper greeting and sign-off

Note: 
- SENT means the email was sent by the user (the person who needs the reply)
- RECEIVED means the email was received from another person
- Pay special attention to the latest message marked as (Latest Message)
- Only generate a reply if the latest message was RECEIVED, otherwise indicate that no reply is needed

Response format:
If latest message was RECEIVED:
  [Your reply here]
If latest message was SENT:
  "No reply needed - the latest message in the thread was sent by you."`;

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