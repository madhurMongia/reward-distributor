import { ethers } from "hardhat";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getNetworkConfig } from "./config/networks";
import { verifyContract } from "./verify";

async function main() {
  const shouldVerify = process.env.VERIFY === "true";
  const [deployer] = await ethers.getSigners();
  const networkName = await ethers.provider.getNetwork().then((network) => network.name);
  const config = getNetworkConfig(networkName);
  const operator = process.env.REFERRAL_PAYOUT_OPERATOR;

  console.log("Deploying ReferralPayoutDistributor contract...");
  console.log("Network:", networkName);
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Token address:", config.token);
  console.log("Operator:", operator);

  if (config.token === "0x0000000000000000000000000000000000000000") {
    throw new Error("Token address not configured for this network");
  }
  if (!operator || !ethers.isAddress(operator)) {
    throw new Error("REFERRAL_PAYOUT_OPERATOR must be a valid address");
  }

  const ReferralPayoutDistributor = await ethers.getContractFactory("ReferralPayoutDistributor");
  const referralPayoutDistributor = await ReferralPayoutDistributor.deploy(config.token, operator);

  await referralPayoutDistributor.waitForDeployment();

  const contractAddress = await referralPayoutDistributor.getAddress();
  const transactionHash = referralPayoutDistributor.deploymentTransaction()?.hash;

  console.log("\n✅ ReferralPayoutDistributor deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", transactionHash);

  const [deployedToken, deployedOwner, deployedOperator] = await Promise.all([
    referralPayoutDistributor.token(),
    referralPayoutDistributor.owner(),
    referralPayoutDistributor.operator(),
  ]);

  console.log("\n✅ Verification complete:");
  console.log("Token:", deployedToken);
  console.log("Owner:", deployedOwner);
  console.log("Operator:", deployedOperator);

  const deploymentInfo = {
    contractName: "ReferralPayoutDistributor",
    contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: {
      token: config.token,
      operator,
    },
    transactionHash,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const deploymentsDir = join(process.cwd(), "deployments", networkName);
  mkdirSync(deploymentsDir, { recursive: true });

  const timestampedFile = join(deploymentsDir, `ReferralPayoutDistributor-${timestamp}.json`);
  const latestFile = join(deploymentsDir, "ReferralPayoutDistributor.json");
  const historyFile = join(deploymentsDir, "referral-payout-distributor-deployments.json");

  writeFileSync(timestampedFile, JSON.stringify(deploymentInfo, null, 2));
  writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));

  const deploymentHistory = existsSync(historyFile) ? JSON.parse(readFileSync(historyFile, "utf8")) : [];
  deploymentHistory.push({
    timestamp: deploymentInfo.deploymentTime,
    contractAddress,
  });
  writeFileSync(historyFile, JSON.stringify(deploymentHistory, null, 2));

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment files saved:");
  console.log(`   Latest: ${latestFile}`);
  console.log(`   Timestamped: ${timestampedFile}`);
  console.log(`   History: ${historyFile}`);

  if (shouldVerify) {
    await verifyContract(contractAddress, [config.token, operator], "ReferralPayoutDistributor");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
