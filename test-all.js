#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests in the correct order and generates reports
 */

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Test configuration
const testConfig = {
  backend: {
    path: "./backend",
    tests: [
      { name: "Lint", command: "npm run lint" },
      { name: "Unit Tests", command: "npm run test:coverage" },
      { name: "Security Audit", command: "npm audit --audit-level=moderate" },
    ],
  },
  frontend: {
    path: "./frontend",
    tests: [
      { name: "Lint", command: "npm run lint" },
      { name: "Unit Tests", command: "npm run test:run -- --coverage" },
      {
        name: "Accessibility Tests",
        command: "npm run test:run -- --testPathPattern=accessibility",
      },
      {
        name: "Integration Tests",
        command: "npm run test:run -- --testPathPattern=integration",
      },
      { name: "Component Tests", command: "npm run test:component" },
      { name: "Security Audit", command: "npm audit --audit-level=moderate" },
    ],
  },
};

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: [],
};

// Utility functions
function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(`${title}`, "cyan");
  log(`${"=".repeat(60)}`, "cyan");
}

function logSubsection(title) {
  log(`\n${"-".repeat(40)}`, "blue");
  log(`${title}`, "blue");
  log(`${"-".repeat(40)}`, "blue");
}

function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    log(`Running: ${command}`, "yellow");

    const child = spawn(command, [], {
      shell: true,
      cwd,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      const duration = Date.now() - startTime;
      if (code === 0) {
        log(`✅ Passed (${duration}ms)`, "green");
        resolve({ success: true, duration });
      } else {
        log(`❌ Failed (${duration}ms)`, "red");
        resolve({ success: false, duration, code });
      }
    });

    child.on("error", (error) => {
      log(`❌ Error: ${error.message}`, "red");
      reject(error);
    });
  });
}

async function runTestSuite(suiteName, config) {
  logSection(`${suiteName.toUpperCase()} TESTS`);

  const suiteResults = {
    name: suiteName,
    passed: 0,
    failed: 0,
    tests: [],
  };

  for (const test of config.tests) {
    logSubsection(test.name);

    try {
      const result = await runCommand(test.command, config.path);

      const testResult = {
        name: test.name,
        success: result.success,
        duration: result.duration,
        command: test.command,
      };

      if (result.success) {
        suiteResults.passed++;
        results.passed++;
      } else {
        suiteResults.failed++;
        results.failed++;
        testResult.exitCode = result.code;
      }

      suiteResults.tests.push(testResult);
    } catch (error) {
      log(`❌ Error running ${test.name}: ${error.message}`, "red");
      suiteResults.failed++;
      results.failed++;

      suiteResults.tests.push({
        name: test.name,
        success: false,
        error: error.message,
        command: test.command,
      });
    }
  }

  results.details.push(suiteResults);
  return suiteResults;
}

async function runE2ETests() {
  logSection("END-TO-END TESTS");

  log("Starting backend server...", "yellow");
  const backendProcess = spawn("npm", ["start"], {
    cwd: "./backend",
    stdio: "pipe",
    env: { ...process.env, NODE_ENV: "test", PORT: "3001" },
  });

  // Wait for backend to start
  await new Promise((resolve) => setTimeout(resolve, 5000));

  log("Starting frontend server...", "yellow");
  const frontendProcess = spawn("npm", ["run", "preview"], {
    cwd: "./frontend",
    stdio: "pipe",
    env: { ...process.env, PORT: "5173" },
  });

  // Wait for frontend to start
  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    log("Running Cypress E2E tests...", "yellow");
    const result = await runCommand("npm run test:e2e:ci", "./frontend");

    if (result.success) {
      results.passed++;
      log("✅ E2E tests passed", "green");
    } else {
      results.failed++;
      log("❌ E2E tests failed", "red");
    }

    results.details.push({
      name: "E2E Tests",
      passed: result.success ? 1 : 0,
      failed: result.success ? 0 : 1,
      tests: [
        {
          name: "Cypress E2E",
          success: result.success,
          duration: result.duration,
        },
      ],
    });
  } catch (error) {
    log(`❌ Error running E2E tests: ${error.message}`, "red");
    results.failed++;
  } finally {
    // Clean up processes
    backendProcess.kill();
    frontendProcess.kill();
  }
}

