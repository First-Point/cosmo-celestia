const { ethers } = require("hardhat");

async function main() {
  try {
    // Provider'ı al
    const provider = ethers.provider;
    console.log("Provider type:", typeof provider);
    
    // Provider'ın temel özelliklerini kontrol et
    console.log("Provider methods:", Object.keys(provider).filter(key => typeof provider[key] === 'function'));
    
    // Ağ bilgisini al
    const network = await provider.getNetwork();
    console.log("Network:", {
      name: network.name,
      chainId: Number(network.chainId)
    });
    
    // Blok numarasını al
    const blockNumber = await provider.getBlockNumber();
    console.log("Current block number:", blockNumber);
    
    // Gas fiyatını al
    const gasPrice = await provider.getFeeData();
    console.log("Gas price:", {
      gasPrice: gasPrice.gasPrice ? gasPrice.gasPrice.toString() : 'null',
      maxFeePerGas: gasPrice.maxFeePerGas ? gasPrice.maxFeePerGas.toString() : 'null',
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? gasPrice.maxPriorityFeePerGas.toString() : 'null'
    });
    
    // Signer'ı al ve test et
    const [signer] = await ethers.getSigners();
    console.log("Signer address:", await signer.getAddress());
    console.log("Signer balance:", (await signer.provider.getBalance(signer.address)).toString());
    
    console.log("Provider test successful!");
  } catch (error) {
    console.error("Provider test failed:", error);
  }
}

main().catch(console.error);