# 🌌 Cosmo Celestia - AI-Powered DEX Trading Agents

## 🚀 Overview
Cosmo Celestia is a revolutionary AI trading agent powered by ElizaOS that automates trading strategies and executes trades on DEX platforms. Built on the ABC blockchain, it enables users to deploy intelligent trading agents that analyze market data, detect arbitrage opportunities, and execute trades automatically through our advanced AI system.

## 📍 Contract Addresses (ABC Testnet)

```
CosmoDEX: 0x68Ef81065Bcad75401B1df5923611DfFD29596cc
IcecreamToken: 0x5b0B5E7fbd7f88582a25dA520E3e355866669960
TestUSDC: 0x51Ed2EF83Db766f1555A5a2Ef6E602588aEd3c98
```

Demo link: https://app.cosmohub.ai/cosmo-celestia
![Screenshot 2025-03-01 at 03 35 37](https://github.com/user-attachments/assets/5aba83b0-4f80-4e7c-8f88-87934ddbfbd4)
![Screenshot 2025-03-01 at 05 05 33](https://github.com/user-attachments/assets/792822ea-8563-42c4-8467-976969cca5dd)
![Screenshot 2025-03-01 at 02 38 35](https://github.com/user-attachments/assets/2f36c03d-7aa3-4d22-87af-60c0794e2a0c)
![Screenshot 2025-03-01 at 05 05 46](https://github.com/user-attachments/assets/9187147d-2738-414b-a3d0-ba19cb214a2e)


## ✨ Key Features

### ⚡ Gelato-Powered Gas Sponsorship on ABC
- **Gelato Relay Integration**: Seamless transaction relay and execution system
- **ABC Rollup Integration**: Built on ABC's high-performance rollup for fast and secure transactions
- **Seamless UX**: Users can trade without worrying about gas fees
- **Sponsored Operations**: All agent operations are gas-sponsored
- **Meta-transactions**: Secure and reliable transaction relay system
- **Low Costs**: Reduced transaction fees through rollup batching
- **Fast Finality**: Quick transaction confirmations with rollup security

### 🤖 AI Trading Agents
- **Intelligent Market Analysis**: Real-time market data processing and pattern recognition
- **Automated Trading**: Smart execution of trades based on market conditions
- **Strategy Customization**: Configure risk levels and trading parameters
- **Adaptive Learning**: Agents evolve strategies based on market performance

### 💱 DEX Infrastructure
- **Efficient AMM**: Constant product formula (`x * y = k`) for reliable pricing
- **Liquidity Management**: Easy liquidity provision and removal
- **Token Support**: Compatible with all ERC20 tokens
- **Gasless Transactions**: Powered by Gelato Relay

### 📊 User Dashboard
- **Performance Tracking**: Real-time PnL and trade history
- **Agent Configuration**: Customize trading strategies and risk parameters
- **Market Analytics**: Comprehensive market data and trends
- **Portfolio Management**: Track and manage your positions


## Tech Stack
### ⚡ Smart Contracts Stack
- **Framework**: Hardhat
- **Language**: Solidity ^0.8.20
- **Key Libraries**:
  - OpenZeppelin Contracts
  - Gelato Relay SDK
- **Testing**: Hardhat Test & Waffle
- **Deployment**: Hardhat Deploy
- **Key Features**:
  - AMM Implementation
  - Liquidity Pool Management
  - Agent Integration
  - Gasless Transactions

### AI Agent (ElizaOS)
- **Framework**: ElizaOS AI Agent Framework
### Backend
- **Runtime**: Node.js
### Frontend
- **Framework**: Next.js


## 📋 Available Functions

### Liquidity Functions
```solidity
// Add liquidity to the pool
addLiquidity()

// Remove liquidity from the pool
removeLiquidity()

// Get liquidity for a provider
getLiquidity()
```

### Trading Functions
```solidity
// Swap IcecreamToken for USDC
swapIcecreamForUsdc()

// Swap USDC for IcecreamToken
swapUsdcForIcecream()

// Get expected output amount for a swap
getAmountOut()
```

### Pool Information
```solidity
// Get current pool reserves
getReserves()

// Get user's token pair balance
getUserPairBalance()
```

### Faucet Functions
```solidity
// Mint Icecream tokens to recipient
icecreamFaucet()

// Mint USDC tokens to recipient
usdcFaucet()

// Mint both tokens to recipient
bothTokensFaucet()
```

### Token Management
```solidity
// Deposit tokens to user's balance
depositTokens()

// Withdraw tokens from user's balance
withdrawTokens()
```

### Trader Operations
```solidity
// Swap tokens between user and trader
traderSwap()

// Swap user's IcecreamToken for TestUSDC (trader only)
traderSwapIcecreamForUsdc()

// Swap user's TestUSDC for IcecreamToken (trader only)
traderSwapUsdcForIcecream()

// Update the trader wallet address
setTraderWallet()
```

### Gelato Integration
```solidity
// Get the sender address in context of meta-transactions
_msgSender()

// Get the transaction data in context of meta-transactions
_msgData()
```

## How to Setup

1. **Setting Up ElizaOS**  
   To install and run ElizaOS, execute the following commands:
   ```bash
   git clone https://github.com/elizaos/eliza-starter.git
   cd eliza-starter
   cp .env.example .env
   pnpm i && pnpm build && pnpm start
   ```

2. **Moving the plugin-cosmo-celestia Plugin**  
   Ensure that the `plugin-cosmo-celestia` is moved into the `packages` folder within the ElizaOS directory. For example:
   ```bash
   mv path/to/plugin-cosmo-celestia ./packages/
   ```
   *Note:* Replace `path/to/plugin-cosmo-celestia` with the actual path to the plugin on your system.

3. **Deploying CosmoDEX Contract**  
   To deploy the `CosmoDEX.sol` contract located in the `/contracts` folder, run the Hardhat deployment script:
   ```bash
   npx hardhat run scripts/deployFullCosmoDEX.js --network <network_name>
   ```
   *Note:* Replace `<network_name>` with the appropriate network you are using.

4. **Repository URL**  
   For more details, visit the repository:  
   [https://github.com/First-Point/cosmo-celestia/](https://github.com/First-Point/cosmo-celestia/)



## 🌐 About Cosmo Hub Platform

Cosmo Celestia is powered by [Cosmo Hub](https://cosmohub.ai/), our comprehensive AI agent platform for the ABC ecosystem. Features include:

- **One-Click Agent Deployment**: Instantly deploy trading agents
- **Strategy Marketplace**: Access pre-built trading strategies
- **Risk Management**: Advanced tools for portfolio protection
- **Performance Analytics**: Detailed trading insights and reporting

<img width="1911" alt="image" src="https://github.com/user-attachments/assets/2648f456-6ded-456f-8564-ee4e87c36511" />
<img width="1912" alt="image" src="https://github.com/user-attachments/assets/42b08235-97a7-4b20-a88d-28284fb7cdb4" />


## 🤝 Contributing
We welcome contributions! Please see our [Contributing Guidelines](https://github.com/First-Point/cosmo-celestia/blob/main/CONTRIBUTING.md) for details.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/First-Point/cosmo-celestia/blob/main/LICENSE) file for details.

## 🆘 Support
- [GitHub Issues](https://github.com/First-Point/cosmo-celestia/issues): Report bugs and feature requests

## 👥 Team
- Project Lead: First Point Team

