export interface NetworkConfig {
  token: string;
  amountPerClaim: string;
  maxAmount: string;
  crossChainProofOfHumanity: string;
  voucherSigner: string;
  explorer: {
    name: string;
    url: string;
    apiUrl: string;
    apiKey?: string;
  };
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const networkConfigs: Record<string, NetworkConfig> = {
  chaido: {
    // PNK token address on Chaido testnet
    token: "0xA353A70c8B3C7d38A869436d4CDeBe8e5611681a",
    // Amount per claim in wei (e.g., 100 PNK = 100 * 10^18)
    amountPerClaim: (1000n * 10n ** 18n).toString(), // 1000 tokens with 18 decimals
    // Maximum voucher amount in wei.
    maxAmount: (1000n * 10n ** 18n).toString(), // 1000 tokens with 18 decimals
    // CrossChainProofOfHumanity contract address on Chaido
    crossChainProofOfHumanity: "0xBFb98b8F785dE02F35e4eAa8b83a4c9390f75f99",
    // Backend voucher signer for RewardDistributorV2.
    voucherSigner: ZERO_ADDRESS,
    explorer: {
      name: "Blockscout",
      url: "https://gnosis-chiado.blockscout.com",
      apiUrl: "https://gnosis-chiado.blockscout.com/api"
    }
  },
  gnosis: {
    // PNK token address on Gnosis mainnet
    token: "0xcb3231aBA3b451343e0Fddfc45883c842f223846",
    // Amount per claim in wei.
    amountPerClaim: (1200n * 10n ** 18n).toString(), // 1200 tokens with 18 decimals
    // Maximum voucher amount in wei.
    maxAmount: (1200n * 10n ** 18n).toString(), // 1200 tokens with 18 decimals
    // CrossChainProofOfHumanity contract address on Gnosis
    crossChainProofOfHumanity: "0x16044E1063C08670f8653055A786b7CC2034d2b0",
    // Backend voucher signer for RewardDistributorV2.
    voucherSigner: ZERO_ADDRESS,
    explorer: {
      name: "Blockscout",
      url: "https://gnosis.blockscout.com",
      apiUrl: "https://gnosis.blockscout.com/api",
      apiKey: process.env.BLOCKSCOUT_API_KEY
    }
  },
  sepolia: {
    // PNK token address on Sepolia testnet.
    token: "0xA1eE4D32bdBcA69cdb445D66fAA3804aFFa24bFE",
    // Amount per claim in wei.
    amountPerClaim: (1000n * 10n ** 18n).toString(), // 1000 tokens with 18 decimals
    // Maximum voucher amount in wei.
    maxAmount: (1000n * 10n ** 18n).toString(), // 1000 tokens with 18 decimals
    // CrossChainProofOfHumanity contract address on Sepolia.
    crossChainProofOfHumanity: "0x5142177398E94ce45b19c59cBA5d3d71a1c34202",
    // Backend voucher signer for RewardDistributorV2.
    voucherSigner: ZERO_ADDRESS,
    explorer: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
      apiUrl: "https://api-sepolia.etherscan.io/api",
      apiKey: process.env.ETHERSCAN_API_KEY
    }
  }
};

export function getNetworkConfig(networkName: string): NetworkConfig {
  const config = networkConfigs[networkName];
  if (!config) {
    throw new Error(`Network configuration not found for: ${networkName}`);
  }
  return config;
}
