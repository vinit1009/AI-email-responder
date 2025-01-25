"use client";

import { useState } from 'react';
import { Star, Inbox, SendHorizontal, PenSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ComposeEmail } from './compose-email';

interface SidebarProps {
  currentView: 'inbox' | 'starred' | 'sent';
  onViewChange: (view: 'inbox' | 'starred' | 'sent') => void;
}

export function EmailSidebar({ currentView, onViewChange }: SidebarProps) {
  const { data: session } = useSession();
  const [showCompose, setShowCompose] = useState(false);

  const navigationItems = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: SendHorizontal,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
    },
  ] as const;

  return (
    <div className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full">
      {showCompose && (
        <ComposeEmail onClose={() => setShowCompose(false)} />
      )}

      <div className="p-4">
        <button
          onClick={() => setShowCompose(true)}
          className="w-full px-4 py-2.5 bg-black text-white rounded-lg 
                   hover:bg-neutral-800 transition-all duration-200 
                   flex items-center justify-center gap-2 font-medium
                   active:bg-neutral-900 active:scale-[0.98]"
        >
          <PenSquare className="h-4 w-4" />
          <span>Compose</span>
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {navigationItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                     transition-all duration-200 group relative
                     ${currentView === id 
                       ? 'bg-neutral-100 text-neutral-900' 
                       : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                     }`}
          >
            <Icon 
              className={`h-4 w-4 transition-colors duration-200
                       ${currentView === id 
                         ? 'text-neutral-900' 
                         : 'text-neutral-500 group-hover:text-neutral-900'
                       }`}
            />
            <span className="font-medium text-sm">{label}</span>
            
            {/* Active Indicator */}
            {currentView === id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 
                           bg-black rounded-r-full" 
              />
            )}
          </button>
        ))}
      </nav>

      {/* User Profile Section */}
      {session?.user && (
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-2">
            {session.user.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'Profile'} 
                className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 
                           flex items-center justify-center text-neutral-500">
                {session.user.name?.[0] || session.user.email?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {session.user.name && (
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {session.user.name}
                </p>
              )}
              <p className="text-xs text-neutral-500 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      )}
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