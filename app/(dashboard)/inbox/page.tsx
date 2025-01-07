"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/email/sidebar";
import { EmailList } from "@/components/email/email-list";
import { EmailView } from "@/components/email/email-view";

export default function InboxPage() {
  const { data: session, status } = useSession();
  const [selectedEmail, setSelectedEmail] = useState(null);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email List */}
        <div className={`${selectedEmail ? 'w-2/5' : 'w-full'} border-r border-gray-200 bg-white`}>
          <EmailList onEmailSelect={setSelectedEmail} />
        </div>

        {/* Email View */}
        {selectedEmail && (
          <div className="w-3/5 bg-white">
            <EmailView email={selectedEmail} />
          </div>
        )}
      </div>
    </div>
  );
}