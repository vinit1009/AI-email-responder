import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { getOAuth2Client } from '@/lib/google';

export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      console.error('No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching thread:', params.threadId);

    const oauth2Client = await getOAuth2Client(session.user.email);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: params.threadId,
      format: 'full',
    });

    if (!thread.data) {
      console.error('No thread data received');
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    console.log('Thread fetched successfully');
    return NextResponse.json(thread.data);
  } catch (error) {
    console.error('Error fetching email thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email thread', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 