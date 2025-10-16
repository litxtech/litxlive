import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { verifyAdminAuth, AdminUser } from "@/backend/middlewares/supabaseAdminAuth";
import { supabaseServer } from "@/lib/supabaseServer";
import { pool } from "@/backend/lib/db";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('Authorization');
  
  console.log('[tRPC Context] Authorization header:', authHeader ? 'EXISTS' : 'MISSING');
  
  let admin: AdminUser | null = null;
  let user: { id: string; email?: string } | null = null;
  
  if (authHeader) {
    try {
      admin = await verifyAdminAuth(authHeader);
      console.log('[tRPC Context] Admin verified:', admin?.username ?? admin?.id);
    } catch {
      console.log('[tRPC Context] Not admin, trying regular user auth...');
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: supabaseUser }, error: supabaseError } = await supabaseServer.auth.getUser(token);
        if (!supabaseError && supabaseUser) {
          user = { id: supabaseUser.id, email: supabaseUser.email };
          console.log('[tRPC Context] User authenticated:', user.id);
        }
      } catch (supabaseErr) {
        console.error('[tRPC Context] Supabase auth failed:', supabaseErr);
      }
    }
  } else {
    console.log('[tRPC Context] No Authorization header provided');
  }

  return {
    req: opts.req,
    admin,
    user,
    db: pool,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Admin authentication required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      admin: ctx.admin,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User authentication required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);
