import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface EmailData {
  id: string;
  threadId: string;
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  body: string;
  date: string;
  read: boolean;
  labelIds: string[];
  snippet: string;
}

export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    this.oauth2Client.setCredentials({
      access_token: accessToken
    });
  }

  async listEmails(maxResults = 20) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        labelIds: ['INBOX'],
        q: 'in:inbox'
      });

      if (!response.data.messages) {
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          try {
            const email = await gmail.users.messages.get({
              userId: 'me',
              id: message.id!,
              format: 'full'
            });
            return this.parseEmail(email.data);
          } catch (error) {
            console.error(`Error fetching email ${message.id}:`, error);
            return null;
          }
        })
      );

      return emails.filter((email): email is EmailData => email !== null);
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  private parseEmail(emailData: any): EmailData {
    const headers = emailData.payload.headers;
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const date = getHeader('Date');

    // Extract body
    let body = '';
    const extractBody = (part: any): string => {
      if (part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString();
      }
      if (part.parts) {
        return part.parts.map(extractBody).join('\n');
      }
      return '';
    };

    if (emailData.payload.parts) {
      const textPart = emailData.payload.parts.find(
        (part: any) => part.mimeType === 'text/plain'
      );
      if (textPart) {
        body = extractBody(textPart);
      } else {
        body = extractBody(emailData.payload);
      }
    } else {
      body = extractBody(emailData.payload);
    }

    // Parse sender information
    let sender = { name: '', email: '' };
    const fromMatch = from.match(/(?:"?([^"]*)"?\s)?<?(.+@[^>]+)>?/);
    if (fromMatch) {
      sender = {
        name: fromMatch[1] || fromMatch[2].split('@')[0],
        email: fromMatch[2]
      };
    } else {
      sender = {
        name: from,
        email: from
      };
    }

    return {
      id: emailData.id,
      threadId: emailData.threadId,
      subject: subject || '(no subject)',
      sender,
      body,
      snippet: emailData.snippet,
      date,
      read: !emailData.labelIds.includes('UNREAD'),
      labelIds: emailData.labelIds
    };
  }

  async markAsRead(messageId: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    } catch (error) {
      console.error('Error marking email as read:', error);
      throw error;
    }
  }
}