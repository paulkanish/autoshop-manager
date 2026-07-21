import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log("🔍 AUTH DEBUG: Starting authorize...");
        console.log("🔍 AUTH DEBUG: Email received:", credentials?.email);
        console.log("🔍 AUTH DEBUG: DATABASE_URL is set?", process.env.DATABASE_URL ? "YES (starts with: " + process.env.DATABASE_URL.substring(0, 15) + "...)" : "NO");

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ AUTH DEBUG: Missing email or password");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          console.log("🔍 AUTH DEBUG: User found in DB?", !!user);
          if (user) {
             console.log("🔍 AUTH DEBUG: User role:", user.role);
          }

          if (!user) {
            console.log("❌ AUTH DEBUG: User not found in database. Check DATABASE_URL!");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          console.log("🔍 AUTH DEBUG: Password valid?", isPasswordValid);

          if (!isPasswordValid) {
            console.log("❌ AUTH DEBUG: Password invalid");
            return null;
          }

          console.log("✅ AUTH DEBUG: Login successful!");
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("💥 AUTH DEBUG: Prisma or bcrypt error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
