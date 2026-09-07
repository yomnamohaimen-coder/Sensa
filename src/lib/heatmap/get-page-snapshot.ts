import { createClient } from "@/utils/supabase/client";

export type PageSnapshot = {
  image_url: string;
  width: number;
  height: number;
};

export async function getPageSnapshot(
  trackingId: string,
  page: string,
): Promise<PageSnapshot | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("page_snapshots")
    .select("image_url, width, height")
    .eq("tracking_id", trackingId)
    .eq("page", page)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (!data.image_url || data.width <= 0 || data.height <= 0) {
    return null;
  }

  return {
    image_url: data.image_url,
    width: data.width,
    height: data.height,
  };
}
