import hre from "hardhat";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { getNetworkConfig } from "./config/networks";
import { verifyContract } from "./verify-v2";

const { ethers, network } = hre as any;

async function main() {
  const shouldVerify = process.env.VERIFY === 'true';
  
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  console.log("Deploying RewardDistributorV2 contract...");
  console.log("Network:", networkName);
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  if (shouldVerify) {
    console.log("🔍 Verification enabled - contract will be verified on explorer after deployment");
  }

  // Get network-specific configuration
  const config = getNetworkConfig(networkName);
  
  console.log("\nDeployment parameters:");
  console.log("Token address:", config.token);
  console.log("Max voucher amount:", ethers.formatEther(config.maxAmount), "tokens");
  console.log("CrossChainProofOfHumanity address:", config.crossChainProofOfHumanity);
  console.log("Voucher signer:", config.voucherSigner);

  // Validate addresses
  if (config.token === "0x0000000000000000000000000000000000000000") {
    throw new Error("Token address not configured for this network");
  }
  if (config.crossChainProofOfHumanity === "0x0000000000000000000000000000000000000000") {
    throw new Error("CrossChainProofOfHumanity address not configured for this network");
  }

  // Deploy RewardDistributorV2 contract
  const RewardDistributorV2 = await ethers.getContractFactory("RewardDistributorV2");
  const rewardDistributor = await RewardDistributorV2.deploy(
    config.token,
    config.maxAmount,
    config.crossChainProofOfHumanity,
    config.voucherSigner
  );

  await rewardDistributor.waitForDeployment();
  const contractAddress = await rewardDistributor.getAddress();

  console.log("\n✅ RewardDistributorV2 deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", rewardDistributor.deploymentTransaction()?.hash);

  // Verify contract deployment
  console.log("\nVerifying deployment...");
  const [
    deployedToken,
    deployedMaxAmount,
    deployedCrossChainPoH,    
    deployedVoucherSigner,
    deployedOwner
  ] = await Promise.all([
    rewardDistributor.token(),
    rewardDistributor.maxAmount(),
    rewardDistributor.crossChainProofOfHumanity(),
    rewardDistributor.voucherSigner(),
    rewardDistributor.owner()
  ]);

  console.log("✅ Verification complete:");
  console.log("Token:", deployedToken);
  console.log("Max voucher amount:", ethers.formatEther(deployedMaxAmount), "tokens");
  console.log("CrossChainProofOfHumanity:", deployedCrossChainPoH);
  console.log("Voucher signer:", deployedVoucherSigner);
  console.log("Owner:", deployedOwner);

  // Save deployment info to deployments folder
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const deploymentInfo = {
    contractName: "RewardDistributorV2",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: {
      token: config.token,
      maxAmount: config.maxAmount,
      crossChainProofOfHumanity: config.crossChainProofOfHumanity,
      voucherSigner: config.voucherSigner
    },
    transactionHash: rewardDistributor.deploymentTransaction()?.hash
  };

  // Create deployments directory structure
  const deploymentsDir = join(process.cwd(), "deployments", networkName);
  mkdirSync(deploymentsDir, { recursive: true });

  // Save timestamped deployment file
  const timestampedFile = join(deploymentsDir, `RewardDistributorV2-${timestamp}.json`);
  writeFileSync(timestampedFile, JSON.stringify(deploymentInfo, null, 2));

  // Update or create latest deployment file
  const latestFile = join(deploymentsDir, "RewardDistributorV2.json");
  writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));

  // Update deployment history
  const historyFile = join(deploymentsDir, "deployments.json");
  let deploymentHistory: any[] = [];
  
  if (existsSync(historyFile)) {
    try {
      const historyContent = readFileSync(historyFile, 'utf8');
      deploymentHistory = JSON.parse(historyContent);
    } catch (error) {
      console.warn("Warning: Could not read deployment history, creating new one");
      deploymentHistory = [];
    }
  }

  deploymentHistory.push({
    timestamp: deploymentInfo.deploymentTime,
    contractName: deploymentInfo.contractName,
    contractAddress: contractAddress
  });

  writeFileSync(historyFile, JSON.stringify(deploymentHistory, null, 2));

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment files saved:`);
  console.log(`   Latest: ${latestFile}`);
  console.log(`   Timestamped: ${timestampedFile}`);
  console.log(`   History: ${historyFile}`);
  console.log(`\n📊 Total deployments on ${networkName}: ${deploymentHistory.length}`);

  // Optional explorer verification
  if (shouldVerify) {
    console.log(`\n🔍 Starting explorer verification...`);
    const constructorArgs = [
      config.token,
      config.maxAmount,
      config.crossChainProofOfHumanity,
      config.voucherSigner
    ];
    
    const verified = await verifyContract(contractAddress, constructorArgs, "RewardDistributorV2");
    
    if (verified) {
      const explorerUrl = `${config.explorer.url}/address/${contractAddress}`;
      console.log(`\n🔗 View verified contract on ${config.explorer.name}: ${explorerUrl}`);
    }
  } else {
    console.log(`\n💡 To verify this contract on the explorer, run:`);
    console.log(`   npx hardhat run scripts/verify-v2.ts --network ${networkName}`);
    console.log(`   or redeploy with: VERIFY=true npx hardhat run scripts/deploy-v2.ts --network ${networkName}`);
  }

  return {
    contract: rewardDistributor,
    address: contractAddress,
    deploymentInfo
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
