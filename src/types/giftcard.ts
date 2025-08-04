export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  originalBalance: number;
  isRedeemed: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  createdAt: Date;
  createdBy?: string;
  redeemedAt?: Date;
  redeemedBy?: string;
}

export interface RedemptionHistory {
  id: string;
  giftCardId: string;
  userId?: string;
  amountRedeemed: number;
  redeemedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface RateLimit {
  id: string;
  userIdentifier: string;
  actionType: 'generate' | 'redeem';
  attempts: number;
  lastAttempt: Date;
  resetAt: Date;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  isAdmin: boolean;
  createdAt: Date;
}