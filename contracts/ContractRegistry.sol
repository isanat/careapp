// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ContractRegistry
 * @author IdosoLink Platform
 * @notice Registry for senior care contracts on blockchain
 * @dev Stores contract hashes and metadata for immutability and verification
 */
contract ContractRegistry is AccessControl, Pausable {
    
    // Role definitions
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Contract status enum
    enum ContractStatus {
        DRAFT,              // 0
        PENDING_ACCEPTANCE, // 1
        ACTIVE,             // 2
        COMPLETED,          // 3
        CANCELLED,          // 4
        DISPUTED            // 5
    }
    
    // Contract structure
    struct CareContract {
        bytes32 contractHash;        // Hash of the contract document
        address familyAddress;       // Family wallet address
        address caregiverAddress;    // Caregiver wallet address
        uint256 createdAt;           // Timestamp of creation
        uint256 acceptedAt;          // Timestamp of acceptance (0 if not accepted)
        uint256 completedAt;         // Timestamp of completion (0 if not completed)
        ContractStatus status;       // Current status
        uint256 totalEurCents;       // Total value in EUR cents
        uint256 platformFeeEurCents; // Platform fee in EUR cents
        string metadata;             // Additional metadata (JSON)
    }
    
    // Mapping from contract ID to contract
    mapping(string => CareContract) public contracts;
    
    // Mapping from address to contract IDs
    mapping(address => string[]) public userContracts;
    
    // Array of all contract IDs
    string[] public allContractIds;
    
    // Events
    event ContractCreated(
        string indexed contractId,
        bytes32 indexed contractHash,
        address indexed familyAddress,
        address caregiverAddress,
        uint256 totalEurCents
    );
    
    event ContractAccepted(
        string indexed contractId,
        address indexed caregiverAddress,
        uint256 acceptedAt
    );
    
    event ContractStatusUpdated(
        string indexed contractId,
        ContractStatus oldStatus,
        ContractStatus newStatus
    );
    
    event ContractCompleted(
        string indexed contractId,
        uint256 completedAt
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }
    
    /**
     * @notice Register a new contract
     * @param contractId Unique contract identifier
     * @param contractHash Hash of the contract document
     * @param familyAddress Family wallet address
     * @param caregiverAddress Caregiver wallet address
     * @param totalEurCents Total contract value in EUR cents
     * @param metadata Additional metadata as JSON string
     */
    function createContract(
        string calldata contractId,
        bytes32 contractHash,
        address familyAddress,
        address caregiverAddress,
        uint256 totalEurCents,
        uint256 platformFeeEurCents,
        string calldata metadata
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(contracts[contractId].createdAt == 0, "Contract already exists");
        require(familyAddress != address(0), "Invalid family address");
        require(caregiverAddress != address(0), "Invalid caregiver address");
        require(familyAddress != caregiverAddress, "Addresses must be different");
        
        CareContract storage newContract = contracts[contractId];
        newContract.contractHash = contractHash;
        newContract.familyAddress = familyAddress;
        newContract.caregiverAddress = caregiverAddress;
        newContract.createdAt = block.timestamp;
        newContract.status = ContractStatus.PENDING_ACCEPTANCE;
        newContract.totalEurCents = totalEurCents;
        newContract.platformFeeEurCents = platformFeeEurCents;
        newContract.metadata = metadata;
        
        // Add to user contracts
        userContracts[familyAddress].push(contractId);
        userContracts[caregiverAddress].push(contractId);
        allContractIds.push(contractId);
        
        emit ContractCreated(
            contractId,
            contractHash,
            familyAddress,
            caregiverAddress,
            totalEurCents
        );
    }
    
    /**
     * @notice Accept a contract (by caregiver)
     * @param contractId Contract identifier
     */
    function acceptContract(string calldata contractId) 
        external 
        whenNotPaused 
    {
        CareContract storage contract_ = contracts[contractId];
        
        require(contract_.createdAt > 0, "Contract not found");
        require(contract_.status == ContractStatus.PENDING_ACCEPTANCE, "Invalid status");
        require(msg.sender == contract_.caregiverAddress, "Only caregiver can accept");
        
        contract_.status = ContractStatus.ACTIVE;
        contract_.acceptedAt = block.timestamp;
        
        emit ContractAccepted(contractId, contract_.caregiverAddress, block.timestamp);
        emit ContractStatusUpdated(contractId, ContractStatus.PENDING_ACCEPTANCE, ContractStatus.ACTIVE);
    }
    
    /**
     * @notice Update contract status
     * @param contractId Contract identifier
     * @param newStatus New status
     */
    function updateStatus(
        string calldata contractId, 
        ContractStatus newStatus
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        CareContract storage contract_ = contracts[contractId];
        
        require(contract_.createdAt > 0, "Contract not found");
        require(contract_.status != newStatus, "Status unchanged");
        
        ContractStatus oldStatus = contract_.status;
        contract_.status = newStatus;
        
        if (newStatus == ContractStatus.COMPLETED) {
            contract_.completedAt = block.timestamp;
            emit ContractCompleted(contractId, block.timestamp);
        }
        
        emit ContractStatusUpdated(contractId, oldStatus, newStatus);
    }
    
    /**
     * @notice Get contract details
     * @param contractId Contract identifier
     */
    function getContract(string calldata contractId) 
        external 
        view 
        returns (
            bytes32 contractHash,
            address familyAddress,
            address caregiverAddress,
            uint256 createdAt,
            uint256 acceptedAt,
            ContractStatus status,
            uint256 totalEurCents
        ) 
    {
        CareContract storage contract_ = contracts[contractId];
        require(contract_.createdAt > 0, "Contract not found");
        
        return (
            contract_.contractHash,
            contract_.familyAddress,
            contract_.caregiverAddress,
            contract_.createdAt,
            contract_.acceptedAt,
            contract_.status,
            contract_.totalEurCents
        );
    }
    
    /**
     * @notice Get all contract IDs for a user
     * @param userAddress User wallet address
     */
    function getUserContracts(address userAddress) 
        external 
        view 
        returns (string[] memory) 
    {
        return userContracts[userAddress];
    }
    
    /**
     * @notice Get total number of contracts
     */
    function getTotalContracts() external view returns (uint256) {
        return allContractIds.length;
    }
    
    /**
     * @notice Verify contract hash
     * @param contractId Contract identifier
     * @param hashToVerify Hash to verify
     */
    function verifyContractHash(
        string calldata contractId, 
        bytes32 hashToVerify
    ) external view returns (bool) {
        return contracts[contractId].contractHash == hashToVerify;
    }
    
    /**
     * @notice Pause contract operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause contract operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
