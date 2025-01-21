import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's tokens from Supabase
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', session.user.email)
      .single();

    if (tokenError || !tokenData) {
      console.error('Error fetching tokens:', tokenError);
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 401 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expires_at ? tokenData.expires_at * 1000 : undefined
    });

    // Create Gmail client
    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client
    });

    // Fetch email details
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: params.id,
      format: 'full'
    });

    const headers = email.data.payload?.headers;
    const subject = headers?.find(h => h.name === 'Subject')?.value || '(no subject)';
    const from = headers?.find(h => h.name === 'From')?.value || '';
    const to = headers?.find(h => h.name === 'To')?.value || '';
    const date = headers?.find(h => h.name === 'Date')?.value || '';

    // Get email body
    let body = '';
    if (email.data.payload?.parts) {
      // Handle multipart message
      const textPart = email.data.payload.parts.find(
        part => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    } else if (email.data.payload?.body?.data) {
      // Handle single part message
      body = Buffer.from(email.data.payload.body.data, 'base64').toString('utf-8');
    }

    return NextResponse.json({
      id: email.data.id,
      threadId: email.data.threadId,
      subject,
      from,
      to,
      date,
      body,
      snippet: email.data.snippet || '',
      labelIds: email.data.labelIds || []
    });

  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email' },
      { status: 500 }
    );
  }
} 