import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ReferralPayoutDistributor, MockERC20 } from "../typechain-types";

describe("ReferralPayoutDistributor", function () {
  let distributor: ReferralPayoutDistributor;
  let token: MockERC20;
  let newToken: MockERC20;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("10000");
  const AMOUNT_1 = ethers.parseEther("250");
  const AMOUNT_2 = ethers.parseEther("125");

  beforeEach(async function () {
    [owner, operator, user1, user2, nonOwner] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    token = await MockERC20Factory.deploy("Test Token", "TEST", 18, INITIAL_SUPPLY);
    newToken = await MockERC20Factory.deploy("New Token", "NEW", 18, INITIAL_SUPPLY);

    const DistributorFactory = await ethers.getContractFactory("ReferralPayoutDistributor");
    distributor = await DistributorFactory.deploy(await token.getAddress(), operator.address);

    await token.transfer(await distributor.getAddress(), ethers.parseEther("1000"));
  });

  it("distributes a referral payout batch", async function () {
    await expect(distributor.connect(operator).distribute([user1.address, user2.address], [AMOUNT_1, AMOUNT_2]))
      .to.emit(distributor, "Paid")
      .withArgs([user1.address, user2.address], [AMOUNT_1, AMOUNT_2]);

    expect(await token.balanceOf(user1.address)).to.equal(AMOUNT_1);
    expect(await token.balanceOf(user2.address)).to.equal(AMOUNT_2);
  });

  it("rejects invalid payout batches", async function () {
    await expect(distributor.connect(operator).distribute([user1.address], [])).to.be.revertedWith("length mismatch");
    await expect(distributor.connect(operator).distribute([ethers.ZeroAddress], [AMOUNT_1])).to.be.revertedWith("invalid recipient");
  });

  it("only allows the operator to distribute", async function () {
    await expect(
      distributor.connect(nonOwner).distribute([user1.address], [AMOUNT_1])
    ).to.be.revertedWith("not operator");
  });

  it("only allows the owner to withdraw", async function () {
    await expect(distributor.connect(nonOwner).withdraw(AMOUNT_1)).to.be.revertedWith("not owner");
  });

  it("withdraws tokens to the owner", async function () {
    const ownerBalanceBefore = await token.balanceOf(owner.address);

    await expect(distributor.withdraw(AMOUNT_1))
      .to.emit(distributor, "Withdrawn")
      .withArgs(owner.address, AMOUNT_1);

    expect((await token.balanceOf(owner.address)) - ownerBalanceBefore).to.equal(AMOUNT_1);
  });

  it("changes the payout token", async function () {
    await newToken.transfer(await distributor.getAddress(), ethers.parseEther("1000"));

    await expect(distributor.setToken(await newToken.getAddress()))
      .to.emit(distributor, "TokenChanged")
      .withArgs(await token.getAddress(), await newToken.getAddress());

    expect(await distributor.token()).to.equal(await newToken.getAddress());

    await distributor.connect(operator).distribute([user1.address], [AMOUNT_1]);

    expect(await newToken.balanceOf(user1.address)).to.equal(AMOUNT_1);
    expect(await token.balanceOf(user1.address)).to.equal(0);
  });

  it("only allows the owner to change the payout token", async function () {
    await expect(distributor.connect(nonOwner).setToken(await newToken.getAddress())).to.be.revertedWith("not owner");
    await expect(distributor.setToken(ethers.ZeroAddress)).to.be.revertedWith("invalid token");
  });

  it("changes the operator", async function () {
    await expect(distributor.setOperator(user1.address))
      .to.emit(distributor, "OperatorChanged")
      .withArgs(operator.address, user1.address);

    expect(await distributor.operator()).to.equal(user1.address);

    await expect(distributor.connect(operator).distribute([user2.address], [AMOUNT_1])).to.be.revertedWith("not operator");
    await distributor.connect(user1).distribute([user2.address], [AMOUNT_1]);

    expect(await token.balanceOf(user2.address)).to.equal(AMOUNT_1);
  });

  it("only allows the owner to change the operator", async function () {
    await expect(distributor.connect(nonOwner).setOperator(user1.address)).to.be.revertedWith("not owner");
    await expect(distributor.setOperator(ethers.ZeroAddress)).to.be.revertedWith("invalid operator");
  });

});
