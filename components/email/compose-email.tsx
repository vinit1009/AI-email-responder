"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Wand2, Sparkles } from 'lucide-react';

interface ComposeEmailProps {
  onClose: () => void;
  replyTo?: {
    to: string;
    subject: string;
    threadId?: string;
    emails?: EmailDetails[];
  };
}

export function ComposeEmail({ onClose, replyTo }: ComposeEmailProps) {
  const { data: session } = useSession();
  const [to, setTo] = useState(replyTo?.to || '');
  const [subject, setSubject] = useState(replyTo?.subject ? `Re: ${replyTo.subject}` : '');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !content) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      setError(null);

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.email}`,
        },
        body: JSON.stringify({
          to,
          subject,
          content,
          threadId: replyTo?.threadId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const generateAIReply = async () => {
    if (!replyTo?.emails) return;

    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/ai/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: replyTo.emails,
          subject: replyTo.subject,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate reply');
      }

      const data = await response.json();
      setContent(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate reply');
    } finally {
      setGenerating(false);
    }
  };

  const improveEmail = async () => {
    if (!content.trim()) {
      setError('Please write some content first');
      return;
    }

    try {
      setImproving(true);
      setError(null);

      const response = await fetch('/api/ai/improve-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          subject,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve email');
      }

      const data = await response.json();
      setContent(data.improvedContent);
      if (!replyTo) {
        setSubject(data.improvedSubject);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve email');
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {replyTo ? 'Reply' : 'New Message'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                disabled={!!replyTo}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div className="relative">
              <textarea
                placeholder="Write your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {replyTo && (
                  <button
                    type="button"
                    onClick={generateAIReply}
                    disabled={generating}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md flex items-center gap-2"
                  >
                    <Wand2 className="h-5 w-5" />
                    {generating ? 'Generating...' : 'AI Generate'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={improveEmail}
                  disabled={improving || !content.trim()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md flex items-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  {improving ? 'Improving...' : 'Improve with AI'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm">{error}</div>
          )}

          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function XMarkIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
} 