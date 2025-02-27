const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Checking token mint limits...");
  
  const [account] = await ethers.getSigners();
  console.log("Using account:", account.address);
  
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
  
  // Token kontratlarının kaynak kodunu kontrol et
  console.log("\nChecking token contract source code...");
  
  // IcecreamToken kontratının kaynak kodunu kontrol et
  try {
    // Kontrat değişkenlerini kontrol et
    console.log("\nIcecreamToken contract variables:");
    
    // MAX_MINT_AMOUNT
    try {
      const maxMintAmount = await icecreamToken.MAX_MINT_AMOUNT();
      console.log("MAX_MINT_AMOUNT:", ethers.formatEther(maxMintAmount));
    } catch (error) {
      console.log("MAX_MINT_AMOUNT not found or not public");
    }
    
    // Mint fonksiyonunu kontrol et
    console.log("\nIcecreamToken mint function:");
    const mintFunction = IcecreamToken.interface.fragments.find(f => f.name === 'mint');
    if (mintFunction) {
      console.log("Parameters:", mintFunction.inputs);
    } else {
      console.log("Mint function not found in ABI");
    }
  } catch (error) {
    console.error("Error checking IcecreamToken:", error.message);
  }
  
  // TestUSDC kontratının kaynak kodunu kontrol et
  try {
    // Kontrat değişkenlerini kontrol et
    console.log("\nTestUSDC contract variables:");
    
    // MAX_MINT_AMOUNT
    try {
      const maxMintAmount = await testUSDC.MAX_MINT_AMOUNT();
      console.log("MAX_MINT_AMOUNT:", ethers.formatUnits(maxMintAmount, 6));
    } catch (error) {
      console.log("MAX_MINT_AMOUNT not found or not public");
    }
    
    // Mint fonksiyonunu kontrol et
    console.log("\nTestUSDC mint function:");
    const mintFunction = TestUSDC.interface.fragments.find(f => f.name === 'mint');
    if (mintFunction) {
      console.log("Parameters:", mintFunction.inputs);
    } else {
      console.log("Mint function not found in ABI");
    }
  } catch (error) {
    console.error("Error checking TestUSDC:", error.message);
  }
  
  console.log("\nToken mint limits check completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 