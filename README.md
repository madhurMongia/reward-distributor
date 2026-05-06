# RewardDistributor Smart Contract

A smart contract that distributes ERC20 token rewards to verified humans through Proof of Humanity verification.

### Constructor Parameters

- `_token` - Address of the ERC20 token to distribute
- `_amountPerClaim` - Fixed amount of tokens each verified human can claim
- `_crossChainProofOfHumanity` - Address of the Proof of Humanity contract

## RewardDistributorV2

`RewardDistributorV2` distributes referral rewards with backend signed EIP-712 vouchers.

### V2 Constructor Parameters

- `_token` - Address of the ERC20 token to distribute
- `_maxAmount` - Maximum token amount a signed voucher can authorize
- `_crossChainProofOfHumanity` - Address of the Cross-Chain Proof of Humanity contract
- `_voucherSigner` - Backend signer authorized to sign referral reward vouchers

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` file with your private key:
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ```

## Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npx hardhat coverage
```

Run tests with gas reporting:
```bash
REPORT_GAS=true npm test
```

## Configuration

Before deployment, update the contract addresses in [`scripts/config/networks.ts`](scripts/config/networks.ts):

```typescript
export const networkConfigs: Record<string, NetworkConfig> = {
  chaido: {
    token: "0x...", // Replace with actual PNK token address
    amountPerClaim: "100000000000000000000", // V1 fixed claim amount
    maxAmount: "100000000000000000000", // V2 maximum voucher amount
    crossChainProofOfHumanity: "0x...", // Replace with actual PoH contract address
    voucherSigner: "0x..." // Replace with backend voucher signer address
  },
  gnosis: {
    token: "0x...", // Replace with actual PNK token address
    amountPerClaim: "100000000000000000000", // V1 fixed claim amount
    maxAmount: "100000000000000000000", // V2 maximum voucher amount
    crossChainProofOfHumanity: "0x...", // Replace with actual PoH contract address
    voucherSigner: "0x..." // Replace with backend voucher signer address
  }
};
```

## Deployment

`scripts/deploy.ts` deploys `RewardDistributor`. `scripts/deploy-v2.ts` deploys `RewardDistributorV2` using the per-network `voucherSigner` from `scripts/config/networks.ts`.

### Deploy V1 to Chaido Testnet
```bash
npx hardhat run scripts/deploy.ts --network chaido
# deploy and verify in one run
VERIFY=true npx hardhat run scripts/deploy.ts --network chaido
```

### Deploy V1 to Gnosis Mainnet
```bash
npx hardhat run scripts/deploy.ts --network gnosis
# deploy and verify in one run
VERIFY=true npx hardhat run scripts/deploy.ts --network gnosis
```

### Deploy V2 to Chaido Testnet
```bash
npx hardhat run scripts/deploy-v2.ts --network chaido
# deploy and verify in one run
VERIFY=true npx hardhat run scripts/deploy-v2.ts --network chaido
```

### Deploy V2 to Gnosis Mainnet
```bash
npx hardhat run scripts/deploy-v2.ts --network gnosis
# deploy and verify in one run
VERIFY=true npx hardhat run scripts/deploy-v2.ts --network gnosis
```

### Deploy to Local Network (for testing)
```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy V1
npx hardhat run scripts/deploy.ts --network localhost

# Or deploy V2
npx hardhat run scripts/deploy-v2.ts --network localhost
```

## Contract Verification

After deployment, you can verify your contracts on block explorers:

### Verify V1 on Chaido Testnet
```bash
npm run verify:chaido
```

### Verify V1 on Gnosis Mainnet
```bash
npm run verify:gnosis
```

### Verify V2 on Chaido Testnet
```bash
npm run verify:v2:chaido
```

### Verify V2 on Gnosis Mainnet
```bash
npm run verify:v2:gnosis
```

### Alternative Verification Method
You can also run verification directly with Hardhat:
```bash
npx hardhat run scripts/verify.ts --network chaido
npx hardhat run scripts/verify.ts --network gnosis
npx hardhat run scripts/verify-v2.ts --network chaido
npx hardhat run scripts/verify-v2.ts --network gnosis
```

The V1 verification script will:
1. Read the latest deployment info from `deployments/<network>/RewardDistributor.json`
2. Verify the contract on the network's block explorer
3. Display the explorer URL for the verified contract

The V2 verification script will:
1. Read the latest deployment info from `deployments/<network>/RewardDistributorV2.json`
2. Verify the contract on the network's block explorer
3. Display the explorer URL for the verified contract

Make sure you have the appropriate API keys set in your `.env` file:
- `GNOSISSCAN_API_KEY` (for Gnosis network)
- `BLOCKSCOUT_API_KEY` (optional for Chaido, as Blockscout doesn't require it)

## Post-Deployment

1. **Fund the Contract**: Transfer PNK tokens to the deployed contract address
2. **Test Claims**: Verify the claim functionality works with verified humanity IDs
3. **Monitor**: Track contract events and token balance

### Deployment Records

Deployment information is automatically saved to multiple files for each network:

```
deployments/[network]/
├── RewardDistributor.json                # Latest V1 deployment, if deployed with a V1 script
├── RewardDistributor-[timestamp].json    # Timestamped V1 deployment files
├── RewardDistributorV2.json              # Latest V2 deployment, if deployed with the V2 script
├── RewardDistributorV2-[timestamp].json  # Timestamped V2 deployment files
└── deployments.json                      # Deployment history
```

Each deployment creates:
- **Latest file**: Always contains the most recent deployment info
- **Timestamped file**: Permanent record of each deployment (never overwritten)
- **History file**: List of all deployments with timestamps and addresses

This means you can deploy multiple times without losing previous deployment records.

## License

MIT License
