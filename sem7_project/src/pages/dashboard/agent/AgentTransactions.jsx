import React, { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, Clock, FileText, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { paymentAPI } from '../../../services/backendAPI';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const AgentTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: '30',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await paymentAPI.getAgentTransactions();
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[statusLower] || 'outline'}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.dateRange !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(filters.dateRange));
      const transactionDate = new Date(transaction.CreatedAt);
      if (transactionDate < daysAgo) {
        return false;
      }
    }
    return true;
  });

  // Calculate commission (2% of property value)
  const calculateCommission = (amount) => {
    return amount * 0.02;
  };

  const stats = {
    totalEarnings: transactions.reduce((sum, t) => 
      t.Status?.toLowerCase() === 'completed' ? sum + calculateCommission(t.Amount || 0) : sum, 0),
    pendingAmount: transactions.reduce((sum, t) => 
      t.Status?.toLowerCase() === 'pending' ? sum + calculateCommission(t.Amount || 0) : sum, 0),
    totalTransactions: transactions.length,
    completedDeals: transactions.filter(t => t.Status?.toLowerCase() === 'completed').length,
  };

  const formatAmountPdf = (amount) => {
    return `Rs. ${amount?.toLocaleString('en-IN') || '0'}`;
  };

  const handleExportReport = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Agent Transactions Report', 14, 20);
      
      // Metadata
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
      doc.text(`Total Earnings: ${formatAmountPdf(stats.totalEarnings)}`, 14, 34);
      
      // Table
      const tableData = [...filteredTransactions]
        .sort((a, b) => a.Id - b.Id)
        .map(t => [
        t.Id,
        t.PropertyTitle || 'N/A',
        t.BuyerName || 'N/A',
        formatAmountPdf(t.Amount),
        formatAmountPdf(calculateCommission(t.Amount || 0)),
        t.Status,
        new Date(t.CreatedAt).toLocaleDateString('en-IN')
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['ID', 'Property', 'Buyer', 'Value', 'Commission', 'Status', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });

      doc.save(`Agent-Transactions-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    }
  };

  const handleDownloadInvoice = (transaction) => {
    try {
      const doc = new jsPDF();
      const commission = calculateCommission(transaction.Amount || 0);

      // Header
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246);
      doc.text('INVOICE', 14, 20);
      
      // Company Info
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Property Management System', 14, 30);
      doc.text('123 Real Estate Ave, Business City', 14, 35);
      doc.text('support@pms.com', 14, 40);

      // Invoice Details
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text(`Invoice #: INV-${transaction.Id}`, 140, 30);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 140, 36);
      doc.text(`Status: Paid`, 140, 42);

      // Bill To
      doc.line(14, 50, 196, 50);
      doc.setFontSize(12);
      doc.text('Bill To:', 14, 60);
      doc.setFontSize(10);
      doc.text(`Agent Name: ${transaction.AgentName || 'Agent'}`, 14, 66);
      // Assuming we might have agent email or other details in future, placeholder for now

      // Transaction Details Table
      autoTable(doc, {
        startY: 80,
        head: [['Description', 'Amount']],
        body: [
          [`Commission for sale of ${transaction.PropertyTitle}`, formatAmountPdf(commission)],
          ['Service Tax (18%)', formatAmountPdf(commission * 0.18)], // Example tax
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Total
      const finalY = doc.lastAutoTable.finalY + 10;
      const totalAmount = commission + (commission * 0.18);
      
      doc.setFontSize(12);
      doc.text(`Total Amount: ${formatAmountPdf(totalAmount)}`, 140, finalY);
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Thank you for your business!', 105, 280, { align: 'center' });

      doc.save(`Invoice-${transaction.Id}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Invoice download failed:', error);
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-gray-600 mt-2">Track your sales and commissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Commission earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">To be received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedDeals}</div>
            <p className="text-xs text-muted-foreground">Successful deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="ml-auto" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Your property deals and commission history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between items-center p-4 border rounded">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map(transaction => (
                <div key={transaction.Id} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">#{transaction.Id}</span>
                        {getStatusBadge(transaction.Status)}
                      </div>
                      <p className="text-sm font-medium">
                        {transaction.PropertyTitle || 'Property Sale'}
                      </p>
                      <p className="text-sm text-gray-600">Buyer: {transaction.BuyerName || 'N/A'}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(transaction.CreatedAt).toLocaleDateString()}
                        </span>
                        <span>{transaction.PropertyCity}, {transaction.PropertyState}</span>
                        {transaction.PaymentMethod && <span>{transaction.PaymentMethod}</span>}
                      </div>
                      {transaction.RazorpayPaymentId && (
                        <p className="text-xs text-gray-500 mt-2">
                          Payment ID: {transaction.RazorpayPaymentId}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Property Value</p>
                      <p className="text-lg font-semibold">{formatAmount(transaction.Amount)}</p>
                      <p className="text-sm text-gray-600 mt-2">Commission (2%)</p>
                      <p className="text-xl font-bold text-primary">
                        {formatAmount(calculateCommission(transaction.Amount))}
                      </p>
                      {transaction.Status?.toLowerCase() === 'completed' && (
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => handleDownloadInvoice(transaction)}>
                          <Download className="h-3 w-3 mr-2" />
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-gray-600">Your transaction history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentTransactions;
