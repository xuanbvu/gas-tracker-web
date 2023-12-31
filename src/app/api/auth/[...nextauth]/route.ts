import { prisma } from "@/db";
import { compare } from "bcrypt";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          username: token.username
        }
      }
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as any
        return {
          ...token,
          id: u.id,
          username: u.username
        }
      }

      return token
    }
  },
  providers: [
    CredentialsProvider({
      name: 'Sign in',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username
          }
        })
        if (!user) return null

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        )
        if (!isPasswordValid) return null

        return {
          id: user.id,
          username: user.username,
        }
      }
    })
  ]
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }