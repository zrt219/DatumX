/**
 * Read-only BOT Chain Mainnet (Chain ID 677) KPI 6 Partner Dataset Readiness & Simulation Script
 *
 * Strictly executes read-only RPC calls (eth_call / eth_estimateGas).
 * Zero transactions are signed or broadcast.
 */

import { createPublicClient, formatEther, http } from 'viem'
import { botChainRegistryAbi } from '../src/lib/abi/botchainRegistryAbi.ts'
import { KPI6_PARTNER_SYNTHETIC_PRESETS } from '../src/lib/botchainPartnerPresets.ts'
import { canonicalJsonStringify, computeSha256Hex } from '../src/lib/canonicalHash.ts'

const REGISTRY_ADDRESS = '0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7' as const
const RPC_URL = 'https://rpc.botchain.ai'
const EXPECTED_CHAIN_ID = 677

async function main() {
  const client = createPublicClient({ transport: http(RPC_URL) })
  const chainId = await client.getChainId()
  if (chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Expected Chain ID ${EXPECTED_CHAIN_ID}, got ${chainId}`)
  }

  const [owner, publicReg, totalRecords, gasPriceWei] = await Promise.all([
    client.readContract({ address: REGISTRY_ADDRESS, abi: botChainRegistryAbi, functionName: 'owner' }),
    client.readContract({
      address: REGISTRY_ADDRESS,
      abi: botChainRegistryAbi,
      functionName: 'publicRegistrationEnabled',
    }),
    client.readContract({ address: REGISTRY_ADDRESS, abi: botChainRegistryAbi, functionName: 'totalRecords' }),
    client.getGasPrice(),
  ])

  console.log('='.repeat(88))
  console.log('DATUMX × BOT CHAIN MAINNET — KPI 6 PARTNER READINESS & SIMULATION (READ-ONLY)')
  console.log('='.repeat(88))
  console.log(`Chain ID: ${chainId} | Contract: ${REGISTRY_ADDRESS}`)
  console.log(`Owner: ${owner} | publicRegistrationEnabled: ${publicReg} | totalRecords: ${totalRecords}`)
  console.log(`Live Gas Price: ${gasPriceWei} wei (${Number(gasPriceWei) / 1e9} gwei)`)
  console.log('')

  for (const preset of KPI6_PARTNER_SYNTHETIC_PRESETS) {
    const datasetIdBytes32 = (await computeSha256Hex(preset.datasetId)) as `0x${string}`
    const canonicalJson = canonicalJsonStringify(preset.payload)
    const datasetHashBytes32 = (await computeSha256Hex(canonicalJson)) as `0x${string}`

    const [isAllowed, balanceWei] = await Promise.all([
      client.readContract({
        address: REGISTRY_ADDRESS,
        abi: botChainRegistryAbi,
        functionName: 'authorizedSubmitters',
        args: [preset.assignedWalletAddress],
      }),
      client.getBalance({ address: preset.assignedWalletAddress }),
    ])

    let alreadyExists = false
    try {
      const existing = await client.readContract({
        address: REGISTRY_ADDRESS,
        abi: botChainRegistryAbi,
        functionName: 'getDataset',
        args: [datasetIdBytes32],
      })
      alreadyExists = Boolean(existing?.exists)
    } catch {
      alreadyExists = false
    }

    if (!isAllowed) {
      throw new Error(`Partner wallet ${preset.assignedWalletAddress} is NOT authorized on-chain`)
    }
    if (alreadyExists) {
      throw new Error(`Dataset ID ${preset.datasetId} (${datasetIdBytes32}) already exists on-chain`)
    }

    await client.simulateContract({
      account: preset.assignedWalletAddress,
      address: REGISTRY_ADDRESS,
      abi: botChainRegistryAbi,
      functionName: 'registerDataset',
      args: [datasetIdBytes32, datasetHashBytes32, preset.version, preset.metadataURI],
    })

    const gasEstimate = await client.estimateContractGas({
      account: preset.assignedWalletAddress,
      address: REGISTRY_ADDRESS,
      abi: botChainRegistryAbi,
      functionName: 'registerDataset',
      args: [datasetIdBytes32, datasetHashBytes32, preset.version, preset.metadataURI],
    })

    const estimatedCostWei = gasEstimate * gasPriceWei

    console.log(`[READY] ${preset.buttonLabel} (${preset.assignedWalletLabel})`)
    console.log(`  Sender:      ${preset.assignedWalletAddress} (Authorized: ${isAllowed}, Balance: ${formatEther(balanceWei)} BOT)`)
    console.log(`  Dataset ID:  ${preset.datasetId}`)
    console.log(`  bytes32 ID:  ${datasetIdBytes32}`)
    console.log(`  SHA-256:     ${datasetHashBytes32}`)
    console.log(`  Version/URI: ${preset.version} | ${preset.metadataURI}`)
    console.log(`  Simulation:  PASS (Unregistered & Revert-Free) | Gas: ${gasEstimate} (~${formatEther(estimatedCostWei)} BOT)`)
    console.log('')
  }

  console.log('ALL 3 SYNTHETIC PARTNER DATASETS SIMULATED SUCCESSFULLY WITH ZERO BROADCASTS.')
}

main().catch((err) => {
  console.error('KPI 6 readiness simulation failed:', err)
  process.exit(1)
})
