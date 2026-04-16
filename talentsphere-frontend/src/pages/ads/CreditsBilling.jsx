/**
 * Credits & Billing Page
 * Display credit balance, purchase credits, and transaction history
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import adManagerService from '../../services/adManager';
import { toast } from 'sonner';

const CreditsBilling = () => {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const data = await adManagerService.getCredits();
      setCredits(data);
    } catch (error) {
      console.error('Failed to load credits:', error);
      toast.error('Failed to load credit information');
      // Set mock data for demo
      setCredits({
        balance: 450.75,
        transactions: [
          {
            id: 1,
            amount: 100,
            transaction_type: 'PURCHASE',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            note: 'Credit purchase',
          },
          {
            id: 2,
            amount: 50.25,
            transaction_type: 'SPEND',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            note: 'Campaign spend',
          },
          {
            id: 3,
            amount: 400,
            transaction_type: 'PURCHASE',
            created_at: new Date(Date.now() - 604800000).toISOString(),
            note: 'Initial credit purchase',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async () => {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setProcessingPurchase(true);
      // In a real app, this would integrate with Stripe
      await adManagerService.purchaseCredits(
        parseFloat(purchaseAmount),
        `PURCHASE_${Date.now()}`
      );
      toast.success(`Successfully purchased $${purchaseAmount} in credits!`);
      setPurchaseAmount('');
      setShowPurchaseDialog(false);
      loadCredits();
    } catch (error) {
      toast.error(error?.error || 'Failed to process purchase');
    } finally {
      setProcessingPurchase(false);
    }
  };

  const getTransactionIcon = (type) => {
    if (type === 'PURCHASE' || type === 'BONUS') {
      return <ArrowDownLeft className="w-4 h-4 text-[#1BA398]" />;
    }
    return <ArrowUpRight className="w-4 h-4 text-[#FF6B35]" />;
  };

  const getTransactionBadge = (type) => {
    const variants = {
      PURCHASE: 'bg-[#1BA398]/20 text-[#1BA398] border border-[#1BA398]/40',
      SPEND: 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/40',
      REFUND: 'bg-[#123f6e]/70 text-slate-200 border border-[#1b4f86]',
      BONUS: 'bg-[#0a335f]/80 text-slate-200 border border-[#1b4f86]',
    };
    return variants[type] || 'bg-[#123f6e]/70 text-slate-200 border border-[#1b4f86]';
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pageBackgroundStyle = {
    backgroundColor: '#002a5a',
    backgroundImage:
      'radial-gradient(circle at center, rgba(18, 63, 110, 0.45) 0, rgba(18, 63, 110, 0.45) 18px, transparent 20px)',
    backgroundSize: '74px 74px',
  };

  const darkCardClass = 'border-[#1b4f86] bg-[#0a335f]/75 text-slate-100';
  const brandPrimaryButtonClass = 'bg-gradient-to-r from-[#1BA398] to-[#FF6B35] text-slate-100 hover:from-[#158b7e] hover:to-[#e55a24]';
  const brandOutlineButtonClass = 'border-[#1BA398]/50 text-[#1BA398] hover:bg-[#1BA398]/15 hover:text-slate-100';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-300">Loading credit information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl rounded-2xl p-4 sm:p-6" style={pageBackgroundStyle}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Credits & Billing</h1>
        <p className="text-slate-300 mt-1">Manage your ad credits and billing information</p>
      </div>

      {/* Credit Balance Card - Large & Prominent */}
      <Card className={`${darkCardClass} bg-gradient-to-br from-[#001F3F]/90 via-[#0a2847]/85 to-[#1BA398]/30`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                Current Balance
              </p>
              <h2 className="text-5xl font-bold mt-2">
                {formatCurrency(credits?.balance || 0)}
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                Ready to spend on campaigns
              </p>
            </div>
            <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className={`gap-2 ${brandPrimaryButtonClass}`}>
                  <Plus className="w-5 h-5" />
                  Purchase Credits
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Purchase Credits</DialogTitle>
                  <DialogDescription>
                    Add credits to your account to run more ads
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="50.00"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      step="0.01"
                      min="1"
                    />
                  </div>

                  {/* Quick select amounts */}
                  <div>
                    <Label className="text-xs text-slate-300 mb-2 block">
                      Quick Select
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 100, 250].map((amount) => (
                        <Button
                          key={amount}
                          variant={purchaseAmount === amount.toString() ? 'default' : 'outline'}
                          size="sm"
                          className={purchaseAmount === amount.toString() ? brandPrimaryButtonClass : brandOutlineButtonClass}
                          onClick={() => setPurchaseAmount(amount.toString())}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Alert>
                    <CreditCard className="h-4 w-4" />
                    <AlertDescription>
                      You'll be redirected to secure payment (Stripe integration)
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      className={brandOutlineButtonClass}
                      onClick={() => setShowPurchaseDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePurchaseCredits}
                      disabled={!purchaseAmount || processingPurchase}
                      className={brandPrimaryButtonClass}
                    >
                      {processingPurchase ? 'Processing...' : `Pay ${formatCurrency(purchaseAmount || 0)}`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Usage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={darkCardClass}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">Lifetime Purchased</p>
                <TrendingUp className="w-4 h-4 text-[#1BA398]" />
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  credits?.transactions
                    ?.filter((t) => t.transaction_type === 'PURCHASE')
                    ?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={darkCardClass}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">Total Spent</p>
                <TrendingDown className="w-4 h-4 text-[#FF6B35]" />
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  credits?.transactions
                    ?.filter((t) => t.transaction_type === 'SPEND')
                    ?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={darkCardClass}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">Transactions</p>
                <CreditCard className="w-4 h-4 text-[#1BA398]" />
              </div>
              <p className="text-2xl font-bold">
                {credits?.transactions?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className={darkCardClass}>
        <CardHeader className="pb-4 border-b border-[#1b4f86]">
          <CardTitle className="text-slate-100">Transaction History</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-slate-300">Date</TableHead>
                <TableHead className="text-slate-300">Type</TableHead>
                <TableHead className="text-right text-slate-300">Amount</TableHead>
                <TableHead className="text-slate-300">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits?.transactions && credits.transactions.length > 0 ? (
                credits.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {formatDate(transaction.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTransactionBadge(transaction.transaction_type)}>
                        <span className="mr-1">
                          {getTransactionIcon(transaction.transaction_type)}
                        </span>
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={
                          transaction.transaction_type === 'PURCHASE' ||
                          transaction.transaction_type === 'BONUS' ||
                          transaction.transaction_type === 'REFUND'
                            ? 'text-[#1BA398]'
                            : 'text-[#FF6B35]'
                        }
                      >
                        {transaction.transaction_type === 'PURCHASE' ||
                        transaction.transaction_type === 'BONUS' ||
                        transaction.transaction_type === 'REFUND'
                          ? '+'
                          : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">
                      {transaction.reference_id || transaction.note || '—'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="4" className="text-center py-8 text-slate-300">
                    No transactions yet. Purchase credits to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Billing Information */}
      <Card className={darkCardClass}>
        <CardHeader>
          <CardTitle className="text-sm text-slate-100">Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              💳 Secure payments powered by Stripe. Your credit card information is never stored on our servers.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Payment Methods</Label>
              <p className="text-sm mt-2">
                <Button variant="outline" size="sm" className={brandOutlineButtonClass}>
                  Add Payment Method
                </Button>
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Billing Address</Label>
              <p className="text-sm mt-2 text-slate-300">
                To update your billing address, please contact support
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Invoices</Label>
              <p className="text-sm mt-2 text-slate-300">
                All invoices are automatically emailed after each transaction
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className={darkCardClass}>
        <CardHeader>
          <CardTitle className="text-sm text-slate-100">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">When will my credits be available?</p>
            <p className="text-slate-300">
              Credits are available immediately after payment is processed.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Can I request a refund?</p>
            <p className="text-slate-300">
              Unused credits can be refunded within 30 days of purchase. Contact support for details.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">What payment methods do you accept?</p>
            <p className="text-slate-300">
              We accept all major credit cards (Visa, Mastercard, Amex) and bank transfers.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">How do I know how much each campaign will cost?</p>
            <p className="text-slate-300">
              When creating a campaign, you set your budget and bid amount. You only pay for actual impressions or clicks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsBilling;
