import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BotChainPilotPanel } from '../components/botchain/BotChainPilotPanel'
import type { WalletState } from '../types'
import {
  checkBotchainRegistryLiveStatus,
  readBotchainDataset,
  verifyBotchainDatasetHash,
  submitBotchainDataset,
  prepareRegisterBotchainDataset,
  fetchAllBotchainDatasets,
  checkSubmitterPermissions,
  prepareSetAuthorizedSubmitter,
  executeSetAuthorizedSubmitter,
} from '../lib/botchainClient'
import { switchToBotChainMainnet } from '../lib/network'
import { canonicalJsonStringify, computeSha256Hex } from '../lib/canonicalHash'

// Mock botchainClient and network modules cleanly and deterministically
vi.mock('../lib/botchainClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/botchainClient')>()
  return {
    ...actual,
    checkBotchainRegistryLiveStatus: vi.fn(),
    readBotchainDataset: vi.fn(),
    verifyBotchainDatasetHash: vi.fn(),
    submitBotchainDataset: vi.fn(),
    prepareRegisterBotchainDataset: vi.fn(),
    fetchAllBotchainDatasets: vi.fn(),
    checkSubmitterPermissions: vi.fn(),
    prepareSetAuthorizedSubmitter: vi.fn(),
    executeSetAuthorizedSubmitter: vi.fn(),
  }
})

vi.mock('../lib/network', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/network')>()
  return {
    ...actual,
    switchToBotChainMainnet: vi.fn(),
    getEthereumProvider: vi.fn(() => window.ethereum),
  }
})

