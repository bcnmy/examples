// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20Mintable.sol";

contract MockPool is Ownable {
    address public immutable token0;
    address public immutable token1;
    uint24 public immutable fee;

    // Mock state variables
    uint160 public sqrtPriceX96;
    int24 public tick;
    uint128 public liquidity;

    // Add this state variable (adjust the value as needed)
    uint256 public CURRENT_PRICE_WETH_PER_USDC = 3900 * 1e6;

    error TransactionDeadlinePassed();
    error V3InvalidSwap();
    error V3TooLittleReceived();
    error V3TooMuchRequested();

    constructor(
        address _token0,
        address _token1,
        uint24 _fee,
        uint160 _initialSqrtPriceX96
    ) Ownable(msg.sender) {
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
        sqrtPriceX96 = _initialSqrtPriceX96;
    }

    function execute(
        bytes calldata commands,
        bytes[] calldata inputs,
        uint256 deadline
    ) external payable returns (int256 amount0, int256 amount1) {
        if (block.timestamp > deadline) revert TransactionDeadlinePassed();

        // Decode the first command (assuming it's a swap)
        if (commands.length == 0) revert V3InvalidSwap();

        // Mock implementation - decode inputs assuming first input contains swap params
        (
            address recipient,
            bool zeroForOne,
            int256 amountSpecified,
            uint160 sqrtPriceLimitX96
        ) = abi.decode(inputs[0], (address, bool, int256, uint160));

        // Perform the swap
        return _swap(recipient, zeroForOne, amountSpecified, sqrtPriceLimitX96);
    }

    function _swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96
    ) internal returns (int256 amount0, int256 amount1) {
        if (amountSpecified == 0) revert V3InvalidSwap();

        uint256 amount = uint256(
            amountSpecified > 0 ? amountSpecified : -amountSpecified
        );

        if (zeroForOne) {
            // WETH -> USDC: multiply by price and adjust decimals
            uint256 usdcAmount = (amount * CURRENT_PRICE_WETH_PER_USDC) / 1e18;

            require(
                IERC20(token0).transferFrom(msg.sender, address(this), amount),
                "T0F"
            );
            require(IERC20(token1).transfer(recipient, usdcAmount), "T1F");
            return (int256(amount), -int256(usdcAmount));
        } else {
            // USDC -> WETH: divide by price and adjust decimals
            uint256 wethAmount = (amount * 1e18) / CURRENT_PRICE_WETH_PER_USDC;

            require(
                IERC20(token1).transferFrom(msg.sender, address(this), amount),
                "T1F"
            );
            require(IERC20(token0).transfer(recipient, wethAmount), "T0F");
            return (-int256(wethAmount), int256(amount));
        }
    }

    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96_,
            int24 tick_,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        )
    {
        return (sqrtPriceX96, tick, 0, 0, 0, 0, true);
    }

    // Mock functions to set state
    function setPrice(uint160 _sqrtPriceX96, int24 _tick) external {
        sqrtPriceX96 = _sqrtPriceX96;
        tick = _tick;
    }

    function setLiquidity(uint128 _liquidity) external {
        liquidity = _liquidity;
    }

    function setCurrentPrice(uint256 newPrice) external onlyOwner {
        CURRENT_PRICE_WETH_PER_USDC = newPrice;
    }

    // Function to directly mint tokens to the pool for testing
    function mintPoolTokens(
        uint256 wethAmount,
        uint256 usdcAmount
    ) external onlyOwner {
        require(
            IERC20Mintable(token0).mint(address(this), wethAmount),
            "WETH mint failed"
        );
        require(
            IERC20Mintable(token1).mint(address(this), usdcAmount),
            "USDC mint failed"
        );
    }
}
