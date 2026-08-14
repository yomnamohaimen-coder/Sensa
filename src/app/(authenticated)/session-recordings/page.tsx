import { SessionRecordingsPageContent } from "@/components/session-recordings-page";
import { getUserSessionRecordings } from "@/lib/session-recordings/get-sessions";

export default async function SessionRecordingsPage() {
  const sessions = await getUserSessionRecordings();

  return <SessionRecordingsPageContent sessions={sessions} />;
}
