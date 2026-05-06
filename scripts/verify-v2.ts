import hre from "hardhat";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getNetworkConfig } from "./config/networks";

const { ethers, network } = hre as any;

interface DeploymentInfo {
  contractName: string;
  contractAddress: string;
  deployer: string;
  deploymentTime: string;
  constructorArgs: {
    token: string;
    maxAmount: string;
    crossChainProofOfHumanity: string;
    voucherSigner: string;
  };
  transactionHash?: string;
}

export async function verifyContract(
  contractAddress: string,
  constructorArgs: any[],
  contractName: string = "RewardDistributorV2"
): Promise<boolean> {
  console.log(`\n🔍 Verifying ${contractName} at ${contractAddress}...`);
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ ${contractName} verified successfully on explorer!`);
    return true;
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`✅ ${contractName} is already verified on explorer!`);
      return true;
    } else {
      console.error(`❌ Explorer verification failed for ${contractName}:`, error.message);
      const networkName = network.name;
      console.log(`💡 You can verify manually later using: npx hardhat run scripts/verify-v2.ts --network ${networkName}`);
      return false;
    }
  }
}

export async function getExplorerUrl(contractAddress: string, networkName: string): Promise<string> {
  const config = getNetworkConfig(networkName);
  return `${config.explorer.url}/address/${contractAddress}`;
}

async function main() {
  const networkName = network.name;
  console.log(`🌐 Network: ${networkName}`);
  
  // Check if deployment file exists
  const deploymentFile = join(process.cwd(), "deployments", networkName, "RewardDistributorV2.json");
  
  if (!existsSync(deploymentFile)) {
    console.error(`❌ No deployment found for network: ${networkName}`);
    console.log(`Expected file: ${deploymentFile}`);
    process.exit(1);
  }

  // Read deployment info
  let deploymentInfo: DeploymentInfo;
  try {
    const deploymentContent = readFileSync(deploymentFile, 'utf8');
    deploymentInfo = JSON.parse(deploymentContent);
  } catch (error) {
    console.error(`❌ Failed to read deployment file: ${error}`);
    process.exit(1);
  }

  console.log(`📋 Contract: ${deploymentInfo.contractName}`);
  console.log(`📍 Address: ${deploymentInfo.contractAddress}`);
  console.log(`👤 Deployer: ${deploymentInfo.deployer}`);
  console.log(`⏰ Deployed: ${deploymentInfo.deploymentTime}`);

  // Prepare constructor arguments
  const constructorArgs = [
    deploymentInfo.constructorArgs.token,
    deploymentInfo.constructorArgs.maxAmount,
    deploymentInfo.constructorArgs.crossChainProofOfHumanity,
    deploymentInfo.constructorArgs.voucherSigner
  ];

  console.log(`\n🔧 Constructor arguments:`);
  console.log(`   Token: ${constructorArgs[0]}`);
  console.log(`   Max voucher amount: ${ethers.formatEther(constructorArgs[1])} tokens`);
  console.log(`   CrossChainProofOfHumanity: ${constructorArgs[2]}`);
  console.log(`   Voucher signer: ${constructorArgs[3]}`);

  // Verify the contract
  const verified = await verifyContract(
    deploymentInfo.contractAddress,
    constructorArgs,
    deploymentInfo.contractName
  );

  if (verified) {
    const explorerUrl = await getExplorerUrl(deploymentInfo.contractAddress, networkName);
    console.log(`\n🔗 View on explorer: ${explorerUrl}`);
    
    const config = getNetworkConfig(networkName);
    console.log(`\n📊 Verification Summary:`);
    console.log(`   Network: ${networkName}`);
    console.log(`   Explorer: ${config.explorer.name}`);
    console.log(`   Contract: ${deploymentInfo.contractName}`);
    console.log(`   Address: ${deploymentInfo.contractAddress}`);
    console.log(`   Status: ✅ Verified`);
  } else {
    console.log(`\n❌ Verification failed. Please check the error messages above.`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📖 Contract Verification Script

Usage:
  npx hardhat run scripts/verify-v2.ts --network <network>

Examples:
  npx hardhat run scripts/verify-v2.ts --network chaido
  npx hardhat run scripts/verify-v2.ts --network gnosis

This script will:
1. Read the latest deployment info from deployments/<network>/RewardDistributorV2.json
2. Verify the contract on the network's block explorer
3. Display the explorer URL for the verified contract

Make sure you have the appropriate API keys set in your .env file:
- GNOSISSCAN_API_KEY (for Gnosis network)
- BLOCKSCOUT_API_KEY (optional for Chaido, as Blockscout doesn't require it)
  `);
  process.exit(0);
}
if (require.main === module) {
  // Execute verification
  main()
    .then(() => {
      console.log(`\n🎉 Verification completed successfully!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Verification failed:");
      console.error(error);
      process.exit(1);
    });
}
