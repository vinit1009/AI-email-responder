import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { getOAuth2Client } from '@/lib/google';

function extractEmailAddress(headerValue: string): string {
  // Handle format: "Name <email@example.com>" or just "email@example.com"
  const emailMatch = headerValue.match(/<(.+?)>/) || headerValue.match(/([^\s<]+@[^\s>]+)/);
  return emailMatch ? emailMatch[1] : headerValue;
}

function formatEmailField(headerValue: string): string {
  // Handle format: "Name <email@example.com>"
  const namePart = headerValue.split('<')[0].trim();
  const emailPart = extractEmailAddress(headerValue);
  
  if (namePart && namePart !== emailPart) {
    return `${namePart} (${emailPart})`;
  }
  return emailPart;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken');
    const view = searchParams.get('view') || 'inbox';

    const oauth2Client = await getOAuth2Client(session.user.email);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get the query based on the view
    let query = '';
    switch (view) {
      case 'inbox':
        query = 'in:inbox';
        break;
      case 'starred':
        query = 'is:starred';
        break;
      case 'sent':
        query = 'in:sent';
        break;
      default:
        query = 'in:inbox';
    }

    // Set maxResults to 50
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50, // Ensure we get 50 emails per page
      pageToken: pageToken || undefined,
      q: query,
    });

    const messages = response.data.messages || [];
    const nextPageToken = response.data.nextPageToken;

    // Get detailed information for each message
    const messageDetails = await Promise.all(
      messages.map(async (message) => {
        // Get message metadata
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date', 'To'],
        });

        // Get thread information to get message count
        const threadData = await gmail.users.threads.get({
          userId: 'me',
          id: messageData.data.threadId!,
        });

        const headers = messageData.data.payload?.headers || [];
        const fromHeader = headers.find(h => h.name === 'From')?.value;
        const toHeader = headers.find(h => h.name === 'To')?.value;

        // Format the from and to fields
        const from = fromHeader ? formatEmailField(fromHeader) : 'Unknown Sender';
        const to = toHeader ? formatEmailField(toHeader) : 'Unknown Recipient';
        
        return {
          id: message.id,
          threadId: messageData.data.threadId,
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          sender: from,
          recipient: to,
          date: headers.find(h => h.name === 'Date')?.value || '',
          snippet: messageData.data.snippet || '',
          labelIds: messageData.data.labelIds || [],
          messagesCount: threadData.data.messages?.length || 1, // Get actual thread message count
        };
      })
    );

    return NextResponse.json({
      emails: messageDetails,
      nextPageToken,
      resultsCount: messageDetails.length,
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}