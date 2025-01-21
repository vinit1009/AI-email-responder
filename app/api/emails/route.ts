import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { getOAuth2Client } from '@/lib/google';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken');

    const oauth2Client = await getOAuth2Client(session.user.email);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch threads instead of messages
    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults: 20,
      pageToken: pageToken || undefined,
    });

    const threads = response.data.threads || [];
    const nextPageToken = response.data.nextPageToken;

    // Get detailed information for each thread
    const threadDetails = await Promise.all(
      threads.map(async (thread) => {
        const threadData = await gmail.users.threads.get({
          userId: 'me',
          id: thread.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const messages = threadData.data.messages || [];
        const latestMessage = messages[messages.length - 1];
        const headers = latestMessage.payload?.headers || [];

        return {
          threadId: thread.id,
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          sender: headers.find(h => h.name === 'From')?.value || 'Unknown Sender',
          date: headers.find(h => h.name === 'Date')?.value || '',
          snippet: latestMessage.snippet || '',
          messagesCount: messages.length,
          labelIds: latestMessage.labelIds || [],
          id: latestMessage.id,
        };
      })
    );

    return NextResponse.json({
      emails: threadDetails,
      nextPageToken,
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}