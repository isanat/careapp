import { prisma } from '@idosolink/db/src/client';
import { ContractOnchainService } from '@idosolink/web3/src/contractOnchainService';
import { TokenLedgerService } from './tokenLedgerService';
import { TokenPricingService } from './tokenPricingService';
import { hashContractPayload } from '../utils/hash';

export class ContractService {
  private ledger = new TokenLedgerService();
  private pricing = new TokenPricingService();
  private onchain = new ContractOnchainService();

  async createContract(params: {
    familyUserId: string;
    caregiverUserId: string;
    hoursPerWeek: number;
    hourlyRateEur: number;
    tasks: string[];
    startDate: Date;
    endDate?: Date;
  }) {
    const total = params.hoursPerWeek * params.hourlyRateEur * 4;
    const contract = await prisma.contract.create({
      data: {
        familyUserId: params.familyUserId,
        caregiverUserId: params.caregiverUserId,
        status: 'PENDING_ACCEPTANCE',
        hoursPerWeek: params.hoursPerWeek,
        hourlyRateEur: params.hourlyRateEur,
        tasksJson: JSON.stringify(params.tasks),
        startDate: params.startDate,
        endDate: params.endDate,
        totalEurEstimated: total,
        acceptance: { create: {} }
      }
    });

    const feeToken = this.pricing.eurToToken(5);
    await this.ledger.debit({
      userId: params.familyUserId,
      reason: 'Contract fee',
      amountToken: feeToken,
      amountEur: 5,
      refId: contract.id
    });
    await this.ledger.debit({
      userId: params.caregiverUserId,
      reason: 'Contract fee',
      amountToken: feeToken,
      amountEur: 5,
      refId: contract.id
    });

    return contract;
  }

  async acceptContract(contractId: string, acceptedBy: 'family' | 'caregiver') {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    });
    if (!contract) {
      throw new Error('Contract not found');
    }

    const acceptance = await prisma.contractAcceptance.update({
      where: { contractId },
      data:
        acceptedBy === 'family'
          ? { acceptedByFamilyAt: new Date() }
          : { acceptedByCaregiverAt: new Date() }
    });

    if (acceptance.acceptedByFamilyAt && acceptance.acceptedByCaregiverAt) {
      const hash = hashContractPayload({
        contractId,
        familyUserId: contract.familyUserId,
        caregiverUserId: contract.caregiverUserId,
        hoursPerWeek: contract.hoursPerWeek,
        hourlyRateEur: contract.hourlyRateEur,
        tasks: JSON.parse(contract.tasksJson),
        startDate: contract.startDate,
        endDate: contract.endDate
      });

      const txHash = await this.onchain.recordContract(hash, {
        contractId,
        familyUserId: contract.familyUserId,
        caregiverUserId: contract.caregiverUserId
      });

      await prisma.contract.update({
        where: { id: contractId },
        data: {
          status: 'ACTIVE',
          onchainHash: hash,
          onchainTxHash: txHash
        }
      });
    }

    return acceptance;
  }
}
