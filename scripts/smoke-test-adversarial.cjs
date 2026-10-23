/**
 * DatumX Protocol & BOT Chain Pilot - Smoke Test 3 Adversarial Challenge Runner
 * Author: Challenger 2 (Empirical Challenger)
 * 
 * Adversarial Challenge Battery:
 * 1. Rapid View Traversal (80+ high-frequency transitions + ping-pong view thrashing to expose React 19 race conditions / hook breaks)
 * 2. Pilot Verification & Registration UI Input Fuzzing (12+ adversarial JSON payloads: syntax errors, unclosed braces, empty strings, whitespace, truncated JSON, primitives, HTML/script injections, proto keys)
 * 3. Network Badge State Switches (unexpected chain IDs: Chain 1, 11155111, 999999, 0, plus real-time in-page chainChanged & accountsChanged event storms)
 * 4. Strict Zero Console & Page Error Enforcement (fails if any uncaught console.error or pageerror occurs)
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

// Dynamic Mock Ethereum Provider script with emit capabilities
function createDynamicEthereumProviderScript(initialChainIdHex, initialAccounts = ['0x90F79bf6EB2c4f870365E785982E1f101E93b906']) {
  return `
    (function() {
      let currentChainId = '${initialChainIdHex}';
      let currentAccounts = ${JSON.stringify(initialAccounts)};
      const listeners = {};

      window.__datumx_setChainId = function(newChainIdHex) {
        currentChainId = newChainIdHex;
        if (listeners['chainChanged']) {
          listeners['chainChanged'].forEach(fn => fn(newChainIdHex));
        }
      };

      window.__datumx_setAccounts = function(newAccounts) {
        currentAccounts = newAccounts;
        if (listeners['accountsChanged']) {
          listeners['accountsChanged'].forEach(fn => fn(newAccounts));
        }
      };

      window.ethereum = {
        isMetaMask: true,
        request: async function({ method, params }) {
          if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
            return currentAccounts;
          }
          if (method === 'eth_chainId') {
            return currentChainId;
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

async function runAdversarialSmokeTest() {
  const testStartTime = Date.now();
  const logs = [];
  function log(msg) {
    const ts = new Date().toISOString();
    const formatted = `[${ts}] ${msg}`;
    console.log(formatted);
    logs.push(formatted);
  }

  log('========================================================================');
  log('=== ADVERSARIAL SMOKE TEST 3: Headless Browser & UI Stress Harness ===');
  log('========================================================================');

  const projectRoot = path.resolve(__dirname, '..');
  const port = 4174; // Use port 4174 to avoid any lingering socket collisions
  const baseUrl = `http://127.0.0.1:${port}`;

  let previewProcess = null;
  let browser = null;
  const consoleErrors = [];
  const pageErrors = [];

  try {
    // Step 1: Launch preview server
    log(`[Phase 0] Spawning Vite preview server on ${baseUrl}...`);
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
    log(`[Phase 0] Preview server online and responsive at ${baseUrl}.`);

    // Step 2: Launch Headless Browser
    log('[Phase 0] Launching Playwright Chromium...');
    const playwright = getPlaywright();
    const executablePath = getChromiumExecutablePath();
    browser = await playwright.chromium.launch({
      headless: true,
      executablePath: executablePath || undefined,
    });
    log('[Phase 0] Chromium headless browser active.');

    // -------------------------------------------------------------------------
    // Phase 1: Rapid View Traversal Stress Test (React 19 Concurrency & Hooks)
    // -------------------------------------------------------------------------
    log('\n>>> PHASE 1: STRESS-TESTING RAPID VIEW TRAVERSAL & REACT 19 CONCURRENCY <<<');
    const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1 = await context1.newPage();

    page1.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        log(`  [UNCAUGHT CONSOLE ERROR] ${text}`);
        consoleErrors.push({ phase: 'Phase 1/2', url: page1.url(), text });
      }
    });

    page1.on('pageerror', (err) => {
      const msg = err.message || String(err);
      log(`  [UNCAUGHT PAGE ERROR] ${msg}`);
      pageErrors.push({ phase: 'Phase 1/2', url: page1.url(), error: msg });
    });

    await page1.goto(baseUrl, { waitUntil: 'networkidle' });

    const viewLabels = [
      'Overview',
      'Datasets',
      'Validation',
      'Validators',
      'Audit Trail',
      'Governance',
      'BOT Chain Pilot',
      'Settings',
    ];

    log(`[Phase 1.1] Executing 5 full forward & reverse high-frequency sweeps across all 8 views...`);
    let totalClicks = 0;
    for (let round = 1; round <= 5; round++) {
      // Forward sweep
      for (const label of viewLabels) {
        const btn = page1.locator('aside nav button').filter({ hasText: label });
        await btn.click();
        totalClicks++;
        await page1.waitForTimeout(20); // Fast burst: 20ms
      }
      // Reverse sweep
      for (let i = viewLabels.length - 1; i >= 0; i--) {
        const label = viewLabels[i];
        const btn = page1.locator('aside nav button').filter({ hasText: label });
        await btn.click();
        totalClicks++;
        await page1.waitForTimeout(20); // Fast burst: 20ms
      }
    }
    log(`[Phase 1.1] Completed ${totalClicks} high-frequency navigation clicks.`);

    log(`[Phase 1.2] Executing rapid ping-pong thrashing between BOT Chain Pilot and Settings/Validation (20 cycles)...`);
    for (let i = 0; i < 20; i++) {
      await page1.locator('aside nav button').filter({ hasText: 'BOT Chain Pilot' }).click();
      await page1.waitForTimeout(15);
      await page1.locator('aside nav button').filter({ hasText: 'Overview' }).click();
      await page1.waitForTimeout(15);
      await page1.locator('aside nav button').filter({ hasText: 'Settings' }).click();
      await page1.waitForTimeout(15);
      await page1.locator('aside nav button').filter({ hasText: 'Validation' }).click();
      await page1.waitForTimeout(15);
      totalClicks += 4;
    }
    log(`[Phase 1.2] Completed ${totalClicks} total rapid navigation view switches.`);

    log(`[Phase 1.3] Settling verification: Confirming full DOM render integrity for each view after thrashing...`);
    const viewChecks = [
      { label: 'Overview', assertion: async (p) => p.getByText('Lineage Graph').first().isVisible() },
      { label: 'Datasets', assertion: async (p) => p.getByText('Dataset Registry').first().isVisible() },
      { label: 'Validation', assertion: async (p) => p.getByText('Validator Review Panel').first().isVisible() },
      { label: 'Validators', assertion: async (p) => p.getByText('Validator Network').first().isVisible() },
      { label: 'Audit Trail', assertion: async (p) => p.getByText('Forensic ledger').first().isVisible() },
      { label: 'Governance', assertion: async (p) => p.getByText('Project Management').first().isVisible() },
      { label: 'BOT Chain Pilot', assertion: async (p) => p.getByText('BOT CHAIN TESTNET — CHAIN ID 968').first().isVisible() },
      { label: 'Settings', assertion: async (p) => p.getByText('Research Dossier').first().isVisible() },
    ];

    for (const item of viewChecks) {
      const btn = page1.locator('aside nav button').filter({ hasText: item.label });
      await btn.click();
      await page1.waitForTimeout(150);
      const isVisible = await item.assertion(page1);
      if (!isVisible) {
        throw new Error(`DOM verification failed for view '${item.label}' after rapid thrashing.`);
      }
      log(`  ✓ View [${item.label}] cleanly mounted and verified.`);
    }

    // -------------------------------------------------------------------------
    // Phase 2: Pilot Verification UI Input Fuzzing & Malformed JSON Battery
    // -------------------------------------------------------------------------
    log('\n>>> PHASE 2: STRESS-TESTING MALFORMED & INVALID JSON INPUTS <<<');
    // Ensure on BOT Chain Pilot view
    await page1.locator('aside nav button').filter({ hasText: 'BOT Chain Pilot' }).click();
    await page1.waitForTimeout(200);

    // Baseline registration first
    log('[Phase 2.0] Establishing baseline registration on BOT Chain Pilot...');
    await page1.getByRole('button', { name: 'Canonicalize & Hash' }).click();
    await page1.waitForTimeout(100);
    await page1.getByRole('button', { name: /Stage Local Simulation|Submit On-Chain/ }).click();
    await page1.waitForTimeout(300);

    const storedHashLabel = page1.getByText('Stored Content Hash:');
    if (!(await storedHashLabel.isVisible())) {
      throw new Error('Baseline registration failed: Stored Content Hash not visible');
    }
    log('[Phase 2.0] Baseline record registered successfully.');

    // Locate elements
    const step1Textarea = page1.locator('textarea').first();
    const step3Textarea = page1.locator('textarea').nth(1);
    const hashBtn = page1.getByRole('button', { name: 'Canonicalize & Hash' });
    const verifyBtn = page1.getByRole('button', { name: /Verify Against Staged Simulation Hash|Verify Against On-Chain Hash/ });

    // Adversarial inputs for Step 3 (Verification input)
    const adversarialVerificationCases = [
      { name: 'Trailing comma syntax error', payload: '{\n  "benchmarkId": "BOT-001",\n}' },
      { name: 'Unclosed object brace', payload: '{\n  "benchmarkId": "BOT-001"' },
      { name: 'Empty string', payload: '' },
      { name: 'Whitespace & newline string', payload: '   \n\t\r\n   ' },
      { name: 'Truncated array', payload: '{"samples": [{"depth": 10.5' },
      { name: 'Primitive plain string', payload: 'Hello world this is not JSON' },
      { name: 'Primitive number', payload: '12345.6789' },
      { name: 'Primitive boolean', payload: 'true' },
      { name: 'Primitive null', payload: 'null' },
      { name: 'Array root payload', payload: '[1, 2, 3, {"depth": 10}]' },
      { name: 'Empty object {}', payload: '{}' },
      { name: 'Deeply nested JSON structure', payload: '{"l1":{"l2":{"l3":{"l4":{"l5":{"l6":{"val":42}}}}}}}' },
      { name: 'Script tag / HTML injection', payload: '{"payload": "<script>alert(1)</script><img src=x onerror=alert(1)>"}' },
      { name: 'Prototype pollution attempt', payload: '{"__proto__": {"polluted": true}, "constructor": {"prototype": {"admin": true}}}' },
      { name: 'Unicode & emoji stream', payload: '{"label": "🚀💥🔥 ⚛️ 🌐 ⚡", "special": "\\u0000\\uFFFF\\u202E"}' },
    ];

    log(`[Phase 2.1] Executing adversarial battery against Step 3 Verification textarea (${adversarialVerificationCases.length} test cases)...`);

    for (const testCase of adversarialVerificationCases) {
      log(`  -> Fuzzing Step 3 with: [${testCase.name}]`);
      await step3Textarea.fill(testCase.payload);
      await verifyBtn.click();
      await page1.waitForTimeout(80);

      // Verify that the UI didn't crash:
      // If the input was invalid JSON syntax, BotChainPilotPanel should display the error message banner
      // If it was valid JSON (e.g. primitive, empty object, array, script string), it should calculate and result in MISMATCH.
      const isErrorBanner = await page1.getByText('Invalid JSON syntax in verification input payload.').isVisible();
      const isMismatch = await page1.getByText('MISMATCH [PAYLOAD ALTERED]').isVisible();

      if (!isErrorBanner && !isMismatch) {
        log(`    Notice: Case [${testCase.name}] handled without banner or mismatch badge (checked state)`);
      } else if (isErrorBanner) {
        log(`    ✓ Handled gracefully via Error Banner: "Invalid JSON syntax in verification input payload."`);
      } else if (isMismatch) {
        log(`    ✓ Handled gracefully via Mismatch Verification: "MISMATCH [PAYLOAD ALTERED]"`);
      }

      // Check button remains clickable and active
      if (!(await verifyBtn.isEnabled())) {
        throw new Error(`Verify button became locked/disabled after test case: ${testCase.name}`);
      }
    }
    log('[Phase 2.1] Step 3 Verification fuzzing completed with zero crashes.');

    // Adversarial inputs for Step 1 (Registration payload)
    log(`[Phase 2.2] Stress-testing Step 1 Registration textarea with syntax corruption...`);
    const step1Cases = [
      { name: 'Truncated JSON in Step 1', payload: '{"benchmarkId": "BROKEN", ' },
      { name: 'Empty text in Step 1', payload: '' },
      { name: 'Invalid token in Step 1', payload: '<<<NOT_JSON>>>' },
    ];

    for (const c of step1Cases) {
      log(`  -> Testing Step 1 with: [${c.name}]`);
      await step1Textarea.fill(c.payload);
      await hashBtn.click();
      await page1.waitForTimeout(80);

      const errVisible = await page1.getByText('Invalid JSON syntax in raw dataset payload.').isVisible();
      if (!errVisible) {
        throw new Error(`Step 1 did not surface expected error banner for invalid JSON case: ${c.name}`);
      }
      log(`    ✓ Correctly surfaced: "Invalid JSON syntax in raw dataset payload."`);
    }
    log('[Phase 2.2] Step 1 Registration error handling verified.');

    await context1.close();

    // -------------------------------------------------------------------------
    // Phase 3: Simulated Network State & Chain ID Boundary Stress Test
    // -------------------------------------------------------------------------
    log('\n>>> PHASE 3: STRESS-TESTING NETWORK BADGES & UNEXPECTED CHAIN IDS <<<');

    const staticChainTests = [
      {
        chainIdHex: '0x161b28',
        chainIdDec: 1449000,
        name: 'XRPL EVM Testnet (Native)',
        expectedTopNav: 'XRPL EVM Testnet',
        expectedTone: 'green',
      },
      {
        chainIdHex: '0x3c8',
        chainIdDec: 968,
        name: 'BOT Chain Testnet (Bohr)',
        expectedTopNav: 'Wrong network',
        expectedTone: 'amber',
        expectedPilotBadge: 'Connected to 968',
      },
      {
        chainIdHex: '0x1',
        chainIdDec: 1,
        name: 'Ethereum Mainnet (Unexpected)',
        expectedTopNav: 'Wrong network',
        expectedTone: 'amber',
        expectedPilotButton: 'Switch to Bohr Testnet',
      },
      {
        chainIdHex: '0xaa36a7',
        chainIdDec: 11155111,
        name: 'Sepolia Testnet (Unexpected)',
        expectedTopNav: 'Wrong network',
        expectedTone: 'amber',
      },
      {
        chainIdHex: '0xf423f',
        chainIdDec: 999999,
        name: 'Arbitrary High Chain ID 999999 (Boundary)',
        expectedTopNav: 'Wrong network',
        expectedTone: 'amber',
      },
    ];

    for (const test of staticChainTests) {
      log(`[Phase 3.1] Testing static network injection: Chain ID ${test.chainIdDec} (${test.name})...`);
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addInitScript(createDynamicEthereumProviderScript(test.chainIdHex));
      const page = await ctx.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          log(`  [UNCAUGHT CONSOLE ERROR] ${msg.text()}`);
          consoleErrors.push({ phase: `Phase 3 (${test.name})`, url: page.url(), text: msg.text() });
        }
      });
      page.on('pageerror', (err) => {
        log(`  [UNCAUGHT PAGE ERROR] ${err.message}`);
        pageErrors.push({ phase: `Phase 3 (${test.name})`, url: page.url(), error: err.message });
      });

      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      // Check TopNav badge
      const badge = page.locator('header').getByText(test.expectedTopNav);
      if (!(await badge.isVisible())) {
        throw new Error(`Expected TopNav badge "${test.expectedTopNav}" not visible for Chain ID ${test.chainIdDec}`);
      }
      log(`  ✓ TopNav badge correctly displayed "${test.expectedTopNav}".`);

      // Check pilot page if applicable
      if (test.expectedPilotBadge || test.expectedPilotButton) {
        await page.locator('aside nav button').filter({ hasText: 'BOT Chain Pilot' }).click();

        if (test.expectedPilotBadge) {
          const pilotBadge = page.getByText(test.expectedPilotBadge).first();
          await pilotBadge.waitFor({ state: 'visible', timeout: 5000 });
          log(`  ✓ BOT Chain Pilot panel correctly displayed "${test.expectedPilotBadge}".`);
        }

        if (test.expectedPilotButton) {
          const pilotBtn = page.getByRole('button', { name: test.expectedPilotButton }).first();
          await pilotBtn.waitFor({ state: 'visible', timeout: 5000 });
          log(`  ✓ BOT Chain Pilot panel correctly displayed action "${test.expectedPilotButton}".`);
        }
      }

      await ctx.close();
    }

    // -------------------------------------------------------------------------
    // Phase 3.2: Real-time In-Page Chain Switching & Account Event Storm
    // -------------------------------------------------------------------------
    log('\n[Phase 3.2] Testing real-time in-page chainChanged & accountsChanged event storm...');
    const dynamicCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await dynamicCtx.addInitScript(createDynamicEthereumProviderScript('0x161b28'));
    const dynamicPage = await dynamicCtx.newPage();

    dynamicPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        log(`  [UNCAUGHT CONSOLE ERROR] ${msg.text()}`);
        consoleErrors.push({ phase: 'Phase 3.2 Dynamic Events', url: dynamicPage.url(), text: msg.text() });
      }
    });
    dynamicPage.on('pageerror', (err) => {
      log(`  [UNCAUGHT PAGE ERROR] ${err.message}`);
      pageErrors.push({ phase: 'Phase 3.2 Dynamic Events', url: dynamicPage.url(), error: err.message });
    });

    await dynamicPage.goto(baseUrl, { waitUntil: 'networkidle' });

    // Initial state: XRPL EVM Testnet
    let currentBadge = await dynamicPage.locator('header').getByText('XRPL EVM Testnet').isVisible();
    if (!currentBadge) throw new Error('Initial dynamic test badge mismatch');
    log('  ✓ Initial state confirmed: "XRPL EVM Testnet"');

    // Rapidly fire chainChanged events
    const switchSequence = [
      { hex: '0x3c8', label: 'Wrong network', desc: 'BOT Chain 968' },
      { hex: '0x1', label: 'Wrong network', desc: 'Mainnet 1' },
      { hex: '0x161b28', label: 'XRPL EVM Testnet', desc: 'XRPL EVM 1449000' },
      { hex: '0xf423f', label: 'Wrong network', desc: 'High Chain 999999' },
      { hex: '0x161b28', label: 'XRPL EVM Testnet', desc: 'XRPL EVM 1449000' },
    ];

    for (const step of switchSequence) {
      log(`  -> Emitting window.ethereum.chainChanged('${step.hex}') [${step.desc}]...`);
      await dynamicPage.evaluate((hex) => {
        window.__datumx_setChainId(hex);
      }, step.hex);
      await dynamicPage.waitForTimeout(100);

      const isBadgeActive = await dynamicPage.locator('header').getByText(step.label).isVisible();
      if (!isBadgeActive) {
        throw new Error(`TopNav failed to reactively update badge to "${step.label}" after chainChanged to ${step.hex}`);
      }
      log(`    ✓ TopNav dynamically updated to "${step.label}".`);
    }

    // Now test accountsChanged event (disconnect -> reconnect)
    log('  -> Emitting window.ethereum.accountsChanged([]) [Disconnect]...');
    await dynamicPage.evaluate(() => {
      window.__datumx_setAccounts([]);
    });
    await dynamicPage.waitForTimeout(100);

    const isDisconnected = await dynamicPage.locator('header').getByText('Disconnected').isVisible();
    if (!isDisconnected) {
      throw new Error('TopNav failed to update to "Disconnected" when accounts list became empty');
    }
    log('    ✓ TopNav dynamically rendered "Disconnected" badge.');

    log('  -> Emitting window.ethereum.accountsChanged([\'0x90F79bf...\']) [Reconnect]...');
    await dynamicPage.evaluate(() => {
      window.__datumx_setAccounts(['0x90F79bf6EB2c4f870365E785982E1f101E93b906']);
    });
    await dynamicPage.waitForTimeout(100);

    const isReconnected = await dynamicPage.locator('header').getByText('XRPL EVM Testnet').isVisible();
    if (!isReconnected) {
      throw new Error('TopNav failed to restore "XRPL EVM Testnet" upon account reconnect');
    }
    log('    ✓ TopNav dynamically restored "XRPL EVM Testnet" badge upon reconnection.');

    await dynamicCtx.close();

    // -------------------------------------------------------------------------
    // Phase 4: Error Audit & Metrics
    // -------------------------------------------------------------------------
    log('\n========================================================================');
    log('>>> PHASE 4: ADVERSARIAL ERROR AUDIT & INTEGRITY METRICS <<<');
    log('========================================================================');
    log(`Total Navigation Switches Executed: ${totalClicks}`);
    log(`Adversarial JSON Payloads Tested: ${adversarialVerificationCases.length + step1Cases.length}`);
    log(`Network Configurations & Events Tested: ${staticChainTests.length + switchSequence.length + 2}`);
    log(`Uncaught Console Errors Captured: ${consoleErrors.length}`);
    log(`Unhandled Page Exceptions Captured: ${pageErrors.length}`);

    if (consoleErrors.length > 0) {
      consoleErrors.forEach((e, idx) => log(`  [FAILURE] Console error ${idx + 1} (${e.phase}): ${e.text}`));
      throw new Error(`Adversarial Challenge FAILED: ${consoleErrors.length} uncaught console errors detected.`);
    }

    if (pageErrors.length > 0) {
      pageErrors.forEach((e, idx) => log(`  [FAILURE] Page error ${idx + 1} (${e.phase}): ${e.error}`));
      throw new Error(`Adversarial Challenge FAILED: ${pageErrors.length} unhandled page exceptions detected.`);
    }

    const totalDuration = ((Date.now() - testStartTime) / 1000).toFixed(2);
    log(`\n=== ADVERSARIAL STRESS TEST COMPLETED SUCCESSFULLY IN ${totalDuration}s ===`);
    log('VERDICT: CONFIRM CORRECTNESS (0 uncaught errors, 100% resilience across all stress vectors)');

    return {
      success: true,
      verdict: 'CONFIRM CORRECTNESS',
      durationSeconds: Number(totalDuration),
      totalClicks,
      fuzzCasesCount: adversarialVerificationCases.length + step1Cases.length,
      networkCasesCount: staticChainTests.length + switchSequence.length + 2,
      consoleErrorsCount: 0,
      pageErrorsCount: 0,
      logs,
    };
  } finally {
    log('\n[Teardown] Tearing down browser context and preview server...');
    if (browser) {
      try {
        await browser.close();
        log('[Teardown] Chromium browser terminated cleanly.');
      } catch (e) {
        // Ignore
      }
    }
    if (previewProcess && previewProcess.pid) {
      try {
        killProcessTree(previewProcess.pid);
        log(`[Teardown] Vite preview server (PID: ${previewProcess.pid}) terminated cleanly.`);
      } catch (e) {
        // Ignore
      }
    }
  }
}

if (require.main === module) {
  runAdversarialSmokeTest()
    .then((result) => {
      console.log('\n[ADVERSARIAL VERDICT]: CONFIRM CORRECTNESS');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n[ADVERSARIAL VERDICT]: CHALLENGE_FAILED');
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runAdversarialSmokeTest };
