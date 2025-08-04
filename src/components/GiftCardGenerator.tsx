import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gift, Copy, Check } from 'lucide-react';
import { giftCardAPI } from '@/lib/giftcard-api';
import { toast } from '@/hooks/use-toast';
import { GiftCard } from '@/types/giftcard';

export const GiftCardGenerator = () => {
  const [amount, setAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [expiryDays, setExpiryDays] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<GiftCard | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const presetAmounts = ['10', '25', '50', '100', '250', 'custom'];

  const handleGenerate = async () => {
    const finalAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);
    
    if (!finalAmount || finalAmount < 5 || finalAmount > 1000) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount between $5 and $1000",
        variant: "destructive"
      });
      return;
    }

    const expiry = expiryDays ? parseInt(expiryDays) : undefined;
    if (expiry && (expiry < 1 || expiry > 365)) {
      toast({
        title: "Invalid Expiry",
        description: "Expiry must be between 1 and 365 days",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await giftCardAPI.generateGiftCard(finalAmount, expiry);
      
      if (result.success && result.giftCard) {
        setGeneratedCard(result.giftCard);
        toast({
          title: "Gift Card Generated!",
          description: `Successfully created a $${finalAmount} gift card`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate gift card",
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
      setIsGenerating(false);
    }
  };

  const copyCode = async () => {
    if (generatedCard) {
      await navigator.clipboard.writeText(generatedCard.code);
      setCopiedCode(true);
      toast({
        title: "Copied!",
        description: "Gift card code copied to clipboard",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Gift className="h-6 w-6 text-primary" />
            Generate Steam Gift Card
          </CardTitle>
          <CardDescription>
            Create new Steam gift cards with custom amounts and expiry dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset ? "default" : "outline"}
                  onClick={() => setAmount(preset)}
                  className="text-sm"
                >
                  {preset === 'custom' ? 'Custom' : `$${preset}`}
                </Button>
              ))}
            </div>
            {amount === 'custom' && (
              <Input
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                type="number"
                min="5"
                max="1000"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry (Optional)</Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger>
                <SelectValue placeholder="Select expiry period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No expiry</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={!amount || isGenerating}
            className="w-full steam-button"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Gift Card'
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedCard && (
        <Card className="gift-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-steam-wallet">
              Gift Card Generated Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                ${generatedCard.balance.toFixed(2)}
              </Badge>
              {generatedCard.expiresAt && (
                <p className="text-sm text-muted-foreground">
                  Expires: {generatedCard.expiresAt.toLocaleDateString()}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Gift Card Code</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedCard.code}
                  readOnly
                  className="font-mono text-center text-lg tracking-wider"
                />
                <Button
                  onClick={copyCode}
                  variant="outline"
                  size="icon"
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-steam-wallet" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Created: {generatedCard.createdAt.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};