import fs from "node:fs";
import path from "node:path";
import { test as base, expect } from "@playwright/test";
import { ConsoleErrorCollector } from "../helpers/console-errors";

export const test = base.extend<{ consoleErrors: ConsoleErrorCollector }>({
  consoleErrors: async ({ page }, use) => {
    const collector = new ConsoleErrorCollector(page);
    await use(collector);
  },
});

export { expect };

export function recordRunUserEmail(email: string): void {
  const authDir = path.resolve(process.cwd(), "e2e/.auth");
  const runUsersPath = path.join(authDir, "run-users.json");
  fs.mkdirSync(authDir, { recursive: true });

  const existing = fs.existsSync(runUsersPath)
    ? (JSON.parse(fs.readFileSync(runUsersPath, "utf8")) as string[])
    : [];

  if (!existing.includes(email)) {
    existing.push(email);
    fs.writeFileSync(runUsersPath, JSON.stringify(existing, null, 2));
  }
}
