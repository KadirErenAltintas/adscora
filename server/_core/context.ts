import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../shared/database.types";
import { authenticateSupabaseRequest } from "./supabaseAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await authenticateSupabaseRequest(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
