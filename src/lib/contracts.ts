import { isAddress } from 'viem'
import { datasetRegistryAbi, projectRegistryAbi, projectRouterAbi, validationModuleAbi } from './abi/drillproofAbi'
import { DEPLOYED_CONTRACTS, NETWORK_NAME } from './web3Config'

function resolveContractAddress(value: string) {
  return isAddress(value) ? (value as `0x${string}`) : undefined
}

export const drillProofContracts = {
  projectRegistry: {
    address: resolveContractAddress(DEPLOYED_CONTRACTS.projectRegistry),
    abi: projectRegistryAbi,
  },
  datasetRegistry: {
    address: resolveContractAddress(DEPLOYED_CONTRACTS.datasetRegistry),
    abi: datasetRegistryAbi,
  },
  projectRouter: {
    address: resolveContractAddress(DEPLOYED_CONTRACTS.projectRouter),
    abi: projectRouterAbi,
  },
  validationModule: {
    address: resolveContractAddress(DEPLOYED_CONTRACTS.validationModule),
    abi: validationModuleAbi,
  },
} as const

export function hasLiveProtocolConfig() {
  return Boolean(
    drillProofContracts.projectRegistry.address &&
      drillProofContracts.datasetRegistry.address &&
      drillProofContracts.projectRouter.address &&
      drillProofContracts.validationModule.address,
  )
}

export const liveCompatibilityNotice = hasLiveProtocolConfig()
  ? `Live ${NETWORK_NAME} contract routing is configured. Wallet writes and contract reads target the canonical DatumX V5 deployment.`
  : `No live DatumX deployment manifest is configured for ${NETWORK_NAME}. Wallet and network handling remain available while contract mode stays disabled.`
