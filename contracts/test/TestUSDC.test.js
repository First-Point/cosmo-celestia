const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestUSDC", function () {
  let testUSDC;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy TestUSDC
    const TestUSDC = await ethers.getContractFactory("TestUSDC");
    testUSDC = await TestUSDC.deploy(1000000); // 1 million tokens
    
    // Transfer some tokens to users for testing
    await testUSDC.transfer(user1.address, "1000000000"); // 1,000 USDC
    await testUSDC.transfer(user2.address, "1000000000"); // 1,000 USDC
  });
  
  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      expect(await testUSDC.name()).to.equal("Test USDC");
      expect(await testUSDC.symbol()).to.equal("tUSDC");
    });
    
    it("Should mint initial supply to deployer", async function () {
      const totalSupply = await testUSDC.totalSupply();
      const ownerBalance = await testUSDC.balanceOf(owner.address);
      
      // Initial supply minus transfers to users
      expect(ownerBalance).to.equal(totalSupply - BigInt("2000000000"));
    });
    
    it("Should have 6 decimals like real USDC", async function () {
      expect(await testUSDC.decimals()).to.equal(6);
    });
  });
  
  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const initialUser1Balance = await testUSDC.balanceOf(user1.address);
      const transferAmount = "100000000"; // 100 USDC
      
      // Transfer from user1 to user2
      await testUSDC.connect(user1).transfer(user2.address, transferAmount);
      
      // Check balances
      expect(await testUSDC.balanceOf(user1.address)).to.equal(initialUser1Balance - BigInt(transferAmount));
      expect(await testUSDC.balanceOf(user2.address)).to.equal("1100000000"); // 1,100 USDC
    });
    
    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialUser1Balance = await testUSDC.balanceOf(user1.address);
      
      // Try to send more tokens than user1 has
      await expect(
        testUSDC.connect(user1).transfer(user2.address, initialUser1Balance + BigInt(1))
      ).to.be.reverted;
      
      // Balances should remain unchanged
      expect(await testUSDC.balanceOf(user1.address)).to.equal(initialUser1Balance);
    });
  });
  
  describe("Minting", function () {
    it("Should allow users to mint tokens within limits", async function () {
      const initialBalance = await testUSDC.balanceOf(user1.address);
      const mintAmount = "500000000"; // 500 USDC
      
      await testUSDC.connect(user1).mint(mintAmount);
      
      expect(await testUSDC.balanceOf(user1.address)).to.equal(initialBalance + BigInt(mintAmount));
    });
    
    it("Should enforce maximum mint amount", async function () {
      const maxMintAmount = await testUSDC.MAX_MINT_AMOUNT();
      const tooMuch = (maxMintAmount + 1n).toString();
      
      await expect(
        testUSDC.connect(user1).mint(tooMuch)
      ).to.be.revertedWith("Amount exceeds maximum mint limit");
    });
    
    it("Should enforce cooldown period between mints", async function () {
      // First mint should succeed
      await testUSDC.connect(user1).mint("100000000"); // 100 USDC
      
      // Second mint should fail due to cooldown
      await expect(
        testUSDC.connect(user1).mint("100000000")
      ).to.be.revertedWith("Cooldown period not elapsed");
    });
    
    it("Should allow minting after cooldown period", async function () {
      // First mint
      await testUSDC.connect(user1).mint("100000000"); // 100 USDC
      
      // Increase time by more than the cooldown period (1 hour + 1 second)
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Second mint should now succeed
      await expect(
        testUSDC.connect(user1).mint("100000000")
      ).not.to.be.reverted;
    });
  });
  
  describe("Burning", function () {
    it("Should allow token burning", async function () {
      const initialBalance = await testUSDC.balanceOf(user1.address);
      const burnAmount = "500000000"; // 500 USDC
      
      await testUSDC.connect(user1).burn(burnAmount);
      
      expect(await testUSDC.balanceOf(user1.address)).to.equal(initialBalance - BigInt(burnAmount));
    });
    
    it("Should fail if trying to burn more than balance", async function () {
      const initialBalance = await testUSDC.balanceOf(user1.address);
      
      await expect(
        testUSDC.connect(user1).burn(initialBalance + BigInt(1))
      ).to.be.reverted;
    });
  });
}); 