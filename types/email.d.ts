export interface Email {
  id: string;
  subject: string;
  sender: string;
  date: string;
  snippet: string;
  labelIds: string[];
}

export interface EmailDetails {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  snippet: string;
  labelIds: string[];
} 