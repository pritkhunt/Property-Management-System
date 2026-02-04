const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { runQuery, getOne, getAll } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

// Create Razorpay Order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user.id;

    console.log('💳 Creating payment order for property:', propertyId);

    // Get property details
    const property = await getOne(
      'SELECT * FROM Properties WHERE Id = ?',
      [propertyId]
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if property is already sold
    if (property.Status === 'sold') {
      return res.status(400).json({
        success: false,
        message: 'Property is already sold'
      });
    }

    // Check if user is trying to buy their own property
    if (property.UserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot buy your own property'
      });
    }

    const amount = Math.round(property.Price * 100); // Convert to paise (smallest currency unit)
    const currency = 'INR';

    // Create Razorpay order
    const options = {
      amount: amount,
      currency: currency,
      receipt: `property_${propertyId}_${Date.now()}`,
      notes: {
        propertyId: propertyId,
        userId: userId,
        propertyTitle: property.Title
      }
    };

    const order = await razorpay.orders.create(options);

    // Save transaction to database
    const transaction = await runQuery(
      `INSERT INTO Transactions (UserId, PropertyId, AgentId, Amount, Currency, RazorpayOrderId, Status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, propertyId, property.AgentId, property.Price, currency, order.id]
    );

    console.log('✅ Order created:', order.id);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amount,
        currency: currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        property: {
          id: property.Id,
          title: property.Title,
          price: property.Price,
          image: property.Images ? property.Images.split(',')[0] : null
        },
        transactionId: transaction.id
      }
    });
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

// Verify Payment
router.post('/verify', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      propertyId
    } = req.body;

    console.log('🔍 Verifying payment:', razorpay_payment_id);

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      console.error('❌ Invalid payment signature');
      
      // Update transaction status to failed
      await runQuery(
        `UPDATE Transactions 
         SET Status = 'failed', UpdatedAt = CURRENT_TIMESTAMP 
         WHERE RazorpayOrderId = ?`,
        [razorpay_order_id]
      );

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update transaction with payment details
    await runQuery(
      `UPDATE Transactions 
       SET RazorpayPaymentId = ?, RazorpaySignature = ?, Status = 'completed', UpdatedAt = CURRENT_TIMESTAMP 
       WHERE RazorpayOrderId = ?`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Update property status to sold
    await runQuery(
      `UPDATE Properties 
       SET Status = 'sold', UpdatedAt = CURRENT_TIMESTAMP 
       WHERE Id = ?`,
      [propertyId]
    );

    console.log('✅ Payment verified and property marked as sold');

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      }
    });
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Get user's transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await getAll(
      `SELECT 
        t.*,
        p.Title as PropertyTitle,
        p.Images as PropertyImages,
        p.City as PropertyCity,
        p.State as PropertyState
       FROM Transactions t
       LEFT JOIN Properties p ON t.PropertyId = p.Id
       WHERE t.UserId = ?
       ORDER BY t.CreatedAt DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Get specific transaction
router.get('/transaction/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await getOne(
      `SELECT 
        t.*,
        p.Title as PropertyTitle,
        p.Images as PropertyImages,
        p.Price as PropertyPrice,
        p.City as PropertyCity,
        p.State as PropertyState,
        a.Name as AgentName,
        a.Email as AgentEmail
       FROM Transactions t
       LEFT JOIN Properties p ON t.PropertyId = p.Id
       LEFT JOIN Agents a ON t.AgentId = a.Id
       WHERE t.Id = ? AND t.UserId = ?`,
      [id, userId]
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('❌ Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
});

// Get all transactions (Admin only)
router.get('/admin/transactions', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const transactions = await getAll(
      `SELECT 
        t.*,
        p.Title as PropertyTitle,
        p.Images as PropertyImages,
        p.City as PropertyCity,
        p.State as PropertyState,
        u.Name as BuyerName,
        u.Email as BuyerEmail,
        a.Name as AgentName,
        a.Email as AgentEmail
       FROM Transactions t
       LEFT JOIN Properties p ON t.PropertyId = p.Id
       LEFT JOIN Users u ON t.UserId = u.Id
       LEFT JOIN Agents a ON t.AgentId = a.Id
       ORDER BY t.CreatedAt DESC`
    );

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('❌ Get admin transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Get agent's transactions
router.get('/agent/transactions', authenticate, async (req, res) => {
  try {
    const agentId = req.user.id;

    // Check if user is agent
    if (req.user.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Agent only.'
      });
    }

    const transactions = await getAll(
      `SELECT 
        t.*,
        p.Title as PropertyTitle,
        p.Images as PropertyImages,
        p.City as PropertyCity,
        p.State as PropertyState,
        u.Name as BuyerName,
        u.Email as BuyerEmail
       FROM Transactions t
       LEFT JOIN Properties p ON t.PropertyId = p.Id
       LEFT JOIN Users u ON t.UserId = u.Id
       WHERE t.AgentId = ?
       ORDER BY t.CreatedAt DESC`,
      [agentId]
    );

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('❌ Get agent transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

module.exports = router;
