const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    env: {
      apiUrl: "http://localhost:3001",
    },

    setupNodeEvents(on, config) {
      // implement node event listeners here

      // Task for resetting test data
      on("task", {
        resetTestData() {
          const axios = require("axios");
          return axios
            .post(`${config.env.apiUrl}/api/test-data/reset`)
            .then(() =>
              axios.post(`${config.env.apiUrl}/api/test-data/seed/all`)
            )
            .then(() => "Test data reset successfully")
            .catch((error) => {
              console.error("Failed to reset test data:", error.message);
              return "Failed to reset test data";
            });
        },

        seedLargeDataset(count = 1000) {
          const axios = require("axios");
          return axios
            .post(`${config.env.apiUrl}/api/test-data/seed/large-dataset`, {
              count,
            })
            .then((response) => response.data)
            .catch((error) => {
              console.error("Failed to seed large dataset:", error.message);
              throw error;
            });
        },
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
