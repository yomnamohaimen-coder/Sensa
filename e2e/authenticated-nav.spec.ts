import { test, expect } from "./fixtures";

const ROUTES = [
  {
    path: "/dashboard",
    heading: /^Welcome(,.+)?$/,
  },
  {
    path: "/reports",
    heading: "Reports",
  },
  {
    path: "/heatmap",
    heading: "Heatmap",
  },
  {
    path: "/session-recordings",
    heading: "Session Recordings",
  },
  {
    path: "/settings",
    heading: "Settings",
  },
] as const;

test.describe("Authenticated navigation", () => {
  for (const route of ROUTES) {
    test(`loads ${route.path} without errors`, async ({
      page,
      consoleErrors,
    }) => {
      await page.goto(route.path);

      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();

      await expect(page.locator("main, section, header").first()).toBeVisible();

      const bodyText = await page.locator("body").innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      consoleErrors.assertClean();
    });
  }
});
