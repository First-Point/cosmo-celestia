const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing CosmoDEX parameterized faucet functions...");
  
  const [account] = await ethers.getSigners();
  console.log("Using account:", account.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(account.address)), "ETH");
  
  // CosmoDEX kontrat adresi
  const cosmoDEXAddress = "0x68Ef81065Bcad75401B1df5923611DfFD29596cc"; // Yeni deploy edilen adres
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
  const icecreamDecimals = await icecreamToken.decimals();
  const usdcDecimals = await testUSDC.decimals();
  
  // Başlangıç bakiyelerini kontrol et
  const initialIcecreamBalance = await icecreamToken.balanceOf(account.address);
  const initialUsdcBalance = await testUSDC.balanceOf(account.address);
  
  console.log("\nInitial token balances:");
  console.log(`ICECREAM balance: ${ethers.formatUnits(initialIcecreamBalance, icecreamDecimals)} ICECREAM`);
  console.log(`USDC balance: ${ethers.formatUnits(initialUsdcBalance, usdcDecimals)} USDC`);
  
  // Faucet miktarlarını göster
  const icecreamFaucetAmount = await cosmoDEX.ICECREAM_FAUCET_AMOUNT();
  const usdcFaucetAmount = await cosmoDEX.USDC_FAUCET_AMOUNT();
  
  console.log("\nFaucet amounts:");
  console.log(`ICECREAM faucet amount: ${ethers.formatUnits(icecreamFaucetAmount, icecreamDecimals)} ICECREAM`);
  console.log(`USDC faucet amount: ${ethers.formatUnits(usdcFaucetAmount, usdcDecimals)} USDC`);
  
  // 1. ICECREAM faucet'i test et
  console.log("\n1. Testing ICECREAM faucet...");
  try {
    // Parametreli faucet fonksiyonunu çağır
    const tx = await cosmoDEX.icecreamFaucet(account.address);
    await tx.wait();
    console.log("ICECREAM faucet transaction successful!");
    
    // Yeni bakiyeyi kontrol et
    const newIcecreamBalance = await icecreamToken.balanceOf(account.address);
    console.log(`New ICECREAM balance: ${ethers.formatUnits(newIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`Received: ${ethers.formatUnits(newIcecreamBalance - initialIcecreamBalance, icecreamDecimals)} ICECREAM`);
  } catch (error) {
    console.error("Error using ICECREAM faucet:", error.message);
    
    // Hata detaylarını göster
    console.log("\nError details:");
    console.log(error);
  }
  
  // 2. USDC faucet'i test et
  console.log("\n2. Testing USDC faucet...");
  try {
    // Parametreli faucet fonksiyonunu çağır
    const tx = await cosmoDEX.usdcFaucet(account.address);
    await tx.wait();
    console.log("USDC faucet transaction successful!");
    
    // Yeni bakiyeyi kontrol et
    const newUsdcBalance = await testUSDC.balanceOf(account.address);
    console.log(`New USDC balance: ${ethers.formatUnits(newUsdcBalance, usdcDecimals)} USDC`);
    console.log(`Received: ${ethers.formatUnits(newUsdcBalance - initialUsdcBalance, usdcDecimals)} USDC`);
  } catch (error) {
    console.error("Error using USDC faucet:", error.message);
    
    // Hata detaylarını göster
    console.log("\nError details:");
    console.log(error);
  }
  
  // 3. Both tokens faucet'i test et
  console.log("\n3. Testing both tokens faucet...");
  try {
    // Parametreli faucet fonksiyonunu çağır
    const tx = await cosmoDEX.bothTokensFaucet(account.address);
    await tx.wait();
    console.log("Both tokens faucet transaction successful!");
    
    // Yeni bakiyeleri kontrol et
    const finalIcecreamBalance = await icecreamToken.balanceOf(account.address);
    const finalUsdcBalance = await testUSDC.balanceOf(account.address);
    
    console.log("\nFinal token balances:");
    console.log(`ICECREAM balance: ${ethers.formatUnits(finalIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`USDC balance: ${ethers.formatUnits(finalUsdcBalance, usdcDecimals)} USDC`);
    
    console.log(`\nTotal received from faucets:`);
    console.log(`ICECREAM: ${ethers.formatUnits(finalIcecreamBalance - initialIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`USDC: ${ethers.formatUnits(finalUsdcBalance - initialUsdcBalance, usdcDecimals)} USDC`);
  } catch (error) {
    console.error("Error using both tokens faucet:", error.message);
    
    // Hata detaylarını göster
    console.log("\nError details:");
    console.log(error);
  }
  
  console.log("\nFaucet tests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 