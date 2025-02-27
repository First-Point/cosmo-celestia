// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IcecreamToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Icecream Token", "ICECREAM") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
    
    /**
     * @dev Public function to mint tokens without limits
     * @param amount Amount of tokens to mint
     */
    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }
} 