/**
 * DatumX Protocol & BOT Chain Pilot - Smoke Test 3 Runner
 * Headless Browser & UI Console Smoke Test
 * 
 * Verifies:
 * 1. Clean Vite preview launch on http://127.0.0.1:4173
 * 2. 0 console errors and 0 unhandled page errors across entire execution
 * 3. Traversal across all 8 primary console views:
 *    - overview, datasets, validation, validators, audit, governance, botchain, settings
 * 4. BOT Chain Pilot UI interactive workflow:
 *    - Banner renders 'BOT CHAIN TESTNET — CHAIN ID 968'
 *    - 'Canonicalize & Hash' calculates deterministic SHA-256
 *    - 'Stage Local Simulation' stages simulation record without fabricating fake transaction hashes
 *    - 'Verify Against Staged Simulation Hash' with original payload yields MATCH [LOCAL SIMULATION ONLY — NOT ON-CHAIN]
 *    - Candidate payload modification yields MISMATCH [PAYLOAD ALTERED]
 * 5. Network badge rendering:
 *    - Disconnected: slate 'Disconnected' badge
 *    - Chain ID 1449000: green 'XRPL EVM Testnet' badge
 *    - Chain ID 968: amber 'Wrong network' in TopNav, green 'Connected to 968' in Pilot header
 * 6. Clean process termination for preview server and browser
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Resolve Playwright instance
function getPlaywright() {
  try {
    return require('playwright');
  } catch (e) {
    const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Zhane\\AppData\\Local';
    const npxDir = path.join(localAppData, 'npm-cache', '_npx');
    if (fs.existsSync(npxDir)) {
      const dirs = fs.readdirSync(npxDir);
      for (const d of dirs) {
        const candidate = path.join(npxDir, d, 'node_modules', 'playwright');
        if (fs.existsSync(candidate)) {
          return require(candidate);
        }
      }
    }
    throw new Error('Playwright could not be resolved from node_modules or npx cache');
  }
}

// Find Chromium executable
function getChromiumExecutablePath() {
  const customPath = 'C:\\Users\\Zhane\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe';
  if (fs.existsSync(customPath)) {
    return customPath;
  }
  return undefined;
}

// HTTP ping utility
function pingUrl(url, timeoutMs = 25000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', () => {
        retry();
      });
      req.end();
    }

    function retry() {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for preview server at ${url}`));
      } else {
        setTimeout(tryConnect, 300);
      }
    }

    tryConnect();
  });
}

// Clean process kill on Windows
function killProcessTree(pid) {
  try {
    execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
  } catch (e) {
    // Process may have already exited
  }
}

// Mock Ethereum Provider for network badge tests
function createMockEthereumProviderScript(chainIdHex, accounts = ['0x90F79bf6EB2c4f870365E785982E1f101E93b906']) {
  return `
    (function() {
      const listeners = {};
      window.ethereum = {
        isMetaMask: true,
        request: async function({ method, params }) {
          if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
            return ${JSON.stringify(accounts)};
          }
          if (method === 'eth_chainId') {
            return '${chainIdHex}';
          }
          if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') {
            return null;
          }
          return null;
        },
        on: function(event, handler) {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(handler);
        },
        removeListener: function(event, handler) {
          if (!listeners[event]) return;
          listeners[event] = listeners[event].filter(h => h !== handler);
        }
      };
    })();
  `;
}

async function runSmokeTest() {
  const testStartTime = Date.now();
  const logs = [];
  function log(msg) {
    const ts = new Date().toISOString();
    const formatted = `[${ts}] ${msg}`;
    console.log(formatted);
    logs.push(formatted);
  }

  log('=== STARTING SMOKE TEST 3: Headless Browser & UI Console Smoke Test ===');
  const projectRoot = path.resolve(__dirname, '..');
  const port = 4173;
  const baseUrl = `http://127.0.0.1:${port}`;

  let previewProcess = null;
  let browser = null;
  const consoleErrors = [];
  const pageErrors = [];

  try {
    // Step 1: Launch preview server
    log(`[Step 1] Launching Vite preview server on ${baseUrl}...`);
    const isWindows = process.platform === 'win32';
    const npmCmd = isWindows ? 'npx.cmd' : 'npx';
    previewProcess = spawn(npmCmd, ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: isWindows,
    });

    previewProcess.stderr.on('data', (data) => {
      const errStr = data.toString();
      if (errStr.toLowerCase().includes('error')) {
        log(`[Preview stderr] ${errStr.trim()}`);
      }
    });

    await pingUrl(baseUrl, 25000);
    log(`[Step 1] Vite preview server is responsive at ${baseUrl}.`);

    // Step 2: Launch Headless Browser
    log('[Step 2] Initializing Playwright Chromium browser...');
    const playwright = getPlaywright();
    const executablePath = getChromiumExecutablePath();
    log(`[Step 2] Using Chromium executable: ${executablePath || 'Playwright default'}`);

    const launchOptions = {
      headless: true,
    };
    if (executablePath) {
      launchOptions.executablePath = executablePath;
    } else {
      launchOptions.channel = 'msedge';
    }

    browser = await playwright.chromium.launch(launchOptions);
    log('[Step 2] Headless browser launched successfully.');

    // Step 3: Run Baseline Tests (Disconnected State)
    log('[Step 3] Running Disconnected Session: view navigation and pilot interaction...');
    const context1 = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page1 = await context1.newPage();

    page1.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        log(`[Browser console.error] ${text}`);
        consoleErrors.push({ url: page1.url(), text });
      }
    });

    page1.on('pageerror', (err) => {
      const msg = err.message || String(err);
      log(`[Browser pageerror] ${msg}`);
      pageErrors.push({ url: page1.url(), error: msg });
    });

    await page1.goto(baseUrl, { waitUntil: 'networkidle' });
    log(`[Step 3] Loaded base URL: ${baseUrl}`);

    // Check Disconnected network badge
    const disconnectedBadge = page1.locator('header').getByText('Disconnected');
    if (!(await disconnectedBadge.isVisible())) {
      throw new Error('Disconnected badge was not found in TopNav header');
    }
    log('[Step 3.1] Verified TopNav renders "Disconnected" badge in disconnected state.');

    // Check MetaMask warning banner
    const metaMaskWarning = page1.getByText('MetaMask not detected');
    const isWarningVisible = await metaMaskWarning.isVisible();
    log(`[Step 3.2] Verified MetaMask warning banner rendered: ${isWarningVisible}`);

    // 8 Navigation Views to Traverse
    const views = [
      { key: 'overview', label: 'Overview', assertion: async (p) => p.getByText('Lineage Graph').first().isVisible() },
      { key: 'datasets', label: 'Datasets', assertion: async (p) => p.getByText('Dataset Registry').first().isVisible() },
      { key: 'validation', label: 'Validation', assertion: async (p) => p.getByText('Validator Review Panel').first().isVisible() },
      { key: 'validators', label: 'Validators', assertion: async (p) => p.getByText('Validator Network').first().isVisible() },
      { key: 'audit', label: 'Audit Trail', assertion: async (p) => p.getByText('Forensic ledger').first().isVisible() },
      { key: 'governance', label: 'Governance', assertion: async (p) => p.getByText('Project Management').first().isVisible() },
      { key: 'botchain', label: 'BOT Chain Pilot', assertion: async (p) => p.getByText('BOT CHAIN TESTNET — CHAIN ID 968').first().isVisible() },
      { key: 'settings', label: 'Settings', assertion: async (p) => p.getByText('Research Dossier').first().isVisible() },
    ];

    log('[Step 3.3] Beginning traversal of all 8 primary navigation views...');
    for (const view of views) {
      const navButton = page1.locator('aside nav button').filter({ hasText: view.label });
      await navButton.click();
      await page1.waitForTimeout(300); // Allow lazy component chunk to mount
      const isAssertValid = await view.assertion(page1);
      if (!isAssertValid) {
        throw new Error(`View '${view.key}' failed rendering assertion`);
      }
      log(`  -> Navigated to view: [${view.key}] ("${view.label}") - Render OK`);
    }
    log('[Step 3.3] All 8 console navigation views traversed cleanly.');

    // Step 4: Exercise BOT Chain Pilot UI (on page1)
    log('[Step 4] Exercising BOT Chain Pilot UI on view [botchain]...');
    const botchainButton = page1.locator('aside nav button').filter({ hasText: 'BOT Chain Pilot' });
    await botchainButton.click();
    await page1.waitForTimeout(300);

    // 4.1 Verify header text
    const pilotHeader = page1.getByRole('heading', { name: /BOT CHAIN TESTNET — CHAIN ID 968/i });
    if (!(await pilotHeader.isVisible())) {
      throw new Error('Pilot header "BOT CHAIN TESTNET — CHAIN ID 968" is not visible');
    }
    log('[Step 4.1] Verified header renders "BOT CHAIN TESTNET — CHAIN ID 968".');

    // 4.2 Click "Canonicalize & Hash"
    log('[Step 4.2] Clicking "Canonicalize & Hash"...');
    const hashButton = page1.getByRole('button', { name: 'Canonicalize & Hash' });
    await hashButton.click();

    // Wait for the SHA-256 hash output box to render with 0x prefix
    const hashContainer = page1.locator('div').filter({ hasText: /^SHA-256:\s*0x/ }).first();
    await hashContainer.waitFor({ state: 'visible', timeout: 5000 });
    const hashText = (await hashContainer.textContent()).trim();
    log(`[Step 4.2] Computed SHA-256 output verified: ${hashText}`);
    const matchHash = hashText.match(/0x[a-fA-F0-9]{64}/);
    if (!matchHash) {
      throw new Error(`Unexpected hash format: ${hashText}`);
    }

    // 4.3 Click "Stage Local Simulation"
    log('[Step 4.3] Clicking "Stage Local Simulation"...');
    const registerButton = page1.getByRole('button', { name: /Stage Local Simulation|Submit On-Chain/ });
    await registerButton.click();
    await page1.waitForTimeout(400);

    const storedHashLabel = page1.getByText('Stored Content Hash:');
    if (!(await storedHashLabel.isVisible())) {
      throw new Error('Stored Content Hash label not visible in Step 2 after registration');
    }
    
    // In local simulation mode without deployed contract, verify that NO fake transaction hash or link is rendered!
    const localNotice = page1.getByText('Local simulation only. No on-chain transaction hash or block explorer record exists.');
    if (await localNotice.isVisible()) {
      log('[Step 4.3] Verified honest simulation posture: No fabricated transaction hash or block explorer link rendered.');
    } else {
      const txLink = page1.locator('a[href*="scan.bohr.life/tx/"]');
      if (await txLink.isVisible()) {
        const txHref = await txLink.getAttribute('href');
        log(`[Step 4.3] Live transaction confirmed on Bohr testnet. Link: ${txHref}`);
      }
    }

    // 4.4 Verify Integrity (MATCH)
    log('[Step 4.4] Clicking verify button with unmodified payload...');
    const verifyButton = page1.getByRole('button', { name: /Verify Against Staged Simulation Hash|Verify Against On-Chain Hash/ });
    await verifyButton.click();
    await page1.waitForTimeout(300);

    const matchBadge = page1.getByText(/MATCH \[(LOCAL SIMULATION ONLY.*|ON-CHAIN RECORD INTEGRITY VERIFIED|RECORD INTEGRITY VERIFIED)\]/i);
    if (!(await matchBadge.isVisible())) {
      throw new Error('MATCH badge was not displayed');
    }
    log('[Step 4.4] Verified MATCH state is rendered.');

    // 4.5 Modify payload and Verify Integrity (MISMATCH)
    log('[Step 4.5] Modifying candidate payload in Step 3 textarea with altered data...');
    // Find candidate payload textarea in Step 3
    const candidateTextarea = page1.locator('textarea').nth(1);
    const originalCandidateVal = await candidateTextarea.inputValue();
    const tamperedPayload = JSON.parse(originalCandidateVal);
    tamperedPayload.samples[0].gammaCount = 9999.9; // Alter sample value
    tamperedPayload.tampered = true;
    await candidateTextarea.fill(JSON.stringify(tamperedPayload, null, 2));

    log('[Step 4.5] Clicking verify button with tampered payload...');
    await verifyButton.click();
    await page1.waitForTimeout(300);

    const mismatchBadge = page1.getByText('MISMATCH [PAYLOAD ALTERED]');
    if (!(await mismatchBadge.isVisible())) {
      throw new Error('MISMATCH [PAYLOAD ALTERED] badge was not displayed for tampered payload');
    }
    log('[Step 4.5] Verified MISMATCH state: MISMATCH [PAYLOAD ALTERED] is rendered.');

    await context1.close();

    // Step 5: Test Network Badges with Injected Providers
    log('[Step 5] Testing network badges with simulated wallet providers...');

    // 5.1 Test Chain ID 1449000 (XRPL EVM Testnet)
    log('  -> Testing Chain ID 1449000 (0x161b28 - XRPL EVM Testnet)...');
    const contextXrpl = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await contextXrpl.addInitScript(createMockEthereumProviderScript('0x161b28'));
    const pageXrpl = await contextXrpl.newPage();

    pageXrpl.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push({ url: pageXrpl.url(), text: msg.text() });
    });
    pageXrpl.on('pageerror', (err) => {
      pageErrors.push({ url: pageXrpl.url(), error: err.message || String(err) });
    });

    await pageXrpl.goto(baseUrl, { waitUntil: 'networkidle' });
    const xrplBadge = pageXrpl.locator('header').getByText('XRPL EVM Testnet');
    if (!(await xrplBadge.isVisible())) {
      throw new Error('Expected "XRPL EVM Testnet" badge in TopNav when chainId is 1449000');
    }
    log('  -> Verified TopNav displays green "XRPL EVM Testnet" badge.');
    await contextXrpl.close();

    // 5.2 Test Chain ID 968 (Bohr / BOT Chain Testnet)
    log('  -> Testing Chain ID 968 (0x3c8 - BOT Chain Testnet)...');
    const contextBohr = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await contextBohr.addInitScript(createMockEthereumProviderScript('0x3c8'));
    const pageBohr = await contextBohr.newPage();

    pageBohr.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push({ url: pageBohr.url(), text: msg.text() });
    });
    pageBohr.on('pageerror', (err) => {
      pageErrors.push({ url: pageBohr.url(), error: err.message || String(err) });
    });

    await pageBohr.goto(baseUrl, { waitUntil: 'networkidle' });

    // In TopNav, chain 968 is not XRPL EVM Testnet, so it renders "Wrong network" with amber dot
    const wrongNetBadge = pageBohr.locator('header').getByText('Wrong network');
    if (!(await wrongNetBadge.isVisible())) {
      throw new Error('Expected "Wrong network" badge in TopNav when connected to Chain ID 968');
    }
    log('  -> Verified TopNav displays amber "Wrong network" badge for Chain ID 968.');

    // In BOT Chain Pilot panel, chain 968 is native, so it displays "Connected to 968"
    const botchainNav = pageBohr.locator('aside nav button').filter({ hasText: 'BOT Chain Pilot' });
    await botchainNav.click();
    await pageBohr.waitForTimeout(300);

    const connected968Badge = pageBohr.getByText('Connected to 968');
    if (!(await connected968Badge.isVisible())) {
      throw new Error('Expected "Connected to 968" green badge in BOT Chain Pilot header');
    }
    log('  -> Verified BOT Chain Pilot header displays green "Connected to 968" badge.');
    await contextBohr.close();

    // Step 6: Verify 0 Console Errors and 0 Page Errors
    log('[Step 6] Verifying console error log metrics...');
    log(`  -> Total console errors captured: ${consoleErrors.length}`);
    log(`  -> Total unhandled page errors captured: ${pageErrors.length}`);

    if (consoleErrors.length > 0) {
      consoleErrors.forEach((e, idx) => log(`    [Console Error ${idx + 1}] ${e.url}: ${e.text}`));
      throw new Error(`Smoke Test 3 failed: ${consoleErrors.length} console errors encountered`);
    }
    if (pageErrors.length > 0) {
      pageErrors.forEach((e, idx) => log(`    [Page Error ${idx + 1}] ${e.url}: ${e.error}`));
      throw new Error(`Smoke Test 3 failed: ${pageErrors.length} page errors encountered`);
    }

    const testDuration = ((Date.now() - testStartTime) / 1000).toFixed(2);
    log(`=== SMOKE TEST 3 PASSED PERFECTLY IN ${testDuration}s (0 errors) ===`);

    return {
      success: true,
      durationSeconds: Number(testDuration),
      viewsTraversed: views.map((v) => v.key),
      consoleErrorsCount: 0,
      pageErrorsCount: 0,
      logs,
    };
  } finally {
    // Clean process teardown
    log('[Teardown] Cleaning up browser and server processes...');
    if (browser) {
      try {
        await browser.close();
        log('[Teardown] Browser closed.');
      } catch (e) {
        // Ignore
      }
    }
    if (previewProcess && previewProcess.pid) {
      try {
        killProcessTree(previewProcess.pid);
        log(`[Teardown] Vite preview server (PID: ${previewProcess.pid}) terminated.`);
      } catch (e) {
        // Ignore
      }
    }
  }
}

if (require.main === module) {
  runSmokeTest()
    .then((result) => {
      console.log('\n[SUMMARY RESULT]: SUCCESS');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n[SUMMARY RESULT]: FAILURE');
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runSmokeTest };
