# CosmoDEX - AI-Powered DEX with Gasless Transactions

CosmoDEX is a minimal decentralized exchange (DEX) that features AI-triggered trades and gasless transactions through Gelato Relay integration. Built on ABC testnet, it provides a simple yet powerful platform for token swapping and liquidity provision.

## Features

- **Single Liquidity Pool**: Automated Market Maker (AMM) using constant product formula (`x * y = k`)
- **Custom ERC20 Tokens**:
  - IcecreamToken (ICECREAM): 18 decimals
  - Test USDC (tUSDC): 6 decimals, mimicking real USDC
- **AI Integration**: Support for AI-triggered trades with dedicated events and data storage
- **Gasless Transactions**: Integration with Gelato Relay for gas-free operations
- **Trade History**: On-chain storage of trade data for AI analysis

## Prerequisites

```bash
node >= 18.0.0
npm >= 9.0.0
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CosmoDEX.git
cd CosmoDEX
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
ABC_TESTNET_RPC_URL=https://rpc.abc.t.raas.gelato.cloud
ABC_TESTNET_PRIVATE_KEY=your_private_key_here
```

## Smart Contracts

### Core Contracts

- `IcecreamToken.sol`: Custom ERC20 token with public minting capability
- `TestUSDC.sol`: USDC-like token with 6 decimals
- `CosmoDEX.sol`: Main DEX contract with AMM functionality
- `Relayer.sol`: Contract for handling gasless transactions

### Contract Addresses (ABC Testnet)

```
IcecreamToken: 0xEcAe8C3655dC10760288F62698D3d36a53918C74
TestUSDC: 0x0829344670A694d66Eac833308d0b2879c2f8899
```

## Deployment

### Deploy Tokens
```bash
npx hardhat run scripts/deployTokens.js --network abc
```

### Deploy DEX
```bash
npx hardhat run scripts/deployDEX.js --network abc
```

### Deploy Relayer
```bash
npx hardhat run scripts/deployRelayer.js --network abc
```

## Testing

Run the full test suite:
```bash
npx hardhat test
```

Run specific tests:
```bash
npx hardhat test test/IcecreamToken.test.js
npx hardhat test test/TestUSDC.test.js
npx hardhat test test/CosmoDEX.test.js
```

## Interacting with Contracts

### Token Operations
```bash
# Mint tokens using faucet
npx hardhat run scripts/faucet.js --network abc ICECREAM_ADDRESS USDC_ADDRESS RECIPIENT_ADDRESS

# Check token info and balances
npx hardhat run scripts/interactWithTokens.js --network abc
```

### DEX Operations
```bash
# Add liquidity
# Remove liquidity
# Swap tokens
See scripts/deployDEX.js for examples
```

### Gasless Transactions

Using custom relayer:
```bash
npx hardhat run scripts/relayTransaction.js --network abc
```

Using Gelato Relay:
```bash
npx hardhat run scripts/gelatoRelay.js --network abc
```

## Architecture

```
contracts/
├── IcecreamToken.sol   # ICECREAM token implementation
├── TestUSDC.sol        # tUSDC token implementation
├── CosmoDEX.sol        # Main DEX contract
└── Relayer.sol         # Gasless transaction handler

scripts/
├── deploy/
│   ├── deployTokens.js
│   ├── deployDEX.js
│   └── deployRelayer.js
├── faucet.js
├── interactWithTokens.js
├── relayTransaction.js
└── gelatoRelay.js

test/
├── IcecreamToken.test.js
├── TestUSDC.test.js
└── CosmoDEX.test.js
```

## Key Features

### Constant Product AMM
- Uses `x * y = k` formula for price determination
- Includes 0.3% swap fee
- Minimum liquidity requirement to prevent attacks

### AI Integration
- On-chain trade history storage
- AI-triggered swap functionality
- Event emission for AI analysis

### Gasless Transactions
- Custom relayer implementation
- Gelato Relay integration
- Signature verification for security

## Security Considerations

- All contracts use OpenZeppelin's secure implementations
- Signature verification for gasless transactions
- Cooldown periods for token minting
- Maximum mint amounts to prevent abuse

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenZeppelin for secure contract implementations
- Gelato Network for relay services
- ABC testnet for providing the testing environment
