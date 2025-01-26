import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user: user,
          email: user.email
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        if (!account?.access_token || !account?.refresh_token) {
          console.error('Missing access or refresh token');
          return false;
        }

        // Add logging to help debug
        console.log('Sign in attempt:', {
          email: user.email,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
        });

        // Store tokens in Supabase using email as the identifier
        const { error } = await supabase
          .from('oauth_tokens')
          .upsert({
            user_id: user.email,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            provider: 'google',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error storing tokens:', error);
          return false;
        }

        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Handle both development and production URLs
      if (url.startsWith("/")) {
        // For relative URLs, use the baseUrl (which will be different in dev/prod)
        return `${baseUrl}${url}`
      } else if (url.startsWith("http://localhost:3000") || url.startsWith("https://ai-email-responder-eta.vercel.app")) {
        // Allow both localhost and production URLs
        return url
      }
      return baseUrl
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  logger: {
    error: (code, ...message) => {
      console.error('NextAuth Error:', code, message);
    },
    warn: (code, ...message) => {
      console.warn('NextAuth Warning:', code, message);
    },
    debug: (code, ...message) => {
      console.debug('NextAuth Debug:', code, message);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };