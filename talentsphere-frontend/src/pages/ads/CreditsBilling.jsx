/**
 * Credits & Billing Page
 * Display credit balance and transaction history
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import adManagerService from '../../services/adManager';
import { toast } from 'sonner';

const CreditsBilling = () => {
  const [credits, setCredits] = useState(null);
  const [packages, setPackages] = useState([]);
  const [purchasing, setPurchasing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadCredits();
    loadPackages();

    const purchaseResult = searchParams.get('purchase');
    if (purchaseResult) {
      if (purchaseResult === 'success') {
        toast.success('Payment simulated — credits added to your balance');
      } else {
        toast.error('Payment simulation failed — no credits were added');
      }
      searchParams.delete('purchase');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const data = await adManagerService.getCredits();
      setCredits(data);
    } catch (error) {
      console.error('Failed to load credits:', error);
      toast.error('Failed to load credit information');
      setCredits({ balance: 0, transactions: [] });
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const data = await adManagerService.getCreditPackages();
      setPackages(data?.packages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      setPackages([]);
    }
  };

  const handlePurchase = async (code) => {
    try {
      setPurchasing(code);
      const data = await adManagerService.purchaseCredits(code);
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.error('Could not start checkout');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error(error.message || 'Could not start credit purchase');
    } finally {
      setPurchasing(null);
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
    return `RWF ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
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
        <p className="text-slate-300 mt-1">Review your ad credit balance and transaction history</p>
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
          </div>
        </CardContent>
      </Card>

      {/* Credit Packs */}
      <Card className={darkCardClass}>
        <CardHeader className="pb-4 border-b border-[#1b4f86]">
          <CardTitle className="text-slate-100">Buy Credit Packs</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pack) => (
                <div
                  key={pack.code}
                  className="rounded-xl border border-[#1b4f86] bg-[#001F3F]/60 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#1BA398]" />
                    <span className="font-semibold text-slate-100">{pack.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">
                    {formatCurrency(pack.price_rwf)}
                  </p>
                  <p className="text-sm text-slate-300">
                    {Number(pack.credits).toLocaleString()} ad credits
                  </p>
                  <Button
                    size="sm"
                    className="bg-[#1BA398] hover:bg-[#1BA398]/80 text-white mt-auto"
                    disabled={purchasing === pack.code}
                    onClick={() => handlePurchase(pack.code)}
                  >
                    {purchasing === pack.code ? 'Starting…' : 'Buy Credits'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              Credit packs are not available right now.
            </p>
          )}
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
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
};

export default CreditsBilling;
