import { prisma } from '@idosolink/db/src/client';
import { TokenService, WalletService } from '@idosolink/web3/src';
import { TokenLedgerService } from './tokenLedgerService';
import { TokenPricingService } from './tokenPricingService';

export class RedemptionService {
  private ledger = new TokenLedgerService();
  private pricing = new TokenPricingService();
  private tokenService = new TokenService();
  private walletService = new WalletService();

  async redeem(userId: string, amountToken: number) {
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const amountEur = this.pricing.tokenToEur(amountToken);
    const burnTxHash = await this.tokenService.burnFrom(wallet.address, amountToken);

    await this.ledger.debit({
      userId,
      reason: 'Token redemption',
      amountToken,
      amountEur,
      refId: wallet.id,
      txHash: burnTxHash
    });

    return prisma.redemption.create({
      data: {
        userId,
        amountToken,
        amountEur,
        status: 'PROCESSING',
        burnTxHash
      }
    });
  }
}
