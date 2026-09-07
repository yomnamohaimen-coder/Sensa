import { test, expect } from "./fixtures";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { level: 1, name: "Settings" }),
    ).toBeVisible();
  });

  test("updates product name", async ({ page }) => {
    const productName = `E2E Product ${Date.now()}`;
    const productForm = page.locator("form").filter({ hasText: "Product name" });
    const input = productForm.locator("#product-name");

    await input.fill(productName);
    await productForm.getByRole("button", { name: "Save" }).click();

    await expect(productForm.getByText("Saved")).toBeVisible();

    await page.reload();
    await expect(productForm.locator("#product-name")).toHaveValue(productName);
  });

  test("toggles light and dark appearance", async ({ page }) => {
    const lightButton = page.getByRole("radio", { name: "Light" });
    const darkButton = page.getByRole("radio", { name: "Dark" });

    await expect(lightButton).toBeVisible();
    await expect(darkButton).toBeVisible();

    await darkButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await lightButton.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("opens and closes delete account dialog without deleting", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Delete account", exact: true })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Confirm account deletion",
    });
    await expect(dialog).toBeVisible();
    await expect(page.locator("#delete-account-confirmation")).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });
});
