import { test, expect } from "@playwright/test";

/**
 * E2E Test Suite for Block Editor
 *
 * Prerequisites:
 * - Components must include data-testid attributes for reliable selection
 * - Database should be reset/seeded before tests for consistency
 *
 * Required data-testid attributes:
 * - Editor container: data-testid="editor"
 * - Block wrapper: data-testid="block" and data-block-id="{id}"
 * - Text block content: data-testid="text-block-{id}"
 * - Image block: data-testid="image-block-{id}"
 * - Slash menu: data-testid="block-type-menu"
 * - Menu options: data-testid="menu-option-{type}" (paragraph, h1, h2, h3, image)
 */

test.describe("Block Editor E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the editor page
    await page.goto("/");

    // Wait for the editor to be ready
    await page.waitForSelector(".editor-container", { timeout: 10000 });

    // Wait for initial blocks to load from database
    await page.waitForResponse(
      (response) => response.url().includes("/api/blocks") && response.status() === 200
    );
  });

  test("should load and display initial blocks", async ({ page }) => {
    // Verify that the editor container is visible
    const editor = page.locator(".editor-container");
    await expect(editor).toBeVisible();

    // Wait for blocks to be rendered
    const blocks = page.locator("[data-block-id]");

    // Check that at least one block exists (or specific count if seeded)
    await expect(blocks.first()).toBeVisible({ timeout: 5000 });

    // Verify blocks are displayed in order
    const blockCount = await blocks.count();
    expect(blockCount).toBeGreaterThan(0);

    // Check that blocks have proper structure
    for (let i = 0; i < Math.min(blockCount, 3); i++) {
      const block = blocks.nth(i);
      await expect(block).toBeVisible();

      // Each block should have a data-block-id attribute
      const blockId = await block.getAttribute("data-block-id");
      expect(blockId).toBeTruthy();
    }
  });

  test("should add new text block on Enter", async ({ page }) => {
    // Get initial block count
    const initialBlocks = page.locator("[data-block-id]");
    const initialCount = await initialBlocks.count();

    // Focus on the first text block
    const firstBlock = initialBlocks.first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Press Enter to create a new block
    await page.keyboard.press("Enter");

    // Wait for the API call to create the block
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/blocks") &&
        response.request().method() === "POST" &&
        response.status() === 201,
      { timeout: 5000 }
    );

    // Wait a bit for the DOM to update
    await page.waitForTimeout(500);

    // Verify a new block was created
    const updatedBlocks = page.locator("[data-block-id]");
    const newCount = await updatedBlocks.count();
    expect(newCount).toBe(initialCount + 1);

    // Verify the new block is focused
    const newBlockIndex = await firstBlock.evaluate((el) => {
      const parent = el.parentElement;
      return Array.from(parent?.children || []).indexOf(el);
    });

    const newBlock = updatedBlocks.nth(newBlockIndex + 1);
    await expect(newBlock).toBeVisible();
  });

  test("should show slash command menu on /", async ({ page }) => {
    // Focus on a text block
    const firstBlock = page.locator("[data-block-id]").first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Type "/" to trigger the slash command menu
    await page.keyboard.type("/");

    // Wait for the menu to appear (it has z-50 and fixed positioning)
    const menu = page.locator(".fixed.z-50.bg-white.rounded-lg.shadow-lg");
    await expect(menu).toBeVisible({ timeout: 2000 });

    // Verify menu contains expected options by checking button text
    await expect(menu.locator('button:has-text("Paragraph")')).toBeVisible();
    await expect(menu.locator('button:has-text("Heading 1")')).toBeVisible();
    await expect(menu.locator('button:has-text("Heading 2")')).toBeVisible();
    await expect(menu.locator('button:has-text("Heading 3")')).toBeVisible();
    await expect(menu.locator('button:has-text("Image")')).toBeVisible();
  });

  test("should convert block type from menu", async ({ page }) => {
    // Focus on a paragraph block
    const firstBlock = page.locator("[data-block-id]").first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Add some text first
    await page.keyboard.type("Test heading");

    // Wait for content to save
    await page.waitForTimeout(300);

    // Clear and type "/" to open menu
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("/");

    // Wait for menu
    const menu = page.locator(".fixed.z-50.bg-white.rounded-lg.shadow-lg");
    await expect(menu).toBeVisible({ timeout: 2000 });

    // Click on H1 option
    const h1Option = menu.locator('button:has-text("Heading 1")');
    await h1Option.click();

    // Wait for the API call to update the block type
    await page.waitForResponse(
      (response) =>
        response.url().includes(`/api/blocks/${firstBlockId}`) &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
      { timeout: 5000 }
    );

    // Verify the block type changed to h1
    // The block should now render as an h1 element
    const h1Element = firstBlock.locator("h1");
    await expect(h1Element).toBeVisible({ timeout: 2000 });

    // Verify the menu is closed
    await expect(menu).not.toBeVisible();
  });

  test("should add image block", async ({ page }) => {
    // Focus on a text block
    const firstBlock = page.locator("[data-block-id]").first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Type "/" to open menu
    await page.keyboard.type("/");

    // Wait for menu
    const menu = page.locator(".fixed.z-50.bg-white.rounded-lg.shadow-lg");
    await expect(menu).toBeVisible({ timeout: 2000 });

    // Click on Image option
    const imageOption = menu.locator('button:has-text("Image")');
    await imageOption.click();

    // Wait for the API call to create/update the block
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/blocks") &&
        response.request().method() === "PATCH" &&
        response.status() >= 200 &&
        response.status() < 300,
      { timeout: 5000 }
    );

    // Wait for the image block to render
    await page.waitForTimeout(500);

    // Find the image block by looking for the image input
    const imageInput = page.locator('input[type="text"][placeholder*="image URL"]');
    await expect(imageInput).toBeVisible({ timeout: 3000 });
  });

  test("should edit text content", async ({ page }) => {
    // Focus on the first text block
    const firstBlock = page.locator("[data-block-id]").first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Clear existing content
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");

    // Type new content
    const newContent = "This is edited content";
    await page.keyboard.type(newContent);

    // Verify the content is in the editable element
    await expect(contentEditable).toContainText(newContent);

    // Blur the element to trigger save
    await page.keyboard.press("Escape");
    await contentEditable.blur();

    // Wait for the API call to save the content
    await page.waitForResponse(
      (response) =>
        response.url().includes(`/api/blocks/${firstBlockId}`) &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
      { timeout: 5000 }
    );

    // Verify content persists after blur
    await expect(contentEditable).toContainText(newContent);
  });

  test("should delete empty block on Backspace", async ({ page }) => {
    // Create a new empty block first
    const firstBlock = page.locator("[data-block-id]").first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Press Enter to create a new block
    await page.keyboard.press("Enter");

    // Wait for the new block to be created
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/blocks") && response.request().method() === "POST",
      { timeout: 5000 }
    );

    await page.waitForTimeout(500);

    // Get the count before deletion
    const blocksBeforeDelete = page.locator("[data-block-id]");
    const countBeforeDelete = await blocksBeforeDelete.count();

    // The new block should be focused and empty
    // Press Backspace to delete it
    await page.keyboard.press("Backspace");

    // Wait for the API call to delete the block
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/blocks/") &&
        response.request().method() === "DELETE" &&
        response.status() === 200,
      { timeout: 5000 }
    );

    await page.waitForTimeout(500);

    // Verify the block was deleted
    const blocksAfterDelete = page.locator("[data-block-id]");
    const countAfterDelete = await blocksAfterDelete.count();
    expect(countAfterDelete).toBe(countBeforeDelete - 1);

    // Verify focus returns to the previous block
    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("contenteditable", "true");
  });

  test("should persist changes after page refresh", async ({ page }) => {
    // Add a new block with specific content
    const firstBlock = page.locator("[data-block-id]").first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Press Enter to create a new block
    await page.keyboard.press("Enter");

    // Wait for the new block to be created
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/blocks") &&
        response.request().method() === "POST" &&
        response.status() === 201,
      { timeout: 5000 }
    );

    await page.waitForTimeout(500);

    // Type content in the new block
    const testContent = "Persistent content test";
    await page.keyboard.type(testContent);

    // Blur to save
    await page.keyboard.press("Escape");

    // Wait for save
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/blocks/") && response.request().method() === "PATCH",
      { timeout: 5000 }
    );

    // Get the total block count before refresh
    const blocksBeforeRefresh = page.locator("[data-block-id]");
    const countBeforeRefresh = await blocksBeforeRefresh.count();

    // Refresh the page
    await page.reload();

    // Wait for the editor to load
    await page.waitForSelector(".editor-container", { timeout: 10000 });

    // Wait for blocks to load from database
    await page.waitForResponse(
      (response) => response.url().includes("/api/blocks") && response.status() === 200
    );

    await page.waitForTimeout(500);

    // Verify block count is the same
    const blocksAfterRefresh = page.locator("[data-block-id]");
    const countAfterRefresh = await blocksAfterRefresh.count();
    expect(countAfterRefresh).toBe(countBeforeRefresh);

    // Verify the content we added still exists
    const editorContent = await page.locator(".editor-container").textContent();
    expect(editorContent).toContain(testContent);
  });

  test("should handle keyboard navigation in slash menu", async ({ page }) => {
    // Focus on a text block
    const firstBlock = page.locator("[data-block-id]").first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Type "/" to open menu
    await page.keyboard.type("/");

    // Wait for menu
    const menu = page.locator(".fixed.z-50.bg-white.rounded-lg.shadow-lg");
    await expect(menu).toBeVisible({ timeout: 2000 });

    // Navigate with arrow keys
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");

    // The third option (h2) should be highlighted
    // Press Enter to select
    await page.keyboard.press("Enter");

    // Wait for the update
    await page.waitForResponse(
      (response) =>
        response.url().includes(`/api/blocks/${firstBlockId}`) &&
        response.request().method() === "PATCH",
      { timeout: 5000 }
    );

    // Verify the menu is closed
    await expect(menu).not.toBeVisible();
  });

  test("should close slash menu on Escape", async ({ page }) => {
    // Focus on a text block
    const firstBlock = page.locator("[data-block-id]").first();
    const firstBlockId = await firstBlock.getAttribute("data-block-id");
    const contentEditable = firstBlock.locator("[contenteditable]");

    await contentEditable.click();
    await contentEditable.focus();

    // Type "/" to open menu
    await page.keyboard.type("/");

    // Wait for menu
    const menu = page.locator(".fixed.z-50.bg-white.rounded-lg.shadow-lg");
    await expect(menu).toBeVisible({ timeout: 2000 });

    // Press Escape to close
    await page.keyboard.press("Escape");

    // Verify the menu is closed
    await expect(menu).not.toBeVisible({ timeout: 1000 });

    // Verify the "/" character is still in the content
    const content = await contentEditable.textContent();
    expect(content).toContain("/");
  });

  test("should maintain block order after operations", async ({ page }) => {
    // Get initial block order
    const blocks = page.locator("[data-block-id]");
    const initialCount = await blocks.count();
    const initialIds: string[] = [];

    for (let i = 0; i < initialCount; i++) {
      const id = await blocks.nth(i).getAttribute("data-block-id");
      if (id) initialIds.push(id);
    }

    // Add a new block in the middle
    const middleBlock = blocks.nth(Math.floor(initialCount / 2));
    const middleBlockId = await middleBlock.getAttribute("data-block-id");
    const middleContentEditable = middleBlock.locator("[contenteditable]");

    await middleContentEditable.click();
    await middleContentEditable.focus();
    await page.keyboard.press("Enter");

    // Wait for creation
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/blocks") && response.request().method() === "POST",
      { timeout: 5000 }
    );

    await page.waitForTimeout(500);

    // Verify new block count
    const newCount = await blocks.count();
    expect(newCount).toBe(initialCount + 1);

    // Verify the new block is in the correct position (after middle block)
    const middleIndex = Math.floor(initialCount / 2);
    const blockAfterMiddle = blocks.nth(middleIndex + 1);
    const blockAfterMiddleId = await blockAfterMiddle.getAttribute("data-block-id");

    // The new block should be right after the middle block
    expect(blockAfterMiddleId).not.toBe(initialIds[middleIndex + 1]);
  });
});
