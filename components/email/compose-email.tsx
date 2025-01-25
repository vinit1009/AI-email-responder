"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Wand2, Sparkles, X } from 'lucide-react';

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

      // Format the email content with proper HTML structure and encoding
      const formattedContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                    line-height: 1.6; color: #333;">
          ${content.split('\n').map(line => 
            line.trim() 
              ? `<p style="margin: 0 0 1em 0;">${
                  line
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;')
                }</p>` 
              : '<br/>'
          ).join('')}
        </div>
      `;

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.email}`,
        },
        body: JSON.stringify({
          to,
          subject,
          content: formattedContent,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-neutral-900">
            {replyTo ? 'Reply' : 'New Message'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black
                         text-neutral-900 placeholder:text-neutral-400"
                disabled={!!replyTo}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black
                         text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 justify-end">
                {replyTo && (
                  <button
                    type="button"
                    onClick={generateAIReply}
                    disabled={generating}
                    className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900 
                             hover:bg-neutral-100 rounded-lg transition-colors
                             flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Wand2 className="h-4 w-4" />
                    {generating ? 'Generating...' : 'AI Generate'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={improveEmail}
                  disabled={improving || !content.trim()}
                  className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900 
                           hover:bg-neutral-100 rounded-lg transition-colors
                           flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {improving ? 'Improving...' : 'Improve with AI'}
                </button>
              </div>
              <textarea
                placeholder="Write your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black
                         text-neutral-900 placeholder:text-neutral-400 resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-neutral-700 bg-neutral-100 rounded-lg 
                       hover:bg-neutral-200 transition-colors font-medium
                       disabled:opacity-50"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-black text-white rounded-lg 
                       hover:bg-neutral-800 transition-colors font-medium
                       disabled:opacity-50 disabled:hover:bg-black"
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