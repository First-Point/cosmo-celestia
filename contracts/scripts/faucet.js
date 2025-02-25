const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Get token addresses from command line arguments or use default values
  const icecreamTokenAddress = process.argv[2] || "YOUR_DEPLOYED_ICECREAM_TOKEN_ADDRESS";
  const testUSDCAddress = process.argv[3] || "YOUR_DEPLOYED_TEST_USDC_ADDRESS";
  const recipientAddress = process.argv[4] || deployer.address;
  
  console.log("Minting tokens to:", recipientAddress);
  
  // Connect to deployed tokens
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = IcecreamToken.attach(icecreamTokenAddress);
  
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = TestUSDC.attach(testUSDCAddress);
  
  // Mint tokens to recipient
  try {
    const icecreamTx = await icecreamToken.mint(ethers.parseEther("1000"));
    await icecreamTx.wait();
    console.log("Minted 1000 ICECREAM tokens to", recipientAddress);
  } catch (error) {
    console.error("Failed to mint ICECREAM tokens:", error.message);
  }
  
  try {
    const usdcTx = await testUSDC.mint("1000000000"); // 1000 USDC (6 decimals)
    await usdcTx.wait();
    console.log("Minted 1000 tUSDC tokens to", recipientAddress);
  } catch (error) {
    console.error("Failed to mint tUSDC tokens:", error.message);
  }
  
  // Get balances
  const icecreamBalance = await icecreamToken.balanceOf(recipientAddress);
  const usdcBalance = await testUSDC.balanceOf(recipientAddress);
  
  console.log("Current balances:");
  console.log("ICECREAM:", ethers.formatEther(icecreamBalance));
  console.log("tUSDC:", usdcBalance / 10**6);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 