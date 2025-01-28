"use client";

import Link from "next/link";

export default function Home() {
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

      {/* Main Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed w-full top-0 bg-white/80 backdrop-blur-sm border-b border-neutral-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="text-2xl font-bold text-black">Healius</div>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-black 
                         rounded-lg hover:bg-neutral-800 transition-colors duration-200"
              >
                Sign in with Google
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-6">
                <h1 className="text-6xl font-bold text-black mb-6 leading-[1.1]">
                  Your Inbox,{" "}
                  <span className="bg-gradient-to-r from-neutral-900 to-neutral-500 
                                 bg-clip-text text-transparent">
                    Powered by AI
                  </span>
                </h1>
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  Experience email like never before. Smart responses, intelligent organization,
                  and seamless integration with your existing Gmail account.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-3 
                             border-2 border-black bg-black text-white text-lg 
                             font-medium rounded-xl hover:bg-neutral-800 
                             transition-colors duration-200"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="#features"
                    className="inline-flex items-center justify-center px-6 py-3 
                             border-2 border-neutral-200 text-lg font-medium 
                             rounded-xl hover:bg-neutral-50 transition-colors duration-200"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block lg:col-span-6">
                <div className="relative h-full">
                  {/* Abstract Email UI Decoration */}
                  <div className="absolute inset-0 bg-neutral-50 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_50%,transparent_75%)]" />
                    <div className="p-8">
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-full bg-neutral-200" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-neutral-200 rounded w-3/4" />
                              <div className="h-3 bg-neutral-100 rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "AI-Powered Responses",
                  description: "Generate contextual responses with one click using advanced AI technology."
                },
                {
                  title: "Smart Organization",
                  description: "Intelligent categorization and priority inbox features keep you focused."
                },
                {
                  title: "Gmail Integration",
                  description: "Seamlessly connect with your existing Gmail account and preferences."
                },
                {
                  title: "Enhanced Security",
                  description: "Enterprise-grade security with end-to-end encryption for your peace of mind."
                },
                {
                  title: "Quick Actions",
                  description: "Powerful shortcuts and bulk actions to manage emails efficiently."
                },
                {
                  title: "Beautiful Interface",
                  description: "Clean, modern design that helps you focus on what matters most."
                }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="p-6 bg-white rounded-xl border border-neutral-200 
                           hover:border-neutral-300 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-neutral-200">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-neutral-600">
              <p>© 2024 AImail. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}