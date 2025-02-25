require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    abc: {
      url: process.env.ABC_TESTNET_RPC_URL || "https://rpc.abc.t.raas.gelato.cloud",
      accounts: process.env.ABC_TESTNET_PRIVATE_KEY ? [process.env.ABC_TESTNET_PRIVATE_KEY] : [],
      chainId: 112 // ABC testnet chain ID
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}; 