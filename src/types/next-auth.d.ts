import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MECHANIC" | "OWNER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "MECHANIC" | "OWNER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "MECHANIC" | "OWNER";
  }
}
