const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing CosmoDEX faucet functions...");
  
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
  
  // Başlangıç bakiyelerini kontrol et
  const initialIcecreamBalance = await icecreamToken.balanceOf(account.address);
  const initialUsdcBalance = await testUSDC.balanceOf(account.address);
  
  console.log("\nInitial token balances:");
  console.log(`ICECREAM balance: ${ethers.formatEther(initialIcecreamBalance)} ICECREAM`);
  console.log(`USDC balance: ${ethers.formatUnits(initialUsdcBalance, 6)} USDC`);
  
  // Faucet miktarlarını al
  const icecreamFaucetAmount = await cosmoDEX.ICECREAM_FAUCET_AMOUNT();
  const usdcFaucetAmount = await cosmoDEX.USDC_FAUCET_AMOUNT();
  
  console.log("\nFaucet amounts:");
  console.log(`ICECREAM faucet amount: ${ethers.formatEther(icecreamFaucetAmount)} ICECREAM`);
  console.log(`USDC faucet amount: ${ethers.formatUnits(usdcFaucetAmount, 6)} USDC`);
  
  // 1. ICECREAM faucet'i test et
  console.log("\n1. Testing ICECREAM faucet...");
  try {
    // Faucet fonksiyonunun parametreli mi parametresiz mi olduğunu kontrol et
    let tx;
    try {
      // Önce parametreli versiyonu dene
      tx = await cosmoDEX.icecreamFaucet(account.address);
      console.log("Using parameterized faucet function with recipient address");
    } catch (error) {
      // Parametresiz versiyonu dene
      tx = await cosmoDEX.icecreamFaucet();
      console.log("Using non-parameterized faucet function");
    }
    
    await tx.wait();
    console.log("ICECREAM faucet transaction successful!");
    
    // Yeni bakiyeyi kontrol et
    const newIcecreamBalance = await icecreamToken.balanceOf(account.address);
    console.log(`New ICECREAM balance: ${ethers.formatEther(newIcecreamBalance)} ICECREAM`);
    console.log(`Received: ${ethers.formatEther(newIcecreamBalance - initialIcecreamBalance)} ICECREAM`);
  } catch (error) {
    console.error("Error using ICECREAM faucet:", error.message);
  }
  
  // 2. USDC faucet'i test et
  console.log("\n2. Testing USDC faucet...");
  try {
    // Faucet fonksiyonunun parametreli mi parametresiz mi olduğunu kontrol et
    let tx;
    try {
      // Önce parametreli versiyonu dene
      tx = await cosmoDEX.usdcFaucet(account.address);
      console.log("Using parameterized faucet function with recipient address");
    } catch (error) {
      // Parametresiz versiyonu dene
      tx = await cosmoDEX.usdcFaucet();
      console.log("Using non-parameterized faucet function");
    }
    
    await tx.wait();
    console.log("USDC faucet transaction successful!");
    
    // Yeni bakiyeyi kontrol et
    const newUsdcBalance = await testUSDC.balanceOf(account.address);
    console.log(`New USDC balance: ${ethers.formatUnits(newUsdcBalance, 6)} USDC`);
    console.log(`Received: ${ethers.formatUnits(newUsdcBalance - initialUsdcBalance, 6)} USDC`);
  } catch (error) {
    console.error("Error using USDC faucet:", error.message);
  }
  
  // 3. Kontrat fonksiyonlarını kontrol et
  console.log("\n3. Checking available functions in the contract...");
  
  // Kontrat ABI'sini al
  const contractABI = CosmoDEX.interface.fragments;
  
  // Fonksiyon isimlerini filtrele
  const functionNames = contractABI
    .filter(fragment => fragment.type === 'function')
    .map(fragment => fragment.name);
  
  console.log("Available functions in the contract:");
  console.log(functionNames);
  
  // "both" veya "tokens" içeren fonksiyonları ara
  const bothTokensFunctions = functionNames.filter(name => 
    name.toLowerCase().includes('both') || 
    (name.toLowerCase().includes('tokens') && name.toLowerCase().includes('faucet'))
  );
  
  console.log("\nPossible 'both tokens' faucet functions:");
  console.log(bothTokensFunctions);
  
  // Eğer olası fonksiyon bulunduysa, test et
  if (bothTokensFunctions.length > 0) {
    console.log(`\nTesting ${bothTokensFunctions[0]} function...`);
    try {
      // Fonksiyonu dinamik olarak çağır
      let tx;
      try {
        // Önce parametreli versiyonu dene
        tx = await cosmoDEX[bothTokensFunctions[0]](account.address);
        console.log("Using parameterized function with recipient address");
      } catch (error) {
        // Parametresiz versiyonu dene
        tx = await cosmoDEX[bothTokensFunctions[0]]();
        console.log("Using non-parameterized function");
      }
      
      await tx.wait();
      console.log(`${bothTokensFunctions[0]} transaction successful!`);
      
      // Yeni bakiyeleri kontrol et
      const finalIcecreamBalance = await icecreamToken.balanceOf(account.address);
      const finalUsdcBalance = await testUSDC.balanceOf(account.address);
      
      console.log("\nFinal token balances:");
      console.log(`ICECREAM balance: ${ethers.formatEther(finalIcecreamBalance)} ICECREAM`);
      console.log(`USDC balance: ${ethers.formatUnits(finalUsdcBalance, 6)} USDC`);
      
      console.log(`Total received from faucets:`);
      console.log(`ICECREAM: ${ethers.formatEther(finalIcecreamBalance - initialIcecreamBalance)} ICECREAM`);
      console.log(`USDC: ${ethers.formatUnits(finalUsdcBalance - initialUsdcBalance, 6)} USDC`);
    } catch (error) {
      console.error(`Error using ${bothTokensFunctions[0]} function:`, error.message);
    }
  } else {
    console.log("\nNo 'both tokens' faucet function found in the contract.");
    console.log("You may need to call icecreamFaucet and usdcFaucet separately.");
  }
  
  console.log("\nFaucet tests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 