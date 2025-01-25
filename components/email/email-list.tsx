"use client";

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { format } from "date-fns";
import { Star } from 'lucide-react';

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
  currentView: 'inbox' | 'starred';
  onEmailSelect: (email: Email | null) => void;
}

export function EmailList({ currentView, onEmailSelect }: EmailListProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageTokens, setPrevPageTokens] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalEmails, setTotalEmails] = useState(0);

  const fetchEmails = async (token?: string) => {
    try {
      setLoading(true);
      const url = token 
        ? `/api/emails?pageToken=${token}&view=${currentView}` 
        : `/api/emails?view=${currentView}`;
      
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
      setTotalEmails(data.resultsCount || transformedEmails.length);
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
  }, [session, status, currentView]);

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

  const toggleStar = async (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation(); // Prevent email selection when clicking star
    try {
      const email = emails.find(e => e.id === emailId);
      if (!email) return;

      const isCurrentlyStarred = email.labelIds.includes('STARRED');
      
      const response = await fetch('/api/emails/star', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.email}`,
        },
        body: JSON.stringify({
          messageId: emailId,
          starred: !isCurrentlyStarred,
        }),
      });

      if (!response.ok) throw new Error('Failed to toggle star');

      // Update local state
      setEmails(emails.map(email => {
        if (email.id === emailId) {
          const newLabelIds = isCurrentlyStarred
            ? email.labelIds.filter(id => id !== 'STARRED')
            : [...email.labelIds, 'STARRED'];
          return { ...email, labelIds: newLabelIds };
        }
        return email;
      }));
    } catch (error) {
      console.error('Error toggling star:', error);
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => (
          <div
            key={email.id}
            className="px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 flex items-start"
            onClick={() => {
              if (!email.threadId) {
                console.error('No threadId for email:', email);
                return;
              }
              onEmailSelect(email);
              // Mark as read when opening
              if (email.labelIds.includes('UNREAD')) {
                fetch('/api/emails/mark-read', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.user?.email}`,
                  },
                  body: JSON.stringify({ messageId: email.id }),
                });
              }
            }}
          >
            <button
              onClick={(e) => toggleStar(e, email.id)}
              className="mr-4 text-gray-400 hover:text-yellow-400 flex-shrink-0 mt-1"
            >
              <Star
                className={`h-5 w-5 ${
                  email.labelIds.includes('STARRED')
                    ? 'fill-yellow-400 text-yellow-400'
                    : ''
                }`}
              />
            </button>

            <div className="min-w-0 flex-1"> {/* Add min-w-0 to prevent overflow */}
              <div className="flex items-center justify-between">
                <h3 className={`font-medium truncate mr-2 ${
                  email.labelIds.includes('UNREAD') ? 'font-bold' : ''
                }`}>
                  {email.subject}
                  {email.messagesCount > 1 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({email.messagesCount})
                    </span>
                  )}
                </h3>
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {formatDate(email.date)}
                </span>
              </div>
              <p className={`text-sm truncate ${
                email.labelIds.includes('UNREAD')
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-600'
              }`}>
                {email.sender}
              </p>
              <p className="text-sm text-gray-600 truncate">{email.snippet}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination controls */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} • {totalEmails} emails
          </span>
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