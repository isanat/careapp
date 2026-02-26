import { ethers, JsonRpcProvider, Wallet, Contract } from "ethers";

// Contract ABIs (simplified for MVP)
const SENIOR_TOKEN_ABI = [
  "function mint(address to, uint256 amount, uint256 eurCents, string reason) external",
  "function burnWithReason(uint256 amount, uint256 eurCents, string reason) external",
  "function burnFromWithReason(address from, uint256 amount, uint256 eurCents, string reason) external",
  "function transferWithReason(address to, uint256 amount, string reason) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function totalMinted() external view returns (uint256)",
  "function totalBurned() external view returns (uint256)",
  "function totalInCirculation() external view returns (uint256)",
];

const CONTRACT_REGISTRY_ABI = [
  "function createContract(string contractId, bytes32 contractHash, address familyAddress, address caregiverAddress, uint256 totalEurCents, uint256 platformFeeEurCents, string metadata) external",
  "function acceptContract(string contractId) external",
  "function updateStatus(string contractId, uint8 newStatus) external",
  "function getContract(string contractId) external view returns (bytes32, address, address, uint256, uint256, uint8, uint256)",
  "function getUserContracts(address userAddress) external view returns (string[])",
];

// Contract addresses (will be set after deployment)
const CONTRACT_ADDRESSES = {
  SENIOR_TOKEN: process.env.SENIOR_TOKEN_ADDRESS || "",
  CONTRACT_REGISTRY: process.env.CONTRACT_REGISTRY_ADDRESS || "",
};

// Network configuration
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "";

export class BlockchainService {
  private provider: JsonRpcProvider;
  private wallet: Wallet | null = null;
  private tokenContract: Contract | null = null;
  private registryContract: Contract | null = null;

  constructor() {
    this.provider = new JsonRpcProvider(RPC_URL);

    if (PRIVATE_KEY) {
      this.wallet = new Wallet(PRIVATE_KEY, this.provider);
      
      if (CONTRACT_ADDRESSES.SENIOR_TOKEN) {
        this.tokenContract = new Contract(
          CONTRACT_ADDRESSES.SENIOR_TOKEN,
          SENIOR_TOKEN_ABI,
          this.wallet
        );
      }

      if (CONTRACT_ADDRESSES.CONTRACT_REGISTRY) {
        this.registryContract = new Contract(
          CONTRACT_ADDRESSES.CONTRACT_REGISTRY,
          CONTRACT_REGISTRY_ABI,
          this.wallet
        );
      }
    }
  }

  /**
   * Mint tokens for a user (when they purchase with EUR)
   */
  async mintTokens(
    toAddress: string,
    amountTokens: number,
    eurCents: number,
    reason: string
  ): Promise<string | null> {
    if (!this.tokenContract) {
      console.warn("Token contract not configured - running in mock mode");
      return null;
    }

    try {
      // Convert to wei (18 decimals)
      const amountWei = ethers.parseUnits(amountTokens.toString(), 18);
      
      const tx = await this.tokenContract.mint(
        toAddress,
        amountWei,
        eurCents,
        reason
      );
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error minting tokens:", error);
      throw error;
    }
  }

  /**
   * Burn tokens (when user redeems for EUR)
   */
  async burnTokens(
    fromAddress: string,
    amountTokens: number,
    eurCents: number,
    reason: string
  ): Promise<string | null> {
    if (!this.tokenContract) {
      console.warn("Token contract not configured - running in mock mode");
      return null;
    }

    try {
      const amountWei = ethers.parseUnits(amountTokens.toString(), 18);
      
      const tx = await this.tokenContract.burnFromWithReason(
        fromAddress,
        amountWei,
        eurCents,
        reason
      );
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error burning tokens:", error);
      throw error;
    }
  }

  /**
   * Transfer tokens between users (for tips, fees, etc.)
   */
  async transferTokens(
    fromAddress: string,
    toAddress: string,
    amountTokens: number,
    reason: string
  ): Promise<string | null> {
    if (!this.tokenContract) {
      console.warn("Token contract not configured - running in mock mode");
      return null;
    }

    try {
      const amountWei = ethers.parseUnits(amountTokens.toString(), 18);
      
      const tx = await this.tokenContract.transferWithReason(
        toAddress,
        amountWei,
        reason
      );
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw error;
    }
  }

  /**
   * Get token balance for an address
   */
  async getBalance(address: string): Promise<string> {
    if (!this.tokenContract) {
      return "0";
    }

    try {
      const balance = await this.tokenContract.balanceOf(address);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      console.error("Error getting balance:", error);
      return "0";
    }
  }

  /**
   * Register a contract on blockchain
   */
  async registerContract(
    contractId: string,
    contractHash: string,
    familyAddress: string,
    caregiverAddress: string,
    totalEurCents: number,
    platformFeeEurCents: number,
    metadata: string
  ): Promise<string | null> {
    if (!this.registryContract) {
      console.warn("Registry contract not configured - running in mock mode");
      return null;
    }

    try {
      const hashBytes32 = ethers.id(contractHash);
      
      const tx = await this.registryContract.createContract(
        contractId,
        hashBytes32,
        familyAddress,
        caregiverAddress,
        totalEurCents,
        platformFeeEurCents,
        metadata
      );
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error registering contract:", error);
      throw error;
    }
  }

  /**
   * Accept a contract (called by caregiver)
   */
  async acceptContract(contractId: string): Promise<string | null> {
    if (!this.registryContract) {
      return null;
    }

    try {
      const tx = await this.registryContract.acceptContract(contractId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error accepting contract:", error);
      throw error;
    }
  }

  /**
   * Get contract details
   */
  async getContract(contractId: string): Promise<{
    contractHash: string;
    familyAddress: string;
    caregiverAddress: string;
    createdAt: bigint;
    acceptedAt: bigint;
    status: number;
    totalEurCents: bigint;
  } | null> {
    if (!this.registryContract) {
      return null;
    }

    try {
      const result = await this.registryContract.getContract(contractId);
      return {
        contractHash: result[0],
        familyAddress: result[1],
        caregiverAddress: result[2],
        createdAt: result[3],
        acceptedAt: result[4],
        status: result[5],
        totalEurCents: result[6],
      };
    } catch (error) {
      console.error("Error getting contract:", error);
      return null;
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStats(): Promise<{
    totalSupply: string;
    totalMinted: string;
    totalBurned: string;
    inCirculation: string;
  }> {
    if (!this.tokenContract) {
      return {
        totalSupply: "0",
        totalMinted: "0",
        totalBurned: "0",
        inCirculation: "0",
      };
    }

    try {
      const [totalSupply, totalMinted, totalBurned, inCirculation] = await Promise.all([
        this.tokenContract.totalSupply(),
        this.tokenContract.totalMinted(),
        this.tokenContract.totalBurned(),
        this.tokenContract.totalInCirculation(),
      ]);

      return {
        totalSupply: ethers.formatUnits(totalSupply, 18),
        totalMinted: ethers.formatUnits(totalMinted, 18),
        totalBurned: ethers.formatUnits(totalBurned, 18),
        inCirculation: ethers.formatUnits(inCirculation, 18),
      };
    } catch (error) {
      console.error("Error getting token stats:", error);
      return {
        totalSupply: "0",
        totalMinted: "0",
        totalBurned: "0",
        inCirculation: "0",
      };
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
