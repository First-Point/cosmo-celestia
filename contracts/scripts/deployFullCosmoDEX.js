const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting full CosmoDEX deployment script for ABC testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // 1. Deploy IcecreamToken
  console.log("\nDeploying IcecreamToken...");
  const initialIcecreamSupply = 1000000; // 1,000,000 ICECREAM
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = await IcecreamToken.deploy(initialIcecreamSupply);
  await icecreamToken.waitForDeployment();
  const icecreamTokenAddress = await icecreamToken.getAddress();
  console.log("IcecreamToken deployed to:", icecreamTokenAddress);
  
  // 2. Deploy TestUSDC
  console.log("\nDeploying TestUSDC...");
  const initialUSDCSupply = 1000000; // 1,000,000 USDC
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = await TestUSDC.deploy(initialUSDCSupply);
  await testUSDC.waitForDeployment();
  const testUSDCAddress = await testUSDC.getAddress();
  console.log("TestUSDC deployed to:", testUSDCAddress);
  
  // 3. ABC testnet için Gelato Relay trusted forwarder adresi
  const trustedForwarderAddress = "0x61F2976610970AFeDc1d83229e1E21bdc3D5cbE4";
  console.log("Using Gelato Relay trusted forwarder address:", trustedForwarderAddress);
  
  // 4. Deploy CosmoDEX
  console.log("\nDeploying CosmoDEX...");
  const CosmoDEX = await ethers.getContractFactory("CosmoDEX");
  const cosmoDEX = await CosmoDEX.deploy(
    icecreamTokenAddress,
    testUSDCAddress,
    trustedForwarderAddress
  );
  await cosmoDEX.waitForDeployment();
  const cosmoDEXAddress = await cosmoDEX.getAddress();
  console.log("CosmoDEX deployed to:", cosmoDEXAddress);
  
  // 5. Mint tokens for liquidity
  console.log("\nMinting tokens for liquidity...");
  
  // Amount of tokens to add as initial liquidity
  const icecreamAmount = ethers.parseEther("1000"); // 1,000 ICECREAM
  const usdcAmount = ethers.parseUnits("1000", 6); // 1,000 USDC (6 decimals)
  
  // Mint ICECREAM tokens to deployer
  const icecreamMintTx = await icecreamToken.mint(icecreamAmount);
  await icecreamMintTx.wait();
  console.log(`Minted ${ethers.formatEther(icecreamAmount)} ICECREAM tokens to ${deployer.address}`);
  
  // Mint USDC tokens to deployer
  const usdcMintTx = await testUSDC.mint(usdcAmount);
  await usdcMintTx.wait();
  console.log(`Minted ${ethers.formatUnits(usdcAmount, 6)} USDC tokens to ${deployer.address}`);
  
  // 6. Approve tokens for CosmoDEX
  console.log("\nApproving tokens for CosmoDEX...");
  
  // Approve ICECREAM tokens
  const icecreamApprovalTx = await icecreamToken.approve(cosmoDEXAddress, icecreamAmount);
  await icecreamApprovalTx.wait();
  console.log(`Approved ${ethers.formatEther(icecreamAmount)} ICECREAM tokens for CosmoDEX`);
  
  // Approve USDC tokens
  const usdcApprovalTx = await testUSDC.approve(cosmoDEXAddress, usdcAmount);
  await usdcApprovalTx.wait();
  console.log(`Approved ${ethers.formatUnits(usdcAmount, 6)} USDC tokens for CosmoDEX`);
  
  // 7. Add liquidity to CosmoDEX
  console.log("\nAdding initial liquidity to CosmoDEX...");
  const minLiquidity = 0; // Minimum liquidity to receive (0 for first liquidity provider)
  
  const addLiquidityTx = await cosmoDEX.addLiquidity(
    icecreamAmount,
    usdcAmount,
    minLiquidity
  );
  const receipt = await addLiquidityTx.wait();
  
  // Find the AddLiquidity event in the transaction receipt
  const addLiquidityEvent = receipt.logs
    .filter(log => log.fragment && log.fragment.name === 'AddLiquidity')
    .map(log => cosmoDEX.interface.parseLog(log))[0];
  
  if (addLiquidityEvent) {
    const liquidityMinted = addLiquidityEvent.args.liquidityMinted;
    console.log(`Added liquidity successfully! Liquidity tokens minted: ${ethers.formatEther(liquidityMinted)}`);
  } else {
    console.log("Added liquidity successfully!");
  }
  
  // 8. Get and display current reserves
  const reserves = await cosmoDEX.getReserves();
  console.log("\nCurrent reserves in CosmoDEX:");
  console.log(`ICECREAM reserve: ${ethers.formatEther(reserves[0])}`);
  console.log(`USDC reserve: ${ethers.formatUnits(reserves[1], 6)}`);
  
  // 9. Test faucet functions
  console.log("\nTesting faucet functions...");
  
  // Test ICECREAM faucet
  console.log("\nTesting ICECREAM faucet...");
  try {
    const icecreamFaucetTx = await cosmoDEX.icecreamFaucet();
    await icecreamFaucetTx.wait();
    console.log("ICECREAM faucet transaction successful!");
    
    // Check new balance
    const icecreamBalance = await icecreamToken.balanceOf(deployer.address);
    console.log(`New ICECREAM balance: ${ethers.formatEther(icecreamBalance)}`);
  } catch (error) {
    console.error("Error using ICECREAM faucet:", error.message);
  }
  
  // Test USDC faucet
  console.log("\nTesting USDC faucet...");
  try {
    const usdcFaucetTx = await cosmoDEX.usdcFaucet();
    await usdcFaucetTx.wait();
    console.log("USDC faucet transaction successful!");
    
    // Check new balance
    const usdcBalance = await testUSDC.balanceOf(deployer.address);
    console.log(`New USDC balance: ${ethers.formatUnits(usdcBalance, 6)}`);
  } catch (error) {
    console.error("Error using USDC faucet:", error.message);
  }
  
  // Test both tokens faucet if available
  console.log("\nTesting both tokens faucet...");
  try {
    const bothTokensFaucetTx = await cosmoDEX.bothTokensFaucet();
    await bothTokensFaucetTx.wait();
    console.log("Both tokens faucet transaction successful!");
    
    // Check new balances
    const finalIcecreamBalance = await icecreamToken.balanceOf(deployer.address);
    const finalUsdcBalance = await testUSDC.balanceOf(deployer.address);
    
    console.log("\nFinal token balances:");
    console.log(`ICECREAM balance: ${ethers.formatEther(finalIcecreamBalance)}`);
    console.log(`USDC balance: ${ethers.formatUnits(finalUsdcBalance, 6)}`);
  } catch (error) {
    console.error("Error using both tokens faucet:", error.message);
  }
  
  console.log("\nDeployment and testing completed successfully!");
  console.log("-------------------------------------------");
  console.log("Contract Addresses to save:");
  console.log("IcecreamToken:", icecreamTokenAddress);
  console.log("TestUSDC:", testUSDCAddress);
  console.log("CosmoDEX:", cosmoDEXAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 