import type { Page } from "@playwright/test";

const IGNORED_CONSOLE_PATTERNS = [
  /favicon\.ico/i,
  /Failed to load resource: the server responded with a status of 404/i,
];

export class ConsoleErrorCollector {
  readonly errors: string[] = [];

  constructor(private readonly page: Page) {
    page.on("pageerror", (error) => {
      this.errors.push(error.message);
    });

    page.on("console", (message) => {
      if (message.type() !== "error") {
        return;
      }

      const text = message.text();
      if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) {
        return;
      }

      this.errors.push(text);
    });
  }

  assertClean(): void {
    if (this.errors.length === 0) {
      return;
    }

    throw new Error(
      `Unexpected console/page errors:\n${this.errors.map((entry) => `- ${entry}`).join("\n")}`,
    );
  }
}
