const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CosmoDEX", function () {
  let tokenA;
  let tokenB;
  let dex;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy tokens
    const TokenA = await ethers.getContractFactory("TokenA");
    tokenA = await TokenA.deploy(1000000);
    
    const TokenB = await ethers.getContractFactory("TokenB");
    tokenB = await TokenB.deploy(1000000);
    
    // Deploy DEX
    const CosmoDEX = await ethers.getContractFactory("CosmoDEX");
    dex = await CosmoDEX.deploy(await tokenA.getAddress(), await tokenB.getAddress());
    
    // Transfer some tokens to users
    await tokenA.transfer(user1.address, ethers.parseEther("10000"));
    await tokenB.transfer(user1.address, ethers.parseEther("10000"));
    await tokenA.transfer(user2.address, ethers.parseEther("10000"));
    await tokenB.transfer(user2.address, ethers.parseEther("10000"));
    
    // Approve DEX to spend tokens
    await tokenA.approve(await dex.getAddress(), ethers.parseEther("1000000"));
    await tokenB.approve(await dex.getAddress(), ethers.parseEther("1000000"));
    await tokenA.connect(user1).approve(await dex.getAddress(), ethers.parseEther("10000"));
    await tokenB.connect(user1).approve(await dex.getAddress(), ethers.parseEther("10000"));
    await tokenA.connect(user2).approve(await dex.getAddress(), ethers.parseEther("10000"));
    await tokenB.connect(user2).approve(await dex.getAddress(), ethers.parseEther("10000"));
  });
  
  describe("Deployment", function () {
    it("Should set the right token addresses", async function () {
      expect(await dex.tokenA()).to.equal(await tokenA.getAddress());
      expect(await dex.tokenB()).to.equal(await tokenB.getAddress());
    });
    
    it("Should have zero initial reserves", async function () {
      expect(await dex.reserveA()).to.equal(0);
      expect(await dex.reserveB()).to.equal(0);
    });
  });
  
  describe("Liquidity", function () {
    it("Should add initial liquidity correctly", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("1000");
      
      await expect(dex.addLiquidity(amountA, amountB, 0, 0))
        .to.emit(dex, "AddLiquidity");
      
      expect(await dex.reserveA()).to.equal(amountA);
      expect(await dex.reserveB()).to.equal(amountB);
    });
    
    it("Should add subsequent liquidity proportionally", async function () {
      // Add initial liquidity
      await dex.addLiquidity(
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0
      );
      
      // Add more liquidity
      await dex.connect(user1).addLiquidity(
        ethers.parseEther("500"),
        ethers.parseEther("500"),
        0,
        0
      );
      
      expect(await dex.reserveA()).to.equal(ethers.parseEther("1500"));
      expect(await dex.reserveB()).to.equal(ethers.parseEther("1500"));
    });
    
    it("Should remove liquidity correctly", async function () {
      // Add liquidity
      await dex.addLiquidity(
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0
      );
      
      const initialLiquidity = await dex.liquidity(owner.address);
      
      // Remove half of the liquidity
      await expect(dex.removeLiquidity(initialLiquidity / 2n, 0, 0))
        .to.emit(dex, "RemoveLiquidity");
      
      expect(await dex.reserveA()).to.equal(ethers.parseEther("500"));
      expect(await dex.reserveB()).to.equal(ethers.parseEther("500"));
    });
  });
  
  describe("Swapping", function () {
    beforeEach(async function () {
      // Add liquidity
      await dex.addLiquidity(
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0
      );
    });
    
    it("Should swap TokenA for TokenB correctly", async function () {
      const amountIn = ethers.parseEther("100");
      const expectedAmountOut = await dex.getExpectedOutput(
        amountIn,
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      
      await expect(dex.connect(user1).swap(
        amountIn,
        0,
        await tokenA.getAddress(),
        await tokenB.getAddress()
      ))
        .to.emit(dex, "Swap");
      
      // Check reserves updated
      expect(await dex.reserveA()).to.be.gt(ethers.parseEther("1000"));
      expect(await dex.reserveB()).to.be.lt(ethers.parseEther("1000"));
    });
    
    it("Should swap TokenB for TokenA correctly", async function () {
      const amountIn = ethers.parseEther("100");
      const expectedAmountOut = await dex.getExpectedOutput(
        amountIn,
        await tokenB.getAddress(),
        await tokenA.getAddress()
      );
      
      await expect(dex.connect(user1).swap(
        amountIn,
        0,
        await tokenB.getAddress(),
        await tokenA.getAddress()
      ))
        .to.emit(dex, "Swap");
      
      // Check reserves updated
      expect(await dex.reserveA()).to.be.lt(ethers.parseEther("1000"));
      expect(await dex.reserveB()).to.be.gt(ethers.parseEther("1000"));
    });
    
    it("Should record trade history", async function () {
      // Make a swap
      await dex.connect(user1).swap(
        ethers.parseEther("100"),
        0,
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      
      // Check trade history
      expect(await dex.getTradeHistoryLength()).to.equal(1);
      
      const trades = await dex.getTradeHistoryBatch(0, 1);
      expect(trades[0].trader).to.equal(user1.address);
      expect(trades[0].tokenIn).to.equal(await tokenA.getAddress());
      expect(trades[0].tokenOut).to.equal(await tokenB.getAddress());
      expect(trades[0].amountIn).to.equal(ethers.parseEther("100"));
    });
    
    it("Should allow AI-triggered trades", async function () {
      const amountIn = ethers.parseEther("100");
      
      await expect(dex.connect(user1).aiTriggeredSwap(
        amountIn,
        0,
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        user2.address
      ))
        .to.emit(dex, "AITriggeredTrade");
      
      // Check that user2 received the tokens
      expect(await tokenB.balanceOf(user2.address)).to.be.gt(ethers.parseEther("10000"));
    });
  });
}); 