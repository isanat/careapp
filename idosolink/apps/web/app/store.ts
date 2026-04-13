'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TOKEN_RATE, eurToToken, tokenToEur } from '../lib/finance';

export type UserRole = 'FAMILIAR' | 'CUIDADOR';

export interface LedgerEntry {
  id: string;
  type: 'activation' | 'purchase' | 'contract_fee' | 'tip' | 'redeem';
  description: string;
  tokens: number;
  eur: number;
  date: string;
  txHash?: string;
}

export interface Wallet {
  address: string;
  balanceTokens: number;
  balanceEurEstimate: number;
}

export interface Caregiver {
  id: string;
  name: string;
  rating: number;
  priceHour: number;
  distanceKm: number;
  services: string[];
  bio: string;
  availability: string;
}

export type ContractStatus = 'Draft' | 'Pending' | 'Active' | 'Completed';

export interface Contract {
  id: string;
  caregiverId: string;
  caregiverName: string;
  hoursPerWeek: number;
  tasks: string[];
  startDate: string;
  notes: string;
  status: ContractStatus;
  priceEur: number;
  feeTokens: number;
  acceptedByFamily: boolean;
  acceptedByCaregiver: boolean;
  proofHash?: string;
  txHash?: string;
}

interface Settings {
  advancedMode: boolean;
}

interface AppState {
  role: UserRole;
  wallet: Wallet;
  ledger: LedgerEntry[];
  caregivers: Caregiver[];
  contracts: Contract[];
  settings: Settings;
  setRole: (role: UserRole) => void;
  toggleAdvancedMode: () => void;
  addTokens: (eur: number, description: string, type: 'activation' | 'purchase') => void;
  spendTokens: (tokens: number, description: string) => boolean;
  addTip: (contractId: string, tokens: number) => void;
  redeemTokens: (tokens: number) => void;
  createContract: (payload: Omit<Contract, 'id' | 'status' | 'acceptedByFamily' | 'acceptedByCaregiver'>) => Contract;
  updateContract: (id: string, updates: Partial<Contract>) => void;
}

const generateId = () => `id_${Math.random().toString(36).slice(2, 10)}`;
const generateAddress = () => `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;

const defaultCaregivers: Caregiver[] = [
  {
    id: 'caregiver-1',
    name: 'Carmela Oliveira',
    rating: 4.9,
    priceHour: 25,
    distanceKm: 3.2,
    services: ['Higiene', 'Mobilidade', 'Companhia'],
    bio: 'Cuidadora há 8 anos, com foco em mobilidade e acompanhamento diário.',
    availability: 'Seg-Sex · 08h-18h'
  },
  {
    id: 'caregiver-2',
    name: 'Tiago Almeida',
    rating: 4.7,
    priceHour: 22,
    distanceKm: 5.6,
    services: ['Medicação', 'Rotina', 'Atividades cognitivas'],
    bio: 'Atua em cuidados domiciliares com rotina estruturada e carinho.',
    availability: 'Seg-Sáb · 10h-20h'
  },
  {
    id: 'caregiver-3',
    name: 'Luiza Pereira',
    rating: 5.0,
    priceHour: 28,
    distanceKm: 2.1,
    services: ['Companhia', 'Passeios', 'Alimentação'],
    bio: 'Especialista em bem-estar emocional e alimentação assistida.',
    availability: 'Ter-Dom · 09h-19h'
  }
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: 'FAMILIAR',
      wallet: {
        address: generateAddress(),
        balanceTokens: eurToToken(25),
        balanceEurEstimate: 25
      },
      ledger: [
        {
          id: generateId(),
          type: 'activation',
          description: 'Ativação inicial com €25 (créditos)',
          tokens: eurToToken(25),
          eur: 25,
          date: new Date().toISOString()
        }
      ],
      caregivers: defaultCaregivers,
      contracts: [],
      settings: {
        advancedMode: false
      },
      setRole: (role) => set({ role }),
      toggleAdvancedMode: () =>
        set((state) => ({ settings: { ...state.settings, advancedMode: !state.settings.advancedMode } })),
      addTokens: (eur, description, type) =>
        set((state) => {
          const tokens = eurToToken(eur);
          const nextBalance = state.wallet.balanceTokens + tokens;
          const nextWallet = {
            ...state.wallet,
            balanceTokens: nextBalance,
            balanceEurEstimate: tokenToEur(nextBalance)
          };
          return {
            wallet: nextWallet,
            ledger: [
              {
                id: generateId(),
                type,
                description,
                tokens,
                eur,
                date: new Date().toISOString(),
                txHash: `tx_${Math.random().toString(36).slice(2, 10)}`
              },
              ...state.ledger
            ]
          };
        }),
      spendTokens: (tokens, description) => {
        const { wallet } = get();
        if (wallet.balanceTokens < tokens) {
          return false;
        }
        const nextBalance = wallet.balanceTokens - tokens;
        set((state) => ({
          wallet: {
            ...state.wallet,
            balanceTokens: nextBalance,
            balanceEurEstimate: tokenToEur(nextBalance)
          },
          ledger: [
            {
              id: generateId(),
              type: 'contract_fee',
              description,
              tokens: -tokens,
              eur: tokenToEur(tokens),
              date: new Date().toISOString()
            },
            ...state.ledger
          ]
        }));
        return true;
      },
      addTip: (contractId, tokens) =>
        set((state) => {
          const nextBalance = state.wallet.balanceTokens - tokens;
          return {
            wallet: {
              ...state.wallet,
              balanceTokens: nextBalance,
              balanceEurEstimate: tokenToEur(nextBalance)
            },
            ledger: [
              {
                id: generateId(),
                type: 'tip',
                description: `Gorjeta enviada · contrato ${contractId}`,
                tokens: -tokens,
                eur: tokenToEur(tokens),
                date: new Date().toISOString()
              },
              ...state.ledger
            ]
          };
        }),
      redeemTokens: (tokens) =>
        set((state) => {
          const nextBalance = state.wallet.balanceTokens - tokens;
          return {
            wallet: {
              ...state.wallet,
              balanceTokens: nextBalance,
              balanceEurEstimate: tokenToEur(nextBalance)
            },
            ledger: [
              {
                id: generateId(),
                type: 'redeem',
                description: 'Conversão de créditos para euro',
                tokens: -tokens,
                eur: tokenToEur(tokens),
                date: new Date().toISOString(),
                txHash: `tx_${Math.random().toString(36).slice(2, 10)}`
              },
              ...state.ledger
            ]
          };
        }),
      createContract: (payload) => {
        const contract: Contract = {
          ...payload,
          id: generateId(),
          status: 'Pending',
          acceptedByCaregiver: false,
          acceptedByFamily: false
        };
        set((state) => ({ contracts: [contract, ...state.contracts] }));
        return contract;
      },
      updateContract: (id, updates) =>
        set((state) => ({
          contracts: state.contracts.map((contract) =>
            contract.id === id ? { ...contract, ...updates } : contract
          )
        }))
    }),
    {
      name: 'idosolink-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        wallet: state.wallet,
        ledger: state.ledger,
        caregivers: state.caregivers,
        contracts: state.contracts,
        settings: state.settings
      })
    }
  )
);

export { TOKEN_RATE };
