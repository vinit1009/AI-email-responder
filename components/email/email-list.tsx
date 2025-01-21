"use client";

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { format, parseISO } from "date-fns";

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
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageTokens, setPrevPageTokens] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchEmails = async (token?: string) => {
    try {
      const url = token 
        ? `/api/emails?pageToken=${token}`
        : '/api/emails';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.user?.email}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await signIn('google');
          return;
        }
        throw new Error(data.error || 'Failed to fetch emails');
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching emails:', err);
      throw err;
    }
  };

  useEffect(() => {
    async function loadEmails() {
      try {
        setLoading(true);
        const data = await fetchEmails();
        setEmails(data.emails);
        setNextPageToken(data.nextPageToken);
        setHasNextPage(!!data.nextPageToken);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch emails');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated' && session?.user?.email) {
      loadEmails();
    }
  }, [session, status]);

  const handlePageChange = async (direction: 'next' | 'prev') => {
    try {
      setLoading(true);
      if (direction === 'next' && nextPageToken) {
        // Store current page token before moving to next page
        setPrevPageTokens(prev => [...prev, nextPageToken]);
        const data = await fetchEmails(nextPageToken);
        setEmails(data.emails);
        setNextPageToken(data.nextPageToken);
        setHasNextPage(!!data.nextPageToken);
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev' && currentPage > 1) {
        // Get the previous page token
        const newPrevTokens = [...prevPageTokens];
        const prevToken = newPrevTokens.pop();
        setPrevPageTokens(newPrevTokens);
        if (prevToken) {
          const data = await fetchEmails(prevToken);
          setEmails(data.emails);
          setNextPageToken(data.nextPageToken);
          setHasNextPage(!!data.nextPageToken);
          setCurrentPage(prev => prev - 1);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change page');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // First try to parse as ISO date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const emailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (emailDate.getTime() === today.getTime()) {
          return format(date, 'h:mm a'); // Today's emails show time
        } else if (date.getFullYear() === now.getFullYear()) {
          return format(date, 'MMM d'); // This year's emails show month and day
        } else {
          return format(date, 'MM/dd/yy'); // Older emails show date with year
        }
      }
      return dateString; // If parsing fails, return original string
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if formatting fails
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
      <div className="flex-1 overflow-y-auto">
        {emails.length > 0 ? (
          <>
            {emails.map((email) => (
              <div
                key={email.threadId}
                className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => onEmailSelect(email)}
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
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <span className="flex items-center">
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Newer
                  </span>
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange('next')}
                  disabled={!hasNextPage || loading}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <span className="flex items-center">
                    Older
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <p>No emails found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function RefreshIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function InboxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}