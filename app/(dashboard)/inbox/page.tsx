"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { EmailSidebar } from "@/components/email/sidebar";
import { EmailList } from "@/components/email/email-list";
import { EmailView } from "@/components/email/email-view";
import type { Email } from "@/types/email";

export default function InboxPage() {
  const { data: session, status } = useSession();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [currentView, setCurrentView] = useState<'inbox' | 'starred'>('inbox');

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  if (!session?.user?.email) {
    return <div>Please sign in to access your inbox</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <EmailSidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className={`${selectedEmail ? 'w-2/5' : 'w-full'} border-r border-gray-200 bg-white`}>
          <EmailList 
            currentView={currentView}
            onEmailSelect={setSelectedEmail} 
          />
        </div>

        {selectedEmail && (
          <div className="w-3/5 bg-white">
            <EmailView email={selectedEmail} />
          </div>
        )}
      </div>
    </div>
  );
}