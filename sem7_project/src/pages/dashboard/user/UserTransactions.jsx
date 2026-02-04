import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Filter, CheckCircle, Clock, XCircle, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { paymentAPI } from '../../../services/backendAPI';
import useAuthStore from '../../../store/authStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const UserTransactions = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '30',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await paymentAPI.getTransactions();
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

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
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
    return `₹${amount?.toLocaleString('en-IN')}`;
  };

  const formatAmountPdf = (amount) => {
    return `Rs. ${amount?.toLocaleString('en-IN') || '0'}`;
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Transaction History', 14, 20);
      
      // Metadata
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 34);
      
      // Table
      const tableData = [...filteredTransactions]
        .sort((a, b) => b.Id - a.Id)
        .map(t => [
        t.Id,
        t.PropertyTitle || 'N/A',
        formatAmountPdf(t.Amount),
        t.Status,
        new Date(t.CreatedAt).toLocaleDateString('en-IN')
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['ID', 'Property', 'Amount', 'Status', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });

      doc.save(`My-Transactions-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    }
  };

  const handleDownloadReceipt = (transaction) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246);
      doc.text('PAYMENT RECEIPT', 14, 20);
      
      // Company Info
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Property Management System', 14, 30);
      doc.text('support@pms.com', 14, 35);

      // Receipt Details
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text(`Receipt #: RCP-${transaction.Id}`, 140, 30);
      doc.text(`Date: ${new Date(transaction.CreatedAt).toLocaleDateString('en-IN')}`, 140, 36);
      doc.text(`Status: Paid`, 140, 42);

      // Payment Details Box
      doc.setDrawColor(200);
      doc.setFillColor(250);
      doc.rect(14, 50, 182, 40, 'FD');
      
      doc.setFontSize(10);
      doc.text('Amount Paid', 20, 60);
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      doc.text(formatAmountPdf(transaction.Amount), 20, 70);
      
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text('Payment Method', 100, 60);
      doc.setFontSize(12);
      doc.text(transaction.PaymentMethod || 'Online', 100, 70);

      // Property Details
      doc.setFontSize(14);
      doc.text('Property Details', 14, 105);
      
      autoTable(doc, {
        startY: 110,
        head: [['Description', 'Details']],
        body: [
          ['Property', transaction.PropertyTitle || 'Property Purchase'],
          ['Location', `${transaction.PropertyCity}, ${transaction.PropertyState}`],
          ['Transaction ID', transaction.RazorpayPaymentId || transaction.Id],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('This is a computer generated receipt.', 105, 280, { align: 'center' });

      doc.save(`Receipt-${transaction.Id}.pdf`);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Receipt download failed:', error);
      toast.error('Failed to download receipt');
    }
  };



  const handlePayment = async (transaction) => {
    try {
      setIsProcessingPayment(true);
      toast.loading('Creating payment order...');

      // Create Razorpay order
      const orderResponse = await paymentAPI.createOrder(transaction.PropertyId);
      
      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId, property: propertyData } = orderResponse.data.data;

      toast.dismiss();

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Property Management System',
        description: `Purchase: ${propertyData.title}`,
        image: propertyData.image || '/logo192.png',
        order_id: orderId,
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...');
            
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              propertyId: transaction.PropertyId
            });

            toast.dismiss();

            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              fetchTransactions(); // Refresh list
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || 'Payment verification failed');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.Name || user?.name || '',
          email: user?.Email || user?.email || '',
          contact: user?.MobileNo || user?.mobileno || ''
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
            setIsProcessingPayment(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setIsProcessingPayment(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
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
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => t.Status?.toLowerCase() === 'completed' ? sum + (t.Amount || 0) : sum, 0),
    pending: transactions.filter(t => t.Status?.toLowerCase() === 'pending').length,
    completed: transactions.filter(t => t.Status?.toLowerCase() === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-gray-600 mt-2">View and manage your payment transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
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

            <Button variant="outline" className="ml-auto" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            A list of all your payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
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
                      <div className="flex items-start gap-3">
                        {getStatusIcon(transaction.Status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">#{transaction.Id}</span>
                            {getStatusBadge(transaction.Status)}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {transaction.PropertyTitle || 'Property Purchase'}
                          </p>
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
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatAmount(transaction.Amount)}</p>
                      {transaction.Status?.toLowerCase() === 'completed' && (
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => handleDownloadReceipt(transaction)}>
                          <Download className="h-3 w-3 mr-2" />
                          Receipt
                        </Button>
                      )}
                      {transaction.Status?.toLowerCase() === 'pending' && (
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handlePayment(transaction)}
                          disabled={isProcessingPayment}
                        >
                          {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
                        </Button>
                      )}
                      {transaction.Status?.toLowerCase() === 'failed' && (
                        <Button size="sm" variant="outline" className="mt-2">
                          Retry
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
              <p className="text-gray-600">
                Your transaction history will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTransactions;
