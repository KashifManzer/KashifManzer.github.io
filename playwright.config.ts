import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results/browser',
  timeout: 45000,
  expect: { timeout: 20000 },
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4322',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chrome', testMatch: ['orbital.spec.ts', 'solar.spec.ts', 'keyframes.spec.ts', 'districts.spec.ts', 'launch.spec.ts', 'asteroids.spec.ts'], use: { channel: 'chrome', launchOptions: { args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader'] } } },
    { name: 'firefox', testMatch: ['solar.spec.ts', 'compatibility.spec.ts', 'keyframes-compatibility.spec.ts', 'districts.spec.ts', 'launch.spec.ts', 'asteroids.spec.ts'], use: { browserName: 'firefox' } },
    { name: 'webkit', testMatch: ['solar.spec.ts', 'compatibility.spec.ts', 'keyframes-compatibility.spec.ts', 'districts.spec.ts', 'launch.spec.ts', 'asteroids.spec.ts'], use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4322 --ignore-lock',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: true,
  },
});
