import { randomBytes } from 'crypto';

export class TokenService {
  async mintTo(address: string, amountToken: number) {
    return `0x${randomBytes(20).toString('hex')}`;
  }

  async burnFrom(address: string, amountToken: number) {
    return `0x${randomBytes(20).toString('hex')}`;
  }

  async getBalance(address: string) {
    return {
      address,
      balance: 0
    };
  }
}
