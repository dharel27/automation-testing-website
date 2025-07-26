// Global teardown for Playwright tests
const { chromium } = require("@playwright/test");

async function globalTeardown() {
  console.log("Cleaning up test environment...");

  // Launch browser for cleanup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Clean up test data
    await page.request.post("http://localhost:3001/api/test-data/reset");

    console.log("Test environment cleanup complete");
  } catch (error) {
    console.error("Failed to cleanup test environment:", error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

module.exports = globalTeardown;
