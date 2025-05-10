/// <reference types="vitest" />

// Define the Vitest workspace configuration
export default {
  // Use glob patterns to find all the vitest/vite config files
  extends: [
    './apps/*/vitest.config.ts',
    './apps/*/vite.config.ts',
  ],
};
