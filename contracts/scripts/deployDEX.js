const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying DEX with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Token adreslerini buraya girin
  const icecreamTokenAddress = "0xEcAe8C3655dC10760288F62698D3d36a53918C74";
  const testUSDCAddress = "0x0829344670A694d66Eac833308d0b2879c2f8899";
  
  // Deploy CosmoDEX
  const CosmoDEX = await ethers.getContractFactory("CosmoDEX");
  const dex = await CosmoDEX.deploy(icecreamTokenAddress, testUSDCAddress);
  await dex.waitForDeployment();
  
  console.log("CosmoDEX deployed to:", await dex.getAddress());
  
  // Tokenları bağla
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = IcecreamToken.attach(icecreamTokenAddress);
  
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = TestUSDC.attach(testUSDCAddress);
  
  // Approve tokens for DEX (optional)
  const addInitialLiquidity = false; // true yaparak başlangıç likidite ekleyebilirsiniz
  
  if (addInitialLiquidity) {
    console.log("Approving tokens for DEX...");
    await icecreamToken.approve(await dex.getAddress(), ethers.parseEther("10000"));
    await testUSDC.approve(await dex.getAddress(), "10000000000"); // 10,000 USDC
    
    console.log("Adding initial liquidity...");
    await dex.addLiquidity(
      ethers.parseEther("1000"), // 1,000 Icecream Tokens
      "1000000000", // 1,000 USDC
      0,
      0
    );
    
    console.log("Initial liquidity added!");
  }
  
  console.log("DEX deployment completed successfully!");
  console.log("-------------------------------------------");
  console.log("Contract Addresses:");
  console.log("IcecreamToken:", icecreamTokenAddress);
  console.log("TestUSDC:", testUSDCAddress);
  console.log("CosmoDEX:", await dex.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 