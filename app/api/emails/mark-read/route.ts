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

    const { messageId } = await request.json();
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const oauth2Client = await getOAuth2Client(session.user.email);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // First, get the current labels to verify UNREAD exists
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'minimal',
    });

    const currentLabels = message.data.labelIds || [];
    
    // Only make the modify call if UNREAD label exists
    if (currentLabels.includes('UNREAD')) {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    }

    // Verify the update
    const updatedMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'minimal',
    });

    const success = !updatedMessage.data.labelIds?.includes('UNREAD');

    return NextResponse.json({ 
      success,
      message: success ? 'Email marked as read' : 'Failed to mark email as read'
    });

  } catch (error) {
    console.error('Error marking email as read:', error);
    return NextResponse.json(
      { 
        error: 'Failed to mark email as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}