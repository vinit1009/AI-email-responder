import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { getOAuth2Client } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, content, threadId } = await request.json();

    const oauth2Client = await getOAuth2Client(session.user.email);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // If we have a threadId, get the original message to reference its Message-ID
    let originalMessageId = '';
    if (threadId) {
      const thread = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
      });
      
      // Get the first message in the thread
      const originalMessage = thread.data.messages?.[0];
      if (originalMessage?.payload?.headers) {
        const messageIdHeader = originalMessage.payload.headers.find(
          h => h.name.toLowerCase() === 'message-id'
        );
        originalMessageId = messageIdHeader?.value || '';
      }
    }

    // Include the user's name in the From header
    const fromHeader = `${session.user.name} <${session.user.email}>`;
    
    // Normalize subject (remove multiple Re: prefixes)
    const normalizedSubject = subject.replace(/^(Re: )+/i, 'Re: ');
    const utf8Subject = `=?utf-8?B?${Buffer.from(normalizedSubject).toString('base64')}?=`;

    // Create email content with proper headers for threading
    const messageParts = [
      `From: ${fromHeader}`,
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      originalMessageId ? `References: ${originalMessageId}` : '',
      originalMessageId ? `In-Reply-To: ${originalMessageId}` : '',
      '',
      content,
    ].filter(Boolean);

    const message = messageParts.join('\n');

    // The body needs to be base64url encoded
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId,
      },
    });

    return NextResponse.json({ messageId: res.data.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 