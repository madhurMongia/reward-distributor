import hre from "hardhat";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { getNetworkConfig } from "./config/networks";
import { verifyContract } from "./verify";

const { ethers } = hre as any;

async function main() {
  const shouldVerify = process.env.VERIFY === 'true';
  const skipVerify = process.env.SKIP_VERIFY === 'true';
  
  const [deployer] = await ethers.getSigners();
  const networkName = await ethers.provider.getNetwork().then((n: any) => n.name);
  console.log("Deploying RewardDistributor contract...");
  console.log("Network:", networkName);
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  if (shouldVerify) {
    console.log("🔍 Verification enabled - contract will be verified on explorer after deployment");
  } else if (skipVerify) {
    console.log("⏭️  Verification skipped - use --verify flag to enable verification");
  }

  // Get network-specific configuration
  const config = getNetworkConfig(networkName);
  
  console.log("\nDeployment parameters:");
  console.log("Token address:", config.token);
  console.log("Amount per claim:", ethers.formatEther(config.amountPerClaim), "tokens");
  console.log("CrossChainProofOfHumanity address:", config.crossChainProofOfHumanity);

  // Validate addresses
  if (config.token === "0x0000000000000000000000000000000000000000") {
    throw new Error("Token address not configured for this network");
  }
  if (config.crossChainProofOfHumanity === "0x0000000000000000000000000000000000000000") {
    throw new Error("CrossChainProofOfHumanity address not configured for this network");
  }

  // Deploy RewardDistributor contract
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(
    config.token,
    config.amountPerClaim,
    config.crossChainProofOfHumanity
  );

  await rewardDistributor.waitForDeployment();
  const contractAddress = await rewardDistributor.getAddress();

  console.log("\n✅ RewardDistributor deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", rewardDistributor.deploymentTransaction()?.hash);

  // Verify contract deployment
  console.log("\nVerifying deployment...");
  const [
    deployedToken,
    deployedAmountPerClaim,
    deployedCrossChainPoH,
    deployedOwner
  ] = await Promise.all([
    rewardDistributor.token(),
    rewardDistributor.amountPerClaim(),
    rewardDistributor.crossChainProofOfHumanity(),
    rewardDistributor.owner()
  ]);

  console.log("✅ Verification complete:");
  console.log("Token:", deployedToken);
  console.log("Amount per claim:", ethers.formatEther(deployedAmountPerClaim), "tokens");
  console.log("CrossChainProofOfHumanity:", deployedCrossChainPoH);
  console.log("Owner:", deployedOwner);

  // Save deployment info to deployments folder
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const deploymentInfo = {
    contractName: "RewardDistributor",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: {
      token: config.token,
      amountPerClaim: config.amountPerClaim,
      crossChainProofOfHumanity: config.crossChainProofOfHumanity
    },
    transactionHash: rewardDistributor.deploymentTransaction()?.hash
  };

  // Create deployments directory structure
  const deploymentsDir = join(process.cwd(), "deployments", networkName);
  mkdirSync(deploymentsDir, { recursive: true });

  // Save timestamped deployment file
  const timestampedFile = join(deploymentsDir, `RewardDistributor-${timestamp}.json`);
  writeFileSync(timestampedFile, JSON.stringify(deploymentInfo, null, 2));

  // Update or create latest deployment file
  const latestFile = join(deploymentsDir, "RewardDistributor.json");
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
  if (shouldVerify && !skipVerify) {
    console.log(`\n🔍 Starting explorer verification...`);
    const constructorArgs = [
      config.token,
      config.amountPerClaim,
      config.crossChainProofOfHumanity
    ];
    
    const verified = await verifyContract(contractAddress, constructorArgs, "RewardDistributor");
    
    if (verified) {
      const explorerUrl = `${config.explorer.url}/address/${contractAddress}`;
      console.log(`\n🔗 View verified contract on ${config.explorer.name}: ${explorerUrl}`);
    }
  } else if (!shouldVerify && !skipVerify) {
    console.log(`\n💡 To verify this contract on the explorer, run:`);
    console.log(`   npm run verify --network ${networkName}`);
    console.log(`   or redeploy with: npm run deploy --network ${networkName} --verify`);
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
