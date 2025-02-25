const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying tokens with the account:", deployer.address);
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
  
  console.log("Token deployment completed successfully!");
  console.log("-------------------------------------------");
  console.log("Token Addresses to save:");
  console.log("IcecreamToken:", await icecreamToken.getAddress());
  console.log("TestUSDC:", await testUSDC.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 