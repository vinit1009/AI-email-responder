"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { decode } from "html-entities"; // For decoding special HTML characters
import { ComposeEmail } from "./compose-email";

interface EmailDetails {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  snippet: string;
  labelIds: string[];
}

interface EmailViewProps {
  email: {
    id: string;
    subject: string;
    sender: string;
    date: string;
    threadId: string;
  };
}

export function EmailView({ email }: EmailViewProps) {
  const { data: session } = useSession();
  const [threadEmails, setThreadEmails] = useState<EmailDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    if (!email?.threadId) {
      console.log('No threadId provided');
      return;
    }

    async function fetchThreadEmails() {
      try {
        setLoading(true);
        console.log('Fetching thread:', email.threadId);
        
        const response = await fetch(`/api/emails/thread/${email.threadId}`, {
          headers: {
            Authorization: `Bearer ${session?.user?.email}`,
          },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch email thread: ${response.status}`);
        }

        const data = await response.json();
        console.log('Thread data received:', data);

        if (!data.messages || !Array.isArray(data.messages)) {
          throw new Error('Invalid thread data format');
        }

        const processedEmails = data.messages.map((message: any) => ({
          id: message.id,
          subject: message.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(No subject)',
          from: message.payload?.headers?.find((h: any) => h.name === 'From')?.value || '',
          to: message.payload?.headers?.find((h: any) => h.name === 'To')?.value || '',
          date: message.payload?.headers?.find((h: any) => h.name === 'Date')?.value || '',
          body: message.payload ? processEmailBody(message.payload) : message.snippet,
          snippet: message.snippet || '',
          labelIds: message.labelIds || []
        }));

        console.log('Processed emails:', processedEmails);
        setThreadEmails(processedEmails);
      } catch (err) {
        console.error("Error fetching email thread:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch email thread"
        );
      } finally {
        setLoading(false);
      }
    }

    if (email?.threadId && session?.user?.email) {
      fetchThreadEmails();
    }
  }, [email.threadId, session?.user?.email]);

  const processEmailBody = (payload: any) => {
    if (!payload.parts && payload.body) {
      return decodeEmailBody(payload.body.data, payload.mimeType);
    }

    if (payload.parts) {
      const htmlPart = payload.parts.find(
        (part: any) => part.mimeType === "text/html"
      );

      if (htmlPart?.body?.data) {
        return decodeEmailBody(htmlPart.body.data, "text/html");
      }

      const textPart = payload.parts.find(
        (part: any) => part.mimeType === "text/plain"
      );

      if (textPart?.body?.data) {
        return decodeEmailBody(textPart.body.data, "text/plain");
      }
    }

    return "Content not available";
  };

  const decodeEmailBody = (data: string, mimeType: string) => {
    try {
      const raw = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
      const decodedContent = decode(raw); // Decode HTML entities first

      if (mimeType === "text/html") {
        return formatEmailContent(decodedContent);
      }

      // For plain text, improve formatting by:
      // 1. Decode HTML entities
      // 2. Split by newlines
      // 3. Remove empty lines
      // 4. Wrap each line in paragraph tags
      return decodedContent
        .split(/\r?\n/) // Split on both \r\n and \n
        .map(line => line.trim())
        .filter(line => line.length > 0) // Remove empty lines
        .map(line => `<p>${line}</p>`)
        .join('\n');
    } catch (error) {
      console.error("Error decoding email body:", error);
      return "Failed to decode email content.";
    }
  };

  const formatEmailContent = (content: string) => {
    // First decode any HTML entities in the content
    const decodedContent = decode(content);
    
    // Clean up common email formatting issues
    const cleanedContent = decodedContent
      .replace(/\r?\n\s*\r?\n/g, '</p><p>') // Convert multiple newlines to paragraphs
      .replace(/\r?\n/g, '<br />'); // Convert single newlines to line breaks

    // Sanitize and allow safe HTML rendering
    return DOMPurify.sanitize(cleanedContent, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "a",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "img",
        "div",
        "span",
        "table",
        "tr",
        "td",
        "th",
        "tbody",
        "thead",
        "style",
        "header",
        "footer",
        "nav",
        "section",
        "article",
        "center",
        "font",
        "b",
        "i",
        "strike",
        "hr",
        "figure",
        "figcaption",
      ],
      ALLOWED_ATTR: [
        "href",
        "src",
        "alt",
        "style",
        "class",
        "id",
        "width",
        "height",
        "align",
        "valign",
        "target",
        "bgcolor",
        "color",
        "border",
        "cellpadding",
        "cellspacing",
        "data-*",
        "title",
        "role",
        "aria-*",
        "name",
        "type",
      ],
      ADD_TAGS: ["style"],
      ADD_ATTR: ["target"],
      WHOLE_DOCUMENT: true,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM: false,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(
      () => alert("Email content copied to clipboard!"),
      (err) => console.error("Failed to copy email content:", err)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Loading email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white p-6">
        <div className="text-center space-y-4">
          <p className="text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!threadEmails.length) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-8 py-6 border-b border-neutral-200">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-xl font-semibold text-neutral-900 leading-tight">
            {email.subject}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReplyModal(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 
                       transition-colors font-medium text-sm"
            >
              Reply
            </button>
            <button
              onClick={() => copyToClipboard(threadEmails[0]?.body || "")}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg 
                       hover:bg-neutral-200 transition-colors font-medium text-sm"
            >
              Copy Content
            </button>
          </div>
        </div>

        {threadEmails.length > 1 && (
          <div className="text-sm text-neutral-500 mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-neutral-400" />
            {threadEmails.length} messages in conversation
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <span className="text-neutral-500 w-16">From:</span>
            <span className="text-neutral-800">{threadEmails[0].from}</span>
          </div>
          <div className="flex items-start">
            <span className="text-neutral-500 w-16">To:</span>
            <span className="text-neutral-800">{threadEmails[0].to}</span>
          </div>
          <div className="flex items-start">
            <span className="text-neutral-500 w-16">Date:</span>
            <span className="text-neutral-800">{formatDate(threadEmails[0].date)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6 space-y-8">
          {threadEmails.map((threadEmail, index) => (
            <div 
              key={threadEmail.id}
              className={`${
                index !== threadEmails.length - 1 
                  ? 'border-b border-neutral-100 pb-8' 
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="font-medium text-neutral-900">
                    {threadEmail.from}
                  </div>
                  <div className="text-sm text-neutral-500">
                    To: {threadEmail.to}
                  </div>
                </div>
                <div className="text-sm text-neutral-500 tabular-nums">
                  {formatDate(threadEmail.date)}
                </div>
              </div>

              <div
                className="prose max-w-none prose-neutral
                         prose-p:text-neutral-600 prose-p:leading-relaxed
                         prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                         prose-blockquote:border-l-neutral-200 prose-blockquote:text-neutral-500
                         prose-strong:text-neutral-900
                         prose-pre:bg-neutral-50 prose-pre:text-neutral-800"
                dangerouslySetInnerHTML={{
                  __html: threadEmail.body,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {showReplyModal && (
        <ComposeEmail
          onClose={() => setShowReplyModal(false)}
          replyTo={{
            to: threadEmails[0]?.from || email.sender,
            subject: email.subject,
            threadId: email.threadId,
            emails: threadEmails,
          }}
        />
      )}
    </div>
  );
}
