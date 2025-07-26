// Global setup for Playwright tests
const { chromium } = require("@playwright/test");

async function globalSetup() {
  console.log("Setting up test environment...");

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for services to be ready
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.goto("http://localhost:3001/api/health", {
      waitUntil: "networkidle",
    });

    // Reset and seed test data
    await page.request.post("http://localhost:3001/api/test-data/reset");
    await page.request.post("http://localhost:3001/api/test-data/seed/all");

    console.log("Test environment setup complete");
  } catch (error) {
    console.error("Failed to setup test environment:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