describe('BotChainPilotPanel', () => {
  const onRefreshWalletMock = vi.fn(async () => {})
  const writeTextMock = vi.fn().mockResolvedValue(undefined)

  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: writeTextMock,
    },
    configurable: true,
    writable: true,
  })

  const mockEthereum = {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  }

  const defaultConnectedWallet: WalletState = {
    account: '0x31A826bB9D5F6087d94CDA31945C1234d061b788',
    chainId: 677,
    chainName: 'BOT Chain Mainnet',
    isConnected: true,
    isCorrectNetwork: true,
    isMetaMaskAvailable: true,
    isBusy: false,
  }

  const wrongChainWallet: WalletState = {
    account: '0x31A826bB9D5F6087d94CDA31945C1234d061b788',
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    isConnected: true,
    isCorrectNetwork: false,
    isMetaMaskAvailable: true,
    isBusy: false,
  }

  const disconnectedWallet: WalletState = {
    account: undefined,
    chainId: undefined,
    chainName: undefined,
    isConnected: false,
    isCorrectNetwork: false,
    isMetaMaskAvailable: true,
    isBusy: false,
  }

  const mockRecentRecords = [
    {
      datasetId: '0x444154554d582d424f542d4c4956452d30303100000000000000000000000000' as `0x${string}`,
      datasetHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
      version: '1.0.0',
      metadataURI: 'https://datumx.vercel.app/metadata/bot-live-001.json',
      submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
      timestamp: 1792736400,
      exists: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    writeTextMock.mockClear()
    mockEthereum.request.mockReset()

    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      configurable: true,
      writable: true,
    })

    // Default mock setup: registry is live on Chain 677
    vi.mocked(checkBotchainRegistryLiveStatus).mockResolvedValue({
      status: 'LIVE_VERIFIED',
      address: '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7',
    })

    vi.mocked(fetchAllBotchainDatasets).mockResolvedValue(mockRecentRecords)

    vi.mocked(checkSubmitterPermissions).mockImplementation(async (address) => {
      const addr = address.toLowerCase()
      const ownerAddress = '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as const
      if (addr === '0x31a826bb9d5f6087d94cda31945c1234d061b788') {
        return {
          address: '0x31A826bB9D5F6087d94CDA31945C1234d061b788',
          owner: ownerAddress,
          balanceWei: 973722540000000000n,
          balanceFormatted: '0.97372',
          isOwner: true,
          isAuthorizedSubmitter: true,
          publicRegistrationEnabled: false,
          canRegister: true,
        }
      }
      if (addr === '0xf226c920957bd4b648eaf1a8d1f859057ec605a4') {
        return {
          address: '0xF226C920957BD4B648EaF1A8d1f859057Ec605a4',
          owner: ownerAddress,
          balanceWei: 30374540000000000n,
          balanceFormatted: '0.03037',
          isOwner: false,
          isAuthorizedSubmitter: true,
          publicRegistrationEnabled: false,
          canRegister: true,
        }
      }
      if (addr === '0xe75d3c3c109c06bcfb833b4a9bb7c2fe87597af2') {
        return {
          address: '0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2',
          owner: ownerAddress,
          balanceWei: 32508880000000000n,
          balanceFormatted: '0.03251',
          isOwner: false,
          isAuthorizedSubmitter: true,
          publicRegistrationEnabled: false,
          canRegister: true,
        }
      }
      return {
        address: address as `0x${string}`,
        owner: ownerAddress,
        balanceWei: 0n,
        balanceFormatted: '0.0',
        isOwner: false,
        isAuthorizedSubmitter: false,
        publicRegistrationEnabled: false,
        canRegister: false,
      }
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'ethereum')
  })

  // =========================================================================
  // Suite 1: Header, Network Status, & Switching
  // =========================================================================
  describe('Suite 1: Header, Network Status, & Switching', () => {
    it('1. renders panel title and default network details', async () => {
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      expect(screen.getByText(/BOT CHAIN MAINNET — CHAIN ID 677/i)).toBeInTheDocument()
      expect(screen.getByText('rpc.botchain.ai')).toBeInTheDocument()
      const scanLink = screen.getByRole('link', { name: /^scan\.botchain\.ai$/i })
      expect(scanLink).toHaveAttribute('href', 'https://scan.botchain.ai')
    })

    it('2. displays "LIVE ON-CHAIN READY" when registry is live', async () => {
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      expect(await screen.findByText('LIVE ON-CHAIN READY')).toBeInTheDocument()
      expect(screen.getByText(/BOT Chain Mainnet Registry Contract Active/i)).toBeInTheDocument()
      expect(screen.getByText('0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7')).toBeInTheDocument()
    })

    it('3. displays "MAINNET DEPLOYMENT PENDING" when registry is checking or not live', async () => {
      vi.mocked(checkBotchainRegistryLiveStatus).mockResolvedValueOnce({
        status: 'NOT_DEPLOYED',
        address: '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7',
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      expect(await screen.findByText(/MAINNET DEPLOYMENT PENDING/i)).toBeInTheDocument()
      expect(screen.getByText(/MAINNET DEPLOYMENT PENDING — AWAITING BROADCAST AUTHORIZATION/i)).toBeInTheDocument()
    })

    it('4. displays "Switch to BOT Chain Mainnet (677)" button when wallet is on wrong chain', () => {
      render(<BotChainPilotPanel wallet={wrongChainWallet} onRefreshWallet={onRefreshWalletMock} />)

      expect(screen.getByRole('button', { name: 'Switch to BOT Chain Mainnet (677)' })).toBeInTheDocument()
    })

    it('5. calls switchToBotChainMainnet and onRefreshWallet when switch network button clicked', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={wrongChainWallet} onRefreshWallet={onRefreshWalletMock} />)

      const switchBtn = screen.getByRole('button', { name: 'Switch to BOT Chain Mainnet (677)' })
      await user.click(switchBtn)

      expect(switchToBotChainMainnet).toHaveBeenCalledWith(mockEthereum)
      expect(onRefreshWalletMock).toHaveBeenCalled()
    })

    it('6. displays "Connected to 677" badge with checkmark when wallet is on Chain 677', () => {
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      expect(screen.queryByRole('button', { name: 'Switch to BOT Chain Mainnet (677)' })).not.toBeInTheDocument()
      expect(screen.getByText(/Connected to 677/i)).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Suite 2: Partner Presets & Field Inputs (Step 1)
  // =========================================================================
  describe('Suite 2: Partner Presets & Field Inputs (Step 1)', () => {
    it('7. renders all 3 partner preset buttons', () => {
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      expect(screen.getByRole('button', { name: 'W1 Tx 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'W1 Tx 2' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'W2 Tx 1' })).toBeInTheDocument()
    })

    it('8. clicking "W1 Tx 1" loads Leon Wallet 1 preset data', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      await user.click(screen.getByRole('button', { name: 'W1 Tx 1' }))

      expect(screen.getByDisplayValue('BOT-SYNTH-PILOT-W1-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://datumx.vercel.app/metadata/bot-synth-pilot-w1-001.json')).toBeInTheDocument()
      expect(await screen.findByText(/Loaded synthetic preset BOT-SYNTH-PILOT-W1-001 \(intended signer: Leon Wallet 1 0xF226\.\.\.05a4\)/i)).toBeInTheDocument()
      // Canonical SHA-256 for W1-001
      expect(screen.getByText(/0xea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5/i)).toBeInTheDocument()
    })

    it('9. clicking "W1 Tx 2" loads Leon Wallet 1 secondary preset', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      await user.click(screen.getByRole('button', { name: 'W1 Tx 2' }))

      expect(screen.getByDisplayValue('BOT-SYNTH-PILOT-W1-002')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://datumx.vercel.app/metadata/bot-synth-pilot-w1-002.json')).toBeInTheDocument()
      expect(await screen.findByText(/Loaded synthetic preset BOT-SYNTH-PILOT-W1-002 \(intended signer: Leon Wallet 1 0xF226\.\.\.05a4\)/i)).toBeInTheDocument()
      // Canonical SHA-256 for W1-002
      expect(screen.getByText(/0xff2a0d3d505bfff72ca8bc22636ca1fe82d109768b7c2f321b08acc2b50158f1/i)).toBeInTheDocument()
    })

    it('10. clicking "W2 Tx 1" loads Leon Wallet 2 preset', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      await user.click(screen.getByRole('button', { name: 'W2 Tx 1' }))

      expect(screen.getByDisplayValue('BOT-SYNTH-PILOT-W2-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://datumx.vercel.app/metadata/bot-synth-pilot-w2-001.json')).toBeInTheDocument()
      expect(await screen.findByText(/Loaded synthetic preset BOT-SYNTH-PILOT-W2-001 \(intended signer: Leon Wallet 2 0xe75d\.\.\.7Af2\)/i)).toBeInTheDocument()
      // Canonical SHA-256 for W2-001
      expect(screen.getByText(/0xeb0fa956cb31251a458783b95d73d5a45124f600032eccebbaa4ca27c045439d/i)).toBeInTheDocument()
    })

    it('11. clicking "New Unique ID" resets dataset ID to fresh timestamped identifier', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      // First load preset
      await user.click(screen.getByRole('button', { name: 'W1 Tx 1' }))
      expect(screen.getByDisplayValue('BOT-SYNTH-PILOT-W1-001')).toBeInTheDocument()

      // Click New Unique ID
      await user.click(screen.getByRole('button', { name: 'New Unique ID' }))
      expect(screen.getByDisplayValue(/^BOT-REVIEW-\d+/)).toBeInTheDocument()
    })

    it('12. allows editing Dataset Identifier, Version, and Metadata URI manually', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const idInput = screen.getByDisplayValue(/^BOT-REVIEW-\d+/)
      await user.clear(idInput)
      await user.type(idInput, 'CUSTOM-PILOT-999')
      expect(screen.getByDisplayValue('CUSTOM-PILOT-999')).toBeInTheDocument()

      const versionInput = screen.getByDisplayValue('1.0.0')
      await user.clear(versionInput)
      await user.type(versionInput, '2.5.0')
      expect(screen.getByDisplayValue('2.5.0')).toBeInTheDocument()

      const uriInput = screen.getByDisplayValue('https://datumx.vercel.app/metadata/bot-synth-002.json')
      await user.clear(uriInput)
      await user.type(uriInput, 'https://datumx.vercel.app/metadata/custom-001.json')
      expect(screen.getByDisplayValue('https://datumx.vercel.app/metadata/custom-001.json')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Suite 3: Canonical Hashing & Simulation (Fee Preview)
  // =========================================================================
  describe('Suite 3: Canonical Hashing & Simulation (Fee Preview)', () => {
    it('13. "Canonicalize & Hash" button recalculates SHA-256 for edited payload', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      // Modify payload
      const textareas = screen.getAllByRole('textbox')
      const payloadArea = textareas[3] // Step 1 payload textarea
      const customPayload = { testItem: 'DatumX-Custom-Payload', value: 42 }
      fireEvent.change(payloadArea, { target: { value: JSON.stringify(customPayload) } })

      await user.click(screen.getByRole('button', { name: 'Canonicalize & Hash' }))

      const expectedCanonical = canonicalJsonStringify(customPayload)
      const expectedHash = await computeSha256Hex(expectedCanonical)

      expect(await screen.findByText(new RegExp(expectedHash, 'i'))).toBeInTheDocument()
    })

    it('14. "Canonicalize & Hash" displays error on invalid JSON syntax', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const textareas = screen.getAllByRole('textbox')
      const payloadArea = textareas[3]
      fireEvent.change(payloadArea, { target: { value: '{ badJson: true,' } })

      await user.click(screen.getByRole('button', { name: 'Canonicalize & Hash' }))

      expect(await screen.findByText('Invalid JSON syntax in raw dataset payload.')).toBeInTheDocument()
    })

    it('15. "Simulate & Preview Fee" button renders only when contract is LIVE_READY', async () => {
      vi.mocked(checkBotchainRegistryLiveStatus).mockResolvedValueOnce({
        status: 'NOT_DEPLOYED',
        address: '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7',
      })

      const { unmount } = render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      // When NOT_DEPLOYED, simulate button should not exist
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Simulate & Preview Fee' })).not.toBeInTheDocument()
      })

      unmount()

      // When LIVE_VERIFIED on a fresh mount
      vi.mocked(checkBotchainRegistryLiveStatus).mockResolvedValueOnce({
        status: 'LIVE_VERIFIED',
        address: '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7',
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      expect(await screen.findByRole('button', { name: 'Simulate & Preview Fee' })).toBeInTheDocument()
    })

    it('16. "Simulate & Preview Fee" errors if no wallet is connected', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={disconnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const simBtn = await screen.findByRole('button', { name: 'Simulate & Preview Fee' })
      await user.click(simBtn)

      expect(
        await screen.findByText(/Connect an authorized wallet on BOT Chain Mainnet \(Chain ID 677\) to simulate registration\./i),
      ).toBeInTheDocument()
    })

    it('17. "Simulate & Preview Fee" displays simulation card with gas and cost estimates', async () => {
      const user = userEvent.setup()
      vi.mocked(prepareRegisterBotchainDataset).mockResolvedValueOnce({
        registryAddress: '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7',
        senderAddress: '0x31A826bB9D5F6087d94CDA31945C1234d061b788',
        datasetId: '0xa560973520c0548ad1ca86c3cabc3b4e94f730ba00ceadaa534e75eb745f19ff',
        datasetHash: '0xea0dcdd1105a83a9ffb80af7c14c5311baa8c6398cc82c52b44543a1ffb48df5',
        version: '1.0.0',
        metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-pilot-w1-001.json',
        gasEstimate: 220497n,
        gasPriceWei: 20000000000n,
        estimatedCostWei: 4409940000000000n,
        estimatedCostBot: '0.00441',
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const simBtn = await screen.findByRole('button', { name: 'Simulate & Preview Fee' })
      await user.click(simBtn)

      expect(await screen.findByText('Simulation Passed — Partner MetaMask Approval Gate')).toBeInTheDocument()
      expect(screen.getByText(/220497 gas \(~0\.00441 BOT\)/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Confirm & Sign in MetaMask' })).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Suite 4: Dataset Registration (Simulation vs Live On-Chain)
  // =========================================================================
  describe('Suite 4: Dataset Registration (Simulation vs Live On-Chain)', () => {
    it('18. stages record in local simulation mode when registry is not live', async () => {
      const user = userEvent.setup()
      vi.mocked(checkBotchainRegistryLiveStatus).mockResolvedValueOnce({
        status: 'NOT_DEPLOYED',
        address: '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7',
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const stageBtn = await screen.findByRole('button', { name: 'Stage Simulation (Mainnet)' })
      await user.click(stageBtn)

      // Step 2 should display staged record
      expect(await screen.findByText('LOCAL SIMULATION — NO ON-CHAIN TRANSACTION')).toBeInTheDocument()
      expect(screen.getByText(/MAINNET BROADCAST GATE: BotChainDatasetRegistry has not yet been broadcast to BOT Chain Mainnet\./i)).toBeInTheDocument()
      expect(screen.getByText(/Local simulation only\. No on-chain transaction hash or block explorer record exists\./i)).toBeInTheDocument()
    })

    it('19. submits live on-chain registration when registry is live and wallet is connected', async () => {
      const user = userEvent.setup()
      const mockTxHash = '0xabc1234567890abcdef1234567890abcdef1234567890abcdef12345678901234' as `0x${string}`

      vi.mocked(submitBotchainDataset).mockResolvedValueOnce(mockTxHash)
      vi.mocked(readBotchainDataset).mockImplementationOnce(async (id) => {
        // Compute current default payload hash
        const defaultPayload = {
          benchmarkId: 'BOT-SYNTH-BENCHMARK-002',
          projectName: 'Bohr Clean Energy Sensor Grid',
          samples: [
            { depth: 15.0, gammaCount: 165.2, status: 'validated' },
            { depth: 30.0, gammaCount: 210.5, status: 'validated' },
            { depth: 45.0, gammaCount: 345.8, status: 'anomalous_high' },
          ],
          timestamp: 1792736400,
        }
        const hash = await computeSha256Hex(canonicalJsonStringify(defaultPayload))
        return {
          datasetId: id,
          datasetHash: hash,
          version: '1.0.0',
          metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-002.json',
          submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
          timestamp: 1792736400n,
          exists: true,
        }
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const submitBtn = await screen.findByRole('button', { name: 'Submit On-Chain' })
      await user.click(submitBtn)

      expect(submitBotchainDataset).toHaveBeenCalled()
      expect(await screen.findByText('CONFIRMED ON-CHAIN (RPC READBACK)')).toBeInTheDocument()
      expect(screen.getByText(new RegExp(`Transaction confirmed on BOT Chain Mainnet! Tx: ${mockTxHash}`, 'i'))).toBeInTheDocument()
    })

    it('20. catches on-chain stored hash mismatch', async () => {
      const user = userEvent.setup()
      vi.mocked(submitBotchainDataset).mockResolvedValueOnce('0xabc12345' as `0x${string}`)
      vi.mocked(readBotchainDataset).mockResolvedValueOnce({
        datasetId: '0xcac633c1802ce94471ea68adade887139bee186336f6df5d92db29c814f95c0d' as `0x${string}`,
        datasetHash: '0x9999999999999999999999999999999999999999999999999999999999999999' as `0x${string}`,
        version: '1.0.0',
        metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-002.json',
        submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
        timestamp: 1792736400n,
        exists: true,
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const submitBtn = await screen.findByRole('button', { name: 'Submit On-Chain' })
      await user.click(submitBtn)

      expect(await screen.findByText(/Verification failed: On-chain stored hash/i)).toBeInTheDocument()
    })

    it('21. catches duplicate dataset ID rejection during registration', async () => {
      const user = userEvent.setup()
      vi.mocked(submitBotchainDataset).mockRejectedValueOnce(
        new Error('Duplicate dataset ID: record already registered on-chain'),
      )

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const submitBtn = await screen.findByRole('button', { name: 'Submit On-Chain' })
      await user.click(submitBtn)

      expect(await screen.findByText('Duplicate dataset ID: record already registered on-chain')).toBeInTheDocument()
    })

    it('22. catches unauthorized submitter rejection', async () => {
      const user = userEvent.setup()
      vi.mocked(submitBotchainDataset).mockRejectedValueOnce(
        new Error('Submitting wallet lacks permission to register datasets'),
      )

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const submitBtn = await screen.findByRole('button', { name: 'Submit On-Chain' })
      await user.click(submitBtn)

      expect(await screen.findByText('Submitting wallet lacks permission to register datasets')).toBeInTheDocument()
    })

    it('23. catches incorrect network rejection if wallet chain does not match 677', async () => {
      const user = userEvent.setup()
      const walletOn968: WalletState = {
        ...defaultConnectedWallet,
        chainId: 968,
        isCorrectNetwork: false,
      }

      render(<BotChainPilotPanel wallet={walletOn968} onRefreshWallet={onRefreshWalletMock} />)

      const submitBtn = await screen.findByRole('button', { name: 'Submit On-Chain' })
      await user.click(submitBtn)

      expect(
        await screen.findByText(/Connected wallet must be on BOT Chain Mainnet \(Chain ID 677\)\. Currently on chain ID 968\./i),
      ).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Suite 5: Step 2 Record Readback & Explorer Query
  // =========================================================================
  describe('Suite 5: Step 2 Record Readback & Explorer Query', () => {
    it('24. displays empty state message when no record is loaded', () => {
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      expect(screen.getByText('No record loaded or registered yet.')).toBeInTheDocument()
      expect(screen.getByText('Submit in Step 1 or query an ID above to inspect state.')).toBeInTheDocument()
    })

    it('25. displays loaded on-chain record details', async () => {
      const user = userEvent.setup()
      vi.mocked(readBotchainDataset).mockResolvedValueOnce({
        datasetId: '0xcac633c1802ce94471ea68adade887139bee186336f6df5d92db29c814f95c0d' as `0x${string}`,
        datasetHash: '0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000' as `0x${string}`,
        version: '1.2.3',
        metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-002.json',
        submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
        timestamp: 1792736400n,
        exists: true,
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const queryInput = screen.getByPlaceholderText('ID (e.g. BOT-SYNTH-001 or 0x...)')
      await user.type(queryInput, 'BOT-SYNTH-002')
      await user.click(screen.getByRole('button', { name: 'Query' }))

      expect(await screen.findByText('CONFIRMED ON-CHAIN (RPC READBACK)')).toBeInTheDocument()
      expect(screen.getByText('0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000')).toBeInTheDocument()
      expect(screen.getByText('1.2.3')).toBeInTheDocument()
      expect(screen.getByText('0x31A826bB9D5F6087d94CDA31945C1234d061b788')).toBeInTheDocument()
    })

    it('26. displays transaction link and "Copy URL" button for on-chain records', async () => {
      const user = userEvent.setup()
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')
      const mockTxHash = '0xabc1234567890abcdef1234567890abcdef1234567890abcdef12345678901234' as `0x${string}`

      vi.mocked(submitBotchainDataset).mockResolvedValueOnce(mockTxHash)
      vi.mocked(readBotchainDataset).mockImplementationOnce(async (id) => {
        const defaultPayload = {
          benchmarkId: 'BOT-SYNTH-BENCHMARK-002',
          projectName: 'Bohr Clean Energy Sensor Grid',
          samples: [
            { depth: 15.0, gammaCount: 165.2, status: 'validated' },
            { depth: 30.0, gammaCount: 210.5, status: 'validated' },
            { depth: 45.0, gammaCount: 345.8, status: 'anomalous_high' },
          ],
          timestamp: 1792736400,
        }
        const hash = await computeSha256Hex(canonicalJsonStringify(defaultPayload))
        return {
          datasetId: id,
          datasetHash: hash,
          version: '1.0.0',
          metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-002.json',
          submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
          timestamp: 1792736400n,
          exists: true,
        }
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const submitBtn = await screen.findByRole('button', { name: 'Submit On-Chain' })
      await user.click(submitBtn)

      expect(await screen.findByText('CONFIRMED ON-CHAIN (RPC READBACK)')).toBeInTheDocument()
      const txLink = screen.getByRole('link', { name: /0xabc12345\.\.\.901234/i })
      expect(txLink).toHaveAttribute('href', `https://scan.botchain.ai/tx/${mockTxHash}`)

      const copyBtn = screen.getByRole('button', { name: /Copy URL/i })
      await user.click(copyBtn)

      expect(writeTextSpy).toHaveBeenCalledWith(`https://scan.botchain.ai/tx/${mockTxHash}`)
      expect(await screen.findByText('Copied')).toBeInTheDocument()
    })

    it('27. "Query" input loads on-chain record by ID via readBotchainDataset', async () => {
      const user = userEvent.setup()
      vi.mocked(readBotchainDataset).mockResolvedValueOnce({
        datasetId: '0xcac633c1802ce94471ea68adade887139bee186336f6df5d92db29c814f95c0d' as `0x${string}`,
        datasetHash: '0x3333444455556666777788889999000011112222333344445555666677778888' as `0x${string}`,
        version: '1.0.0',
        metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-002.json',
        submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
        timestamp: 1792736400n,
        exists: true,
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const queryInput = screen.getByPlaceholderText('ID (e.g. BOT-SYNTH-001 or 0x...)')
      await user.type(queryInput, 'BOT-SYNTH-002')
      await user.click(screen.getByRole('button', { name: 'Query' }))

      expect(readBotchainDataset).toHaveBeenCalled()
      expect(await screen.findByText('CONFIRMED ON-CHAIN (RPC READBACK)')).toBeInTheDocument()
      expect(screen.getByText('Successfully loaded dataset record from BOT Chain Mainnet for ID: BOT-SYNTH-002')).toBeInTheDocument()
    })

    it('28. "Query" shows error when queried ID is not found on-chain', async () => {
      const user = userEvent.setup()
      vi.mocked(readBotchainDataset).mockResolvedValueOnce({
        datasetId: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
        datasetHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
        version: '',
        metadataURI: '',
        submitter: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        timestamp: 0n,
        exists: false,
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const queryInput = screen.getByPlaceholderText('ID (e.g. BOT-SYNTH-001 or 0x...)')
      await user.type(queryInput, 'NONEXISTENT-DATASET')
      await user.click(screen.getByRole('button', { name: 'Query' }))

      expect(
        await screen.findByText('Dataset ID NONEXISTENT-DATASET was not found on BOT Chain Mainnet registry.'),
      ).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Suite 6: Step 3 Cryptographic Integrity Verification & Tampering Proofs
  // =========================================================================
  describe('Suite 6: Step 3 Cryptographic Integrity Verification & Tampering Proofs', () => {
    it('29. disables Verify button before any record is staged or registered', async () => {
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      const verifyBtn = screen.getByRole('button', { name: /Verify Against Staged Simulation Hash|Verify On-Chain/i })
      expect(verifyBtn).toBeDisabled()

      fireEvent.click(verifyBtn)
      expect(verifyBotchainDatasetHash).not.toHaveBeenCalled()
    })

    it('30. verifies authentic payload produces MATCH [ON-CHAIN SMART CONTRACT VERIFIED]', async () => {
      const user = userEvent.setup()
      vi.mocked(readBotchainDataset).mockResolvedValueOnce({
        datasetId: '0xcac633c1802ce94471ea68adade887139bee186336f6df5d92db29c814f95c0d' as `0x${string}`,
        datasetHash: '0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000' as `0x${string}`,
        version: '1.0.0',
        metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-002.json',
        submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
        timestamp: 1792736400n,
        exists: true,
      })
      vi.mocked(verifyBotchainDatasetHash).mockResolvedValueOnce(true)

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      // Query record to load it into Step 2 and Step 3
      const queryInput = screen.getByPlaceholderText('ID (e.g. BOT-SYNTH-001 or 0x...)')
      await user.type(queryInput, 'BOT-SYNTH-002')
      await user.click(screen.getByRole('button', { name: 'Query' }))
      expect(await screen.findByText('CONFIRMED ON-CHAIN (RPC READBACK)')).toBeInTheDocument()

      const verifyBtn = screen.getByRole('button', { name: 'Verify On-Chain (verifyDatasetHash)' })
      await user.click(verifyBtn)

      expect(verifyBotchainDatasetHash).toHaveBeenCalled()
      expect(await screen.findByText('MATCH [ON-CHAIN SMART CONTRACT VERIFIED]')).toBeInTheDocument()
      expect(screen.getByText(/On-chain verifyDatasetHash\(\) returned true for recomputed SHA-256 digest/i)).toBeInTheDocument()
    })

    it('31. "Simulate Tampered Reading" alters sensor readings in verification textarea', async () => {
      const user = userEvent.setup()
      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      await user.click(screen.getByRole('button', { name: 'Simulate Tampered Reading' }))

      expect(await screen.findByText(/Altered payload sensor reading \(gammaCount: 999\.9\) to simulate data corruption\./i)).toBeInTheDocument()
      const textareas = screen.getAllByRole('textbox')
      const verificationArea = textareas[5] as HTMLTextAreaElement // Step 3 verification textarea (index 4 is Step 2 query ID input)
      expect(verificationArea.value).toContain('999.9')
    })

    it('32. verifies altered payload produces MISMATCH [PAYLOAD ALTERED] with cryptographic proof', async () => {
      const user = userEvent.setup()
      vi.mocked(readBotchainDataset).mockResolvedValueOnce({
        datasetId: '0xcac633c1802ce94471ea68adade887139bee186336f6df5d92db29c814f95c0d' as `0x${string}`,
        datasetHash: '0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000' as `0x${string}`,
        version: '1.0.0',
        metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-002.json',
        submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
        timestamp: 1792736400n,
        exists: true,
      })
      vi.mocked(verifyBotchainDatasetHash).mockResolvedValueOnce(false)

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      // Query record into Step 2
      const queryInput = screen.getByPlaceholderText('ID (e.g. BOT-SYNTH-001 or 0x...)')
      await user.type(queryInput, 'BOT-SYNTH-002')
      await user.click(screen.getByRole('button', { name: 'Query' }))
      expect(await screen.findByText('CONFIRMED ON-CHAIN (RPC READBACK)')).toBeInTheDocument()

      // Tamper payload in Step 3
      await user.click(screen.getByRole('button', { name: 'Simulate Tampered Reading' }))

      const verifyBtn = screen.getByRole('button', { name: 'Verify On-Chain (verifyDatasetHash)' })
      await user.click(verifyBtn)

      expect(verifyBotchainDatasetHash).toHaveBeenCalled()
      expect(await screen.findByText(/MISMATCH \[PAYLOAD ALTERED\]/i)).toBeInTheDocument()
      expect(screen.getByText(/On-chain verifyDatasetHash\(\) returned false: altered payload rejected by smart contract/i)).toBeInTheDocument()
      expect(screen.getByText('Stored on-chain:')).toBeInTheDocument()
      expect(screen.getByText('Altered payload:')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Suite 7: Subtab Navigation, Explorer, & Owner Allowlist
  // =========================================================================
  describe('Suite 7: Subtab Navigation, Explorer, & Owner Allowlist', () => {
    it('33. navigates to "In-App Contract Explorer" and queries RPC state directly', async () => {
      const user = userEvent.setup()
      vi.mocked(readBotchainDataset).mockResolvedValueOnce({
        datasetId: '0xcac633c1802ce94471ea68adade887139bee186336f6df5d92db29c814f95c0d' as `0x${string}`,
        datasetHash: '0x4444555566667777888899990000111122223333444455556666777788889999' as `0x${string}`,
        version: '1.0.0',
        metadataURI: 'https://datumx.vercel.app/metadata/bot-synth-002.json',
        submitter: '0x31A826bB9D5F6087d94CDA31945C1234d061b788' as `0x${string}`,
        timestamp: 1792736400n,
        exists: true,
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      // Switch subtab to Explorer
      await user.click(screen.getByRole('button', { name: /In-App Contract Explorer/i }))

      expect(screen.getByText('Contract Overview')).toBeInTheDocument()
      expect(screen.getByText('BotChainDatasetRegistry')).toBeInTheDocument()
      expect(screen.getAllByText('0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7').length).toBeGreaterThanOrEqual(2)

      // Query Direct On-Chain State Reader
      const explorerInput = screen.getByPlaceholderText('Enter dataset ID string or 0x bytes32 hash...')
      await user.type(explorerInput, 'BOT-SYNTH-002')
      await user.click(screen.getByRole('button', { name: /Query RPC/i }))

      expect(await screen.findByText(/Record Found in BOT Chain Mainnet State/i)).toBeInTheDocument()
      expect(screen.getByText('0x4444555566667777888899990000111122223333444455556666777788889999')).toBeInTheDocument()
    })

    it('34. navigates to "Owner Allowlist" and displays partner wallet statuses', async () => {
      const user = userEvent.setup()
      vi.mocked(prepareSetAuthorizedSubmitter).mockResolvedValueOnce({
        registryAddress: '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7',
        ownerAddress: '0x31A826bB9D5F6087d94CDA31945C1234d061b788',
        submitterAddress: '0x1111111111111111111111111111111111111111',
        authorized: true,
        alreadyInTargetState: false,
        gasEstimate: 45000n,
        gasPriceWei: 20000000000n,
        estimatedCostWei: 900000000000000n,
        estimatedCostBot: '0.0009',
      })

      vi.mocked(executeSetAuthorizedSubmitter).mockResolvedValueOnce({
        txHash: '0xauth1234567890abcdef1234567890abcdef1234567890abcdef12345678901234',
        blockNumber: 29743054n,
        registryAddress: '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7',
        ownerAddress: '0x31A826bB9D5F6087d94CDA31945C1234d061b788',
        submitterAddress: '0x1111111111111111111111111111111111111111',
        authorized: true,
        receiptStatus: 'success',
      })

      render(<BotChainPilotPanel wallet={defaultConnectedWallet} onRefreshWallet={onRefreshWalletMock} />)

      // Switch to Allowlist subtab
      await user.click(screen.getByRole('button', { name: /Owner Allowlist/i }))

      expect(screen.getByText('Partner Wallet Allowlist Status (Chain ID 677)')).toBeInTheDocument()
      expect(screen.getByText('Leon Wallet 1')).toBeInTheDocument()
      expect(screen.getByText('Leon Wallet 2')).toBeInTheDocument()
      expect(screen.getByText('0xF226C920957BD4B648EaF1A8d1f859057Ec605a4')).toBeInTheDocument()
      expect(screen.getByText('0xe75d3c3c109C06bCFb833b4a9BB7c2FE87597Af2')).toBeInTheDocument()

      // Allowlist status badges
      const authorizedBadges = await screen.findAllByText('AUTHORIZED ON MAINNET')
      expect(authorizedBadges.length).toBeGreaterThanOrEqual(2)

      // Test Owner Authorization Form for a new wallet
      const targetInput = screen.getByPlaceholderText('0x...')
      await user.clear(targetInput)
      await user.type(targetInput, '0x1111111111111111111111111111111111111111')

      await user.click(screen.getByRole('button', { name: /Simulate & Estimate/i }))

      expect(await screen.findByText('Pre-Broadcast Simulation Passed — Review Before Confirming in MetaMask')).toBeInTheDocument()
      expect(screen.getByText('Estimated Gas: 45000 units')).toBeInTheDocument()

      const authBtn = screen.getByRole('button', { name: 'Authorize in MetaMask' })
      await user.click(authBtn)

      expect(executeSetAuthorizedSubmitter).toHaveBeenCalled()
      expect(await screen.findByText('On-Chain Authorization Confirmed')).toBeInTheDocument()
      expect(screen.getAllByText(/0xauth1234567890/i).length).toBeGreaterThanOrEqual(1)
      expect(onRefreshWalletMock).toHaveBeenCalled()
    })
  })
})
