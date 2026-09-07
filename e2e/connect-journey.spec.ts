import { test, expect, recordRunUserEmail } from "./fixtures";
import { completeOnboardingIfPresent, signupViaUI } from "./helpers/auth";
import { requireE2eEnv } from "./helpers/env";
import { deleteUserByEmail } from "./helpers/supabase-admin";
import { generateTestEmail } from "./helpers/test-user";

test.describe("Connect journey", () => {
  let testEmail = "";

  test.afterAll(async () => {
    if (!testEmail) {
      return;
    }

    await deleteUserByEmail(testEmail);
  });

  test("signs up, completes onboarding, and loads Connect", async ({ page }) => {
    testEmail = generateTestEmail();
    const password = requireE2eEnv("E2E_TEST_PASSWORD");
    recordRunUserEmail(testEmail);

    await signupViaUI(page, testEmail, password);
    await completeOnboardingIfPresent(page);

    await page.goto("/connect");

    await expect(
      page.getByRole("heading", { level: 1, name: "Connect" }),
    ).toBeVisible();

    const snippet = page.getByText("Your tracking snippet");
    const missingTrackingId = page.getByText(
      "Your tracking ID is not available yet",
    );
    await expect(snippet.or(missingTrackingId)).toBeVisible();

    await expect(page.locator("#site-url")).toBeVisible();

    const statusBanner = page.getByText(/Connected — data is being received|Waiting for data/i);
    await expect(statusBanner).toBeVisible();
  });
});
