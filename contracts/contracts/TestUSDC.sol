// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TestUSDC is ERC20, ERC20Burnable {
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
     * @dev Public function to mint tokens without limits
     * @param amount Amount of tokens to mint
     */
    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }
} 