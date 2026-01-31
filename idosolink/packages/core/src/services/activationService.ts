import { prisma } from '@idosolink/db/src/client';
import { WalletService } from '@idosolink/web3/src/walletService';
import { TokenPricingService } from './tokenPricingService';
import { TokenLedgerService } from './tokenLedgerService';

export class ActivationService {
  private walletService = new WalletService();
  private pricing = new TokenPricingService();
  private ledger = new TokenLedgerService();

  async activateUser(userId: string, paymentId: string) {
    const wallet = await this.walletService.createEmbeddedWallet(userId);
    const tokenAmount = this.pricing.eurToToken(25);

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID' }
    });

    await this.ledger.credit({
      userId,
      reason: 'Activation',
      amountToken: tokenAmount,
      amountEur: 25,
      refId: paymentId
    });

    return { wallet, tokenAmount };
  }
}
