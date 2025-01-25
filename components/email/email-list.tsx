"use client";

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { format } from "date-fns";
import { Star, Loader2 } from 'lucide-react';

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
  currentView: 'inbox' | 'starred' | 'sent';
  onEmailSelect: (email: Email | null) => void;
}

function EmailSkeleton() {
  return (
    <div className="px-6 py-4 border-b border-neutral-200 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="mt-1 h-7 w-7 rounded-full bg-neutral-200" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="h-5 bg-neutral-200 rounded w-1/3" />
            <div className="h-4 bg-neutral-200 rounded w-16" />
          </div>
          <div className="h-4 bg-neutral-200 rounded w-1/4 mb-1" />
          <div className="h-4 bg-neutral-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
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
  const [cachedEmails, setCachedEmails] = useState<Record<string, Email[]>>({});

  const fetchEmails = async (token?: string) => {
    try {
      setLoading(true);
      
      // Check cache first
      if (!token && cachedEmails[currentView]) {
        setEmails(cachedEmails[currentView]);
        setLoading(false);
        return;
      }

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

      // Update cache
      setCachedEmails(prev => ({
        ...prev,
        [currentView]: transformedEmails
      }));

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
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto">
          {[...Array(8)].map((_, i) => (
            <EmailSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 m-4 bg-white rounded-lg shadow-lg">
        <p className="text-neutral-600 mb-6 text-lg">Please sign in to view your emails</p>
        <button
          onClick={() => signIn('google')}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors duration-200 font-medium"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 m-4 bg-white rounded-lg shadow-lg">
        <p className="text-red-600 mb-6 text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors duration-200 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <p className="text-lg">
              {currentView === 'inbox' && "No emails in your inbox"}
              {currentView === 'starred' && "No starred emails"}
              {currentView === 'sent' && "No sent emails"}
            </p>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              className="group px-6 py-4 border-b border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-all duration-200"
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
              <div className="flex items-start space-x-4">
                <button
                  onClick={(e) => toggleStar(e, email.id)}
                  className="mt-1 p-1 rounded-full hover:bg-neutral-100 transition-colors duration-200"
                >
                  <Star
                    className={`h-5 w-5 transition-colors duration-200 ${
                      email.labelIds.includes('STARRED')
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-neutral-400 group-hover:text-neutral-600'
                    }`}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`truncate mr-4 text-neutral-900 ${
                      email.labelIds.includes('UNREAD') ? 'font-bold' : 'font-medium'
                    }`}>
                      {email.subject}
                      {email.messagesCount > 1 && (
                        <span className="ml-2 text-sm text-neutral-500 font-normal">
                          ({email.messagesCount})
                        </span>
                      )}
                    </h3>
                    <span className="text-sm text-neutral-500 flex-shrink-0 font-medium">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <p className={`text-sm truncate mb-1 ${
                    email.labelIds.includes('UNREAD')
                      ? 'text-neutral-800 font-medium'
                      : 'text-neutral-600'
                  }`}>
                    {email.sender}
                  </p>
                  <p className="text-sm text-neutral-500 truncate leading-relaxed">
                    {email.snippet}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="flex-shrink-0 border-t border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 text-sm bg-white border border-neutral-300 rounded-lg 
                     hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white
                     transition-colors duration-200 font-medium text-neutral-700"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-600 font-medium">
            Page {currentPage} • {totalEmails} emails
          </span>
          <button
            onClick={() => handlePageChange('next')}
            disabled={!hasNextPage || loading}
            className="px-4 py-2 text-sm bg-white border border-neutral-300 rounded-lg 
                     hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white
                     transition-colors duration-200 font-medium text-neutral-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}