"use client";

import { useState } from "react";

interface EmailProps {
  email: {
    id: string;
    subject: string;
    sender: {
      name: string;
      email: string;
    };
    content: string;
    date: string;
  };
}

export function EmailView({ email }: EmailProps) {
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const generateAIResponse = async () => {
    setIsGeneratingResponse(true);
    try {
      // This will be replaced with actual Gemini API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiResponse("This is a sample AI-generated response...");
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Email Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold mb-4">{email.subject}</h1>
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            {email.sender.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium">{email.sender.name}</div>
            <div className="text-sm text-gray-600">{email.sender.email}</div>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="prose max-w-none">
          {email.content}
        </div>
      </div>

      {/* Reply Section */}
      <div className="p-6 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={generateAIResponse}
              disabled={isGeneratingResponse}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isGeneratingResponse ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Generate AI Response
                </>
              )}
            </button>
          </div>

          {aiResponse && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">AI-Generated Response:</div>
              <div className="text-gray-800">{aiResponse}</div>
              <button
                onClick={() => setAiResponse(null)}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Discard
              </button>
            </div>
          )}

          <textarea
            className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Write your reply..."
          />

          <div className="flex justify-end mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={`animate-spin ${props.className || ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}