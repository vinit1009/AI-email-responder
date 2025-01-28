"use client";

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { format } from "date-fns";
import { Star, Loader2 } from 'lucide-react';
import { decode } from 'html-entities';
import { EmailCategories } from './email-categories';

interface Email {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  recipient: string;
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
  const [currentCategory, setCurrentCategory] = useState('CATEGORY_PERSONAL');
  const [categoryPageTokens, setCategoryPageTokens] = useState<Record<string, string>>({});
  const [categoryEmails, setCategoryEmails] = useState<Record<string, Email[]>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [allCategoriesLoaded, setAllCategoriesLoaded] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const categories = [
    'all',
    'CATEGORY_PERSONAL',
    'CATEGORY_UPDATES',
    'CATEGORY_PROMOTIONS',
    'CATEGORY_SOCIAL'
  ];

  const fetchAllCategories = async () => {
    try {
      setLoading(true);
      const emailsByCategory: Record<string, Email[]> = {};
      const tokensByCategory: Record<string, string> = {};
      
      // Fetch one category at a time with delay
      for (const category of categories) {
        const url = new URL('/api/emails', window.location.origin);
        url.searchParams.set('view', currentView);
        url.searchParams.set('category', category);
        
        try {
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${session?.user?.email}`,
            },
          });

          const data = await response.json();
          if (!data.emails || !Array.isArray(data.emails)) {
            throw new Error('Invalid emails data received');
          }

          // Store in temporary object first
          emailsByCategory[category] = data.emails.map((email: any) => ({
            id: email.id || email.messageId,
            threadId: email.threadId || email.id,
            subject: email.subject || '(No Subject)',
            sender: email.sender || email.from || 'Unknown Sender',
            recipient: email.recipient || email.to || 'Unknown Recipient',
            snippet: email.snippet || '',
            date: email.date || new Date().toISOString(),
            labelIds: email.labelIds || [],
            messagesCount: email.messagesCount || 1
          }));

          if (data.nextPageToken) {
            tokensByCategory[category] = data.nextPageToken;
          }

          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error fetching ${category}:`, error);
        }
      }

      // Update all state at once after all fetches are complete
      setCategoryEmails(emailsByCategory);
      setCategoryPageTokens(tokensByCategory);

      // Set initial category emails to Personal
      if (emailsByCategory['CATEGORY_PERSONAL']) {
        setEmails(emailsByCategory['CATEGORY_PERSONAL']);
        setNextPageToken(tokensByCategory['CATEGORY_PERSONAL'] || null);
        setHasNextPage(!!tokensByCategory['CATEGORY_PERSONAL']);
      }
      
      setAllCategoriesLoaded(true);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch emails');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && isInitialLoad) {
      fetchAllCategories();
    }
  }, [status, isInitialLoad]);

  // Update the useEffect for category changes
  useEffect(() => {
    if (allCategoriesLoaded && categoryEmails[currentCategory]) {
      setEmails(categoryEmails[currentCategory]);
      setNextPageToken(categoryPageTokens[currentCategory]);
      setHasNextPage(!!categoryPageTokens[currentCategory]);
      setCurrentPage(1); // Reset page number when changing categories
      setPrevPageTokens([]); // Reset pagination tokens
    }
  }, [currentCategory, allCategoriesLoaded, categoryEmails, categoryPageTokens]);

  // Add an effect to handle initial loading state
  useEffect(() => {
    if (!loading && categoryEmails['CATEGORY_PERSONAL']?.length === 0) {
      setEmails([]);
    }
  }, [loading, categoryEmails]);

  const handlePageChange = async (direction: 'next' | 'prev') => {
    try {
      setIsPageLoading(true);
      
      if (direction === 'next' && nextPageToken) {
        // Store current page's emails before moving to next
        setCachedEmails(prev => ({
          ...prev,
          [currentPage]: emails
        }));
        
        setPrevPageTokens(prev => [...prev, nextPageToken]);
        
        // Fetch next page
        const url = new URL('/api/emails', window.location.origin);
        url.searchParams.set('view', currentView);
        url.searchParams.set('category', currentCategory);
        url.searchParams.set('pageToken', nextPageToken);
        
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${session?.user?.email}`,
          },
        });

        const data = await response.json();
        if (!data.emails || !Array.isArray(data.emails)) {
          throw new Error('Invalid emails data received');
        }

        const newEmails = data.emails.map((email: any) => ({
          id: email.id || email.messageId,
          threadId: email.threadId || email.id,
          subject: email.subject || '(No Subject)',
          sender: email.sender || email.from || 'Unknown Sender',
          recipient: email.recipient || email.to || 'Unknown Recipient',
          snippet: email.snippet || '',
          date: email.date || new Date().toISOString(),
          labelIds: email.labelIds || [],
          messagesCount: email.messagesCount || 1
        }));

        // Update current view
        setEmails(newEmails);
        setNextPageToken(data.nextPageToken);
        setHasNextPage(!!data.nextPageToken);
        setCurrentPage(prev => prev + 1);

      } else if (direction === 'prev' && currentPage > 1) {
        // Get previous page's emails from cache
        const previousEmails = cachedEmails[currentPage - 1];
        
        if (previousEmails) {
          // If we have the previous page cached, use it
          setEmails(previousEmails);
          setCurrentPage(prev => prev - 1);
          
          // Update next page token
          const newPrevTokens = [...prevPageTokens];
          const currentToken = newPrevTokens.pop();
          setPrevPageTokens(newPrevTokens);
          setNextPageToken(currentToken || null);
          setHasNextPage(true);
        } else {
          // If not cached, fetch the previous page
          const newPrevTokens = [...prevPageTokens];
          const prevToken = newPrevTokens[newPrevTokens.length - 2]; // Get second to last token
          
          const url = new URL('/api/emails', window.location.origin);
          url.searchParams.set('view', currentView);
          url.searchParams.set('category', currentCategory);
          url.searchParams.set('pageToken', prevToken || '');
          
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${session?.user?.email}`,
            },
          });

          const data = await response.json();
          if (!data.emails || !Array.isArray(data.emails)) {
            throw new Error('Invalid emails data received');
          }

          const previousEmails = data.emails.map((email: any) => ({
            id: email.id || email.messageId,
            threadId: email.threadId || email.id,
            subject: email.subject || '(No Subject)',
            sender: email.sender || email.from || 'Unknown Sender',
            recipient: email.recipient || email.to || 'Unknown Recipient',
            snippet: email.snippet || '',
            date: email.date || new Date().toISOString(),
            labelIds: email.labelIds || [],
            messagesCount: email.messagesCount || 1
          }));

          // Update state
          setEmails(previousEmails);
          setPrevPageTokens(newPrevTokens.slice(0, -1));
          setNextPageToken(newPrevTokens[newPrevTokens.length - 1] || null);
          setCurrentPage(prev => prev - 1);
          setHasNextPage(true);
        }
      }
    } catch (error) {
      console.error('Error changing page:', error);
      setError(error instanceof Error ? error.message : 'Failed to change page');
    } finally {
      setIsPageLoading(false);
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

  const getEmailDisplay = (email: Email) => {
    if (currentView === 'sent') {
      return {
        primary: `To: ${email.recipient}`,
        secondary: `From: ${email.sender}`
      };
    }
    return {
      primary: `From: ${email.sender}`,
      secondary: `To: ${email.recipient}`
    };
  };

  const formatEmailContent = (text: string) => {
    // Decode HTML entities and clean up special characters
    return decode(text)
      .replace(/&\w+;/g, match => {
        switch (match) {
          case '&quot;': return '"';
          case '&apos;': return "'";
          case '&amp;': return '&';
          case '&lt;': return '<';
          case '&gt;': return '>';
          default: return match;
        }
      });
  };

  const markAsRead = async (emailId: string) => {
    try {
      // Update local state immediately across all categories
      const updateEmailInCategory = (emails: Email[]) => 
        emails.map(email => {
          if (email.id === emailId) {
            return {
              ...email,
              labelIds: email.labelIds.filter(label => label !== 'UNREAD')
            };
          }
          return email;
        });

      // Update current emails list
      setEmails(prevEmails => updateEmailInCategory(prevEmails));

      // Update all category caches
      setCategoryEmails(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(category => {
          if (updated[category]) {
            updated[category] = updateEmailInCategory(updated[category]);
          }
        });
        return updated;
      });

      // Make API call to update server
      const response = await fetch('/api/emails/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.email}`,
        },
        body: JSON.stringify({ messageId: emailId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark email as read');
      }

      // Verify the update was successful
      const data = await response.json();
      if (!data.success) {
        throw new Error('Server indicated unsuccessful update');
      }

    } catch (error) {
      console.error('Error marking email as read:', error);
      // Revert local state changes and refresh data
      await fetchAllCategories();
      // Optionally show an error toast/notification
    }
  };

  const filteredEmails = emails.filter(email => {
    if (currentCategory === 'all') return true;
    return email.labelIds.includes(currentCategory);
  });

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
    <div className="h-full flex flex-col bg-white">
      <div className="flex-shrink-0 border-b border-neutral-200">
        <EmailCategories 
          emails={emails}
          onCategoryChange={(category) => {
            setCurrentCategory(category);
            setCurrentPage(1);
            setPrevPageTokens([]);
          }}
          loading={isInitialLoad}
          categoryEmails={categoryEmails}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <p className="text-lg">
              {currentCategory === 'all' 
                ? "No emails found" 
                : `No emails in ${currentCategory.replace('CATEGORY_', '').toLowerCase()}`
              }
            </p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            console.log('Email thread:', email.subject, 'Count:', email.messagesCount);
            return (
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
                    markAsRead(email.id);
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
                          <span className="inline-flex items-center justify-center px-2 py-0.5 
                                         text-xs font-medium bg-neutral-100 text-neutral-600 
                                         rounded-full min-w-[1.5rem] ml-2">
                            {email.messagesCount}
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
                      {getEmailDisplay(email).primary}
                    </p>
                    <p className="text-sm text-neutral-500 truncate leading-relaxed">
                      {formatEmailContent(email.snippet)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="flex-shrink-0 border-t border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 1 || isPageLoading}
            className="px-4 py-2 text-sm bg-white border border-neutral-300 rounded-lg 
                     hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white
                     transition-colors duration-200 font-medium text-neutral-700
                     flex items-center gap-2 min-w-[100px] justify-center"
          >
            {isPageLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Previous'
            )}
          </button>
          
          <span className="text-sm text-neutral-600 font-medium">
            Page {currentPage} • {filteredEmails.length} emails
          </span>
          
          <button
            onClick={() => handlePageChange('next')}
            disabled={!hasNextPage || isPageLoading}
            className="px-4 py-2 text-sm bg-white border border-neutral-300 rounded-lg 
                     hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white
                     transition-colors duration-200 font-medium text-neutral-700
                     flex items-center gap-2 min-w-[100px] justify-center"
          >
            {isPageLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}