import { ethers } from "hardhat";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getNetworkConfig } from "./config/networks";
import { verifyContract } from "./verify";

async function main() {
  const shouldVerify = process.env.VERIFY === "true";
  const skipVerify = process.env.SKIP_VERIFY === "true";

  const [deployer] = await ethers.getSigners();
  const networkName = await ethers.provider.getNetwork().then((network) => network.name);
  console.log("Deploying ReferralPayoutDistributor contract...");
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
  const operator = config.referralPayoutOperator;

  console.log("\nDeployment parameters:");
  console.log("Token address:", config.token);
  console.log("Operator:", operator);

  // Validate addresses
  if (config.token === "0x0000000000000000000000000000000000000000") {
    throw new Error("Token address not configured for this network");
  }
  if (!ethers.isAddress(operator) || operator === "0x0000000000000000000000000000000000000000") {
    throw new Error("Referral payout operator not configured for this network");
  }

  // Deploy ReferralPayoutDistributor contract
  const ReferralPayoutDistributor = await ethers.getContractFactory("ReferralPayoutDistributor");
  const referralPayoutDistributor = await ReferralPayoutDistributor.deploy(config.token, operator);

  await referralPayoutDistributor.waitForDeployment();
  const contractAddress = await referralPayoutDistributor.getAddress();

  console.log("\n✅ ReferralPayoutDistributor deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", referralPayoutDistributor.deploymentTransaction()?.hash);

  // Save deployment info to deployments folder
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const deploymentInfo = {
    contractName: "ReferralPayoutDistributor",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: {
      token: config.token,
      operator,
    },
    transactionHash: referralPayoutDistributor.deploymentTransaction()?.hash,
  };

  // Create deployments directory structure
  const deploymentsDir = join(process.cwd(), "deployments", networkName);
  mkdirSync(deploymentsDir, { recursive: true });

  // Save timestamped deployment file
  const timestampedFile = join(deploymentsDir, `ReferralPayoutDistributor-${timestamp}.json`);
  writeFileSync(timestampedFile, JSON.stringify(deploymentInfo, null, 2));

  // Update or create latest deployment file
  const latestFile = join(deploymentsDir, "ReferralPayoutDistributor.json");
  writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));

  // Update deployment history
  const historyFile = join(deploymentsDir, "referral-payout-distributor-deployments.json");
  let deploymentHistory: any[] = [];

  if (existsSync(historyFile)) {
    try {
      const historyContent = readFileSync(historyFile, "utf8");
      deploymentHistory = JSON.parse(historyContent);
    } catch (error) {
      console.warn("Warning: Could not read deployment history, creating new one");
      deploymentHistory = [];
    }
  }

  deploymentHistory.push({
    timestamp: deploymentInfo.deploymentTime,
    contractAddress: contractAddress,
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
    const constructorArgs = [config.token, operator];

    const verified = await verifyContract(contractAddress, constructorArgs, "ReferralPayoutDistributor");

    if (verified) {
      const explorerUrl = `${config.explorer.url}/address/${contractAddress}`;
      console.log(`\n🔗 View verified contract on ${config.explorer.name}: ${explorerUrl}`);
    }
  } else if (!shouldVerify && !skipVerify) {
    console.log(`\n💡 To verify this contract on the explorer, run:`);
    console.log(`   npm run verify:referral-payout:${networkName}`);
    console.log(`   or redeploy with: npm run deploy:referral-payout:${networkName}:verify`);
  }

  return {
    contract: referralPayoutDistributor,
    address: contractAddress,
    deploymentInfo,
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
