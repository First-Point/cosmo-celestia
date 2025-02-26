// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title TokenRelayer
 * @dev Enables gasless transactions for IcecreamToken and TestUSDC
 */
contract TokenRelayer is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public icecreamToken;
    address public testUSDC;
    
    // Mapping to track used nonces
    mapping(address => mapping(uint256 => bool)) public usedNonces;
    
    // Events
    event RelayedTransfer(address indexed token, address indexed from, address indexed to, uint256 amount);
    event RelayedMint(address indexed token, address indexed to, uint256 amount);
    
    /**
     * @dev Constructor to set token addresses
     * @param _icecreamToken Address of IcecreamToken
     * @param _testUSDC Address of TestUSDC
     */
    constructor(address _icecreamToken, address _testUSDC) Ownable(msg.sender) {
        icecreamToken = _icecreamToken;
        testUSDC = _testUSDC;
    }
    
    /**
     * @dev Relay a token transfer without the sender paying gas
     * @param token Address of the token to transfer
     * @param from Address sending the tokens
     * @param to Address receiving the tokens
     * @param amount Amount of tokens to transfer
     * @param nonce Unique nonce to prevent replay attacks
     * @param signature Signature signed by the sender
     */
    function relayTransfer(
        address token,
        address from,
        address to,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(token == icecreamToken || token == testUSDC, "Invalid token");
        require(!usedNonces[from][nonce], "Nonce already used");
        
        // Mark nonce as used
        usedNonces[from][nonce] = true;
        
        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "relayTransfer",
                token,
                from,
                to,
                amount,
                nonce
            )
        );
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        require(signer == from, "Invalid signature");
        
        // Execute transfer
        bool success = IERC20(token).transferFrom(from, to, amount);
        require(success, "Transfer failed");
        
        emit RelayedTransfer(token, from, to, amount);
    }
    
    /**
     * @dev Relay a token mint without the recipient paying gas
     * @param token Address of the token to mint
     * @param to Address receiving the minted tokens
     * @param amount Amount of tokens to mint
     * @param nonce Unique nonce to prevent replay attacks
     * @param signature Signature signed by the recipient
     */
    function relayMint(
        address token,
        address to,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(token == icecreamToken || token == testUSDC, "Invalid token");
        require(!usedNonces[to][nonce], "Nonce already used");
        
        // Mark nonce as used
        usedNonces[to][nonce] = true;
        
        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "relayMint",
                token,
                to,
                amount,
                nonce
            )
        );
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        require(signer == to, "Invalid signature");
        
        // Execute mint
        if (token == icecreamToken) {
            // Call mint function on IcecreamToken
            (bool success, ) = icecreamToken.call(
                abi.encodeWithSignature("mint(uint256)", amount)
            );
            require(success, "Mint failed");
        } else {
            // Call mint function on TestUSDC
            (bool success, ) = testUSDC.call(
                abi.encodeWithSignature("mint(uint256)", amount)
            );
            require(success, "Mint failed");
        }
        
        emit RelayedMint(token, to, amount);
    }
}
