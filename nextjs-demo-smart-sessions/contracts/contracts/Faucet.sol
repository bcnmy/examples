// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Faucet is ReentrancyGuard, Ownable {
    uint256 public immutable ETH_DRIP_AMOUNT = 0.01 ether;
    uint256 public TOKEN_DRIP_AMOUNT = 10 * 10**18; // 10 tokens with 18 decimals
    uint256 public constant DRIP_COOLDOWN = 24 hours;
    
    mapping(address => uint256) public lastEthDripTime;
    mapping(address => mapping(address => uint256)) public lastTokenDripTime;
    
    event EthDrip(address indexed recipient, uint256 amount);
    event TokenDrip(address indexed token, address indexed recipient, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    receive() external payable {}
    
    function requestEth() external nonReentrant {
        require(
            block.timestamp >= lastEthDripTime[msg.sender] + DRIP_COOLDOWN,
            "Please wait 24 hours between ETH requests"
        );
        require(
            address(this).balance >= ETH_DRIP_AMOUNT,
            "Insufficient ETH in faucet"
        );
        
        lastEthDripTime[msg.sender] = block.timestamp;
        
        (bool success, ) = msg.sender.call{value: ETH_DRIP_AMOUNT}("");
        require(success, "ETH transfer failed");
        
        emit EthDrip(msg.sender, ETH_DRIP_AMOUNT);
    }

    function requestTokens(address token) external nonReentrant {
        require(
            block.timestamp >= lastTokenDripTime[token][msg.sender] + DRIP_COOLDOWN,
            "Please wait 24 hours between token requests"
        );
        
        IERC20 tokenContract = IERC20(token);
        require(
            tokenContract.balanceOf(address(this)) >= TOKEN_DRIP_AMOUNT,
            "Insufficient tokens in faucet"
        );
        
        lastTokenDripTime[token][msg.sender] = block.timestamp;
        
        require(
            tokenContract.transfer(msg.sender, TOKEN_DRIP_AMOUNT),
            "Token transfer failed"
        );
        
        emit TokenDrip(token, msg.sender, TOKEN_DRIP_AMOUNT);
    }
    
    function withdrawEth() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "ETH transfer failed");
    }

    function withdrawTokens(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(
            tokenContract.transfer(msg.sender, balance),
            "Token transfer failed"
        );
    }
}