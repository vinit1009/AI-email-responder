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

    const { messageIds } = await request.json();
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
          // Move to trash instead of permanent delete
          await gmail.users.messages.trash({
            userId: 'me',
            id: messageId,
          });
          return { messageId, success: true };
        } catch (error) {
          console.error(`Error deleting message ${messageId}:`, error);
          return { messageId, success: false };
        }
      })
    );

    const allSuccessful = results.every(result => result.success);

    return NextResponse.json({ 
      success: allSuccessful,
      results,
      message: allSuccessful 
        ? 'Successfully moved to trash' 
        : 'Some operations failed'
    });

  } catch (error) {
    console.error('Error deleting emails:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 