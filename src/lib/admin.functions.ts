import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ALLOWED_TABLES = [
  "site_settings",
  "page_sections",
  "artists",
  "schedule_items",
  "gallery_items",
  "bus_routes",
  "faqs",
  "quick_info_items",
] as const;
type TableName = (typeof ALLOWED_TABLES)[number];

function assertTable(t: string): asserts t is TableName {
  if (!(ALLOWED_TABLES as readonly string[]).includes(t)) {
    throw new Error(`Forbidden table: ${t}`);
  }
}

async function requireAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const [settings, sections, quickInfo, artists, schedule, gallery, buses, faqs] = await Promise.all([
      supabaseAdmin.from("site_settings").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("page_sections").select("*").order("sort_order"),
      supabaseAdmin.from("quick_info_items").select("*").order("sort_order"),
      supabaseAdmin.from("artists").select("*").order("sort_order"),
      supabaseAdmin.from("schedule_items").select("*").order("sort_order"),
      supabaseAdmin.from("gallery_items").select("*").order("sort_order"),
      supabaseAdmin.from("bus_routes").select("*").order("sort_order"),
      supabaseAdmin.from("faqs").select("*").order("sort_order"),
    ]);
    return {
      settings: settings.data,
      sections: sections.data ?? [],
      quickInfo: quickInfo.data ?? [],
      artists: artists.data ?? [],
      schedule: schedule.data ?? [],
      gallery: gallery.data ?? [],
      buses: buses.data ?? [],
      faqs: faqs.data ?? [],
    };
  });

export const upsertRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; values: Record<string, unknown> }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    assertTable(data.table);
    const { data: row, error } = await supabaseAdmin
      .from(data.table)
      .upsert(data.values)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; id: string }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    assertTable(data.table);
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) return { claimed: false };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { claimed: true };
  });

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });
