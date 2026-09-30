import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "alex@company.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user and include their workspace association
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { workspace: true },
        });

        if (!user) {
          return null;
        }

        // Basic user return for session building
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.workspaceId = (user as any).workspaceId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).workspaceId = token.workspaceId;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
