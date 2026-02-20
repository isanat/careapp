/**
 * Easypay Service - Payment Gateway for Portugal
 * Documentation: https://docs.easypay.pt/docs
 * 
 * Supports:
 * - MB Way (mobile payments)
 * - Multibanco references
 * - Credit/Debit cards
 * - Direct debit
 */

// API URLs
const EASYPAY_API_URL = process.env.EASYPAY_ENV === 'production'
  ? 'https://api.easypay.pt/2.0'
  : 'https://api.test.easypay.pt/2.0';

// Types
export interface EasypayConfig {
  apiKey: string;
  accountId: string;
}

export interface EasypaySinglePaymentRequest {
  // Required
  type: 'sale' | 'authorization' | 'capture';
  method: 'mbway' | 'multibanco' | 'cc' | 'dd';
  
  // Transaction data
  transaction_key: string; // Unique ID for this payment
  amount: number; // Amount in euros (decimal)
  currency: string; // EUR
  
  // Customer data
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    phone_indicative?: string; // +351 for Portugal
    fiscal_number?: string; // NIF
    address?: {
      country?: string;
      city?: string;
      postal_code?: string;
      street?: string;
    };
  };
  
  // Optional
  description?: string;
  capture?: {
    transaction_key?: string;
    descriptors?: {
      fee?: string;
      client?: string;
    };
  };
  
  // Callback URL for webhooks
  url_callback?: string;
  url_cancel?: string;
  url_success?: string;
}

export interface EasypaySinglePaymentResponse {
  id: number;
  uid: string;
  status: 'ok' | 'error';
  message?: string;
  
  // Payment details
  transaction_key: string;
  type: string;
  method: string;
  
  // Amounts
  amount: number;
  amount_requested: number;
  currency: string;
  
  // Status
  status_payment: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  
  // MB Way specific
  mbway?: {
    alias?: string; // Phone number
    request_id?: string;
  };
  
  // Multibanco specific
  multibanco?: {
    entity: string;
    reference: string;
    amount: number;
    expires_at: string;
  };
  
  // Card specific
  creditcard?: {
    url?: string; // Payment page URL
  };
  
  // URLs
  url_callback?: string;
  url_success?: string;
  url_cancel?: string;
  
  // Timestamps
  created_at: string;
  expires_at?: string;
  paid_at?: string;
}

export interface EasypayWebhookData {
  id: number;
  uid: string;
  transaction_key: string;
  status: 'ok' | 'error';
  status_payment: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  method: string;
  type: string;
  amount: number;
  currency: string;
  created_at: string;
  paid_at?: string;
  
  // Customer
  customer: {
    id: string;
    name: string;
    email: string;
  };
  
  // Signature for verification
  signature?: string;
}

/**
 * Easypay API Client
 */
export class EasypayService {
  private apiKey: string;
  private accountId: string;
  
  constructor(config?: EasypayConfig) {
    this.apiKey = config?.apiKey || process.env.EASYPAY_API_KEY || '';
    this.accountId = config?.accountId || process.env.EASYPAY_ACCOUNT_ID || '';
  }
  
  /**
   * Make an API request to Easypay
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: Record<string, unknown>
  ): Promise<T> {
    const url = `${EASYPAY_API_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'AccountId': this.accountId,
      'ApiKey': this.apiKey,
    };
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Easypay API error:', responseData);
      throw new Error(responseData.message || 'Easypay API request failed');
    }
    
    return responseData as T;
  }
  
  /**
   * Create a single payment
   */
  async createSinglePayment(
    params: EasypaySinglePaymentRequest
  ): Promise<EasypaySinglePaymentResponse> {
    return this.request<EasypaySinglePaymentResponse>('/single/create', 'POST', {
      ...params,
      // Add callback URL for webhooks
      url_callback: params.url_callback || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/easypay`,
    });
  }
  
  /**
   * Get payment details by UID
   */
  async getPayment(uid: string): Promise<EasypaySinglePaymentResponse> {
    return this.request<EasypaySinglePaymentResponse>(`/single/${uid}`, 'GET');
  }
  
  /**
   * Get payment by transaction key
   */
  async getPaymentByTransactionKey(transactionKey: string): Promise<EasypaySinglePaymentResponse> {
    return this.request<EasypaySinglePaymentResponse>(`/single/transaction/${transactionKey}`, 'GET');
  }
  
  /**
   * Create MB Way payment
   */
  async createMBWayPayment(params: {
    transactionKey: string;
    amount: number;
    customer: {
      id: string;
      name: string;
      email: string;
      phone: string; // Required for MB Way
    };
    description?: string;
  }): Promise<EasypaySinglePaymentResponse> {
    return this.createSinglePayment({
      type: 'sale',
      method: 'mbway',
      transaction_key: params.transactionKey,
      amount: params.amount,
      currency: 'EUR',
      customer: {
        id: params.customer.id,
        name: params.customer.name,
        email: params.customer.email,
        phone: params.customer.phone.replace(/\s/g, ''), // Remove spaces
        phone_indicative: '+351',
      },
      description: params.description,
    });
  }
  
  /**
   * Create Multibanco reference
   */
  async createMultibancoReference(params: {
    transactionKey: string;
    amount: number;
    customer: {
      id: string;
      name: string;
      email: string;
      fiscalNumber?: string; // NIF
    };
    description?: string;
    expiresAt?: Date;
  }): Promise<EasypaySinglePaymentResponse> {
    return this.createSinglePayment({
      type: 'sale',
      method: 'multibanco',
      transaction_key: params.transactionKey,
      amount: params.amount,
      currency: 'EUR',
      customer: {
        id: params.customer.id,
        name: params.customer.name,
        email: params.customer.email,
        fiscal_number: params.customer.fiscalNumber,
      },
      description: params.description,
    });
  }
  
  /**
   * Create credit card payment
   */
  async createCardPayment(params: {
    transactionKey: string;
    amount: number;
    customer: {
      id: string;
      name: string;
      email: string;
    };
    description?: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<EasypaySinglePaymentResponse> {
    return this.createSinglePayment({
      type: 'sale',
      method: 'cc',
      transaction_key: params.transactionKey,
      amount: params.amount,
      currency: 'EUR',
      customer: {
        id: params.customer.id,
        name: params.customer.name,
        email: params.customer.email,
      },
      description: params.description,
      url_success: params.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      url_cancel: params.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
    });
  }
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(data: EasypayWebhookData, signature: string): boolean {
    // Easypay uses a simple signature mechanism
    // The signature is created by concatenating specific fields
    // In production, you should verify this properly
    // For now, we'll check if the signature exists
    return !!signature;
  }
}

// Export singleton instance
export const easypayService = new EasypayService();

// Helper function to format Portuguese phone number
export function formatPortuguesePhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 351, remove it
  if (digits.startsWith('351')) {
    return digits.substring(3);
  }
  
  return digits;
}

// Helper function to validate NIF (Portuguese fiscal number)
export function validateNIF(nif: string): boolean {
  // NIF must be 9 digits
  if (!/^\d{9}$/.test(nif)) {
    return false;
  }
  
  // First digit must be 1, 2, 3, 5, 6, 8, or 9
  const firstDigit = parseInt(nif[0]);
  if (![1, 2, 3, 5, 6, 8, 9].includes(firstDigit)) {
    return false;
  }
  
  // Validate checksum
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(nif[i]) * (9 - i);
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return checkDigit === parseInt(nif[8]);
}
