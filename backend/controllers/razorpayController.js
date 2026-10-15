const crypto = require('crypto');
const Razorpay = require('razorpay');

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: String(req.user?._id || req.user?.id || '')
      }
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    return res.status(500).json({
      message: 'Could not create Razorpay order',
      error: error.message
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      razorpay_order_id,
      razorpay_payment_id
    });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not verify payment',
      error: error.message
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment
};