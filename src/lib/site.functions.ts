import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getLandingData = createServerFn({ method: "GET" }).handler(async () => {
  const admin = supabaseAdmin;
  const [settings, sections, quickInfo, artists, schedule, gallery, buses, faqs, atmosphere, sectionBgs] = await Promise.all([
    admin.from("site_settings").select("*").limit(1).maybeSingle(),
    admin.from("page_sections").select("*").order("sort_order"),
    admin.from("quick_info_items").select("*").eq("is_visible", true).order("sort_order"),
    admin.from("artists").select("*").eq("is_visible", true).order("sort_order"),
    admin.from("schedule_items").select("*").eq("is_visible", true).order("sort_order"),
    admin.from("gallery_items").select("*").eq("is_visible", true).order("sort_order"),
    admin.from("bus_routes").select("*").eq("is_visible", true).order("sort_order"),
    admin.from("faqs").select("*").eq("is_visible", true).order("sort_order"),
    admin.from("visual_settings").select("*").limit(1).maybeSingle(),
    admin.from("section_backgrounds").select("*"),
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
  };
});
