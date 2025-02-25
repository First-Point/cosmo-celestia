// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IcecreamToken is ERC20 {
    // Maximum amount that can be minted per transaction
    uint256 public constant MAX_MINT_AMOUNT = 1000 * 10**18; // 1000 tokens
    
    // Cooldown period between mints (in seconds)
    uint256 public constant MINT_COOLDOWN = 1 hours;
    
    // Mapping to track last mint time for each address
    mapping(address => uint256) public lastMintTime;

    constructor(uint256 initialSupply) ERC20("Icecream Token", "ICECREAM") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
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