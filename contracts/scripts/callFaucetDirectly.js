const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Calling CosmoDEX faucet functions directly...");
  
  const [account] = await ethers.getSigners();
  console.log("Using account:", account.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(account.address)), "ETH");
  
  // CosmoDEX kontrat adresi
  const cosmoDEXAddress = "0x77B6C925AdF68517A74aBAEDd83b877C195591B5";
  console.log("\nCosmoDEX address:", cosmoDEXAddress);
  
  // Token adreslerini almak için minimal ABI
  const minimalABI = [
    "function icecreamToken() view returns (address)",
    "function usdcToken() view returns (address)",
    "function icecreamFaucet()",
    "function usdcFaucet()",
    "function bothTokensFaucet()"
  ];
  
  // Kontrata doğrudan erişim
  const cosmoDEX = new ethers.Contract(cosmoDEXAddress, minimalABI, account);
  
  try {
    // Token adreslerini al
    const icecreamTokenAddress = await cosmoDEX.icecreamToken();
    const usdcTokenAddress = await cosmoDEX.usdcToken();
    
    console.log("\nToken addresses:");
    console.log("IcecreamToken:", icecreamTokenAddress);
    console.log("TestUSDC:", usdcTokenAddress);
    
    // Token kontratlarına erişim için minimal ABI
    const tokenABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];
    
    const icecreamToken = new ethers.Contract(icecreamTokenAddress, tokenABI, account);
    const testUSDC = new ethers.Contract(usdcTokenAddress, tokenABI, account);
    
    // Token bilgilerini al
    const icecreamDecimals = await icecreamToken.decimals();
    const usdcDecimals = await testUSDC.decimals();
    
    // Başlangıç bakiyelerini kontrol et
    const initialIcecreamBalance = await icecreamToken.balanceOf(account.address);
    const initialUsdcBalance = await testUSDC.balanceOf(account.address);
    
    console.log("\nInitial token balances:");
    console.log(`ICECREAM balance: ${ethers.formatUnits(initialIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`USDC balance: ${ethers.formatUnits(initialUsdcBalance, usdcDecimals)} USDC`);
    
    // 1. ICECREAM faucet'i test et
    console.log("\n1. Testing ICECREAM faucet...");
    try {
      // Doğrudan fonksiyon çağrısı
      const tx = await cosmoDEX.icecreamFaucet();
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
      // Doğrudan fonksiyon çağrısı
      const tx = await cosmoDEX.usdcFaucet();
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
      // Doğrudan fonksiyon çağrısı
      const tx = await cosmoDEX.bothTokensFaucet();
      await tx.wait();
      console.log("Both tokens faucet transaction successful!");
      
      // Yeni bakiyeleri kontrol et
      const finalIcecreamBalance = await icecreamToken.balanceOf(account.address);
      const finalUsdcBalance = await testUSDC.balanceOf(account.address);
      
      console.log("\nFinal token balances:");
      console.log(`ICECREAM balance: ${ethers.formatUnits(finalIcecreamBalance, icecreamDecimals)} ICECREAM`);
      console.log(`USDC balance: ${ethers.formatUnits(finalUsdcBalance, usdcDecimals)} USDC`);
      
      console.log(`Total received from faucets:`);
      console.log(`ICECREAM: ${ethers.formatUnits(finalIcecreamBalance - initialIcecreamBalance, icecreamDecimals)} ICECREAM`);
      console.log(`USDC: ${ethers.formatUnits(finalUsdcBalance - initialUsdcBalance, usdcDecimals)} USDC`);
    } catch (error) {
      console.error("Error using both tokens faucet:", error.message);
      
      // Hata detaylarını göster
      console.log("\nError details:");
      console.log(error);
    }
  } catch (error) {
    console.error("Error accessing contract:", error.message);
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