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
          scope: "openid email profile https://www.googleapis.com/auth/gmail.modify",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        try {
          // Use the email as a stable identifier
          const { data: userData, error } = await supabase
            .from("users")
            .select("id")
            .eq("email", session.user.email)
            .single();

          if (error) throw error;

          if (userData) {
            session.user.id = userData.id;
          }
          
          // Add access token to session
          session.accessToken = token.accessToken as string;
        } catch (error) {
          console.error("Error in session callback:", error);
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) return false;

        // Generate a UUID for new users
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching user:", fetchError);
          return false;
        }

        let userId = existingUser?.id;

        if (!existingUser) {
          // Insert new user
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("Error creating user:", insertError);
            return false;
          }
          userId = newUser.id;
        }

        // Store OAuth tokens
        if (account?.access_token) {
          const { error: tokenError } = await supabase
            .from("oauth_tokens")
            .upsert({
              user_id: userId,
              provider: "google",
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              updated_at: new Date().toISOString(),
            });

          if (tokenError) {
            console.error("Error storing tokens:", tokenError);
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Changed from "/auth/error" to "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };