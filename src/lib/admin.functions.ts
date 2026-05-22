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
  "visual_settings",
  "section_backgrounds",
  "stages",
  "ticket_tiers",
  "shop_products",
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
    const [settings, sections, quickInfo, artists, schedule, gallery, buses, faqs, atmosphere, sectionBgs, stages, ticketTiers, shopProducts] = await Promise.all([
      supabaseAdmin.from("site_settings").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("page_sections").select("*").order("sort_order"),
      supabaseAdmin.from("quick_info_items").select("*").order("sort_order"),
      supabaseAdmin.from("artists").select("*").order("sort_order"),
      supabaseAdmin.from("schedule_items").select("*").order("sort_order"),
      supabaseAdmin.from("gallery_items").select("*").order("sort_order"),
      supabaseAdmin.from("bus_routes").select("*").order("sort_order"),
      supabaseAdmin.from("faqs").select("*").order("sort_order"),
      supabaseAdmin.from("visual_settings").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("section_backgrounds").select("*").order("section_key"),
      supabaseAdmin.from("stages").select("*").order("sort_order"),
      supabaseAdmin.from("ticket_tiers").select("*").order("sort_order"),
      supabaseAdmin.from("shop_products").select("*").order("sort_order"),
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
      atmosphere: atmosphere.data,
      sectionBackgrounds: sectionBgs.data ?? [],
      stages: stages.data ?? [],
      ticketTiers: ticketTiers.data ?? [],
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
    // Safety: block deleting a stage if artists/schedule depend on it
    if (data.table === "stages") {
      const [{ count: ac }, { count: sc }] = await Promise.all([
        supabaseAdmin.from("artists").select("id", { count: "exact", head: true }).eq("stage_id", data.id),
        supabaseAdmin.from("schedule_items").select("id", { count: "exact", head: true }).eq("stage_id", data.id),
      ]);
      if ((ac ?? 0) + (sc ?? 0) > 0) {
        throw new Error("No se puede eliminar: hay artistas u horarios vinculados a este escenario.");
      }
    }
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { items: Array<{ id: string; sort_order: number }> }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    // Fetch current to avoid touching locked ones from a stale client
    const { data: current } = await supabaseAdmin.from("page_sections").select("id,is_locked");
    const lockedIds = new Set((current ?? []).filter((r: any) => r.is_locked).map((r: any) => r.id));
    await Promise.all(
      data.items
        .filter((it) => !lockedIds.has(it.id))
        .map((it) =>
          supabaseAdmin.from("page_sections").update({ sort_order: it.sort_order }).eq("id", it.id),
        ),
    );
    return { ok: true };
  });

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

// Bulk import schedule items. Items shape:
//   { start_time, end_time?, artist_name, stage_name, sort_order }
// Options:
//   createMissingArtists, replaceAll, updateArtistStageIfEmpty
export const bulkUpsertSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    items: Array<{ start_time: string; end_time?: string | null; artist_name: string; stage_name: string; sort_order?: number }>;
    options: { createMissingArtists?: boolean; replaceAll?: boolean; updateArtistStageIfEmpty?: boolean };
  }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const opts = data.options ?? {};

    // Preload stages & artists
    const [{ data: stagesRows }, { data: artistsRows }] = await Promise.all([
      supabaseAdmin.from("stages").select("id,name,slug"),
      supabaseAdmin.from("artists").select("id,name,stage_id"),
    ]);
    const stagesBySlug = new Map<string, any>((stagesRows ?? []).map((s: any) => [s.slug, s]));
    const artistsByLower = new Map<string, any>((artistsRows ?? []).map((a: any) => [normalizeName(a.name), a]));

    // Ensure all stages exist
    for (const it of data.items) {
      const slug = slugify(it.stage_name);
      if (!slug) continue;
      if (!stagesBySlug.has(slug)) {
        const { data: created } = await supabaseAdmin
          .from("stages")
          .insert({ name: it.stage_name, slug, sort_order: stagesBySlug.size })
          .select()
          .maybeSingle();
        if (created) stagesBySlug.set(slug, created);
      }
    }

    // Ensure artists exist (if option enabled)
    if (opts.createMissingArtists !== false) {
      for (const it of data.items) {
        const key = normalizeName(it.artist_name);
        if (!key) continue;
        if (!artistsByLower.has(key)) {
          const stage = stagesBySlug.get(slugify(it.stage_name));
          const { data: created } = await supabaseAdmin
            .from("artists")
            .insert({
              name: it.artist_name,
              stage: it.stage_name,
              stage_id: stage?.id ?? null,
              sort_order: artistsByLower.size,
            })
            .select()
            .maybeSingle();
          if (created) artistsByLower.set(key, created);
        }
      }
    }

    if (opts.replaceAll) {
      await supabaseAdmin.from("schedule_items").delete().not("id", "is", null);
    }

    // Insert schedule items
    const rows: any[] = [];
    let order = 0;
    for (const it of data.items) {
      const stage = stagesBySlug.get(slugify(it.stage_name));
      const artist = artistsByLower.get(normalizeName(it.artist_name));

      // optional: update artist stage if empty
      if (opts.updateArtistStageIfEmpty !== false && artist && !artist.stage_id && stage) {
        await supabaseAdmin
          .from("artists")
          .update({ stage_id: stage.id, stage: stage.name })
          .eq("id", artist.id);
        artist.stage_id = stage.id;
      }

      rows.push({
        artist_id: artist?.id ?? null,
        custom_artist_name: artist ? null : it.artist_name,
        stage: stage?.name ?? it.stage_name,
        stage_id: stage?.id ?? null,
        start_time: it.start_time,
        end_time: it.end_time ?? null,
        sort_order: it.sort_order ?? order,
        is_visible: true,
      });
      order++;
    }

    if (rows.length) {
      const { error } = await supabaseAdmin.from("schedule_items").insert(rows);
      if (error) throw new Error(error.message);
    }

    return { ok: true, inserted: rows.length };
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
