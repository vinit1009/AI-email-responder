import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Type for Gmail message header
interface GmailHeader {
  name: string;
  value: string;
}

export async function GET(req: Request) {
  try {
    // Get the session
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
      .eq('user_id', session.user.id)
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

    // Set credentials
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expires_at ? tokenData.expires_at * 1000 : undefined
    });

    // Check if token needs refresh
    const isTokenExpired = tokenData.expires_at && tokenData.expires_at * 1000 < Date.now();
    
    if (isTokenExpired) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in Supabase
      const { error: updateError } = await supabase
        .from('oauth_tokens')
        .update({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokenData.refresh_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (updateError) {
        console.error('Error updating tokens:', updateError);
        return NextResponse.json(
          { error: 'Failed to refresh token' },
          { status: 500 }
        );
      }
    }

    // Create Gmail client
    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client
    });

    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      labelIds: ['INBOX']
    });

    const messages = response.data.messages || [];

    // Fetch full email details
    const emails = await Promise.all(
      messages.map(async (message) => {
        try {
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          const headers = email.data.payload?.headers as GmailHeader[] | undefined;
          
          const getHeader = (name: string): string => {
            const header = headers?.find(h => h.name?.toLowerCase() === name.toLowerCase());
            return header?.value || '';
          };

          const subject = getHeader('Subject');
          const from = getHeader('From');
          const date = getHeader('Date');

          let sender = { name: '', email: '' };
          const fromMatch = from.match(/(?:"?([^"]*)"?\s)?<?(.+@[^>]+)>?/);
          if (fromMatch) {
            sender = {
              name: fromMatch[1] || fromMatch[2].split('@')[0],
              email: fromMatch[2]
            };
          }

          return {
            id: email.data.id,
            threadId: email.data.threadId,
            subject: subject || '(no subject)',
            sender,
            snippet: email.data.snippet || '',
            date,
            read: !email.data.labelIds?.includes('UNREAD'),
            labelIds: email.data.labelIds || []
          };
        } catch (error) {
          console.error('Error fetching email details:', error);
          return null;
        }
      })
    );

    // Filter out any null results from failed fetches
    const validEmails = emails.filter((email): email is NonNullable<typeof email> => email !== null);

    return NextResponse.json(validEmails);
  } catch (error) {
    console.error('Error in /api/emails:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}