import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globalSetup: "./tests/setup.ts",
        testTimeout: 30000
    }
})
