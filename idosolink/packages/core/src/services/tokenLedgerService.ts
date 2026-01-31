import { prisma } from '@idosolink/db/src/client';
import type { TokenLedger } from '@prisma/client';

export class TokenLedgerService {
  async getBalance(userId: string): Promise<number> {
    const entries = await prisma.tokenLedger.findMany({
      where: { userId }
    });
    return entries.reduce((sum: number, entry: TokenLedger) => {
      return entry.type === 'CREDIT' ? sum + entry.amountToken : sum - entry.amountToken;
    }, 0);
  }

  async credit(params: {
    userId: string;
    reason: string;
    amountToken: number;
    amountEur: number;
    refId?: string;
    txHash?: string;
  }) {
    return prisma.tokenLedger.create({
      data: {
        userId: params.userId,
        type: 'CREDIT',
        reason: params.reason,
        amountToken: params.amountToken,
        amountEur: params.amountEur,
        refId: params.refId,
        txHash: params.txHash
      }
    });
  }

  async debit(params: {
    userId: string;
    reason: string;
    amountToken: number;
    amountEur: number;
    refId?: string;
    txHash?: string;
  }) {
    return prisma.tokenLedger.create({
      data: {
        userId: params.userId,
        type: 'DEBIT',
        reason: params.reason,
        amountToken: params.amountToken,
        amountEur: params.amountEur,
        refId: params.refId,
        txHash: params.txHash
      }
    });
  }
}
