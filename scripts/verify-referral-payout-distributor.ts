import { ethers } from "hardhat";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getNetworkConfig } from "./config/networks";
import { getExplorerUrl, verifyContract } from "./verify";

interface ReferralPayoutDistributorDeploymentInfo {
  contractName: string;
  contractAddress: string;
  deployer: string;
  deploymentTime: string;
  constructorArgs: {
    token: string;
    operator: string;
  };
  transactionHash?: string;
}

async function main() {
  const networkName = await ethers.provider.getNetwork().then((network) => network.name);
  const deploymentFile = join(process.cwd(), "deployments", networkName, "ReferralPayoutDistributor.json");

  if (!existsSync(deploymentFile)) {
    throw new Error(`No ReferralPayoutDistributor deployment found at ${deploymentFile}`);
  }

  const deploymentInfo = JSON.parse(readFileSync(deploymentFile, "utf8")) as ReferralPayoutDistributorDeploymentInfo;
  const constructorArgs = [deploymentInfo.constructorArgs.token, deploymentInfo.constructorArgs.operator];

  console.log("Network:", networkName);
  console.log("Contract:", deploymentInfo.contractName);
  console.log("Address:", deploymentInfo.contractAddress);
  console.log("Token:", constructorArgs[0]);
  console.log("Operator:", constructorArgs[1]);

  const verified = await verifyContract(
    deploymentInfo.contractAddress,
    constructorArgs,
    "ReferralPayoutDistributor"
  );

  if (!verified) {
    throw new Error("ReferralPayoutDistributor verification failed");
  }

  const config = getNetworkConfig(networkName);
  console.log(`Explorer: ${config.explorer.name}`);
  console.log(`URL: ${await getExplorerUrl(deploymentInfo.contractAddress, networkName)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });
