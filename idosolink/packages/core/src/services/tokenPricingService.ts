export class TokenPricingService {
  private rate: number;

  constructor(rate = Number(process.env.TOKEN_RATE ?? 10)) {
    this.rate = rate;
  }

  eurToToken(eur: number): number {
    return Math.round(eur * this.rate);
  }

  tokenToEur(token: number): number {
    return Math.round(token / this.rate);
  }
}
