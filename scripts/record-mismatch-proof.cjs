/**
 * Playwright Automation: Record Live On-Chain Mismatch Proof
 * 
 * Captures:
 * 1. Step 2 Query: Reads live on-chain dataset BOT-SYNTH-002 from Bohr Testnet (0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7)
 * 2. Step 3 Original Match: Verifies original payload against on-chain hash -> MATCH [ON-CHAIN RECORD INTEGRITY VERIFIED]
 * 3. Step 3 Tamper Mismatch: Alters gammaCount 165.2 -> 999.9 -> MISMATCH [PAYLOAD ALTERED]
 * 4. Generates bohr/botchain_mismatch_proof.mp4, bohr/botchain_mismatch_proof.gif, and screenshots.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

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
    throw new Error('Playwright not found');
  }
}

function getChromiumExecutablePath() {
  const customPath = 'C:\\Users\\Zhane\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe';
  if (fs.existsSync(customPath)) {
    return customPath;
  }
  return undefined;
}

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

function killProcessTree(pid) {
  try {
    execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
  } catch (e) {
    // Process may have already exited
  }
}

async function record() {
  console.log('--- Starting Preview Server ---');
  const projectRoot = path.join(__dirname, '..');
  const previewProcess = spawn(
    'npx.cmd',
    ['vite', 'preview', '--port', '4173', '--host', '127.0.0.1'],
    {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
    }
  );

  previewProcess.stdout.on('data', (d) => process.stdout.write(`[preview] ${d}`));
  previewProcess.stderr.on('data', (d) => process.stderr.write(`[preview err] ${d}`));

  const targetUrl = 'http://127.0.0.1:4173';
  await pingUrl(targetUrl);
  console.log(`Preview server running at ${targetUrl}`);

  const tempVideoDir = path.join(__dirname, '..', 'bohr', 'temp-video');
  if (!fs.existsSync(tempVideoDir)) {
    fs.mkdirSync(tempVideoDir, { recursive: true });
  }

  const { chromium } = getPlaywright();
  const chromePath = getChromiumExecutablePath();
  console.log(`Using Chromium executable: ${chromePath || 'default'}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1440, height: 960 },
    },
  });

  // Inject mock Ethereum provider connected to Bohr Testnet (Chain ID 968)
  await context.addInitScript(() => {
    const listeners = {};
    window.ethereum = {
      isMetaMask: true,
      request: async function({ method, params }) {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return ['0x31A826bB9D5F6087d94CDA31945C1234d061b788'];
        }
        if (method === 'eth_chainId') {
          return '0x3c8'; // 968 in hex
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
      },
    };
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Navigate to BOT Chain Pilot
    console.log('Navigating to BOT Chain Pilot panel...');
    const botchainNav = page.locator('button:has-text("BOT Chain Pilot")');
    await botchainNav.click();
    await page.waitForTimeout(1500);

    // Wait for live on-chain check
    console.log('Waiting for live on-chain badge...');
    await page.waitForSelector('text=LIVE ON-CHAIN READY', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Scroll to Step 2 & 3
    console.log('Querying dataset BOT-SYNTH-002 in Step 2...');
    const loadInput = page.locator('input[placeholder="ID (e.g. BOT-SYNTH-001 or 0x...)"]');
    await loadInput.fill('BOT-SYNTH-002');
    await page.waitForTimeout(500);

    const queryBtn = page.locator('button:has-text("Query")');
    await queryBtn.click();

    // Wait for on-chain readback confirmation
    await page.waitForSelector('text=CONFIRMED ON-CHAIN (RPC READBACK)', { timeout: 15000 });
    console.log('Record confirmed on-chain!');
    await page.waitForTimeout(2000);

    // Step 3: Verify Original Payload -> MATCH
    console.log('Verifying original payload...');
    const verifyBtn = page.locator('button:has-text("Verify Against On-Chain Hash")');
    await verifyBtn.click();

    await page.waitForSelector('text=MATCH [ON-CHAIN RECORD INTEGRITY VERIFIED]', { timeout: 10000 });
    console.log('MATCH verified!');
    await page.waitForTimeout(1500);

    // Capture MATCH screenshot
    const matchScreenshotPath = path.join(__dirname, '..', 'bohr', 'evidence_match.png');
    await page.screenshot({ path: matchScreenshotPath, fullPage: false });
    console.log(`Saved screenshot: ${matchScreenshotPath}`);
    await page.waitForTimeout(2500);

    // Step 3: Tamper gammaCount -> MISMATCH
    console.log('Clicking "Simulate Tampered Reading"...');
    const tamperBtn = page.locator('button:has-text("Simulate Tampered Reading")');
    await tamperBtn.click();
    await page.waitForTimeout(1000);

    console.log('Verifying tampered payload...');
    await verifyBtn.click();

    await page.waitForSelector('text=MISMATCH [PAYLOAD ALTERED]', { timeout: 10000 });
    console.log('MISMATCH verified!');
    await page.waitForTimeout(1500);

    // Capture MISMATCH screenshot
    const mismatchScreenshotPath = path.join(__dirname, '..', 'bohr', 'evidence_mismatch.png');
    await page.screenshot({ path: mismatchScreenshotPath, fullPage: false });
    console.log(`Saved screenshot: ${mismatchScreenshotPath}`);
    await page.waitForTimeout(3000);

  } finally {
    console.log('Closing browser to save video...');
    await page.close();
    await context.close();
    await browser.close();

    if (previewProcess.pid) {
      killProcessTree(previewProcess.pid);
    }
  }

  // Find generated video
  const videoFiles = fs.readdirSync(tempVideoDir).filter(f => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    const rawWebm = path.join(tempVideoDir, videoFiles[0]);
    const outputMp4 = path.join(__dirname, '..', 'bohr', 'botchain_mismatch_proof.mp4');
    const outputGif = path.join(__dirname, '..', 'bohr', 'botchain_mismatch_proof.gif');

    console.log(`Processing recording: ${rawWebm}`);

    // Convert to MP4
    console.log(`Encoding MP4 to ${outputMp4}...`);
    execSync(`ffmpeg -y -i "${rawWebm}" -c:v libx264 -pix_fmt yuv420p -r 30 "${outputMp4}"`, { stdio: 'inherit' });

    // Convert to high-quality GIF (scaled width 960)
    console.log(`Encoding GIF to ${outputGif}...`);
    execSync(`ffmpeg -y -i "${rawWebm}" -vf "fps=15,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${outputGif}"`, { stdio: 'inherit' });

    // Clean up temp webm files
    for (const f of videoFiles) {
      fs.unlinkSync(path.join(tempVideoDir, f));
    }
    fs.rmdirSync(tempVideoDir);
    console.log('All media artifacts created successfully!');
  } else {
    console.warn('No webm video recorded.');
  }
}

record().catch((err) => {
  console.error('Recording script failed:', err);
  process.exit(1);
});
