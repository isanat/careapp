export const TOKEN_RATE = 10;

export const eurToToken = (eur: number) => Math.round(eur * TOKEN_RATE);

export const tokenToEur = (tokens: number) => Number((tokens / TOKEN_RATE).toFixed(2));
