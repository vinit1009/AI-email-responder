'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // Log the error to your error reporting service
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-red-50">
      <div className="text-center space-y-6 max-w-lg mx-auto px-4">
        <h1 className="text-3xl font-bold text-red-600">Authentication Error</h1>
        <p className="text-neutral-600">
          {error || 'An error occurred during authentication. Please try again.'}
        </p>
        <div>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors duration-200"
          >
            Return to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
} 