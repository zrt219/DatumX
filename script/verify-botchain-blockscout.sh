#!/usr/bin/env bash
set -euo pipefail

CONTRACT_ADDRESS="0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7"
CONTRACT_IDENTIFIER="contracts/botchain/BotChainDatasetRegistry.sol:BotChainDatasetRegistry"
NETWORK="${1:-botchain-mainnet}"

if [ "$NETWORK" = "botchain-mainnet" ]; then
  VERIFIER_URL="https://scan.botchain.ai/api"
  CONSTRUCTOR_ARGS="0000000000000000000000000000000000000000000000000000000000000000"
elif [ "$NETWORK" = "bohr-testnet" ]; then
  VERIFIER_URL="https://scan.bohr.life/api"
  CONSTRUCTOR_ARGS="0000000000000000000000000000000000000000000000000000000000000001"
else
  echo "Unknown network: $NETWORK (supported: botchain-mainnet, bohr-testnet)"
  exit 1
fi

echo "Verifying $CONTRACT_IDENTIFIER at $CONTRACT_ADDRESS on $NETWORK ($VERIFIER_URL)..."
forge verify-contract "$CONTRACT_ADDRESS" "$CONTRACT_IDENTIFIER" \
  --verifier blockscout \
  --verifier-url "$VERIFIER_URL" \
  --use 0.8.24 \
  --num-of-optimizations 200 \
  --via-ir \
  --evm-version cancun \
  --constructor-args "$CONSTRUCTOR_ARGS"

echo "Verification submission complete."
