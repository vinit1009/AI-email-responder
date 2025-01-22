import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface EmailData {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
  date: string;
  labelIds: string[];
  messagesCount: number;
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
          if (!message.id) return null;

          try {
            const email = await gmail.users.messages.get({
              userId: 'me',
              id: message.id,
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

  private parseEmail(emailData: any): EmailData | null {
    try {
      const headers = emailData.payload?.headers;
      if (!Array.isArray(headers)) return null;

      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject') || '(No subject)';
      const from = getHeader('From');
      const date = getHeader('Date') || new Date().toISOString();

      if (!from) return null;

      let sender = from;
      const fromMatch = from.match(/(?:"?([^"]*)"?\s)?<?(.+@[^>]+)>?/);
      if (fromMatch) {
        sender = fromMatch[1]?.trim() || fromMatch[2]?.split('@')[0] || from;
      }

      return {
        id: emailData.id,
        threadId: emailData.threadId,
        subject,
        sender,
        snippet: emailData.snippet || '',
        date,
        labelIds: Array.isArray(emailData.labelIds) ? emailData.labelIds : [],
        messagesCount: 1
      };
    } catch (error) {
      console.error('Error parsing email:', error);
      return null;
    }
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

  async getThread(threadId: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    try {
      const thread = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full'
      });

      if (!thread.data.messages) {
        return [];
      }

      return thread.data.messages.map(message => {
        const headers = message.payload?.headers || [];
        const getHeader = (name: string) => 
          headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        return {
          id: message.id,
          threadId: message.threadId,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          snippet: message.snippet || '',
          labelIds: message.labelIds || [],
          payload: message.payload // Include the full payload for body processing
        };
      });
    } catch (error) {
      console.error('Error fetching thread:', error);
      throw error;
    }
  }
}