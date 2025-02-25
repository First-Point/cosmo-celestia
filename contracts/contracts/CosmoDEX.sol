// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CosmoDEX
 * @dev Minimal Uniswap V2 clone with single liquidity pool functionality
 */
contract CosmoDEX {
    using SafeERC20 for IERC20;

    // Token pair
    address public tokenA;
    address public tokenB;
    
    // Liquidity pool reserves
    uint256 public reserveA;
    uint256 public reserveB;
    
    // Total liquidity tokens
    uint256 public totalLiquidity;
    
    // Mapping of provider address to liquidity amount
    mapping(address => uint256) public liquidity;
    
    // Minimum liquidity to prevent division by zero attacks
    uint256 private constant MINIMUM_LIQUIDITY = 10**3;
    
    // Trade history for AI analysis
    struct Trade {
        address trader;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
    }
    
    Trade[] public tradeHistory;
    
    // Events
    event AddLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event RemoveLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed trader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event AITriggeredTrade(address indexed agent, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    
    /**
     * @dev Constructor to set token addresses
     * @param _tokenA Address of token A
     * @param _tokenB Address of token B
     */
    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        require(_tokenA != _tokenB, "Tokens must be different");
        
        tokenA = _tokenA;
        tokenB = _tokenB;
    }
    
    /**
     * @dev Add liquidity to the pool
     * @param amountADesired Desired amount of token A
     * @param amountBDesired Desired amount of token B
     * @param amountAMin Minimum amount of token A
     * @param amountBMin Minimum amount of token B
     * @return amountA Amount of token A added
     * @return amountB Amount of token B added
     * @return liquidityMinted Liquidity tokens minted
     */
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidityMinted) {
        // Calculate optimal amounts
        if (reserveA == 0 && reserveB == 0) {
            // First liquidity provision
            amountA = amountADesired;
            amountB = amountBDesired;
            
            // Transfer tokens to the contract
            IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
            IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);
            
            // Calculate liquidity tokens to mint
            liquidityMinted = Math.sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            
            // Mint liquidity tokens
            liquidity[msg.sender] = liquidityMinted;
            totalLiquidity = liquidityMinted + MINIMUM_LIQUIDITY;
            
            // Update reserves
            reserveA = amountA;
            reserveB = amountB;
        } else {
            // Subsequent liquidity provision
            uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
            
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                require(amountAOptimal <= amountADesired, "Excessive A amount");
                require(amountAOptimal >= amountAMin, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
            
            // Transfer tokens to the contract
            IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
            IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);
            
            // Calculate liquidity tokens to mint
            liquidityMinted = Math.min(
                (amountA * totalLiquidity) / reserveA,
                (amountB * totalLiquidity) / reserveB
            );
            
            // Mint liquidity tokens
            liquidity[msg.sender] += liquidityMinted;
            totalLiquidity += liquidityMinted;
            
            // Update reserves
            reserveA += amountA;
            reserveB += amountB;
        }
        
        emit AddLiquidity(msg.sender, amountA, amountB, liquidityMinted);
    }
    
    /**
     * @dev Remove liquidity from the pool
     * @param liquidityAmount Amount of liquidity tokens to burn
     * @param amountAMin Minimum amount of token A to receive
     * @param amountBMin Minimum amount of token B to receive
     * @return amountA Amount of token A received
     * @return amountB Amount of token B received
     */
    function removeLiquidity(
        uint256 liquidityAmount,
        uint256 amountAMin,
        uint256 amountBMin
    ) external returns (uint256 amountA, uint256 amountB) {
        require(liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");
        
        // Calculate token amounts to return
        amountA = (liquidityAmount * reserveA) / totalLiquidity;
        amountB = (liquidityAmount * reserveB) / totalLiquidity;
        
        require(amountA >= amountAMin, "Insufficient A amount");
        require(amountB >= amountBMin, "Insufficient B amount");
        
        // Burn liquidity tokens
        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;
        
        // Transfer tokens back to the user
        IERC20(tokenA).safeTransfer(msg.sender, amountA);
        IERC20(tokenB).safeTransfer(msg.sender, amountB);
        
        // Update reserves
        reserveA -= amountA;
        reserveB -= amountB;
        
        emit RemoveLiquidity(msg.sender, amountA, amountB, liquidityAmount);
    }
    
    /**
     * @dev Swap tokens
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @return amountOut Amount of output tokens
     */
    function swap(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut
    ) external returns (uint256 amountOut) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid input token");
        require(tokenOut == tokenA || tokenOut == tokenB, "Invalid output token");
        require(tokenIn != tokenOut, "Input and output tokens must be different");
        require(amountIn > 0, "Insufficient input amount");
        
        // Calculate output amount with 0.3% fee
        uint256 amountInWithFee = amountIn * 997;
        
        if (tokenIn == tokenA && tokenOut == tokenB) {
            // Swap A for B
            amountOut = (amountInWithFee * reserveB) / ((reserveA * 1000) + amountInWithFee);
        } else {
            // Swap B for A
            amountOut = (amountInWithFee * reserveA) / ((reserveB * 1000) + amountInWithFee);
        }
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        // Transfer input tokens from user to contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Transfer output tokens from contract to user
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        // Update reserves
        if (tokenIn == tokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
        
        // Record trade for AI analysis
        tradeHistory.push(Trade({
            trader: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp
        }));
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        
        return amountOut;
    }
    
    /**
     * @dev AI-triggered swap (for automated trading)
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param recipient Address to receive output tokens
     * @return amountOut Amount of output tokens
     */
    function aiTriggeredSwap(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address recipient
    ) external returns (uint256 amountOut) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid input token");
        require(tokenOut == tokenA || tokenOut == tokenB, "Invalid output token");
        require(tokenIn != tokenOut, "Input and output tokens must be different");
        require(amountIn > 0, "Insufficient input amount");
        require(recipient != address(0), "Invalid recipient");
        
        // Calculate output amount with 0.3% fee
        uint256 amountInWithFee = amountIn * 997;
        
        if (tokenIn == tokenA && tokenOut == tokenB) {
            // Swap A for B
            amountOut = (amountInWithFee * reserveB) / ((reserveA * 1000) + amountInWithFee);
        } else {
            // Swap B for A
            amountOut = (amountInWithFee * reserveA) / ((reserveB * 1000) + amountInWithFee);
        }
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        // Transfer input tokens from user to contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Transfer output tokens from contract to recipient
        IERC20(tokenOut).safeTransfer(recipient, amountOut);
        
        // Update reserves
        if (tokenIn == tokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
        
        // Record trade for AI analysis
        tradeHistory.push(Trade({
            trader: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp
        }));
        
        emit AITriggeredTrade(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        
        return amountOut;
    }
    
    /**
     * @dev Get expected output amount for a swap
     * @param amountIn Amount of input tokens
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @return Expected output amount
     */
    function getExpectedOutput(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external view returns (uint256) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid input token");
        require(tokenOut == tokenA || tokenOut == tokenB, "Invalid output token");
        require(tokenIn != tokenOut, "Input and output tokens must be different");
        require(amountIn > 0, "Insufficient input amount");
        
        uint256 amountInWithFee = amountIn * 997;
        
        if (tokenIn == tokenA) {
            // Swap A for B
            return (amountInWithFee * reserveB) / ((reserveA * 1000) + amountInWithFee);
        } else {
            // Swap B for A
            return (amountInWithFee * reserveA) / ((reserveB * 1000) + amountInWithFee);
        }
    }
    
    /**
     * @dev Get the number of trades in history
     * @return Number of trades
     */
    function getTradeHistoryLength() external view returns (uint256) {
        return tradeHistory.length;
    }
    
    /**
     * @dev Get multiple trades from history (for batch querying)
     * @param start Starting index
     * @param end Ending index (exclusive)
     * @return Array of trades
     */
    function getTradeHistoryBatch(uint256 start, uint256 end) external view returns (Trade[] memory) {
        require(start < end, "Invalid range");
        require(end <= tradeHistory.length, "End out of bounds");
        
        Trade[] memory trades = new Trade[](end - start);
        
        for (uint256 i = start; i < end; i++) {
            trades[i - start] = tradeHistory[i];
        }
        
        return trades;
    }
    
    /**
     * @dev Helper function to calculate optimal token amounts
     * @param amountA Amount of token A
     * @param reserveA Reserve of token A
     * @param reserveB Reserve of token B
     * @return Amount of token B
     */
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) internal pure returns (uint256) {
        require(amountA > 0, "Insufficient amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        return (amountA * reserveB) / reserveA;
    }
}

/**
 * @dev Math library for calculating square root
 */
library Math {
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    function min(uint256 x, uint256 y) internal pure returns (uint256) {
        return x < y ? x : y;
    }
}
