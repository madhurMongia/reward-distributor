export interface NetworkConfig {
  token: string;
  amountPerClaim: string;
  crossChainProofOfHumanity: string;
  explorer: {
    name: string;
    url: string;
    apiUrl: string;
    apiKey?: string;
  };
}

export const networkConfigs: Record<string, NetworkConfig> = {
  chaido: {
    // PNK token address on Chaido testnet
    token: "0xA353A70c8B3C7d38A869436d4CDeBe8e5611681a",
    // Amount per claim in wei (e.g., 100 PNK = 100 * 10^18)
    amountPerClaim: (25 * 10 ** 18).toString(), // 25 tokens with 18 decimals
    // CrossChainProofOfHumanity contract address on Chaido
    crossChainProofOfHumanity: "0xBFb98b8F785dE02F35e4eAa8b83a4c9390f75f99",
    explorer: {
      name: "Blockscout",
      url: "https://gnosis-chiado.blockscout.com",
      apiUrl: "https://gnosis-chiado.blockscout.com/api"
    }
  },
  gnosis: {
    // PNK token address on Gnosis mainnet
    token: "0x0000000000000000000000000000000000000000",
    // Amount per claim in wei (e.g., 100 PNK = 100 * 10^18)
    amountPerClaim: (2500 * 10 ** 18).toString(), // 2500 tokens with 18 decimals
    // CrossChainProofOfHumanity contract address on Gnosis
    crossChainProofOfHumanity: "0x0000000000000000000000000000000000000000",
    explorer: {
      name: "GnosisScan",
      url: "https://gnosisscan.io",
      apiUrl: "https://api.gnosisscan.io/api",
      apiKey: process.env.GNOSISSCAN_API_KEY
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