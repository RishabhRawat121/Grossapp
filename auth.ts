import Credentials from "next-auth/providers/credentials"
import connectDb from "@/app/lib/Db"
import User from "@/app/models/user.model"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        email: { label: "email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) return null;
        await connectDb();
        const email = credentials.email as string;
        const password = credentials.password as string;
        const user = await User.findOne({ email });
        if (!user) throw new Error("user is not exist");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("incorrect_password");
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider == "google") {
        await connectDb()
        let dbuser = await User.findOne({ email: user.email })
        if (!dbuser) {
          dbuser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image
          })
        }
        user.id = dbuser._id.toString();
        (user as any).role = dbuser.role;
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as any).role;
      }
      if (trigger === "update") {
        token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        (session.user as any).role = token.role as string;
      }
      return session
    }
  },
  pages: {
    signIn: "/Login",
    error: "/Login",
  },
  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60
  },
  secret: process.env.AUTH_SECRET
}