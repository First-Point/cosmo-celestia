const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting CosmoDEX deployment script for ABC testnet with existing tokens...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Mevcut token adresleri
  const icecreamTokenAddress = "0xEcAe8C3655dC10760288F62698D3d36a53918C74";
  const testUSDCAddress = "0x0829344670A694d66Eac833308d0b2879c2f8899";
  
  console.log("\nUsing existing tokens:");
  console.log("IcecreamToken address:", icecreamTokenAddress);
  console.log("TestUSDC address:", testUSDCAddress);
  
  // Token kontratlarına erişim
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = IcecreamToken.attach(icecreamTokenAddress);
  
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = TestUSDC.attach(testUSDCAddress);
  
  // Token bakiyelerini kontrol et
  const icecreamBalance = await icecreamToken.balanceOf(deployer.address);
  const usdcBalance = await testUSDC.balanceOf(deployer.address);
  
  console.log("\nCurrent token balances:");
  console.log(`ICECREAM balance: ${ethers.formatEther(icecreamBalance)} ICECREAM`);
  console.log(`USDC balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
  
  // ABC testnet için Gelato Relay trusted forwarder adresi
  const trustedForwarderAddress = "0x61F2976610970AFeDc1d83229e1E21bdc3D5cbE4";
  console.log("\nUsing Gelato Relay trusted forwarder address:", trustedForwarderAddress);
  
  // Deploy CosmoDEX
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
  
  // Likidite eklemek için token miktarları
  const icecreamAmount = ethers.parseEther("1000"); // 1,000 ICECREAM
  const usdcAmount = ethers.parseUnits("1000", 6); // 1,000 USDC (6 decimals)
  
  // Eğer bakiyeler yetersizse, token mint et
  if (icecreamBalance < icecreamAmount) {
    console.log("\nMinting additional ICECREAM tokens...");
    const mintAmount = icecreamAmount - icecreamBalance;
    const icecreamMintTx = await icecreamToken.mint(mintAmount);
    await icecreamMintTx.wait();
    console.log(`Minted ${ethers.formatEther(mintAmount)} additional ICECREAM tokens`);
  }
  
  if (usdcBalance < usdcAmount) {
    console.log("\nMinting additional USDC tokens...");
    const mintAmount = usdcAmount - usdcBalance;
    const usdcMintTx = await testUSDC.mint(mintAmount);
    await usdcMintTx.wait();
    console.log(`Minted ${ethers.formatUnits(mintAmount, 6)} additional USDC tokens`);
  }
  
  // Token'ları CosmoDEX için onaylama
  console.log("\nApproving tokens for CosmoDEX...");
  
  // ICECREAM token'larını onayla
  const icecreamApprovalTx = await icecreamToken.approve(cosmoDEXAddress, icecreamAmount);
  await icecreamApprovalTx.wait();
  console.log(`Approved ${ethers.formatEther(icecreamAmount)} ICECREAM tokens for CosmoDEX`);
  
  // USDC token'larını onayla
  const usdcApprovalTx = await testUSDC.approve(cosmoDEXAddress, usdcAmount);
  await usdcApprovalTx.wait();
  console.log(`Approved ${ethers.formatUnits(usdcAmount, 6)} USDC tokens for CosmoDEX`);
  
  // CosmoDEX'e likidite ekleme
  console.log("\nAdding initial liquidity to CosmoDEX...");
  const minLiquidity = 0; // İlk likidite sağlayıcısı için minimum likidite 0
  
  const addLiquidityTx = await cosmoDEX.addLiquidity(
    icecreamAmount,
    usdcAmount,
    minLiquidity
  );
  const receipt = await addLiquidityTx.wait();
  
  // İşlem makbuzundan AddLiquidity olayını bul
  const addLiquidityEvent = receipt.logs
    .filter(log => log.fragment && log.fragment.name === 'AddLiquidity')
    .map(log => cosmoDEX.interface.parseLog(log))[0];
  
  if (addLiquidityEvent) {
    const liquidityMinted = addLiquidityEvent.args.liquidityMinted;
    console.log(`Added liquidity successfully! Liquidity tokens minted: ${ethers.formatEther(liquidityMinted)}`);
  } else {
    console.log("Added liquidity successfully!");
  }
  
  // Mevcut rezervleri al ve göster
  const reserves = await cosmoDEX.getReserves();
  console.log("\nCurrent reserves in CosmoDEX:");
  console.log(`ICECREAM reserve: ${ethers.formatEther(reserves[0])}`);
  console.log(`USDC reserve: ${ethers.formatUnits(reserves[1], 6)}`);
  
  console.log("\nDeployment and liquidity addition completed successfully!");
  console.log("-------------------------------------------");
  console.log("Contract Addresses:");
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