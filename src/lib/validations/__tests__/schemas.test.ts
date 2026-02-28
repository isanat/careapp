import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createContractSchema,
  createReviewSchema,
  contractFeeSchema,
  chatMessageSchema,
  contactFormSchema,
} from '../schemas';

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'securepass123',
      role: 'FAMILY',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'not-an-email',
      password: 'securepass123',
      role: 'FAMILY',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'joao@example.com',
      password: '123',
      role: 'FAMILY',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'joao@example.com',
      password: 'securepass123',
      role: 'ADMIN',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short name', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'joao@example.com',
      password: 'securepass123',
      role: 'CAREGIVER',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid reset data', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123',
      email: 'test@example.com',
      password: 'newpassword123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      email: 'test@example.com',
      password: 'newpassword123',
    });
    expect(result.success).toBe(false);
  });
});

describe('createContractSchema', () => {
  it('accepts valid contract data', () => {
    const result = createContractSchema.safeParse({
      caregiverUserId: 'user_123',
      title: 'Cuidado Diário',
      hourlyRateEur: 1500,
      totalHours: 40,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative hourly rate', () => {
    const result = createContractSchema.safeParse({
      caregiverUserId: 'user_123',
      title: 'Test',
      hourlyRateEur: -100,
      totalHours: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero total hours', () => {
    const result = createContractSchema.safeParse({
      caregiverUserId: 'user_123',
      title: 'Test',
      hourlyRateEur: 1500,
      totalHours: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('createReviewSchema', () => {
  it('accepts valid review', () => {
    const result = createReviewSchema.safeParse({
      contractId: 'contract_123',
      toUserId: 'user_456',
      rating: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    const result = createReviewSchema.safeParse({
      contractId: 'contract_123',
      toUserId: 'user_456',
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects rating above 5', () => {
    const result = createReviewSchema.safeParse({
      contractId: 'contract_123',
      toUserId: 'user_456',
      rating: 6,
    });
    expect(result.success).toBe(false);
  });
});

describe('contractFeeSchema', () => {
  it('accepts valid contract fee data', () => {
    const result = contractFeeSchema.safeParse({ contractId: 'contract_123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty contractId', () => {
    const result = contractFeeSchema.safeParse({ contractId: '' });
    expect(result.success).toBe(false);
  });
});

describe('chatMessageSchema', () => {
  it('accepts valid message', () => {
    const result = chatMessageSchema.safeParse({
      chatRoomId: 'room_123',
      content: 'Hello!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = chatMessageSchema.safeParse({
      chatRoomId: 'room_123',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional messageType', () => {
    const result = chatMessageSchema.safeParse({
      chatRoomId: 'room_123',
      content: 'Photo',
      messageType: 'image',
    });
    expect(result.success).toBe(true);
  });
});

describe('contactFormSchema', () => {
  it('accepts valid contact form', () => {
    const result = contactFormSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@example.com',
      subject: 'Dúvida sobre serviços',
      message: 'Gostaria de saber mais sobre os serviços disponíveis.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short message', () => {
    const result = contactFormSchema.safeParse({
      name: 'Maria',
      email: 'maria@example.com',
      subject: 'Test',
      message: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = contactFormSchema.safeParse({
      name: 'Maria',
    });
    expect(result.success).toBe(false);
  });
});
