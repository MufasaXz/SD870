import { supabase } from "@/integrations/supabase/client";

export async function logAudit(
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>
) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("audit_log").insert({
    actor_id: u.user?.id ?? null,
    actor_email: u.user?.email ?? null,
    action,
    entity,
    entity_id: entityId ?? null,
    details: (details as never) ?? null,
  });
}
