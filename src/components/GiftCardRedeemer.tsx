import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { giftCardAPI } from '@/lib/giftcard-api';
import { toast } from '@/hooks/use-toast';

interface GiftCardRedeemerProps {
  onAdminUnlock?: () => void;
  onBalanceUpdate?: () => void;
}

export const GiftCardRedeemer = ({ onAdminUnlock, onBalanceUpdate }: GiftCardRedeemerProps) => {
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemedAmount, setRedeemedAmount] = useState<number | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter a gift card code",
        variant: "destructive"
      });
      return;
    }

    setIsRedeeming(true);
    
    try {
      const result = await giftCardAPI.redeemGiftCard(code);
      
      if (result.adminUnlocked) {
        toast({
          title: "Admin Access Unlocked!",
          description: "You now have admin privileges",
        });
        onAdminUnlock?.();
        setCode('');
      } else if (result.success && result.balance !== undefined) {
        setRedeemedAmount(result.balance);
        setCode('');
        onBalanceUpdate?.();
        toast({
          title: "Success!",
          description: `$${result.balance.toFixed(2)} has been added to your Steam wallet`,
        });
      } else {
        toast({
          title: "Redemption Failed",
          description: result.error || "Failed to redeem gift card",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const formatCode = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Add dashes every 4 characters
    const formatted = cleaned.replace(/(.{4})/g, '$1-').slice(0, 19); // Max length with dashes
    
    return formatted;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <CreditCard className="h-6 w-6 text-primary" />
            Redeem Gift Card
          </CardTitle>
          <CardDescription>
            Enter your Steam gift card code to add funds to your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Gift Card Code</Label>
            <Input
              id="code"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={handleCodeChange}
              className="font-mono text-center text-lg tracking-wider"
              maxLength={19}
            />
            <p className="text-xs text-muted-foreground">
              Enter the 16-character code from your gift card
            </p>
          </div>

          <Button 
            onClick={handleRedeem}
            disabled={!code.trim() || isRedeeming || code.length < 19}
            className="w-full steam-button"
            size="lg"
          >
            {isRedeeming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redeeming...
              </>
            ) : (
              'Redeem Gift Card'
            )}
          </Button>
        </CardContent>
      </Card>

      {redeemedAmount !== null && (
        <Card className="gift-card border-steam-wallet">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-steam-wallet mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-steam-wallet">
                  Redemption Successful!
                </h3>
                <p className="text-muted-foreground">
                  Your gift card has been redeemed
                </p>
              </div>
              <Badge variant="secondary" className="text-xl px-6 py-3">
                +${redeemedAmount.toFixed(2)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Added to your Steam wallet
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm">
            <h4 className="font-medium">Important Notes:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Gift cards can only be redeemed once</li>
              <li>• Check expiration date if applicable</li>
              <li>• Funds are added directly to your Steam wallet</li>
              <li>• Contact support if you encounter any issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};