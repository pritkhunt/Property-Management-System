import React, { useState, useEffect } from 'react';
import { CreditCard, Download, TrendingUp, DollarSign, Calendar, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { paymentAPI } from '../../../services/backendAPI';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: '30',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await paymentAPI.getAdminTransactions();
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

  // Calculate commission (2% of property value)
  const calculateCommission = (amount) => {
    if (!amount || amount === undefined || amount === null) return 0;
    return amount * 0.02;
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.search && 
        !transaction.PropertyTitle?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !transaction.BuyerName?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && transaction.Status?.toLowerCase() !== filters.status) {
      return false;
    }
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

  const stats = {
    totalRevenue: transactions.reduce((sum, t) => 
      t.Status?.toLowerCase() === 'completed' ? sum + (t.Amount || 0) : sum, 0),
    totalCommission: transactions.reduce((sum, t) => 
      t.Status?.toLowerCase() === 'completed' ? sum + calculateCommission(t.Amount || 0) : sum, 0),
    totalTransactions: transactions.length,
    completedTransactions: transactions.filter(t => t.Status?.toLowerCase() === 'completed').length,
  };

  const formatAmount = (amount) => {
    if (!amount || amount === undefined || amount === null) return '₹0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[statusLower] || 'outline'}>{status}</Badge>;
  };

  const formatAmountPdf = (amount) => {
    if (!amount || amount === undefined || amount === null) return 'INR 0';
    if (amount >= 10000000) {
      return `INR ${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `INR ${(amount / 100000).toFixed(2)} L`;
    }
    return `INR ${amount.toLocaleString('en-IN')}`;
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Transactions Report', 14, 20);
      
      // Metadata
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 34);
      
      // Table
      const tableData = [...filteredTransactions]
        .sort((a, b) => a.Id - b.Id)
        .map(t => [
        t.Id,
        t.PropertyTitle || 'N/A',
        t.BuyerName || 'N/A',
        t.AgentName || 'N/A',
        formatAmountPdf(t.Amount),
        t.Status,
        new Date(t.CreatedAt).toLocaleDateString('en-IN')
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['ID', 'Property', 'Buyer', 'Agent', 'Amount', 'Status', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });

      doc.save(`Transactions-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-gray-600 mt-2">Monitor all platform transactions</p>
        </div>
        <Button onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Property value transacted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalCommission)}</div>
            <p className="text-xs text-muted-foreground">Platform earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTransactions}</div>
            <p className="text-xs text-muted-foreground">Successful deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

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
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Complete transaction history and details</CardDescription>
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Transaction ID</th>
                    <th className="text-left p-4">Property</th>
                    <th className="text-left p-4">Parties</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Commission</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.Id} className="border-b">
                      <td className="p-4">
                        <span className="font-mono text-sm">{transaction.Id}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-sm">{transaction.PropertyTitle || 'Property Sale'}</p>
                          <p className="text-xs text-gray-500">{transaction.PropertyCity}, {transaction.PropertyState}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>Buyer: {transaction.BuyerName || 'N/A'}</p>
                          <p>Agent: {transaction.AgentName || 'N/A'}</p>
                          {transaction.RazorpayPaymentId && (
                            <p className="text-xs text-gray-500 mt-1">ID: {transaction.RazorpayPaymentId}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{formatAmount(transaction.Amount)}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-primary">{formatAmount(calculateCommission(transaction.Amount))}</p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(transaction.Status)}
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{new Date(transaction.CreatedAt).toLocaleDateString()}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTransactions;
