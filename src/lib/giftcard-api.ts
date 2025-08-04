import { GiftCard, RedemptionHistory, User } from '@/types/giftcard';

// Mock database - in a real app this would be Supabase or another backend
class GiftCardAPI {
  private giftCards: GiftCard[] = [];
  private redemptionHistory: RedemptionHistory[] = [];
  private rateLimits = new Map<string, { attempts: number; resetAt: Date }>();
  private currentUser: User | null = null;
  private userBalance: number = 0;
  private adminAttempts: number = 0;

  constructor() {
    // Load from localStorage for persistence across sessions
    this.loadFromStorage();
    
    // No default admin user - must unlock via secret method
    this.currentUser = null;
  }

  private saveToStorage() {
    localStorage.setItem('steam-giftcards', JSON.stringify({
      giftCards: this.giftCards,
      redemptionHistory: this.redemptionHistory,
      userBalance: this.userBalance,
      adminAttempts: this.adminAttempts
    }));
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem('steam-giftcards');
      if (data) {
        const parsed = JSON.parse(data);
        this.giftCards = parsed.giftCards?.map((card: any) => ({
          ...card,
          createdAt: new Date(card.createdAt),
          redeemedAt: card.redeemedAt ? new Date(card.redeemedAt) : undefined,
          expiresAt: card.expiresAt ? new Date(card.expiresAt) : undefined
        })) || [];
        this.redemptionHistory = parsed.redemptionHistory?.map((history: any) => ({
          ...history,
          redeemedAt: new Date(history.redeemedAt)
        })) || [];
        this.userBalance = parsed.userBalance || 0;
        this.adminAttempts = parsed.adminAttempts || 0;
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    }
  }

  private generateCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Format as XXXX-XXXX-XXXX-XXXX
    return result.replace(/(.{4})/g, '$1-').slice(0, -1);
  }

  private checkRateLimit(identifier: string, action: 'generate' | 'redeem', maxAttempts = 10): boolean {
    const key = `${identifier}-${action}`;
    const now = new Date();
    
    const limit = this.rateLimits.get(key);
    
    if (!limit || now > limit.resetAt) {
      this.rateLimits.set(key, {
        attempts: 1,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
      });
      return true;
    }
    
    if (limit.attempts >= maxAttempts) {
      return false;
    }
    
    limit.attempts++;
    return true;
  }

  async generateGiftCard(amount: number, key: string, expiryDate?: Date): Promise<{ success: boolean; giftCard?: GiftCard; error?: string }> {
    if (!this.currentUser?.isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    if (key !== '123') {
      return { success: false, error: 'Invalid generation key' };
    }

    if (amount < 5 || amount > 1000) {
      return { success: false, error: 'Amount must be between $5 and $1000' };
    }

    const clientId = this.currentUser.id;
    if (!this.checkRateLimit(clientId, 'generate', 20)) {
      return { success: false, error: 'Rate limit exceeded. Please try again later.' };
    }

    let code = this.generateCode();
    
    // Ensure unique code
    while (this.giftCards.some(card => card.code === code)) {
      code = this.generateCode();
    }

    const giftCard: GiftCard = {
      id: crypto.randomUUID(),
      code,
      balance: amount,
      originalBalance: amount,
      isRedeemed: false,
      isExpired: false,
      expiresAt: expiryDate,
      createdAt: new Date(),
      createdBy: this.currentUser.id
    };

    this.giftCards.push(giftCard);
    this.saveToStorage();

    return { success: true, giftCard };
  }

  async redeemGiftCard(code: string): Promise<{ success: boolean; balance?: number; error?: string; adminUnlocked?: boolean }> {
    const cleanCode = code.trim().toUpperCase().replace(/\s/g, '');
    
    // Check for admin unlock sequence
    if (cleanCode === '3333-3333-3333-3333') {
      this.adminAttempts++;
      this.saveToStorage();
      
      if (this.adminAttempts >= 10) {
        this.currentUser = {
          id: 'admin-1',
          email: 'admin@steam.com',
          fullName: 'Steam Administrator',
          isAdmin: true,
          createdAt: new Date()
        };
        this.adminAttempts = 0;
        this.saveToStorage();
        return { success: false, error: 'Admin access unlocked', adminUnlocked: true };
      }
      
      return { success: false, error: `Admin unlock: ${this.adminAttempts}/10 attempts` };
    }
    
    const clientId = 'anonymous';
    if (!this.checkRateLimit(clientId, 'redeem', 10)) {
      return { success: false, error: 'Rate limit exceeded. Please try again later.' };
    }

    const giftCard = this.giftCards.find(card => card.code === cleanCode);
    
    if (!giftCard) {
      return { success: false, error: 'Invalid gift card code' };
    }

    if (giftCard.isRedeemed) {
      return { success: false, error: 'This gift card has already been redeemed' };
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      giftCard.isExpired = true;
      this.saveToStorage();
      return { success: false, error: 'This gift card has expired' };
    }

    // Redeem the card
    giftCard.isRedeemed = true;
    giftCard.redeemedAt = new Date();
    giftCard.redeemedBy = 'anonymous';
    
    // Add to user balance
    this.userBalance += giftCard.balance;

    // Add to redemption history
    const redemption: RedemptionHistory = {
      id: crypto.randomUUID(),
      giftCardId: giftCard.id,
      userId: 'anonymous',
      amountRedeemed: giftCard.balance,
      redeemedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent
    };

    this.redemptionHistory.push(redemption);
    this.saveToStorage();

    return { success: true, balance: giftCard.balance };
  }

  async getGiftCards(): Promise<GiftCard[]> {
    if (!this.currentUser?.isAdmin) {
      return [];
    }
    return [...this.giftCards].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRedemptionHistory(): Promise<RedemptionHistory[]> {
    if (!this.currentUser?.isAdmin) {
      return [];
    }
    return [...this.redemptionHistory].sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime());
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Mock authentication
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (email === 'admin@steam.com' && password === 'admin123') {
      this.currentUser = {
        id: 'admin-1',
        email: 'admin@steam.com',
        fullName: 'Steam Administrator',
        isAdmin: true,
        createdAt: new Date()
      };
      return { success: true, user: this.currentUser };
    }
    return { success: false, error: 'Invalid credentials' };
  }

  logout() {
    this.currentUser = null;
  }

  getUserBalance(): number {
    return this.userBalance;
  }

  getUnredeemedGiftCards(): GiftCard[] {
    if (!this.currentUser?.isAdmin) {
      return [];
    }
    return this.giftCards.filter(card => !card.isRedeemed && !card.isExpired);
  }
}

export const giftCardAPI = new GiftCardAPI();