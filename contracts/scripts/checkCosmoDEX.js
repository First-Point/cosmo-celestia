const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Checking CosmoDEX contract information...");
  
  const [account] = await ethers.getSigners();
  console.log("Using account:", account.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(account.address)), "ETH");
  
  // CosmoDEX kontrat adresi
  const cosmoDEXAddress = "0x77B6C925AdF68517A74aBAEDd83b877C195591B5";
  console.log("\nCosmoDEX address:", cosmoDEXAddress);
  
  // CosmoDEX kontratına erişim
  const CosmoDEX = await ethers.getContractFactory("CosmoDEX");
  const cosmoDEX = CosmoDEX.attach(cosmoDEXAddress);
  
  // Token adreslerini al
  const icecreamTokenAddress = await cosmoDEX.icecreamToken();
  const usdcTokenAddress = await cosmoDEX.usdcToken();
  
  console.log("\nToken addresses:");
  console.log("IcecreamToken:", icecreamTokenAddress);
  console.log("TestUSDC:", usdcTokenAddress);
  
  // Token kontratlarına erişim
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = IcecreamToken.attach(icecreamTokenAddress);
  
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = TestUSDC.attach(usdcTokenAddress);
  
  // Token bilgilerini al
  const icecreamName = await icecreamToken.name();
  const icecreamSymbol = await icecreamToken.symbol();
  const icecreamDecimals = await icecreamToken.decimals();
  
  const usdcName = await testUSDC.name();
  const usdcSymbol = await testUSDC.symbol();
  const usdcDecimals = await testUSDC.decimals();
  
  console.log("\nToken information:");
  console.log(`IcecreamToken: ${icecreamName} (${icecreamSymbol}), Decimals: ${icecreamDecimals}`);
  console.log(`TestUSDC: ${usdcName} (${usdcSymbol}), Decimals: ${usdcDecimals}`);
  
  // Rezervleri al
  const reserves = await cosmoDEX.getReserves();
  const icecreamReserve = reserves[0];
  const usdcReserve = reserves[1];
  
  console.log("\nLiquidity pool reserves:");
  console.log(`ICECREAM reserve: ${ethers.formatEther(icecreamReserve)} ICECREAM`);
  console.log(`USDC reserve: ${ethers.formatUnits(usdcReserve, 6)} USDC`);
  
  // Toplam likidite
  const totalLiquidity = await cosmoDEX.totalLiquidity();
  console.log(`\nTotal liquidity tokens: ${ethers.formatEther(totalLiquidity)}`);
  
  // Kullanıcının likidite bakiyesi
  const userLiquidity = await cosmoDEX.liquidity(account.address);
  console.log(`Your liquidity tokens: ${ethers.formatEther(userLiquidity)} (${(userLiquidity * 100n / totalLiquidity).toString()}% of total)`);
  
  // Kullanıcının token çifti bakiyesi
  const userPairBalance = await cosmoDEX.getUserPairBalance(account.address);
  console.log("\nYour token pair balances in DEX:");
  console.log(`ICECREAM balance: ${ethers.formatEther(userPairBalance[0])} ICECREAM`);
  console.log(`USDC balance: ${ethers.formatUnits(userPairBalance[1], 6)} USDC`);
  
  // Kullanıcının token bakiyeleri
  const icecreamBalance = await icecreamToken.balanceOf(account.address);
  const usdcBalance = await testUSDC.balanceOf(account.address);
  
  console.log("\nYour token balances in wallet:");
  console.log(`ICECREAM balance: ${ethers.formatEther(icecreamBalance)} ICECREAM`);
  console.log(`USDC balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
  
  // Trader cüzdan adresi
  const traderWallet = await cosmoDEX.traderWallet();
  console.log("\nTrader wallet address:", traderWallet);
  
  // Sahibin adresi
  const owner = await cosmoDEX.owner();
  console.log("Owner address:", owner);
  
  // Takas oranlarını hesapla
  const oneIcecreamToUsdc = await cosmoDEX.getAmountOut(ethers.parseEther("1"), icecreamTokenAddress);
  const oneUsdcToIcecream = await cosmoDEX.getAmountOut(ethers.parseUnits("1", 6), usdcTokenAddress);
  
  console.log("\nCurrent exchange rates:");
  console.log(`1 ICECREAM = ${ethers.formatUnits(oneIcecreamToUsdc, 6)} USDC`);
  console.log(`1 USDC = ${ethers.formatEther(oneUsdcToIcecream)} ICECREAM`);
  
  console.log("\nCheck completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 