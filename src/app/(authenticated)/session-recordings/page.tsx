import { SessionRecordingsPageContent } from "@/components/session-recordings-page";
import { getUserSessionRecordings } from "@/lib/session-recordings/get-sessions";

export const dynamic = "force-dynamic";

export default async function SessionRecordingsPage() {
  const sessions = await getUserSessionRecordings();

  return <SessionRecordingsPageContent sessions={sessions} />;
}
