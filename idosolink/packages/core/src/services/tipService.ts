import { prisma } from '@idosolink/db/src/client';
import { TokenLedgerService } from './tokenLedgerService';

export class TipService {
  private ledger = new TokenLedgerService();

  async sendTip(params: {
    contractId: string;
    fromUserId: string;
    toUserId: string;
    amountToken: number;
    message?: string;
  }) {
    await this.ledger.debit({
      userId: params.fromUserId,
      reason: 'Tip sent',
      amountToken: params.amountToken,
      amountEur: 0,
      refId: params.contractId
    });

    await this.ledger.credit({
      userId: params.toUserId,
      reason: 'Tip received',
      amountToken: params.amountToken,
      amountEur: 0,
      refId: params.contractId
    });

    return prisma.tip.create({
      data: {
        contractId: params.contractId,
        fromUserId: params.fromUserId,
        toUserId: params.toUserId,
        amountToken: params.amountToken,
        message: params.message
      }
    });
  }
}
