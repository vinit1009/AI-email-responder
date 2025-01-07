"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

interface Email {
  id: string;
  threadId: string;
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  snippet: string;
  date: string;
  read: boolean;
  labelIds: string[];
}

interface EmailListProps {
  onEmailSelect: (email: Email | null) => void;
}

export function EmailList({ onEmailSelect }: EmailListProps) {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmails() {
      if (!session) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/emails');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to fetch emails');
        }
        
        setEmails(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching emails:', err);
        setError(err instanceof Error ? err.message : 'Failed to load emails');
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, [session]);

  const handleEmailClick = async (email: Email) => {
    setSelectedEmailId(email.id);
    onEmailSelect(email);
    
    if (!email.read) {
      try {
        const response = await fetch('/api/emails/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageId: email.id }),
        });
        
        if (response.ok) {
          setEmails(emails.map(e => 
            e.id === email.id ? { ...e, read: true } : e
          ));
        }
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-3 border-b border-gray-200">
        <input 
          type="checkbox" 
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <button 
          onClick={() => window.location.reload()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <RefreshIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto divide-y divide-gray-200">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => handleEmailClick(email)}
            className={`flex items-start p-3 hover:bg-gray-50 cursor-pointer ${
              selectedEmailId === email.id ? "bg-blue-50" : ""
            } ${!email.read ? "font-semibold" : ""}`}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className="truncate text-sm">
                  {email.sender.name || email.sender.email}
                </p>
                <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                  {format(new Date(email.date), "MMM d")}
                </span>
              </div>
              <p className="text-sm truncate">
                {email.subject}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {email.snippet}
              </p>
            </div>
          </div>
        ))}

        {emails.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <InboxIcon className="w-16 h-16 mb-4" />
            <p>No emails found</p>
          </div>
        )}
      </div>
    </div>
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