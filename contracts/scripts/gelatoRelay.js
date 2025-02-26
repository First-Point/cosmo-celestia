// Bu script, Gelato Relay API'sini kullanarak gasless işlemler gerçekleştirir
// npm install @gelatonetwork/relay-sdk ethers@5.7.2

const { GelatoRelay, EvmTransactionStatus } = require("@gelatonetwork/relay-sdk");
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  // Gelato Relay instance oluştur
  const relay = new GelatoRelay();
  
  // Kontrat adreslerini ve ABI'leri tanımla
  const icecreamTokenAddress = "0xEcAe8C3655dC10760288F62698D3d36a53918C74";
  const icecreamTokenABI = [
    "function mint(uint256 amount) external",
    "function transfer(address to, uint256 amount) external returns (bool)"
  ];
  
  // Kullanıcı cüzdanını oluştur
  const provider = new ethers.providers.JsonRpcProvider(process.env.ABC_TESTNET_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Kontrat instance'ını oluştur
  const icecreamToken = new ethers.Contract(icecreamTokenAddress, icecreamTokenABI, wallet);
  
  // Transfer işlemi için veri oluştur
  const recipient = "RECIPIENT_ADDRESS";
  const amount = ethers.utils.parseEther("10"); // 10 ICECREAM
  
  const { data } = await icecreamToken.populateTransaction.transfer(recipient, amount);
  
  // Sponsorlu işlem için request oluştur
  const request = {
    chainId: 112, // ABC testnet chain ID
    target: icecreamTokenAddress,
    data: data,
    user: wallet.address
  };
  
  // İşlemi imzala
  const { taskId } = await relay.sponsoredCall(request, wallet);
  
  console.log(`Relay taskId: ${taskId}`);
  
  // İşlem durumunu takip et
  let status;
  while (status !== EvmTransactionStatus.CONFIRMED) {
    await new Promise(r => setTimeout(r, 2000)); // 2 saniye bekle
    const taskStatus = await relay.getTaskStatus(taskId);
    status = taskStatus.taskState;
    console.log(`Task status: ${status}`);
    
    if (status === EvmTransactionStatus.FAILED || status === EvmTransactionStatus.CANCELLED) {
      throw new Error(`Relay transaction failed with status: ${status}`);
    }
  }
  
  console.log("Relay transaction confirmed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 