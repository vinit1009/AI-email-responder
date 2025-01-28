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

    const { messageIds, markAsRead } = await request.json();
    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      );
    }

    const oauth2Client = await getOAuth2Client(session.user.email);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Process all messages in parallel
    const results = await Promise.all(
      messageIds.map(async (messageId) => {
        try {
          await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
              addLabelIds: markAsRead ? [] : ['UNREAD'],
              removeLabelIds: markAsRead ? ['UNREAD'] : [],
            },
          });
          return { messageId, success: true };
        } catch (error) {
          console.error(`Error modifying message ${messageId}:`, error);
          return { messageId, success: false };
        }
      })
    );

    const allSuccessful = results.every(result => result.success);

    return NextResponse.json({ 
      success: allSuccessful,
      results,
      message: allSuccessful 
        ? `Successfully ${markAsRead ? 'marked as read' : 'marked as unread'}` 
        : 'Some operations failed'
    });

  } catch (error) {
    console.error('Error marking emails:', error);
    return NextResponse.json(
      { 
        error: 'Failed to modify emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 