"use client";

import { useState } from 'react';
import { Star, Inbox, Mail, PenSquare, SendHorizontal } from 'lucide-react';
import { ComposeEmail } from './compose-email';

interface SidebarProps {
  currentView: 'inbox' | 'starred' | 'sent';
  onViewChange: (view: 'inbox' | 'starred' | 'sent') => void;
}

export function EmailSidebar({ currentView, onViewChange }: SidebarProps) {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="w-64 bg-gray-100 p-4 flex flex-col h-full">
      {showCompose && (
        <ComposeEmail onClose={() => setShowCompose(false)} />
      )}

      <button
        onClick={() => setShowCompose(true)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center mb-6"
      >
        <PenSquare className="h-5 w-5 mr-2" />
        Compose
      </button>

      <nav className="space-y-1">
        <button
          onClick={() => onViewChange('inbox')}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'inbox'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Inbox className="h-5 w-5" />
          <span>Inbox</span>
        </button>

        <button
          onClick={() => onViewChange('sent')}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'sent'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <SendHorizontal className="h-5 w-5" />
          <span>Sent</span>
        </button>

        <button
          onClick={() => onViewChange('starred')}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'starred'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Star className="h-5 w-5" />
          <span>Starred</span>
        </button>
      </nav>
    </div>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
} 