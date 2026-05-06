import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("RewardDistributorV2", function () {
  enum Role {
    REFEREE,
    REFERRER,
  }

  const MAX_AMOUNT = ethers.parseEther("250");
  const INITIAL_TOKEN_SUPPLY = ethers.parseEther("1000000");
  const referrerHumanityId = "0x1234567890123456789012345678901234567890";
  const refereeHumanityId = "0x2345678901234567890123456789012345678901";

  async function deployDistributor(overrides: {
    token?: string;
    maxAmount?: bigint;
    proofOfHumanity?: string;
    voucherSigner?: string;
  } = {}) {
    const RewardDistributorV2Factory = await ethers.getContractFactory("RewardDistributorV2");

    return RewardDistributorV2Factory.deploy(
      overrides.token ?? ethers.ZeroAddress,
      overrides.maxAmount ?? MAX_AMOUNT,
      overrides.proofOfHumanity ?? ethers.ZeroAddress,
      overrides.voucherSigner ?? ethers.ZeroAddress
    );
  }

  async function deployFixture() {
    const [owner, voucherSigner, invalidSigner, referrer, referee, relayer] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20Factory.deploy("Test Token", "TEST", 18, INITIAL_TOKEN_SUPPLY);

    const MockProofOfHumanityFactory = await ethers.getContractFactory("MockCrossChainProofOfHumanity");
    const proofOfHumanity = await MockProofOfHumanityFactory.deploy();

    const distributor = await deployDistributor({
      token: await token.getAddress(),
      proofOfHumanity: await proofOfHumanity.getAddress(),
      voucherSigner: voucherSigner.address,
    });

    await token.transfer(await distributor.getAddress(), ethers.parseEther("10000"));
    await proofOfHumanity.setupHuman(referrerHumanityId, referrer.address);
    await proofOfHumanity.setupHuman(refereeHumanityId, referee.address);

    // helper to create signed Reward Voucher
    // by default create a voucher for referrer ,expiry 1hrs and amount 250 tokens
    async function signVoucher(overrides: {
      signer?: typeof voucherSigner;
      role?: number;
      expireAt?: bigint;
      amount?: bigint;
      token?: string;
      verifyingContract?: string;
    } = {}) {
      const network = await ethers.provider.getNetwork();
      const role = overrides.role ?? Role.REFERRER;
      const expireAt = overrides.expireAt ?? BigInt(Math.floor(Date.now() / 1000) + 3600);
      const amount = overrides.amount ?? MAX_AMOUNT;
      const voucherToken = overrides.token ?? await distributor.token();
      const verifyingContract = overrides.verifyingContract ?? await distributor.getAddress();
      const signature = await (overrides.signer ?? voucherSigner).signTypedData(
        {
          name: "PoH Referral Reward Distributor",
          chainId: network.chainId,
          verifyingContract,
        },
        {
          ReferralReward: [
            { name: "referrerHumanityId", type: "bytes20" },
            { name: "refereeHumanityId", type: "bytes20" },
            { name: "role", type: "uint8" },
            { name: "expireAt", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "token", type: "address" },
          ],
        },
        {
          referrerHumanityId,
          refereeHumanityId,
          role,
          expireAt,
          amount,
          token: voucherToken,
        }
      );
      const split = ethers.Signature.from(signature);

      return { role, expireAt, amount, v: split.v, r: split.r, s: split.s };
    }

    function claim(voucher: Awaited<ReturnType<typeof signVoucher>>, signer?: Signer) {
      const claimant = signer ? distributor.connect(signer) : distributor;

      return claimant.claim(
        referrerHumanityId,
        refereeHumanityId,
        voucher.role,
        voucher.expireAt,
        voucher.amount,
        voucher.v,
        voucher.r,
        voucher.s
      );
    }

    return {
      owner,
      voucherSigner,
      invalidSigner,
      referrer,
      referee,
      relayer,
      token,
      proofOfHumanity,
      distributor,
      signVoucher,
      claim,
    };
  }

  describe("Deployment and Initialization", function () {
    it("sets the initial configuration", async function () {
      const { owner, voucherSigner, token, proofOfHumanity, distributor } = await deployFixture();

      expect(await distributor.owner()).to.equal(owner.address);
      expect(await distributor.voucherSigner()).to.equal(voucherSigner.address);
      expect(await distributor.token()).to.equal(await token.getAddress());
      expect(await distributor.crossChainProofOfHumanity()).to.equal(await proofOfHumanity.getAddress());
      expect(await distributor.maxAmount()).to.equal(MAX_AMOUNT);
    });

    it("rejects an invalid token", async function () {
      const { proofOfHumanity, voucherSigner } = await deployFixture();

      await expect(deployDistributor({
        proofOfHumanity: await proofOfHumanity.getAddress(),
        voucherSigner: voucherSigner.address,
      })).to.be.revertedWith("invalid token");
    });

    it("rejects an invalid cross-chain Proof of Humanity contract", async function () {
      const { token, voucherSigner } = await deployFixture();

      await expect(deployDistributor({
        token: await token.getAddress(),
        voucherSigner: voucherSigner.address,
      })).to.be.revertedWith("invalid poh");
    });

    it("rejects an invalid voucher signer", async function () {
      const { token, proofOfHumanity } = await deployFixture();

      await expect(deployDistributor({
        token: await token.getAddress(),
        proofOfHumanity: await proofOfHumanity.getAddress(),
      })).to.be.revertedWith("invalid signer");
    });
  });

  describe("Governance", function () {
    describe("transferOwnership", function () {
      it("allows the owner to transfer ownership", async function () {
        const { owner, distributor, invalidSigner } = await deployFixture();

        await expect(distributor.transferOwnership(invalidSigner.address))
          .to.emit(distributor, "OwnershipTransferred")
          .withArgs(owner.address, invalidSigner.address);

        expect(await distributor.owner()).to.equal(invalidSigner.address);
      });
    });

    describe("setVoucherSigner", function () {
      it("allows the owner to rotate the voucher signer", async function () {
        const { distributor, voucherSigner, invalidSigner, signVoucher, claim } = await deployFixture();

        await expect(distributor.setVoucherSigner(invalidSigner.address))
          .to.emit(distributor, "VoucherSignerChanged")
          .withArgs(voucherSigner.address, invalidSigner.address);

        const voucher = await signVoucher({ signer: invalidSigner });
        await expect(claim(voucher)).to.emit(distributor, "Claimed");
      });
    });

    describe("setToken", function () {
      it("allows the owner to update the reward token", async function () {
        const { distributor, token, referrer, signVoucher, claim } = await deployFixture();
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        const newToken = await MockERC20Factory.deploy("New Token", "NEW", 18, INITIAL_TOKEN_SUPPLY);
        await newToken.transfer(await distributor.getAddress(), ethers.parseEther("10000"));

        await expect(distributor.setToken(await newToken.getAddress()))
          .to.emit(distributor, "TokenChanged")
          .withArgs(await token.getAddress(), await newToken.getAddress());

        const voucher = await signVoucher();
        await claim(voucher);

        expect(await newToken.balanceOf(referrer.address)).to.equal(MAX_AMOUNT);
      });

      it("invalidates old vouchers after the reward token changes", async function () {
        const { distributor, signVoucher, claim } = await deployFixture();
        const oldTokenVoucher = await signVoucher();
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        const newToken = await MockERC20Factory.deploy("New Token", "NEW", 18, INITIAL_TOKEN_SUPPLY);

        await distributor.setToken(await newToken.getAddress());

        await expect(claim(oldTokenVoucher)).to.be.revertedWith("invalid signature");
      });
    });

    describe("setCrossChainProofOfHumanity", function () {
      it("allows the owner to update the cross-chain Proof of Humanity contract", async function () {
        const { distributor, proofOfHumanity, signVoucher, claim } = await deployFixture();
        const MockProofOfHumanityFactory = await ethers.getContractFactory("MockCrossChainProofOfHumanity");
        const newProofOfHumanity = await MockProofOfHumanityFactory.deploy();
        await newProofOfHumanity.setupHuman(referrerHumanityId, ethers.ZeroAddress);

        await expect(distributor.setCrossChainProofOfHumanity(await newProofOfHumanity.getAddress()))
          .to.emit(distributor, "CrossChainProofOfHumanityChanged")
          .withArgs(await proofOfHumanity.getAddress(), await newProofOfHumanity.getAddress());

        const voucher = await signVoucher();
        await expect(claim(voucher)).to.be.revertedWith("invalid referrer");
      });
    });

    describe("setMaxAmount", function () {
      it("allows the owner to update the maximum voucher amount", async function () {
        const { distributor } = await deployFixture();
        const newMaxAmount = ethers.parseEther("100");

        await expect(distributor.setMaxAmount(newMaxAmount))
          .to.emit(distributor, "MaxAmountChanged")
          .withArgs(MAX_AMOUNT, newMaxAmount);

        expect(await distributor.maxAmount()).to.equal(newMaxAmount);
      });
    });
  });

  describe("claim", function () {
    it("pays the current referrer humanity owner with a valid backend voucher", async function () {
      const { distributor, token, referrer, relayer, signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher();

      await expect(claim(voucher, relayer))
        .to.emit(distributor, "Claimed")
        .withArgs(referrerHumanityId, refereeHumanityId, Role.REFERRER, referrer.address, await token.getAddress(), MAX_AMOUNT);

      expect(await token.balanceOf(referrer.address)).to.equal(MAX_AMOUNT);
      expect(await distributor.claimed(refereeHumanityId, Role.REFERRER)).to.equal(true);
    });

    it("pays the current referee humanity owner with a valid backend voucher", async function () {
      const { distributor, token, referee, relayer, signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher({ role: Role.REFEREE });

      await expect(claim(voucher, relayer))
        .to.emit(distributor, "Claimed")
        .withArgs(referrerHumanityId, refereeHumanityId, Role.REFEREE, referee.address, await token.getAddress(), MAX_AMOUNT);

      expect(await token.balanceOf(referee.address)).to.equal(MAX_AMOUNT);
      expect(await distributor.claimed(refereeHumanityId, Role.REFEREE)).to.equal(true);
    });

    it("prevents claiming the same referral side twice", async function () {
      const { signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher();

      await claim(voucher);

      await expect(claim(voucher)).to.be.revertedWith("already claimed");
    });

    it("rejects vouchers not signed by the configured signer", async function () {
      const { invalidSigner, signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher({ signer: invalidSigner });

      await expect(claim(voucher)).to.be.revertedWith("invalid signature");
    });

    it("rejects expired vouchers", async function () {
      const { signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher({ expireAt: 1n });

      await expect(claim(voucher)).to.be.revertedWith("voucher expired");
    });

    it("rejects vouchers above max amount", async function () {
      const { signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher({ amount: MAX_AMOUNT + 1n });

      await expect(claim(voucher)).to.be.revertedWith("amount too high");
    });

    it("rejects signed vouchers with an unknown reward role", async function () {
      const { signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher({ role: 2 });

      await expect(claim(voucher)).to.be.revertedWith("invalid role");
    });

    it("rejects claims when the role beneficiary is no longer human", async function () {
      const { proofOfHumanity, referrer, signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher();
      await proofOfHumanity.setIsHuman(referrer.address, false);

      await expect(claim(voucher)).to.be.revertedWith("invalid referrer");
    });

    it("rejects claims when the referee is no longer human", async function () {
      const { proofOfHumanity, referee, signVoucher, claim } = await deployFixture();
      const voucher = await signVoucher();
      await proofOfHumanity.setIsHuman(referee.address, false);

      await expect(claim(voucher)).to.be.revertedWith("invalid referee");
    });
  });

  describe("withdraw", function () {
    it("allows the owner to withdraw reward tokens", async function () {
      const { owner, token, distributor } = await deployFixture();
      const amount = ethers.parseEther("500");
      const balanceBefore = await token.balanceOf(owner.address);

      await expect(distributor.withdraw(amount))
        .to.emit(distributor, "Withdrawn")
        .withArgs(owner.address, amount);

      expect(await token.balanceOf(owner.address)).to.equal(balanceBefore + amount);
    });
  });
});
