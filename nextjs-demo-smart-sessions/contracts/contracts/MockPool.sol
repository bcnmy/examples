// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20Mintable.sol";

contract MockPool is Ownable {
    address public immutable token0;
    address public immutable token1;
    uint24 public immutable fee;

    // Simple price representation (e.g., 3900 * 1e6 for 3900 USDC per WETH)
    uint256 public CURRENT_PRICE_WETH_PER_USDC = 3900 * 1e6;

    // Custom errors
    error TransactionDeadlinePassed(uint256 deadline, uint256 currentTimestamp);
    error InvalidSwapParameters(address recipient, int256 amountSpecified);
    error InsufficientPoolBalance(
        address token,
        uint256 required,
        uint256 available
    );
    error InsufficientUserBalance(
        address token,
        address user,
        uint256 required,
        uint256 available
    );
    error InsufficientAllowance(
        address token,
        address user,
        uint256 required,
        uint256 available
    );
    error TransferFailed(
        address token,
        address from,
        address to,
        uint256 amount
    );
    error InvalidPrice(uint256 oldPrice, uint256 newPrice);
    error MintFailed(address token, address recipient, uint256 amount);
    error ZeroAddress();
    error ZeroAmount();
    error InvalidCommand(bytes command);
    error InvalidInputLength(uint256 expected, uint256 received);

    // Events for better tracking
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event SwapExecuted(
        address indexed recipient,
        bool zeroForOne,
        uint256 amountIn,
        uint256 amountOut
    );
    event PoolTokensMinted(uint256 wethAmount, uint256 usdcAmount);

    constructor(
        address _token0,
        address _token1,
        uint24 _fee
    ) Ownable(msg.sender) {
        if (_token0 == address(0) || _token1 == address(0))
            revert ZeroAddress();
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
    }

    function execute(
        bytes calldata commands,
        bytes[] calldata inputs,
        uint256 deadline
    ) external payable returns (int256 amount0, int256 amount1) {
        if (block.timestamp > deadline) {
            revert TransactionDeadlinePassed(deadline, block.timestamp);
        }

        // Check command length
        if (commands.length != 1) {
            revert InvalidCommand(commands);
        }

        // Check inputs length
        if (inputs.length != 1) {
            revert InvalidInputLength(1, inputs.length);
        }

        // Get the command byte
        uint8 command = uint8(commands[0]);

        // Command 0x00 or 0x01 for swap
        if (command != 0x00 && command != 0x01) {
            revert InvalidCommand(commands);
        }

        // Decode swap parameters
        (address recipient, bool zeroForOne, int256 amountSpecified) = abi
            .decode(inputs[0], (address, bool, int256));

        if (recipient == address(0)) revert ZeroAddress();
        if (amountSpecified == 0) revert ZeroAmount();

        return _swap(recipient, zeroForOne, amountSpecified);
    }

    function _swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified
    ) internal returns (int256 amount0, int256 amount1) {
        uint256 amount = uint256(
            amountSpecified > 0 ? amountSpecified : -amountSpecified
        );

        if (zeroForOne) {
            // WETH -> USDC
            uint256 usdcAmount = (amount * CURRENT_PRICE_WETH_PER_USDC) / 1e18;

            // Check WETH allowance
            uint256 wethAllowance = IERC20(token0).allowance(
                msg.sender,
                address(this)
            );
            if (wethAllowance < amount) {
                revert InsufficientAllowance(
                    token0,
                    msg.sender,
                    amount,
                    wethAllowance
                );
            }

            // Check WETH balance
            uint256 wethBalance = IERC20(token0).balanceOf(msg.sender);
            if (wethBalance < amount) {
                revert InsufficientUserBalance(
                    token0,
                    msg.sender,
                    amount,
                    wethBalance
                );
            }

            // Check pool's USDC balance
            uint256 poolUsdcBalance = IERC20(token1).balanceOf(address(this));
            if (poolUsdcBalance < usdcAmount) {
                revert InsufficientPoolBalance(
                    token1,
                    usdcAmount,
                    poolUsdcBalance
                );
            }

            // Execute transfers
            bool success = IERC20(token0).transferFrom(
                msg.sender,
                address(this),
                amount
            );
            if (!success) {
                revert TransferFailed(
                    token0,
                    msg.sender,
                    address(this),
                    amount
                );
            }

            success = IERC20(token1).transfer(recipient, usdcAmount);
            if (!success) {
                revert TransferFailed(
                    token1,
                    address(this),
                    recipient,
                    usdcAmount
                );
            }

            emit SwapExecuted(recipient, zeroForOne, amount, usdcAmount);
            return (int256(amount), -int256(usdcAmount));
        } else {
            // USDC -> WETH
            uint256 wethAmount = (amount * 1e18) / CURRENT_PRICE_WETH_PER_USDC;

            // Check USDC allowance
            uint256 usdcAllowance = IERC20(token1).allowance(
                msg.sender,
                address(this)
            );
            if (usdcAllowance < amount) {
                revert InsufficientAllowance(
                    token1,
                    msg.sender,
                    amount,
                    usdcAllowance
                );
            }

            // Check USDC balance
            uint256 usdcBalance = IERC20(token1).balanceOf(msg.sender);
            if (usdcBalance < amount) {
                revert InsufficientUserBalance(
                    token1,
                    msg.sender,
                    amount,
                    usdcBalance
                );
            }

            // Check pool's WETH balance
            uint256 poolWethBalance = IERC20(token0).balanceOf(address(this));
            if (poolWethBalance < wethAmount) {
                revert InsufficientPoolBalance(
                    token0,
                    wethAmount,
                    poolWethBalance
                );
            }

            // Execute transfers
            bool success = IERC20(token1).transferFrom(
                msg.sender,
                address(this),
                amount
            );
            if (!success) {
                revert TransferFailed(
                    token1,
                    msg.sender,
                    address(this),
                    amount
                );
            }

            success = IERC20(token0).transfer(recipient, wethAmount);
            if (!success) {
                revert TransferFailed(
                    token0,
                    address(this),
                    recipient,
                    wethAmount
                );
            }

            emit SwapExecuted(recipient, zeroForOne, amount, wethAmount);
            return (-int256(wethAmount), int256(amount));
        }
    }

    function setCurrentPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert ZeroAmount();
        uint256 oldPrice = CURRENT_PRICE_WETH_PER_USDC;
        CURRENT_PRICE_WETH_PER_USDC = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    function mintPoolTokens(
        uint256 wethAmount,
        uint256 usdcAmount
    ) external onlyOwner {
        if (wethAmount == 0 && usdcAmount == 0) revert ZeroAmount();

        if (wethAmount > 0) {
            bool success = IERC20Mintable(token0).mint(
                address(this),
                wethAmount
            );
            if (!success) revert MintFailed(token0, address(this), wethAmount);
        }

        if (usdcAmount > 0) {
            bool success = IERC20Mintable(token1).mint(
                address(this),
                usdcAmount
            );
            if (!success) revert MintFailed(token1, address(this), usdcAmount);
        }

        emit PoolTokensMinted(wethAmount, usdcAmount);
    }
}
