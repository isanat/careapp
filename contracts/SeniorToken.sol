// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SeniorToken (SENT)
 * @author IdosoLink Platform
 * @notice ERC-20 token for the IdosoLink senior care platform
 * @dev This token is backed by EUR reserves and implements a deflationary mechanism
 * 
 * Key Features:
 * - Minting only by platform (MINTER_ROLE)
 * - Burning for deflationary mechanism
 * - Pausable for emergency situations
 * - Role-based access control
 */
contract SeniorToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Token details
    string public constant TOKEN_NAME = "SeniorToken";
    string public constant TOKEN_SYMBOL = "SENT";
    uint8 public constant DECIMALS = 18;
    
    // Platform treasury address
    address public treasury;
    
    // Total tokens minted and burned (for transparency)
    uint256 public totalMinted;
    uint256 public totalBurned;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, uint256 eurCents, string reason);
    event TokensBurned(address indexed from, uint256 amount, uint256 eurCents, string reason);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event ReserveUpdated(uint256 totalReserveEurCents, uint256 totalTokensInCirculation);
    
    /**
     * @dev Constructor - grants default admin, minter, and pauser roles to deployer
     */
    constructor(address _treasury) ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        require(_treasury != address(0), "Treasury cannot be zero address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        treasury = _treasury;
    }
    
    /**
     * @notice Mint new tokens (only by MINTER_ROLE)
     * @dev Tokens are minted when users purchase with EUR
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint (in token units, not EUR)
     * @param eurCents Amount of EUR paid (in cents) for transparency
     * @param reason Reason for minting (e.g., "ACTIVATION", "TOKEN_PURCHASE")
     */
    function mint(
        address to,
        uint256 amount,
        uint256 eurCents,
        string calldata reason
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        
        _mint(to, amount);
        totalMinted += amount;
        
        emit TokensMinted(to, amount, eurCents, reason);
    }
    
    /**
     * @notice Burn tokens from caller's balance
     * @dev Used when users redeem tokens for EUR
     * @param amount Amount of tokens to burn
     * @param eurCents Amount of EUR to receive (in cents) for transparency
     * @param reason Reason for burning (e.g., "REDEMPTION")
     */
    function burnWithReason(
        uint256 amount,
        uint256 eurCents,
        string calldata reason
    ) external whenNotPaused {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        totalBurned += amount;
        
        emit TokensBurned(msg.sender, amount, eurCents, reason);
    }
    
    /**
     * @notice Burn tokens from specified address (only by MINTER_ROLE)
     * @dev Used for platform redemptions
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     * @param eurCents Amount of EUR paid (in cents)
     * @param reason Reason for burning
     */
    function burnFromWithReason(
        address from,
        uint256 amount,
        uint256 eurCents,
        string calldata reason
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(from != address(0), "Cannot burn from zero address");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
        totalBurned += amount;
        
        emit TokensBurned(from, amount, eurCents, reason);
    }
    
    /**
     * @notice Transfer tokens with reason (for tips, payments, etc.)
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param reason Reason for transfer (e.g., "TIP", "CONTRACT_FEE")
     */
    function transferWithReason(
        address to,
        uint256 amount,
        string calldata reason
    ) external whenNotPaused returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, to, amount);
        
        return true;
    }
    
    /**
     * @notice Pause all token operations (emergency)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause all token operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Treasury cannot be zero address");
        
        address oldTreasury = treasury;
        treasury = newTreasury;
        
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @notice Get total tokens in circulation
     * @return Total supply minus burned tokens
     */
    function totalInCirculation() external view returns (uint256) {
        return totalMinted - totalBurned;
    }
    
    /**
     * @notice Override decimals to return 18
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Mint batch tokens (gas efficient for multiple users)
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of amounts to mint
     * @param eurCents Amount of EUR paid (in cents)
     */
    function mintBatch(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 eurCents
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");
            
            _mint(recipients[i], amounts[i]);
            totalAmount += amounts[i];
        }
        
        totalMinted += totalAmount;
        
        emit TokensMinted(address(0), totalAmount, eurCents, "BATCH_MINT");
    }
}
