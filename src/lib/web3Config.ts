import deploymentManifest from '../../deployments/xrpl-testnet.json'

export const XRPL_EVM_TESTNET = {
  chainId: deploymentManifest.chainId,
  chainIdHex: '0x161b28',
  name: deploymentManifest.networkName,
  rpcUrl: deploymentManifest.rpcUrl,
  nativeCurrency: {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 18,
  },
  blockExplorerUrl: deploymentManifest.explorerUrl,
}

export const DEPLOYMENT_MANIFEST = deploymentManifest
export const DEPLOYED_CONTRACTS = {
  drillProofAccess: deploymentManifest.contracts.DrillProofAccess,
  projectRegistry: deploymentManifest.contracts.ProjectRegistry,
  datasetRegistry: deploymentManifest.contracts.DatasetRegistry,
  validationModule: deploymentManifest.contracts.ValidationModule,
  projectRouter: deploymentManifest.contracts.ProjectRouter,
  duckCreekAdapter: deploymentManifest.contracts.DuckCreekAdapter,
  shirleyCentralAdapter: deploymentManifest.contracts.ShirleyCentralAdapter,
  shirleyEastAdapter: deploymentManifest.contracts.ShirleyEastAdapter,
}
export const XRPL_CHAIN_ID = deploymentManifest.chainId
export const EXPLORER_TX_BASE = `${deploymentManifest.explorerUrl}/tx/`
export const RPC_URL = deploymentManifest.rpcUrl
export const CURRENCY_SYMBOL = XRPL_EVM_TESTNET.nativeCurrency.symbol
export const NETWORK_NAME = deploymentManifest.networkName

export const XRPL_TX_DEFAULTS = {
  legacyGasPrice: 137_500_000_000n,
  gasLimits: {
    datasetSubmit: 700_000n,
    reviewSubmit: 300_000n,
    finalizeDataset: 200_000n,
  },
} as const
