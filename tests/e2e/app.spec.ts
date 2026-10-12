import { expect, test, type Page } from "@playwright/test";

async function attachJpeg(page: Page, name = "photo.jpg") {
  const bytes = await page.evaluate(async () => { const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = 600; const context = canvas.getContext("2d")!; const gradient = context.createLinearGradient(0, 0, 900, 600); gradient.addColorStop(0, "#172554"); gradient.addColorStop(1, "#f97316"); context.fillStyle = gradient; context.fillRect(0, 0, 900, 600); for (let i = 0; i < 150; i++) { context.fillStyle = `hsl(${i * 7} 80% 55%)`; context.fillRect((i * 47) % 900, (i * 83) % 600, 90, 55); } const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), "image/jpeg", 1)); return Array.from(new Uint8Array(await blob.arrayBuffer())); });
  const input = page.locator('input[type="file"]').first(); await expect(input).toBeEnabled(); await input.setInputFiles({ name, mimeType: "image/jpeg", buffer: Buffer.from(bytes) });
}

test("homepage uploads, compresses, and downloads an image", async ({ page }) => {
  await page.goto("/"); await expect(page.getByRole("heading", { name: "Make your images smaller." })).toBeVisible();
  await attachJpeg(page); await expect(page).toHaveURL(/\/compress$/); await expect(page.getByRole("heading", { name: "photo.jpg" })).toBeVisible();
  await page.getByRole("button", { name: "Compress image" }).click(); await expect(page.getByRole("button", { name: "Download image" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download"); await page.getByRole("button", { name: "Download image" }).click(); expect((await downloadPromise).suggestedFilename()).toContain("-compressed.jpg");
});

test("target batch creates a ZIP and supports removal", async ({ page }) => {
  await page.goto("/compress-image-to-500kb"); await attachJpeg(page, "first.jpg"); await expect(page).toHaveURL(/\/compress$/); await expect(page.getByText("Add images")).toBeVisible();
  await attachJpeg(page, "second.jpg"); await expect(page.getByText("second.jpg", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Output format")).toHaveValue("preserve"); await page.getByLabel("Output format").selectOption("image/webp");
  await page.getByRole("button", { name: "Compress all" }).click(); await expect(page.getByRole("button", { name: "Download all as ZIP" })).toBeVisible();
  const zip = page.waitForEvent("download"); await page.getByRole("button", { name: "Download all as ZIP" }).click(); expect((await zip).suggestedFilename()).toBe("imagelab-compressed.zip");
  await page.getByLabel(/Remove second.jpg/).click(); await expect(page.getByText("second.jpg", { exact: true })).toHaveCount(0);
});

test("refresh shows the local-session empty state", async ({ page }) => { await page.goto("/compress"); await expect(page.getByRole("heading", { name: /Select images/ })).toBeVisible(); await page.reload(); await expect(page.getByText(/previous session was not stored/i)).toBeVisible(); });
