"use client";

import Link from "next/link";
import { useState } from "react";
import { EmailList } from "@/components/email/email-list";
import { EmailView } from "@/components/email/email-view";

// Define the Email interface here instead of importing from @prisma/client
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

export default function Home() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  
  console.log('Selected email:', selectedEmail);

  return (
    <div className="relative flex min-h-screen items-center justify-start bg-gradient-to-r from-white to-green-50">
      {/* Gradient Bubble Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[60vw] h-[60vw] left-[70%] top-[20%] bg-emerald-500 blur-[8rem] opacity-20 rounded-full"></div>
        <div className="absolute w-[45vw] h-[45vw] left-[50%] top-[25%] bg-blue-500 blur-[7rem] opacity-20 rounded-full"></div>
        <div className="absolute w-[50vw] h-[50vw] left-[85%] top-[40%] bg-teal-400 blur-[7rem] opacity-20 rounded-full"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-start text-left px-16 py-16 max-w-4xl">
        {/* Logo */}
        <div className="text-4xl font-bold text-emerald-900 mb-4">AImail</div>

        {/* Title */}
        <h1 className="text-6xl font-bold text-[#1a1919] leading-tight mb-6">
          Your Inbox,{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Powered by AI
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Experience email like never before. Smart responses, intelligent organization,
          and seamless integration with your existing Gmail account.
        </p>

        {/* CTA Buttons */}
        <div className="flex space-x-4">
          <Link href="/login" className="group">
            <div className="relative">
              {/* Gradient border container */}
              <div className="absolute inset-[1px] bottom-[-2px] right-[-2px] bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg" />
              {/* Button content */}
              <div className="relative px-8 py-4 bg-white rounded-lg hover:bottom-[-3px] transition-all duration-200">
                <span className="text-gray-900 font-medium text-lg">Sign in with Google</span>
              </div>
            </div>
          </Link>
          
          <Link href="/signup">
            <div className="relative">
              {/* Solid border container */}
              <div className="absolute inset-[1px] bottom-[-2px] right-[-2px] bg-emerald-700 rounded-lg" />
              <div className="relative px-8 py-4 bg-white rounded-lg hover:bottom-[-3px] transition-all duration-200">
                <span className="text-emerald-700 font-medium text-lg">Learn More</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-8 mt-16">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">AI-Powered Responses</h3>
            <p className="text-gray-600">Generate contextual responses with one click using advanced AI technology.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">Gmail Integration</h3>
            <p className="text-gray-600">Seamlessly connect with your existing Gmail account and preferences.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">Smart Organization</h3>
            <p className="text-gray-600">Intelligent categorization and priority inbox features.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">Enhanced Security</h3>
            <p className="text-gray-600">Enterprise-grade security with end-to-end encryption.</p>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        <EmailList onEmailSelect={(email: Email | null) => {
          console.log('Email selected:', email);
          setSelectedEmail(email);
        }} />
        {selectedEmail && <EmailView email={selectedEmail} />}
      </div>
    </div>
  );
}