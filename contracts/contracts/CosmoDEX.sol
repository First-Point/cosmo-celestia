// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ERC2771Context
} from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";

// IcecreamToken ve TestUSDC için interface tanımları
interface IMintableToken {
    function mint(uint256 amount) external;
}

/**
 * @title CosmoDEX
 * @dev A minimal DEX for IcecreamToken and TestUSDC with a single liquidity pool
 * Uses constant product formula (x * y = k) for price determination
 * Supports gasless transactions via Gelato Relay (ERC2771)
 */
contract CosmoDEX is ERC2771Context {
    using SafeERC20 for IERC20;

    // Token addresses
    address public immutable icecreamToken;
    address public immutable usdcToken;

    // Liquidity pool reserves
    uint256 public icecreamReserve;
    uint256 public usdcReserve;

    // Total liquidity tokens
    uint256 public totalLiquidity;
    
    // Mapping of liquidity provider address to their liquidity tokens
    mapping(address => uint256) public liquidity;

    // Fee percentage (0.3%)
    uint256 public constant FEE_NUMERATOR = 3;
    uint256 public constant FEE_DENOMINATOR = 1000;

    // Minimum liquidity to prevent division by zero
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    // Faucet amounts
    uint256 public constant ICECREAM_FAUCET_AMOUNT = 100 * 10**18; // 100 ICECREAM
    uint256 public constant USDC_FAUCET_AMOUNT = 100 * 10**6;      // 100 USDC (6 decimals)

    // Token pair balances
    struct TokenPairBalance {
        uint256 icecreamBalance;
        uint256 usdcBalance;
    }

    // User balances for token pairs
    mapping(address => TokenPairBalance) public userPairBalances;

    // Events
    event AddLiquidity(
        address indexed provider,
        uint256 icecreamAmount,
        uint256 usdcAmount,
        uint256 liquidityMinted
    );

    event RemoveLiquidity(
        address indexed provider,
        uint256 icecreamAmount,
        uint256 usdcAmount,
        uint256 liquidityBurned
    );

    event Swap(
        address indexed user,
        uint256 icecreamAmountIn,
        uint256 usdcAmountIn,
        uint256 icecreamAmountOut,
        uint256 usdcAmountOut
    );
    
    event FaucetUsed(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    event TokensDeposited(
        address indexed user,
        address indexed tokenIn,
        uint256 amountIn,
        address indexed tokenOut,
        uint256 amountOut
    );

    event TokensWithdrawn(
        address indexed user,
        address indexed token1,
        uint256 amount1,
        address indexed token2,
        uint256 amount2
    );

    // Trader wallet address
    address public traderWallet;

    // Owner address
    address public owner;

    // Modifier to restrict functions to owner only
    modifier onlyOwner() {
        require(_msgSender() == owner, "Only owner can call this function");
        _;
    }

    // Modifier to restrict functions to trader wallet only
    modifier onlyTrader() {
        require(_msgSender() == traderWallet, "Only trader wallet can call this function");
        _;
    }

    // Event for trader wallet update
    event TraderWalletUpdated(address indexed oldTrader, address indexed newTrader);

    // Event for trader swap
    event TraderSwap(
        address indexed trader,
        address indexed user,
        uint256 icecreamAmountIn,
        uint256 usdcAmountIn,
        uint256 icecreamAmountOut,
        uint256 usdcAmountOut
    );

    /**
     * @dev Constructor sets the token addresses, trusted forwarder for ERC2771, and initial owner
     * @param _icecreamToken Address of the IcecreamToken
     * @param _usdcToken Address of the TestUSDC token
     * @param _trustedForwarder Address of the Gelato Relay trusted forwarder
     */
    constructor(
        address _icecreamToken, 
        address _usdcToken,
        address _trustedForwarder
    ) ERC2771Context(_trustedForwarder) {
        require(_icecreamToken != address(0), "Invalid Icecream token address");
        require(_usdcToken != address(0), "Invalid USDC token address");
        require(_icecreamToken != _usdcToken, "Tokens must be different");
        require(_trustedForwarder != address(0), "Invalid trusted forwarder address");

        icecreamToken = _icecreamToken;
        usdcToken = _usdcToken;
        owner = _msgSender();
        traderWallet = _msgSender(); // Initially set trader wallet to owner
    }

    /**
     * @dev Faucet function to mint Icecream tokens to a specific recipient
     * @param recipient Address of the token recipient
     */
    function icecreamFaucet(address recipient) external {
        address sender = _msgSender();
        require(recipient != address(0), "Invalid recipient address");
        
        IMintableToken(icecreamToken).mint(ICECREAM_FAUCET_AMOUNT);
        IERC20(icecreamToken).safeTransfer(recipient, ICECREAM_FAUCET_AMOUNT);
        
        emit FaucetUsed(recipient, icecreamToken, ICECREAM_FAUCET_AMOUNT);
    }
    
    /**
     * @dev Faucet function to mint USDC tokens to a specific recipient
     * @param recipient Address of the token recipient
     */
    function usdcFaucet(address recipient) external {
        address sender = _msgSender();
        require(recipient != address(0), "Invalid recipient address");
        
        IMintableToken(usdcToken).mint(USDC_FAUCET_AMOUNT);
        IERC20(usdcToken).safeTransfer(recipient, USDC_FAUCET_AMOUNT);
        
        emit FaucetUsed(recipient, usdcToken, USDC_FAUCET_AMOUNT);
    }

    /**
     * @dev Faucet function to mint both Icecream and USDC tokens to a specific recipient
     * @param recipient Address of the token recipient
     */
    function bothTokensFaucet(address recipient) external {
        address sender = _msgSender();
        require(recipient != address(0), "Invalid recipient address");
        
        // Mint and transfer Icecream tokens
        IMintableToken(icecreamToken).mint(ICECREAM_FAUCET_AMOUNT);
        IERC20(icecreamToken).safeTransfer(recipient, ICECREAM_FAUCET_AMOUNT);
        emit FaucetUsed(recipient, icecreamToken, ICECREAM_FAUCET_AMOUNT);
        
        // Mint and transfer USDC tokens
        IMintableToken(usdcToken).mint(USDC_FAUCET_AMOUNT);
        IERC20(usdcToken).safeTransfer(recipient, USDC_FAUCET_AMOUNT);
        emit FaucetUsed(recipient, usdcToken, USDC_FAUCET_AMOUNT);
    }

    /**
     * @dev Add liquidity to the pool
     * @param icecreamAmount Amount of IcecreamToken to add
     * @param usdcAmount Amount of TestUSDC to add
     * @param minLiquidity Minimum liquidity tokens to receive
     * @return liquidityMinted Amount of liquidity tokens minted
     */
    function addLiquidity(
        uint256 icecreamAmount,
        uint256 usdcAmount,
        uint256 minLiquidity
    ) external returns (uint256 liquidityMinted) {
        address sender = _msgSender();
        require(icecreamAmount > 0 && usdcAmount > 0, "Amounts must be greater than 0");

        // Transfer tokens to the contract
        IERC20(icecreamToken).safeTransferFrom(sender, address(this), icecreamAmount);
        IERC20(usdcToken).safeTransferFrom(sender, address(this), usdcAmount);

        // Calculate liquidity to mint
        if (totalLiquidity == 0) {
            // First liquidity provision
            liquidityMinted = _sqrt(icecreamAmount * usdcAmount) - MINIMUM_LIQUIDITY;
            
            // Mint minimum liquidity to zero address (locked forever)
            liquidity[address(0)] = MINIMUM_LIQUIDITY;
            totalLiquidity = MINIMUM_LIQUIDITY;
        } else {
            // Subsequent liquidity provision
            uint256 icecreamLiquidity = (icecreamAmount * totalLiquidity) / icecreamReserve;
            uint256 usdcLiquidity = (usdcAmount * totalLiquidity) / usdcReserve;
            liquidityMinted = icecreamLiquidity < usdcLiquidity ? icecreamLiquidity : usdcLiquidity;
        }

        require(liquidityMinted >= minLiquidity, "Insufficient liquidity minted");

        // Update reserves
        icecreamReserve += icecreamAmount;
        usdcReserve += usdcAmount;

        // Update liquidity
        liquidity[sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;

        emit AddLiquidity(sender, icecreamAmount, usdcAmount, liquidityMinted);
        return liquidityMinted;
    }

    /**
     * @dev Remove liquidity from the pool
     * @param liquidityAmount Amount of liquidity tokens to burn
     * @param minIcecreamAmount Minimum IcecreamToken to receive
     * @param minUsdcAmount Minimum TestUSDC to receive
     * @return icecreamAmount Amount of IcecreamToken received
     * @return usdcAmount Amount of TestUSDC received
     */
    function removeLiquidity(
        uint256 liquidityAmount,
        uint256 minIcecreamAmount,
        uint256 minUsdcAmount
    ) external returns (uint256 icecreamAmount, uint256 usdcAmount) {
        address sender = _msgSender();
        require(liquidityAmount > 0, "Liquidity amount must be greater than 0");
        require(liquidity[sender] >= liquidityAmount, "Insufficient liquidity");

        // Calculate token amounts to return
        icecreamAmount = (liquidityAmount * icecreamReserve) / totalLiquidity;
        usdcAmount = (liquidityAmount * usdcReserve) / totalLiquidity;

        require(icecreamAmount >= minIcecreamAmount, "Insufficient Icecream output");
        require(usdcAmount >= minUsdcAmount, "Insufficient USDC output");

        // Update liquidity
        liquidity[sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;

        // Update reserves
        icecreamReserve -= icecreamAmount;
        usdcReserve -= usdcAmount;

        // Transfer tokens to the user
        IERC20(icecreamToken).safeTransfer(sender, icecreamAmount);
        IERC20(usdcToken).safeTransfer(sender, usdcAmount);

        emit RemoveLiquidity(sender, icecreamAmount, usdcAmount, liquidityAmount);
        return (icecreamAmount, usdcAmount);
    }

    /**
     * @dev Swap IcecreamToken for TestUSDC
     * @param icecreamAmountIn Amount of IcecreamToken to swap
     * @param minUsdcOut Minimum TestUSDC to receive
     * @return usdcAmountOut Amount of TestUSDC received
     */
    function swapIcecreamForUsdc(
        uint256 icecreamAmountIn,
        uint256 minUsdcOut
    ) external returns (uint256 usdcAmountOut) {
        address sender = _msgSender();
        require(icecreamAmountIn > 0, "Input amount must be greater than 0");
        require(icecreamReserve > 0 && usdcReserve > 0, "Insufficient reserves");

        // Calculate output amount using constant product formula (x * y = k)
        // Apply fee of 0.3%
        uint256 icecreamAmountWithFee = icecreamAmountIn * (1000 - FEE_NUMERATOR);
        usdcAmountOut = (usdcReserve * icecreamAmountWithFee) / (icecreamReserve * 1000 + icecreamAmountWithFee);

        require(usdcAmountOut >= minUsdcOut, "Insufficient output amount");

        // Transfer tokens
        IERC20(icecreamToken).safeTransferFrom(sender, address(this), icecreamAmountIn);
        IERC20(usdcToken).safeTransfer(sender, usdcAmountOut);

        // Update reserves
        icecreamReserve += icecreamAmountIn;
        usdcReserve -= usdcAmountOut;

        emit Swap(sender, icecreamAmountIn, 0, 0, usdcAmountOut);
        return usdcAmountOut;
    }

    /**
     * @dev Swap TestUSDC for IcecreamToken
     * @param usdcAmountIn Amount of TestUSDC to swap
     * @param minIcecreamOut Minimum IcecreamToken to receive
     * @return icecreamAmountOut Amount of IcecreamToken received
     */
    function swapUsdcForIcecream(
        uint256 usdcAmountIn,
        uint256 minIcecreamOut
    ) external returns (uint256 icecreamAmountOut) {
        address sender = _msgSender();
        require(usdcAmountIn > 0, "Input amount must be greater than 0");
        require(icecreamReserve > 0 && usdcReserve > 0, "Insufficient reserves");

        // Calculate output amount using constant product formula (x * y = k)
        // Apply fee of 0.3%
        uint256 usdcAmountWithFee = usdcAmountIn * (1000 - FEE_NUMERATOR);
        icecreamAmountOut = (icecreamReserve * usdcAmountWithFee) / (usdcReserve * 1000 + usdcAmountWithFee);

        require(icecreamAmountOut >= minIcecreamOut, "Insufficient output amount");

        // Transfer tokens
        IERC20(usdcToken).safeTransferFrom(sender, address(this), usdcAmountIn);
        IERC20(icecreamToken).safeTransfer(sender, icecreamAmountOut);

        // Update reserves
        usdcReserve += usdcAmountIn;
        icecreamReserve -= icecreamAmountOut;

        emit Swap(sender, 0, usdcAmountIn, icecreamAmountOut, 0);
        return icecreamAmountOut;
    }

    /**
     * @dev Get current exchange rate
     * @param amountIn Amount of input token
     * @param tokenIn Address of input token
     * @return amountOut Expected amount of output token
     */
    function getAmountOut(
        uint256 amountIn,
        address tokenIn
    ) external view returns (uint256 amountOut) {
        require(amountIn > 0, "Input amount must be greater than 0");
        require(tokenIn == icecreamToken || tokenIn == usdcToken, "Invalid token");
        require(icecreamReserve > 0 && usdcReserve > 0, "Insufficient reserves");

        uint256 amountWithFee = amountIn * (1000 - FEE_NUMERATOR);

        if (tokenIn == icecreamToken) {
            amountOut = (usdcReserve * amountWithFee) / (icecreamReserve * 1000 + amountWithFee);
        } else {
            amountOut = (icecreamReserve * amountWithFee) / (usdcReserve * 1000 + amountWithFee);
        }

        return amountOut;
    }

    /**
     * @dev Get current reserves
     * @return _icecreamReserve Current IcecreamToken reserve
     * @return _usdcReserve Current TestUSDC reserve
     */
    function getReserves() external view returns (uint256 _icecreamReserve, uint256 _usdcReserve) {
        return (icecreamReserve, usdcReserve);
    }

    /**
     * @dev Get liquidity for a provider
     * @param provider Address of the liquidity provider
     * @return liquidityAmount Amount of liquidity tokens owned by the provider
     */
    function getLiquidity(address provider) external view returns (uint256 liquidityAmount) {
        return liquidity[provider];
    }

    /**
     * @dev Calculate square root using Babylonian method
     * @param y Number to calculate square root of
     * @return z Square root of y
     */
    function _sqrt(uint256 y) private pure returns (uint256 z) {
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

    /**
     * @dev Override for ERC2771Context's _msgData()
     */
    function _msgData() internal view override(ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    /**
     * @dev Override for ERC2771Context's _msgSender()
     */
    function _msgSender() internal view override(ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    /**
     * @dev Deposit tokens to the user's balance
     * @param icecreamAmount Amount of IcecreamToken to deposit
     * @param usdcAmount Amount of TestUSDC to deposit
     */
    function depositTokens(uint256 icecreamAmount, uint256 usdcAmount) external {
        address sender = _msgSender();
        
        // Transfer tokens from user to contract
        if (icecreamAmount > 0) {
            IERC20(icecreamToken).safeTransferFrom(sender, address(this), icecreamAmount);
            userPairBalances[sender].icecreamBalance += icecreamAmount;
        }
        
        if (usdcAmount > 0) {
            IERC20(usdcToken).safeTransferFrom(sender, address(this), usdcAmount);
            userPairBalances[sender].usdcBalance += usdcAmount;
        }
        
        emit TokensDeposited(sender, icecreamToken, icecreamAmount, usdcToken, usdcAmount);
    }

    /**
     * @dev Withdraw tokens from the user's balance
     * @param icecreamAmount Amount of IcecreamToken to withdraw
     * @param usdcAmount Amount of TestUSDC to withdraw
     */
    function withdrawTokens(uint256 icecreamAmount, uint256 usdcAmount) external {
        address sender = _msgSender();
        
        // Check and withdraw Icecream tokens
        if (icecreamAmount > 0) {
            require(userPairBalances[sender].icecreamBalance >= icecreamAmount, "Insufficient ICECREAM balance");
            userPairBalances[sender].icecreamBalance -= icecreamAmount;
            IERC20(icecreamToken).safeTransfer(sender, icecreamAmount);
        }
        
        // Check and withdraw USDC tokens
        if (usdcAmount > 0) {
            require(userPairBalances[sender].usdcBalance >= usdcAmount, "Insufficient USDC balance");
            userPairBalances[sender].usdcBalance -= usdcAmount;
            IERC20(usdcToken).safeTransfer(sender, usdcAmount);
        }
        
        emit TokensWithdrawn(sender, icecreamToken, icecreamAmount, usdcToken, usdcAmount);
    }

    /**
     * @dev Get user balance for the token pair
     * @param user Address of the user
     * @return icecreamBalance User's balance of IcecreamToken
     * @return usdcBalance User's balance of TestUSDC
     */
    function getUserPairBalance(address user) external view returns (uint256 icecreamBalance, uint256 usdcBalance) {
        TokenPairBalance memory balance = userPairBalances[user];
        return (balance.icecreamBalance, balance.usdcBalance);
    }

    /**
     * @dev Swap tokens between user and trader
     * @param icecreamAmountIn Amount of IcecreamToken to swap
     * @param usdcAmountIn Amount of TestUSDC to swap
     * @param minIcecreamOut Minimum IcecreamToken to receive
     * @param minUsdcOut Minimum TestUSDC to receive
     * @return icecreamAmountOut Amount of IcecreamToken received
     * @return usdcAmountOut Amount of TestUSDC received
     */
    function traderSwap(
        uint256 icecreamAmountIn,
        uint256 usdcAmountIn,
        uint256 minIcecreamOut,
        uint256 minUsdcOut
    ) external returns (uint256 icecreamAmountOut, uint256 usdcAmountOut) {
        address sender = _msgSender();
        require(icecreamAmountIn > 0 && usdcAmountIn > 0, "Input amounts must be greater than 0");
        require(icecreamReserve > 0 && usdcReserve > 0, "Insufficient reserves");

        // Calculate output amounts
        icecreamAmountOut = (icecreamReserve * usdcAmountIn) / usdcReserve;
        usdcAmountOut = (usdcReserve * icecreamAmountIn) / icecreamReserve;

        require(icecreamAmountOut >= minIcecreamOut, "Insufficient ICECREAM output");
        require(usdcAmountOut >= minUsdcOut, "Insufficient USDC output");

        // Transfer tokens
        IERC20(icecreamToken).safeTransferFrom(sender, address(this), icecreamAmountIn);
        IERC20(usdcToken).safeTransferFrom(sender, address(this), usdcAmountIn);
        IERC20(icecreamToken).safeTransfer(traderWallet, icecreamAmountOut);
        IERC20(usdcToken).safeTransfer(traderWallet, usdcAmountOut);

        // Update reserves
        icecreamReserve -= icecreamAmountIn;
        usdcReserve -= usdcAmountIn;
        icecreamReserve += icecreamAmountOut;
        usdcReserve += usdcAmountOut;

        emit TraderSwap(traderWallet, sender, icecreamAmountIn, usdcAmountIn, icecreamAmountOut, usdcAmountOut);
        return (icecreamAmountOut, usdcAmountOut);
    }

    /**
     * @dev Update the trader wallet address
     * @param _newTraderWallet New trader wallet address
     */
    function setTraderWallet(address _newTraderWallet) external onlyOwner {
        require(_newTraderWallet != address(0), "Invalid trader wallet address");
        address oldTraderWallet = traderWallet;
        traderWallet = _newTraderWallet;
        emit TraderWalletUpdated(oldTraderWallet, _newTraderWallet);
    }

    /**
     * @dev Swap user's IcecreamToken for TestUSDC (trader only)
     * @param user Address of the user whose tokens will be swapped
     * @param icecreamAmountIn Amount of IcecreamToken to swap
     * @param minUsdcOut Minimum TestUSDC to receive
     * @return usdcAmountOut Amount of TestUSDC received
     */
    function traderSwapIcecreamForUsdc(
        address user,
        uint256 icecreamAmountIn,
        uint256 minUsdcOut
    ) external onlyTrader returns (uint256 usdcAmountOut) {
        require(icecreamAmountIn > 0, "Input amount must be greater than 0");
        require(icecreamReserve > 0 && usdcReserve > 0, "Insufficient reserves");
        require(userPairBalances[user].icecreamBalance >= icecreamAmountIn, "Insufficient user ICECREAM balance");

        // Calculate output amount using constant product formula (x * y = k)
        // Apply fee of 0.3%
        uint256 icecreamAmountWithFee = icecreamAmountIn * (1000 - FEE_NUMERATOR);
        usdcAmountOut = (usdcReserve * icecreamAmountWithFee) / (icecreamReserve * 1000 + icecreamAmountWithFee);

        require(usdcAmountOut >= minUsdcOut, "Insufficient output amount");

        // Update user balances
        userPairBalances[user].icecreamBalance -= icecreamAmountIn;
        userPairBalances[user].usdcBalance += usdcAmountOut;

        // Update reserves
        icecreamReserve += icecreamAmountIn;
        usdcReserve -= usdcAmountOut;

        emit TraderSwap(traderWallet, user, icecreamAmountIn, 0, 0, usdcAmountOut);
        return usdcAmountOut;
    }

    /**
     * @dev Swap user's TestUSDC for IcecreamToken (trader only)
     * @param user Address of the user whose tokens will be swapped
     * @param usdcAmountIn Amount of TestUSDC to swap
     * @param minIcecreamOut Minimum IcecreamToken to receive
     * @return icecreamAmountOut Amount of IcecreamToken received
     */
    function traderSwapUsdcForIcecream(
        address user,
        uint256 usdcAmountIn,
        uint256 minIcecreamOut
    ) external onlyTrader returns (uint256 icecreamAmountOut) {
        require(usdcAmountIn > 0, "Input amount must be greater than 0");
        require(icecreamReserve > 0 && usdcReserve > 0, "Insufficient reserves");
        require(userPairBalances[user].usdcBalance >= usdcAmountIn, "Insufficient user USDC balance");

        // Calculate output amount using constant product formula (x * y = k)
        // Apply fee of 0.3%
        uint256 usdcAmountWithFee = usdcAmountIn * (1000 - FEE_NUMERATOR);
        icecreamAmountOut = (icecreamReserve * usdcAmountWithFee) / (usdcReserve * 1000 + usdcAmountWithFee);

        require(icecreamAmountOut >= minIcecreamOut, "Insufficient output amount");

        // Update user balances
        userPairBalances[user].usdcBalance -= usdcAmountIn;
        userPairBalances[user].icecreamBalance += icecreamAmountOut;

        // Update reserves
        usdcReserve += usdcAmountIn;
        icecreamReserve -= icecreamAmountOut;

        emit TraderSwap(traderWallet, user, 0, usdcAmountIn, icecreamAmountOut, 0);
        return icecreamAmountOut;
    }
}
