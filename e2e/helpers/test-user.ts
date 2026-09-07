import { randomBytes } from "node:crypto";

export const E2E_EMAIL_PATTERN =
  /^e2e-test-\d+-[a-f0-9]+@sensa-test\.local$/;

export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString("hex");
  return `e2e-test-${timestamp}-${random}@sensa-test.local`;
}

export function isE2eTestEmail(email: string | null | undefined): boolean {
  return Boolean(email && E2E_EMAIL_PATTERN.test(email));
}
