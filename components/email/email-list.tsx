"use client";

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { format } from "date-fns";

interface Email {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
  date: string;
  labelIds: string[];
  messagesCount: number;
}

interface EmailListProps {
  onEmailSelect: (email: Email | null) => void;
}

export function EmailList({ onEmailSelect }: EmailListProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageTokens, setPrevPageTokens] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchEmails = async (token?: string) => {
    try {
      setLoading(true);
      const url = token ? `/api/emails?pageToken=${token}` : '/api/emails';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await signIn('google');
          return;
        }
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      
      if (!data.emails || !Array.isArray(data.emails)) {
        throw new Error('Invalid emails data received');
      }

      // Transform the emails to match our interface
      const transformedEmails = data.emails.map((email: any) => ({
        id: email.id || email.messageId,
        threadId: email.threadId || email.id,
        subject: email.subject || '(No Subject)',
        sender: email.sender || email.from || 'Unknown Sender',
        snippet: email.snippet || '',
        date: email.date || new Date().toISOString(),
        labelIds: email.labelIds || [],
        messagesCount: email.messagesCount || 1
      }));

      console.log('Transformed emails:', transformedEmails);

      setEmails(transformedEmails);
      setNextPageToken(data.nextPageToken);
      setHasNextPage(!!data.nextPageToken);

    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchEmails();
    }
  }, [session, status]);

  const handlePageChange = async (direction: 'next' | 'prev') => {
    try {
      if (direction === 'next' && nextPageToken) {
        setPrevPageTokens(prev => [...prev, nextPageToken]);
        await fetchEmails(nextPageToken);
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev' && currentPage > 1) {
        const newPrevTokens = [...prevPageTokens];
        const prevToken = newPrevTokens.pop();
        setPrevPageTokens(newPrevTokens);
        if (prevToken) {
          await fetchEmails(prevToken);
          setCurrentPage(prev => prev - 1);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to change page');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const emailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (emailDate.getTime() === today.getTime()) {
          return format(date, 'h:mm a');
        } else if (date.getFullYear() === now.getFullYear()) {
          return format(date, 'MMM d');
        } else {
          return format(date, 'MM/dd/yy');
        }
      }
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-gray-600 mb-4">Please sign in to view your emails</p>
        <button
          onClick={() => signIn('google')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="space-y-2">
          {emails.map((email) => (
            <div
              key={email.id}
              className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
              onClick={() => {
                console.log('Email clicked:', email);
                if (!email.threadId) {
                  console.error('No threadId for email:', email);
                  return;
                }
                onEmailSelect(email);
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {email.subject}
                  {email.messagesCount > 1 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({email.messagesCount})
                    </span>
                  )}
                </h3>
                <span className="text-sm text-gray-500">
                  {formatDate(email.date)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{email.sender}</p>
              <p className="text-sm text-gray-600 truncate">{email.snippet}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination controls */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {currentPage}</span>
          <button
            onClick={() => handlePageChange('next')}
            disabled={!hasNextPage || loading}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}