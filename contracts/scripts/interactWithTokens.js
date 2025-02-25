const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Token adreslerini buraya girin
  const icecreamTokenAddress = "0xEcAe8C3655dC10760288F62698D3d36a53918C74";
  const testUSDCAddress = "0x0829344670A694d66Eac833308d0b2879c2f8899";
  
  // Kontratları bağla
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = IcecreamToken.attach(icecreamTokenAddress);
  
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = TestUSDC.attach(testUSDCAddress);
  
  // Token bilgilerini göster
  console.log("IcecreamToken Info:");
  console.log("Name:", await icecreamToken.name());
  console.log("Symbol:", await icecreamToken.symbol());
  console.log("Decimals:", await icecreamToken.decimals());
  console.log("Total Supply:", ethers.formatEther(await icecreamToken.totalSupply()));
  console.log("Your Balance:", ethers.formatEther(await icecreamToken.balanceOf(deployer.address)));
  
  console.log("\nTestUSDC Info:");
  console.log("Name:", await testUSDC.name());
  console.log("Symbol:", await testUSDC.symbol());
  console.log("Decimals:", await testUSDC.decimals());
  console.log("Total Supply:", (await testUSDC.totalSupply()) / 10**6);
  console.log("Your Balance:", (await testUSDC.balanceOf(deployer.address)) / 10**6);
  
  // Token mint etme (isteğe bağlı)
  const mintIcecream = true; // true yaparak mint edebilirsiniz
  const mintUSDC = true; // true yaparak mint edebilirsiniz
  
  if (mintIcecream) {
    console.log("\nMinting 100 Icecream tokens...");
    const tx1 = await icecreamToken.mint(ethers.parseEther("100"));
    await tx1.wait();
    console.log("Minted! New balance:", ethers.formatEther(await icecreamToken.balanceOf(deployer.address)));
  }
  
  if (mintUSDC) {
    console.log("\nMinting 100 USDC tokens...");
    const tx2 = await testUSDC.mint("100000000"); // 100 USDC (6 decimals)
    await tx2.wait();
    console.log("Minted! New balance:", (await testUSDC.balanceOf(deployer.address)) / 10**6);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 