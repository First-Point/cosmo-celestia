const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Checking CosmoDEX faucet limits...");
  
  const [account] = await ethers.getSigners();
  console.log("Using account:", account.address);
  
  // CosmoDEX kontrat adresi
  const cosmoDEXAddress = "0x77B6C925AdF68517A74aBAEDd83b877C195591B5";
  console.log("\nCosmoDEX address:", cosmoDEXAddress);
  
  // CosmoDEX kontratının ABI'sini al
  const CosmoDEX = await ethers.getContractFactory("CosmoDEX");
  const cosmoDEXABI = CosmoDEX.interface.format();
  
  // Kontrata doğrudan erişim
  const cosmoDEX = new ethers.Contract(cosmoDEXAddress, cosmoDEXABI, account);
  
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
  
  // Token kontratlarının ABI'lerini al
  const icecreamTokenABI = IcecreamToken.interface.format();
  const testUSDCABI = TestUSDC.interface.format();
  
  // Token kontratlarının fonksiyonlarını kontrol et
  console.log("\nChecking token contracts for mint limits...");
  
  // IcecreamToken fonksiyonları
  const icecreamFunctions = IcecreamToken.interface.fragments
    .filter(fragment => fragment.type === 'function')
    .map(fragment => fragment.name);
  
  console.log("\nIcecreamToken functions:");
  console.log(icecreamFunctions);
  
  // TestUSDC fonksiyonları
  const usdcFunctions = TestUSDC.interface.fragments
    .filter(fragment => fragment.type === 'function')
    .map(fragment => fragment.name);
  
  console.log("\nTestUSDC functions:");
  console.log(usdcFunctions);
  
  // Mint fonksiyonlarını kontrol et
  if (icecreamFunctions.includes('mint')) {
    try {
      // Mint fonksiyonunun parametrelerini kontrol et
      const mintFunction = IcecreamToken.interface.fragments.find(f => f.name === 'mint');
      console.log("\nIcecreamToken mint function parameters:", mintFunction.inputs);
      
      // Mint limiti var mı kontrol et
      if (icecreamFunctions.includes('MAX_MINT_AMOUNT')) {
        const maxMintAmount = await icecreamToken.MAX_MINT_AMOUNT();
        console.log("IcecreamToken MAX_MINT_AMOUNT:", ethers.formatEther(maxMintAmount));
      }
    } catch (error) {
      console.error("Error checking IcecreamToken mint function:", error.message);
    }
  }
  
  // CosmoDEX faucet fonksiyonlarını kontrol et
  console.log("\nChecking CosmoDEX faucet functions...");
  
  // CosmoDEX fonksiyonları
  const cosmoDEXFunctions = CosmoDEX.interface.fragments
    .filter(fragment => fragment.type === 'function')
    .map(fragment => fragment.name);
  
  console.log("\nCosmoDEX functions related to faucets:");
  const faucetRelatedFunctions = cosmoDEXFunctions.filter(name => 
    name.toLowerCase().includes('faucet') || 
    name.toLowerCase().includes('mint')
  );
  console.log(faucetRelatedFunctions);
  
  // Faucet miktarlarını kontrol et
  if (cosmoDEXFunctions.includes('ICECREAM_FAUCET_AMOUNT')) {
    const icecreamFaucetAmount = await cosmoDEX.ICECREAM_FAUCET_AMOUNT();
    console.log("\nICECREAM_FAUCET_AMOUNT:", ethers.formatEther(icecreamFaucetAmount));
  }
  
  if (cosmoDEXFunctions.includes('USDC_FAUCET_AMOUNT')) {
    const usdcFaucetAmount = await cosmoDEX.USDC_FAUCET_AMOUNT();
    console.log("USDC_FAUCET_AMOUNT:", ethers.formatUnits(usdcFaucetAmount, 6));
  }
  
  // Token kontratlarının bakiyelerini kontrol et
  const icecreamTokenBalance = await icecreamToken.balanceOf(cosmoDEXAddress);
  const usdcTokenBalance = await testUSDC.balanceOf(cosmoDEXAddress);
  
  console.log("\nToken balances in CosmoDEX contract:");
  console.log(`ICECREAM balance: ${ethers.formatEther(icecreamTokenBalance)} ICECREAM`);
  console.log(`USDC balance: ${ethers.formatUnits(usdcTokenBalance, 6)} USDC`);
  
  console.log("\nFaucet limit check completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 