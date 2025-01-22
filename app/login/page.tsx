"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-green-50">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[60vw] h-[60vw] left-[70%] top-[20%] bg-emerald-500 blur-[8rem] opacity-20 rounded-full"></div>
        <div className="absolute w-[45vw] h-[45vw] left-[50%] top-[25%] bg-blue-500 blur-[7rem] opacity-20 rounded-full"></div>
      </div>
      
      <div className="relative z-10 bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue to AImail</p>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-lg px-6 py-4 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        >
          <FcGoogle className="w-6 h-6" />
          Continue with Google
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-emerald-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-emerald-600 hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
} 