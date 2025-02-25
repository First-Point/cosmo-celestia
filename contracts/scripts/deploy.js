const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Deploy IcecreamToken
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = await IcecreamToken.deploy(1000000); // 1 million tokens
  await icecreamToken.waitForDeployment();
  
  console.log("Icecream Token deployed to:", await icecreamToken.getAddress());
  
  // Deploy TestUSDC
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = await TestUSDC.deploy(1000000); // 1 million tokens
  await testUSDC.waitForDeployment();
  
  console.log("Test USDC deployed to:", await testUSDC.getAddress());
  
  // Deploy CosmoDEX
  const CosmoDEX = await ethers.getContractFactory("CosmoDEX");
  const dex = await CosmoDEX.deploy(await icecreamToken.getAddress(), await testUSDC.getAddress());
  await dex.waitForDeployment();
  
  console.log("Cosmo DEX deployed to:", await dex.getAddress());
  
  // Approve tokens for DEX
  await icecreamToken.approve(await dex.getAddress(), ethers.parseEther("1000000"));
  await testUSDC.approve(await dex.getAddress(), "1000000000000"); // 1 million USDC (6 decimals)
  
  // Add initial liquidity
  console.log("Adding initial liquidity...");
  await dex.addLiquidity(
    ethers.parseEther("100000"), // 100,000 Icecream Tokens
    "100000000000", // 100,000 USDC (6 decimals)
    0,
    0
  );
  
  console.log("Initial liquidity added!");
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 