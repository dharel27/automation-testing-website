// Simple test script to verify the setup
const { spawn } = require("child_process");
const axios = require("axios");

async function testBackend() {
  console.log("Starting backend server...");

  const backend = spawn("npm", ["run", "dev"], {
    cwd: "./backend",
    shell: true,
    stdio: "pipe",
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const response = await axios.get("http://localhost:3001/api/health");
    console.log("✅ Backend health check passed:", response.data);
    backend.kill();
    return true;
  } catch (error) {
    console.log("❌ Backend health check failed:", error.message);
    backend.kill();
    return false;
  }
}

async function testFrontend() {
  console.log("Testing frontend build...");

  const frontend = spawn("npm", ["run", "build"], {
    cwd: "./frontend",
    shell: true,
    stdio: "pipe",
  });

  return new Promise((resolve) => {
    frontend.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Frontend build successful");
        resolve(true);
      } else {
        console.log("❌ Frontend build failed");
        resolve(false);
      }
    });
  });
}

async function runTests() {
  console.log("🚀 Testing project setup...\n");

  const frontendResult = await testFrontend();
  const backendResult = await testBackend();

  console.log("\n📊 Test Results:");
  console.log(`Frontend: ${frontendResult ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Backend: ${backendResult ? "✅ PASS" : "❌ FAIL"}`);

  if (frontendResult && backendResult) {
    console.log("\n🎉 Project setup completed successfully!");
    console.log("Next steps:");
    console.log('1. Run "npm run dev" in the backend directory');
    console.log('2. Run "npm run dev" in the frontend directory');
    console.log("3. Open http://localhost:5173 to view the application");
  } else {
    console.log("\n❌ Setup incomplete. Please check the errors above.");
  }
}

runTests().catch(console.error);
