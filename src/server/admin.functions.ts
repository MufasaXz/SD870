import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Promote the calling user to admin IF no admin exists yet.
 * Bootstraps the very first admin account safely.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string }) => {
    if (!d?.userId || typeof d.userId !== "string") throw new Error("userId required");
    return d;
  })
  .handler(async ({ data }) => {
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);

    if ((count ?? 0) > 0) {
      return { promoted: false, reason: "An admin already exists." };
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: "admin" });
    if (error) throw new Error(error.message);

    return { promoted: true };
  });
