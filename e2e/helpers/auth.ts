import type { Page } from "@playwright/test";

export async function signupViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 30_000 });
}

export async function completeOnboardingIfPresent(page: Page): Promise<void> {
  if (!page.url().includes("/onboarding")) {
    return;
  }

  await page.getByRole("button", { name: "Skip" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}
