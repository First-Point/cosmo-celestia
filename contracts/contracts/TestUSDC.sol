// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TestUSDC is ERC20, ERC20Burnable {
    // Maximum amount that can be minted per transaction
    uint256 public constant MAX_MINT_AMOUNT = 1000 * 10**6; // 1000 USDC (6 decimals)
    
    // Cooldown period between mints (in seconds)
    uint256 public constant MINT_COOLDOWN = 1 hours;
    
    // Mapping to track last mint time for each address
    mapping(address => uint256) public lastMintTime;

    constructor(uint256 initialSupply) ERC20("Test USDC", "tUSDC") {
        _mint(msg.sender, initialSupply * 10 ** 6); // USDC uses 6 decimals
    }
    
    /**
     * @dev Override decimals to match real USDC (6 decimals)
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    
    /**
     * @dev Public function to mint tokens with limits
     * @param amount Amount of tokens to mint
     */
    function mint(uint256 amount) external {
        require(amount <= MAX_MINT_AMOUNT, "Amount exceeds maximum mint limit");
        require(block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN, "Cooldown period not elapsed");
        
        lastMintTime[msg.sender] = block.timestamp;
        _mint(msg.sender, amount);
    }
} 