import { spawn, spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join, basename } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { homedir } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Keep track of the tauri-driver process
let tauriDriver

// Add cargo bin to PATH
const cargoPath = join(homedir(), '.cargo', 'bin')
const env = {
  ...process.env,
  PATH: `${cargoPath}:${process.env.PATH}`
}

// Track test failures for error reports
const testFailures = []

export const config = {
  specs: ['./test/specs/**/*.js'],
  exclude: ['./test/specs/debug.spec.js'],
  maxInstances: 1,
  capabilities: [
    {
      'tauri:options': {
        application: './src-tauri/target/release/blood-pressure-tauri',
      },
    },
  ],
  // Base URL for Tauri app (uses tauri:// protocol in production)
  baseUrl: 'tauri://localhost',
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  // Screenshot settings
  screenshotPath: './test/screenshots',

  // Ensure the app is built before running tests
  onPrepare: function () {
    // Clear previous error reports
    const errorDir = join(__dirname, 'test', 'errors')
    const screenshotDir = join(__dirname, 'test', 'screenshots')

    // Create directories if they don't exist
    mkdirSync(errorDir, { recursive: true })
    mkdirSync(screenshotDir, { recursive: true })

    // Check if release binary already exists
    const releaseBinary = join(__dirname, 'src-tauri', 'target', 'release', 'blood-pressure-tauri')

    if (!existsSync(releaseBinary)) {
      console.log('Building Tauri app in release mode...')
      // Build the app in release mode
      const buildResult = spawnSync('npm', ['run', 'tauri', 'build'], {
        stdio: 'inherit',
        shell: true,
        env,
        cwd: __dirname,
      })

      if (buildResult.status !== 0) {
        throw new Error('Failed to build Tauri app')
      }
    } else {
      console.log('Release binary found, skipping build.')
    }

    // Find tauri-driver path
    const tauriDriverPath = join(cargoPath, 'tauri-driver')

    if (!existsSync(tauriDriverPath)) {
      throw new Error(`tauri-driver not found at ${tauriDriverPath}. Install it with: cargo install tauri-driver`)
    }

    // Start tauri-driver
    console.log('Starting tauri-driver...')
    tauriDriver = spawn(tauriDriverPath, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    })

    tauriDriver.stdout.on('data', (data) => {
      console.log(`tauri-driver: ${data}`)
    })

    tauriDriver.stderr.on('data', (data) => {
      console.error(`tauri-driver error: ${data}`)
    })

    // Wait for tauri-driver to start
    return new Promise((resolve) => setTimeout(resolve, 2000))
  },

  // Clear session before each test file to ensure clean state
  before: async function (capabilities, specs) {
    // Clear localStorage to logout any existing session
    await browser.execute(() => {
      localStorage.clear()
    })
    // Navigate to root to trigger auth check
    await browser.url('/')
    await browser.pause(500)
  },

  // Take screenshot and capture error on test failure
  afterTest: async function (test, context, { error, result, duration, passed, retries }) {
    if (!passed && error) {
      const specName = test.parent || 'unknown'
      const testTitle = test.title || 'unknown-test'
      const safeSpecName = specName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
      const safeTestName = testTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const screenshotDir = join(__dirname, 'test', 'screenshots', safeSpecName)
      const errorDir = join(__dirname, 'test', 'errors', safeSpecName)

      // Create directories
      mkdirSync(screenshotDir, { recursive: true })
      mkdirSync(errorDir, { recursive: true })

      // Take screenshot
      const screenshotPath = join(screenshotDir, `${safeTestName}-${timestamp}.png`)
      try {
        await browser.saveScreenshot(screenshotPath)
        console.log(`Screenshot saved: ${screenshotPath}`)
      } catch (screenshotError) {
        console.error('Failed to save screenshot:', screenshotError.message)
      }

      // Get page source for debugging
      let pageSource = ''
      let currentUrl = ''
      let bodyText = ''
      try {
        currentUrl = await browser.getUrl()
        pageSource = await browser.getPageSource()
        const body = await $('body')
        bodyText = await body.getText()
      } catch (e) {
        pageSource = 'Could not capture page source'
        bodyText = 'Could not capture body text'
      }

      // Create error report markdown
      const errorReport = `# Test Failure Report

## Test Details
- **Spec**: ${specName}
- **Test**: ${testTitle}
- **Duration**: ${duration}ms
- **Timestamp**: ${new Date().toISOString()}
- **Current URL**: ${currentUrl}

## Error Message
\`\`\`
${error.message || 'No error message'}
\`\`\`

## Error Stack
\`\`\`
${error.stack || 'No stack trace'}
\`\`\`

## Screenshot
![Screenshot](./screenshots/${safeSpecName}/${safeTestName}-${timestamp}.png)

Relative path: test/screenshots/${safeSpecName}/${safeTestName}-${timestamp}.png

## Page Content (Body Text)
\`\`\`
${bodyText.substring(0, 2000)}
\`\`\`

## Page Source (first 3000 chars)
\`\`\`html
${pageSource.substring(0, 3000)}
\`\`\`

## How to Debug
1. Check the screenshot to see the current state of the app
2. Check the "Current URL" to see where the test ended up
3. Check "Page Content" to see what text is visible
4. The error message and stack trace show what assertion or action failed

## Common Issues
- If URL is "/dashboard" when expecting "/signup" or "/": A user session persists from previous tests
- If elements not found: The page may not have loaded, or the selector is wrong
- If timeout: The expected condition was never met (check URL and page content)
`

      const errorFilePath = join(errorDir, `${safeTestName}-${timestamp}.md`)
      writeFileSync(errorFilePath, errorReport)
      console.log(`Error report saved: ${errorFilePath}`)

      // Track failure for summary
      testFailures.push({
        spec: specName,
        test: testTitle,
        error: error.message,
        errorFile: errorFilePath,
        screenshot: screenshotPath
      })
    }
  },

  onComplete: function (exitCode, config, capabilities, results) {
    if (tauriDriver) {
      tauriDriver.kill()
    }

    // Write summary of all failures
    if (testFailures.length > 0) {
      const summaryDir = join(__dirname, 'test', 'errors')
      mkdirSync(summaryDir, { recursive: true })

      const summary = `# Test Failure Summary

Generated: ${new Date().toISOString()}
Total Failures: ${testFailures.length}

## Failed Tests

${testFailures.map((f, i) => `### ${i + 1}. ${f.spec} > ${f.test}
- **Error**: ${f.error}
- **Error Report**: ${f.errorFile}
- **Screenshot**: ${f.screenshot}
`).join('\n')}

## Quick Links to Error Reports
${testFailures.map(f => `- [${f.test}](${f.errorFile})`).join('\n')}
`

      const summaryPath = join(summaryDir, 'FAILURE_SUMMARY.md')
      writeFileSync(summaryPath, summary)
      console.log(`\n📋 Failure summary saved: ${summaryPath}`)
    }
  },

  hostname: '127.0.0.1',
  port: 4444,

  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  logLevel: 'info',
}
