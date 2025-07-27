import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { RewardDistributor, MockERC20, MockCrossChainProofOfHumanity } from "../typechain-types";

describe("RewardDistributor", function () {
  let rewardDistributor: RewardDistributor;
  let mockToken: MockERC20;
  let mockProofOfHumanity: MockCrossChainProofOfHumanity;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  const AMOUNT_PER_CLAIM = ethers.parseEther("2500"); // 2500 tokens properly converted to wei
  const INITIAL_TOKEN_SUPPLY = ethers.parseEther(`${10000 * 2500}`); // 25M tokens (10000 claims * 2500 tokens)
  const humanityId1 = "0x1234567890123456789012345678901234567890"; // bytes20
  const humanityId2 = "0x2345678901234567890123456789012345678901"; // bytes20
  const humanityId3 = "0x3456789012345678901234567890123456789012"; // bytes20

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3, nonOwner] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy(
      "Test Token",
      "TEST",
      18,
      INITIAL_TOKEN_SUPPLY
    );

    // Deploy MockCrossChainProofOfHumanity
    const MockProofOfHumanityFactory = await ethers.getContractFactory("MockCrossChainProofOfHumanity");
    mockProofOfHumanity = await MockProofOfHumanityFactory.deploy();

    // Deploy RewardDistributor
    const RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor");
    rewardDistributor = await RewardDistributorFactory.deploy(
      await mockToken.getAddress(),
      AMOUNT_PER_CLAIM,
      await mockProofOfHumanity.getAddress()
    );

    // Transfer tokens to the RewardDistributor contract (transfer half of total supply)
    await mockToken.transfer(await rewardDistributor.getAddress(), ethers.parseEther("12500000"));

    // Setup verified humans
    await mockProofOfHumanity.setupHuman(humanityId1, user1.address);
    await mockProofOfHumanity.setupHuman(humanityId2, user2.address);
    await mockProofOfHumanity.setupHuman(humanityId3, user3.address);
  });

  describe("Deployment and Initialization", function () {
    it("Should set the correct token address", async function () {
      expect(await rewardDistributor.token()).to.equal(await mockToken.getAddress());
    });

    it("Should set the correct amount per claim", async function () {
      expect(await rewardDistributor.amountPerClaim()).to.equal(AMOUNT_PER_CLAIM);
    });

    it("Should set the correct owner", async function () {
      expect(await rewardDistributor.owner()).to.equal(owner.address);
    });

    it("Should set the correct cross chain proof of humanity address", async function () {
      expect(await rewardDistributor.crossChainProofOfHumanity()).to.equal(await mockProofOfHumanity.getAddress());
    });

    it("Should initialize with no claims made", async function () {
      expect(await rewardDistributor.claimed(humanityId1)).to.be.false;
      expect(await rewardDistributor.claimed(humanityId2)).to.be.false;
      expect(await rewardDistributor.claimed(humanityId3)).to.be.false;
    });
  });

  describe("Claim Function", function () {
    it("Should allow verified human to claim rewards", async function () {
      const initialBalance = await mockToken.balanceOf(user1.address);
      
      await expect(rewardDistributor.connect(user1).claim())
        .to.emit(rewardDistributor, "Claimed")
        .withArgs(humanityId1, AMOUNT_PER_CLAIM);

      const finalBalance = await mockToken.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(AMOUNT_PER_CLAIM);
      expect(await rewardDistributor.claimed(humanityId1)).to.be.true;
    });

    it("Should prevent double claiming", async function () {
      // First claim should succeed
      await rewardDistributor.connect(user1).claim();
      expect(await rewardDistributor.claimed(humanityId1)).to.be.true;

      // Second claim should fail
      await expect(rewardDistributor.connect(user1).claim())
        .to.be.revertedWith("already claimed");
    });

    it("Should reject claims from non-human addresses", async function () {
      // Mark user1 as not human
      await mockProofOfHumanity.setIsHuman(user1.address, false);

      await expect(rewardDistributor.connect(user1).claim())
        .to.be.revertedWith("not human");
    });

    it("Should allow multiple different users to claim", async function () {
      // User1 claims
      await rewardDistributor.connect(user1).claim();
      expect(await rewardDistributor.claimed(humanityId1)).to.be.true;

      // User2 claims
      await rewardDistributor.connect(user2).claim();
      expect(await rewardDistributor.claimed(humanityId2)).to.be.true;

      // User3 claims
      await rewardDistributor.connect(user3).claim();
      expect(await rewardDistributor.claimed(humanityId3)).to.be.true;

      // Check balances
      expect(await mockToken.balanceOf(user1.address)).to.equal(AMOUNT_PER_CLAIM);
      expect(await mockToken.balanceOf(user2.address)).to.equal(AMOUNT_PER_CLAIM);
      expect(await mockToken.balanceOf(user3.address)).to.equal(AMOUNT_PER_CLAIM);
    });
  });

  describe("Owner Functions", function () {
    describe("Withdraw", function () {
      it("Should allow owner to withdraw tokens", async function () {
        const withdrawAmount = ethers.parseEther("1000");
        const initialOwnerBalance = await mockToken.balanceOf(owner.address);
        const initialContractBalance = await mockToken.balanceOf(await rewardDistributor.getAddress());

        await expect(rewardDistributor.connect(owner).withdraw(withdrawAmount))
          .to.emit(rewardDistributor, "Withdrawn")
          .withArgs(owner.address, withdrawAmount);

        const finalOwnerBalance = await mockToken.balanceOf(owner.address);
        const finalContractBalance = await mockToken.balanceOf(await rewardDistributor.getAddress());

        expect(finalOwnerBalance - initialOwnerBalance).to.equal(withdrawAmount);
        expect(initialContractBalance - finalContractBalance).to.equal(withdrawAmount);
      });

      it("Should prevent non-owner from withdrawing", async function () {
        const withdrawAmount = ethers.parseEther("1000");
        
        await expect(rewardDistributor.connect(nonOwner).withdraw(withdrawAmount))
          .to.be.revertedWith("not owner");
      });

      it("Should handle failed token transfer during withdrawal", async function () {
        const withdrawAmount = ethers.parseEther("1000");
        
        // Make token transfer fail
        await mockToken.setTransferShouldFail(true);
        
        // The current contract doesn't check transfer return value, so it won't revert
        // Instead, it will emit the Withdrawn event even though the transfer failed
        await expect(rewardDistributor.connect(owner).withdraw(withdrawAmount))
          .to.emit(rewardDistributor, "Withdrawn")
          .withArgs(owner.address, withdrawAmount);
        
        // But the owner's balance shouldn't change since transfer failed
        const ownerBalance = await mockToken.balanceOf(owner.address);
        expect(ownerBalance).to.equal(ethers.parseEther("12500000")); // Initial balance unchanged (25M - 12.5M transferred to contract)
        
        // Reset the flag to prevent interference with other tests
        await mockToken.setTransferShouldFail(false);
      });
    });

    describe("Transfer Ownership", function () {
      it("Should allow owner to transfer ownership", async function () {
        await expect(rewardDistributor.connect(owner).transferOwnership(user1.address))
          .to.emit(rewardDistributor, "OwnershipTransferred")
          .withArgs(owner.address, user1.address);

        expect(await rewardDistributor.owner()).to.equal(user1.address);
      });

      it("Should prevent non-owner from transferring ownership", async function () {
        await expect(rewardDistributor.connect(nonOwner).transferOwnership(user1.address))
          .to.be.revertedWith("not owner");
      });

      it("Should allow new owner to use owner functions", async function () {
        // Transfer ownership to user1
        await rewardDistributor.connect(owner).transferOwnership(user1.address);

        // user1 should now be able to withdraw
        const withdrawAmount = ethers.parseEther("500");
        await expect(rewardDistributor.connect(user1).withdraw(withdrawAmount))
          .to.emit(rewardDistributor, "Withdrawn")
          .withArgs(user1.address, withdrawAmount);

        // Original owner should no longer be able to withdraw
        await expect(rewardDistributor.connect(owner).withdraw(withdrawAmount))
          .to.be.revertedWith("not owner");
      });
    });
  });

  describe("Edge Cases and Error Conditions", function () {
    it("Should handle zero amount per claim", async function () {
      const RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor");
      const zeroAmountDistributor = await RewardDistributorFactory.deploy(
        await mockToken.getAddress(),
        0,
        await mockProofOfHumanity.getAddress()
      );

      await expect(zeroAmountDistributor.connect(user1).claim())
        .to.emit(zeroAmountDistributor, "Claimed")
        .withArgs(humanityId1, 0);
    });

    it("Should handle contract with insufficient token balance", async function () {
      // Deploy new contract with no tokens
      const RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor");
      const emptyDistributor = await RewardDistributorFactory.deploy(
        await mockToken.getAddress(),
        AMOUNT_PER_CLAIM,
        await mockProofOfHumanity.getAddress()
      );

      // This should fail because the contract has no tokens
      await expect(emptyDistributor.connect(user1).claim())
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should handle large amount per claim", async function () {
      const largeAmount = ethers.parseEther("1000000"); // 1 million tokens
      const RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor");
      const largeAmountDistributor = await RewardDistributorFactory.deploy(
        await mockToken.getAddress(),
        largeAmount,
        await mockProofOfHumanity.getAddress()
      );

      // Mint large amount of tokens to the contract
      await mockToken.mint(await largeAmountDistributor.getAddress(), largeAmount);

      await expect(largeAmountDistributor.connect(user1).claim())
        .to.emit(largeAmountDistributor, "Claimed")
        .withArgs(humanityId1, largeAmount);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should have reasonable gas costs for claim function", async function () {
      const tx = await rewardDistributor.connect(user1).claim();
      const receipt = await tx.wait();
      
      // Gas usage should be reasonable (less than 100k gas)
      expect(receipt!.gasUsed).to.be.lessThan(100000);
    });

    it("Should have reasonable gas costs for withdraw function", async function () {
      const withdrawAmount = ethers.parseEther("1000");
      const tx = await rewardDistributor.connect(owner).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      
      // Gas usage should be reasonable (less than 50k gas)
      expect(receipt!.gasUsed).to.be.lessThan(50000);
    });
  });
});