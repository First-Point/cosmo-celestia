const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer, user] = await ethers.getSigners();
  
  // Kontrat adreslerini buraya girin
  const icecreamTokenAddress = "0xEcAe8C3655dC10760288F62698D3d36a53918C74";
  const testUSDCAddress = "0x0829344670A694d66Eac833308d0b2879c2f8899";
  const relayerAddress = "YOUR_RELAYER_ADDRESS"; // Relayer kontratının adresini buraya girin
  
  // Kontratları bağla
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = IcecreamToken.attach(icecreamTokenAddress);
  
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = TestUSDC.attach(testUSDCAddress);
  
  const TokenRelayer = await ethers.getContractFactory("TokenRelayer");
  const relayer = TokenRelayer.attach(relayerAddress);
  
  // Relay işlemi için parametreler
  const token = icecreamTokenAddress; // veya testUSDCAddress
  const from = user.address;
  const to = deployer.address;
  const amount = ethers.parseEther("10"); // 10 ICECREAM
  const nonce = Date.now(); // Basit bir nonce
  
  // İmza oluşturma
  const messageHash = ethers.solidityPackedKeccak256(
    ["string", "address", "address", "address", "uint256", "uint256"],
    ["relayTransfer", token, from, to, amount, nonce]
  );
  
  const signature = await user.signMessage(ethers.getBytes(messageHash));
  
  console.log("Relaying transfer transaction...");
  console.log("Token:", token);
  console.log("From:", from);
  console.log("To:", to);
  console.log("Amount:", ethers.formatEther(amount));
  console.log("Nonce:", nonce);
  
  // Önce token onayı gerekiyor
  await icecreamToken.connect(user).approve(relayerAddress, amount);
  
  // Relay işlemini gerçekleştir
  const tx = await relayer.relayTransfer(
    token,
    from,
    to,
    amount,
    nonce,
    signature
  );
  
  await tx.wait();
  console.log("Transfer relayed successfully!");
  console.log("Transaction hash:", tx.hash);
  
  // Bakiyeleri kontrol et
  const toBalance = await icecreamToken.balanceOf(to);
  console.log("Recipient balance:", ethers.formatEther(toBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 