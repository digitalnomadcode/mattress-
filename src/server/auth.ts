import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getDb,databaseUrl } from "./db";
import { verifyPassword } from "./password";
import { consumeRateLimit } from "./operations";
import { BusinessError } from "./errors";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [Credentials({
    name: "Administrator",
    credentials: { email: {label:"Email",type:"email"}, password:{label:"Password",type:"password"} },
    async authorize(raw, request) {
      const parsed=z.object({email:z.email().max(254),password:z.string().min(1).max(200)}).safeParse(raw);
      if(!parsed.success || !databaseUrl()) return null;
      const email=parsed.data.email.toLowerCase();
      const ip=String(request.headers?.["x-forwarded-for"] || "local").split(",")[0].trim();
      try {
        await consumeRateLimit(`login:${ip}`,30,900);
        await consumeRateLimit(`login-account:${email}`,10,900);
      } catch(error) { if(error instanceof BusinessError) return null; throw error; }
      const user=await getDb().adminUser.findUnique({where:{email}});
      if(!user || user.disabled || !user.passwordHash || !await verifyPassword(parsed.data.password,user.passwordHash)) return null;
      return {id:user.id,email:user.email,name:user.name,sessionVersion:user.sessionVersion};
    },
  })],
  callbacks: {
    async jwt({token,user}) { if(user) token.sessionVersion=user.sessionVersion; return token; },
    async session({session,token}) { if(session.user) {session.user.id=token.sub||"";session.user.sessionVersion=token.sessionVersion??-1;} return session; },
  },
  logger: {error(code){console.error("Authentication error:",code);},warn(code){console.warn("Authentication warning:",code);}},
};

export async function requireAdmin() {
  const session=await getServerSession(authOptions);
  if(!session?.user?.id) throw new BusinessError("UNAUTHORIZED",401);
  const user=await getDb().adminUser.findUnique({where:{id:session.user.id},select:{id:true,email:true,name:true,role:true,disabled:true,sessionVersion:true}});
  if(!user || user.disabled || user.sessionVersion!==session.user.sessionVersion) throw new BusinessError("UNAUTHORIZED",401);
  return user;
}
