const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IcecreamToken", function () {
  let icecreamToken;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy IcecreamToken
    const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
    icecreamToken = await IcecreamToken.deploy(1000000); // 1 million tokens
    
    // Transfer some tokens to users for testing
    await icecreamToken.transfer(user1.address, ethers.parseEther("1000"));
    await icecreamToken.transfer(user2.address, ethers.parseEther("1000"));
  });
  
  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      expect(await icecreamToken.name()).to.equal("Icecream Token");
      expect(await icecreamToken.symbol()).to.equal("ICECREAM");
    });
    
    it("Should mint initial supply to deployer", async function () {
      const totalSupply = await icecreamToken.totalSupply();
      const ownerBalance = await icecreamToken.balanceOf(owner.address);
      
      // Initial supply minus transfers to users
      expect(ownerBalance).to.equal(totalSupply - ethers.parseEther("2000"));
    });
    
    it("Should have 18 decimals", async function () {
      expect(await icecreamToken.decimals()).to.equal(18);
    });
  });
  
  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const initialUser1Balance = await icecreamToken.balanceOf(user1.address);
      const transferAmount = ethers.parseEther("100");
      
      // Transfer from user1 to user2
      await icecreamToken.connect(user1).transfer(user2.address, transferAmount);
      
      // Check balances
      expect(await icecreamToken.balanceOf(user1.address)).to.equal(initialUser1Balance - transferAmount);
      expect(await icecreamToken.balanceOf(user2.address)).to.equal(ethers.parseEther("1100"));
    });
    
    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialUser1Balance = await icecreamToken.balanceOf(user1.address);
      
      // Try to send more tokens than user1 has
      await expect(
        icecreamToken.connect(user1).transfer(user2.address, initialUser1Balance + ethers.parseEther("1"))
      ).to.be.reverted;
      
      // Balances should remain unchanged
      expect(await icecreamToken.balanceOf(user1.address)).to.equal(initialUser1Balance);
    });
  });
  
  describe("Minting", function () {
    it("Should allow users to mint tokens within limits", async function () {
      const initialBalance = await icecreamToken.balanceOf(user1.address);
      const mintAmount = ethers.parseEther("500");
      
      await icecreamToken.connect(user1).mint(mintAmount);
      
      expect(await icecreamToken.balanceOf(user1.address)).to.equal(initialBalance + mintAmount);
    });
    
    it("Should enforce maximum mint amount", async function () {
      const maxMintAmount = await icecreamToken.MAX_MINT_AMOUNT();
      const tooMuch = maxMintAmount + 1n;
      
      await expect(
        icecreamToken.connect(user1).mint(tooMuch)
      ).to.be.revertedWith("Amount exceeds maximum mint limit");
    });
    
    it("Should enforce cooldown period between mints", async function () {
      // First mint should succeed
      await icecreamToken.connect(user1).mint(ethers.parseEther("100"));
      
      // Second mint should fail due to cooldown
      await expect(
        icecreamToken.connect(user1).mint(ethers.parseEther("100"))
      ).to.be.revertedWith("Cooldown period not elapsed");
    });
    
    it("Should allow minting after cooldown period", async function () {
      // First mint
      await icecreamToken.connect(user1).mint(ethers.parseEther("100"));
      
      // Increase time by more than the cooldown period (1 hour + 1 second)
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Second mint should now succeed
      await expect(
        icecreamToken.connect(user1).mint(ethers.parseEther("100"))
      ).not.to.be.reverted;
    });
  });
}); 