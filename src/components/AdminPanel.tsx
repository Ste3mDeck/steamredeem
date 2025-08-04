import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check, BarChart3, History, Gift } from 'lucide-react';
import { giftCardAPI } from '@/lib/giftcard-api';
import { toast } from '@/hooks/use-toast';
import { GiftCard, RedemptionHistory } from '@/types/giftcard';

export const AdminPanel = () => {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionHistory[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cardsData, redemptionsData] = await Promise.all([
        giftCardAPI.getGiftCards(),
        giftCardAPI.getRedemptionHistory()
      ]);
      setGiftCards(cardsData);
      setRedemptions(redemptionsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copied!",
      description: "Gift card code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const stats = {
    totalCards: giftCards.length,
    totalValue: giftCards.reduce((sum, card) => sum + card.originalBalance, 0),
    redeemedCards: giftCards.filter(card => card.isRedeemed).length,
    redeemedValue: giftCards.filter(card => card.isRedeemed).reduce((sum, card) => sum + card.balance, 0),
    activeCards: giftCards.filter(card => !card.isRedeemed && !card.isExpired).length,
    expiredCards: giftCards.filter(card => card.isExpired).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cards</p>
                <p className="text-2xl font-bold">{stats.totalCards}</p>
              </div>
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-steam-wallet" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Redeemed</p>
                <p className="text-2xl font-bold">{stats.redeemedCards}</p>
              </div>
              <Check className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cards</p>
                <p className="text-2xl font-bold">{stats.activeCards}</p>
              </div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="gift-cards" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gift-cards">All Gift Cards</TabsTrigger>
          <TabsTrigger value="unredeemed">Unredeemed</TabsTrigger>
          <TabsTrigger value="redemptions">Redemption History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gift-cards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gift Cards Management</CardTitle>
              <CardDescription>
                View and manage all generated gift cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-mono text-sm">
                          {card.code}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            ${card.balance.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {card.isRedeemed ? (
                            <Badge variant="secondary">Redeemed</Badge>
                          ) : card.isExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge className="bg-steam-wallet text-steam-wallet-foreground">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {card.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {card.expiresAt?.toLocaleDateString() || 'Never'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(card.code)}
                          >
                            {copiedCode === card.code ? (
                              <Check className="h-4 w-4 text-steam-wallet" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unredeemed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unredeemed Gift Cards</CardTitle>
              <CardDescription>
                View all active, unredeemed gift cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCardAPI.getUnredeemedGiftCards().map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-mono text-sm">
                          {card.code}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            ${card.balance.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {card.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {card.expiresAt ? card.expiresAt.toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(card.code)}
                          >
                            {copiedCode === card.code ? (
                              <Check className="h-4 w-4 text-steam-wallet" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
              <CardDescription>
                Track all gift card redemption activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gift Card Code</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Redeemed At</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((redemption) => {
                      const giftCard = giftCards.find(card => card.id === redemption.giftCardId);
                      return (
                        <TableRow key={redemption.id}>
                          <TableCell className="font-mono text-sm">
                            {giftCard?.code || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              ${redemption.amountRedeemed.toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {redemption.redeemedAt.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {redemption.userAgent || 'Unknown'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};