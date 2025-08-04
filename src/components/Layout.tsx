import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Gift, 
  CreditCard, 
  Settings, 
  LogOut, 
  Gamepad2,
  Shield,
  Wallet
} from 'lucide-react';
import { GiftCardGenerator } from '@/components/GiftCardGenerator';
import { GiftCardRedeemer } from '@/components/GiftCardRedeemer';
import { AdminPanel } from '@/components/AdminPanel';
import { giftCardAPI } from '@/lib/giftcard-api';
import { User } from '@/types/giftcard';

export const Layout = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('redeem');
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    setCurrentUser(giftCardAPI.getCurrentUser());
    setUserBalance(giftCardAPI.getUserBalance());
  }, []);

  const handleAdminUnlock = () => {
    setCurrentUser(giftCardAPI.getCurrentUser());
  };

  const handleLogout = () => {
    giftCardAPI.logout();
    setCurrentUser(null);
    setActiveTab('redeem');
  };

  const handleTabChange = (value: string) => {
    if (value === 'admin' && !currentUser?.isAdmin) {
      return;
    }
    if (value === 'generate' && !currentUser?.isAdmin) {
      return;
    }
    setActiveTab(value);
  };

  const handleBalanceUpdate = () => {
    setUserBalance(giftCardAPI.getUserBalance());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary-glow">
                <Gamepad2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Steam Gift Cards</h1>
                <p className="text-sm text-muted-foreground">
                  Generate and redeem Steam gift cards
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{currentUser.fullName}</p>
                    <div className="flex items-center gap-1">
                      {currentUser.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm">
                    <Wallet className="h-4 w-4 mr-2" />
                    Balance: ${userBalance.toFixed(2)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="redeem" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Redeem
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              className="flex items-center gap-2"
              disabled={!currentUser?.isAdmin}
            >
              <Gift className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger 
              value="admin" 
              className="flex items-center gap-2"
              disabled={!currentUser?.isAdmin}
            >
              <Settings className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          <div className="max-w-2xl mx-auto">
            <TabsContent value="redeem">
              <GiftCardRedeemer onAdminUnlock={handleAdminUnlock} onBalanceUpdate={handleBalanceUpdate} />
            </TabsContent>

            <TabsContent value="generate">
              {currentUser?.isAdmin ? (
                <GiftCardGenerator />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
                    <p className="text-muted-foreground">
                      You need admin privileges to generate gift cards.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="admin">
              {currentUser?.isAdmin ? (
                <AdminPanel />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
                    <p className="text-muted-foreground">
                      You need admin privileges to access the admin panel.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Steam Gift Card System. Built with React, TypeScript & Tailwind CSS.</p>
            <p className="mt-1">
              Demo system with persistent local storage and security features.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};