import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';

const handler = NextAuth({
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER ?? '',
      from: process.env.EMAIL_FROM ?? 'no-reply@idosolink.dev'
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' }
});

export { handler as GET, handler as POST };
