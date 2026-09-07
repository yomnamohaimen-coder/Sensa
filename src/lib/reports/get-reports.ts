import { cookies } from "next/headers";
import type { DbReport } from "@/lib/events/schema";
import { createClient } from "@/utils/supabase/server";

export async function getUserReports(): Promise<DbReport[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, user_id, created_at, status, source, source_filename, ai_summary, ai_anomaly, ai_recommendation",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as DbReport[];
}
