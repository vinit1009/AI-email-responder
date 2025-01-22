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

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      pageToken: pageToken || undefined,
    });

    const messages = response.data.messages || [];
    const nextPageToken = response.data.nextPageToken;

    // Get detailed information for each message
    const messageDetails = await Promise.all(
      messages.map(async (message) => {
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = messageData.data.payload?.headers || [];
        
        return {
          messageId: message.id,
          threadId: messageData.data.threadId,
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          sender: headers.find(h => h.name === 'From')?.value || 'Unknown Sender',
          date: headers.find(h => h.name === 'Date')?.value || '',
          snippet: messageData.data.snippet || '',
          labelIds: messageData.data.labelIds || [],
        };
      })
    );

    console.log('Message details:', messageDetails);

    return NextResponse.json({
      emails: messageDetails,
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