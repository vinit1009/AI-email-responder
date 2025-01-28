"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/inbox",
      });
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* Gradient and Pattern Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.05)_100%)]" />
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed w-full top-0 bg-white/80 backdrop-blur-sm border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-black hover:opacity-80 transition-opacity">
              Healius
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-12">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
                Welcome back
              </h1>
              <p className="text-neutral-600">
                Sign in to continue to your inbox
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 
                       border-2 border-neutral-200 rounded-xl text-neutral-700 
                       font-medium hover:bg-neutral-50 hover:border-neutral-300 
                       transition-all duration-200 group"
            >
              <FcGoogle className="w-6 h-6" />
              <span className="text-neutral-900">Continue with Google</span>
            </button>

            {/* Decorative Email Preview */}
            <div className="mt-12 space-y-4 py-6 border-t border-neutral-100">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="flex gap-3 items-center opacity-40"
                >
                  <div className="w-6 h-6 rounded-full bg-neutral-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-neutral-200 rounded w-3/4" />
                    <div className="h-2 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Terms and Privacy */}
            <div className="mt-6 text-center text-sm text-neutral-500">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-black hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-black hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Need help?{" "}
              <Link href="/support" className="text-black hover:underline font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 