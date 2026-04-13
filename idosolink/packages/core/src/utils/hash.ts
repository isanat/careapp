import CryptoJS from 'crypto-js';
import { canonicalize } from './canonicalize';

export const hashContractPayload = (payload: unknown): string => {
  const canonical = canonicalize(payload);
  return CryptoJS.SHA256(canonical).toString(CryptoJS.enc.Hex);
};
