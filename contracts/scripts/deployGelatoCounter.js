const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying GelatoCounter with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Gelato Relay'in trusted forwarder adresi (ağa göre değişir)
  // ABC testnet için Gelato Relay trusted forwarder adresi
  const trustedForwarder = "0x61F2976610970AFeDc1d83229e1E21bdc3D5cbE4";
  
  // Deploy GelatoCounter
  const GelatoCounter = await ethers.getContractFactory("GelatoCounter");
  const counter = await GelatoCounter.deploy(trustedForwarder);
  await counter.waitForDeployment();
  
  const counterAddress = await counter.getAddress();
  console.log("GelatoCounter deployed to:", counterAddress);
  
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 