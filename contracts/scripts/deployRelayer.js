const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying TokenRelayer with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Token adreslerini buraya girin
  const icecreamTokenAddress = "0xEcAe8C3655dC10760288F62698D3d36a53918C74";
  const testUSDCAddress = "0x0829344670A694d66Eac833308d0b2879c2f8899";
  
  // Deploy TokenRelayer
  const TokenRelayer = await ethers.getContractFactory("TokenRelayer");
  const relayer = await TokenRelayer.deploy(icecreamTokenAddress, testUSDCAddress);
  await relayer.waitForDeployment();
  
  console.log("TokenRelayer deployed to:", await relayer.getAddress());
  console.log("-------------------------------------------");
  console.log("Contract Addresses:");
  console.log("IcecreamToken:", icecreamTokenAddress);
  console.log("TestUSDC:", testUSDCAddress);
  console.log("TokenRelayer:", await relayer.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 