async function runPerformanceTests() {
  logSection("PERFORMANCE TESTS");

  try {
    log("Running Lighthouse performance tests...", "yellow");

    // Start servers for performance testing
    const backendProcess = spawn("npm", ["start"], {
      cwd: "./backend",
      stdio: "pipe",
    });

    const frontendProcess = spawn("npm", ["run", "preview"], {
      cwd: "./frontend",
      stdio: "pipe",
    });

    // Wait for servers to start
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const result = await runCommand("npx lighthouse-ci autorun", ".");

    if (result.success) {
      results.passed++;
      log("✅ Performance tests passed", "green");
    } else {
      results.failed++;
      log("❌ Performance tests failed", "red");
    }

    results.details.push({
      name: "Performance Tests",
      passed: result.success ? 1 : 0,
      failed: result.success ? 0 : 1,
      tests: [
        {
          name: "Lighthouse CI",
          success: result.success,
          duration: result.duration,
        },
      ],
    });

    // Clean up
    backendProcess.kill();
    frontendProcess.kill();
  } catch (error) {
    log(`❌ Error running performance tests: ${error.message}`, "red");
    results.failed++;
  }
}

function generateReport() {
  logSection("TEST RESULTS SUMMARY");

  const totalTests = results.passed + results.failed;
  const passRate =
    totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0;

  log(`Total Tests: ${totalTests}`, "bright");
  log(`Passed: ${results.passed}`, "green");
  log(`Failed: ${results.failed}`, "red");
  log(
    `Pass Rate: ${passRate}%`,
    passRate >= 90 ? "green" : passRate >= 70 ? "yellow" : "red"
  );

  // Detailed results
  log("\nDetailed Results:", "bright");
  results.details.forEach((suite) => {
    log(`\n${suite.name}:`, "cyan");
    suite.tests.forEach((test) => {
      const status = test.success ? "✅" : "❌";
      const duration = test.duration ? ` (${test.duration}ms)` : "";
      log(
        `  ${status} ${test.name}${duration}`,
        test.success ? "green" : "red"
      );

      if (!test.success && test.error) {
        log(`    Error: ${test.error}`, "red");
      }
    });
  });

  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: results.passed,
      failed: results.failed,
      passRate: parseFloat(passRate),
    },
    suites: results.details,
  };

  fs.writeFileSync("test-results.json", JSON.stringify(report, null, 2));
  log("\n📊 Test report saved to test-results.json", "cyan");

  // Generate HTML report
  generateHTMLReport(report);
}

function generateHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Results Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .suite { margin-bottom: 30px; }
        .suite h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .test { display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .test.passed { background: #d4edda; }
        .test.failed { background: #f8d7da; }
        .test-name { font-weight: bold; }
        .test-duration { color: #666; font-size: 0.9em; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Results Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${report.summary.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${report.summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${report.summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Pass Rate</h3>
                <div class="value ${
                  report.summary.passRate >= 90 ? "passed" : "failed"
                }">${report.summary.passRate}%</div>
            </div>
        </div>
        
        ${report.suites
          .map(
            (suite) => `
            <div class="suite">
                <h2>${suite.name}</h2>
                ${suite.tests
                  .map(
                    (test) => `
                    <div class="test ${test.success ? "passed" : "failed"}">
                        <span class="test-name">${test.success ? "✅" : "❌"} ${
                      test.name
                    }</span>
                        <span class="test-duration">${
                          test.duration ? `${test.duration}ms` : ""
                        }</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `
          )
          .join("")}
        
        <div class="footer">
            <p>Automation Testing Website - Quality Assurance Report</p>
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync("test-results.html", html);
  log("📊 HTML report saved to test-results.html", "cyan");
}

// Main execution
async function main() {
  const startTime = Date.now();

  log("🚀 Starting Comprehensive Test Suite", "bright");
  log(`Timestamp: ${new Date().toISOString()}`, "cyan");

  try {
    // Check if dependencies are installed
    if (!fs.existsSync("./backend/node_modules")) {
      log("Installing backend dependencies...", "yellow");
      await runCommand("npm install", "./backend");
    }

    if (!fs.existsSync("./frontend/node_modules")) {
      log("Installing frontend dependencies...", "yellow");
      await runCommand("npm install", "./frontend");
    }

    // Run test suites
    await runTestSuite("Backend", testConfig.backend);
    await runTestSuite("Frontend", testConfig.frontend);

    // Run E2E tests if requested
    if (process.argv.includes("--e2e")) {
      await runE2ETests();
    }

    // Run performance tests if requested
    if (process.argv.includes("--performance")) {
      await runPerformanceTests();
    }

    // Generate final report
    generateReport();

    const totalTime = Date.now() - startTime;
    log(`\n🏁 Test suite completed in ${totalTime}ms`, "bright");

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`💥 Fatal error: ${error.message}`, "red");
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes("--help")) {
  log("Comprehensive Test Runner", "bright");
  log("Usage: node test-all.js [options]", "cyan");
  log("Options:", "cyan");
  log("  --e2e          Include end-to-end tests", "yellow");
  log("  --performance  Include performance tests", "yellow");
  log("  --help         Show this help message", "yellow");
  process.exit(0);
}

// Run the main function
main().catch((error) => {
  log(`💥 Unhandled error: ${error.message}`, "red");
  process.exit(1);
});
