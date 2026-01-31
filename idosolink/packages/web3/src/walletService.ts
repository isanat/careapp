import { prisma } from '@idosolink/db/src/client';
import { randomBytes } from 'crypto';

export class WalletService {
  async createEmbeddedWallet(userId: string) {
    const address = `0x${randomBytes(20).toString('hex')}`;
    return prisma.wallet.create({
      data: {
        userId,
        address,
        type: 'EMBEDDED'
      }
    });
  }

  async getWallet(userId: string) {
    return prisma.wallet.findUnique({
      where: { userId }
    });
  }

  async exportWallet(userId: string) {
    return {
      message: 'Export wallet placeholder - integrate AA or MPC provider here.',
      userId
    };
  }
}
