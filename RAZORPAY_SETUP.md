# Razorpay Integration Setup

This application uses **Razorpay** as the payment gateway instead of Stripe, as Razorpay is specifically designed for India and provides excellent support for Indian payment methods.

## Why Razorpay?

- ✅ Best-in-class payment gateway for India
- ✅ Supports multiple payment methods (Cards, Net Banking, UPI, Wallets)
- ✅ Competitive pricing
- ✅ Excellent API and developer support
- ✅ PCI DSS Level 1 certified

## Setup Instructions

### 1. Create a Razorpay Account

1. Visit [Razorpay](https://razorpay.com)
2. Sign up for a free account
3. Complete KYC verification (required for live payments)
4. Go to Dashboard > Settings > API Keys

### 2. Get Your API Keys

In the Razorpay Dashboard:
- Copy your **Key ID** (public key)
- Copy your **Key Secret** (private key - keep this secure!)

### 3. Update Backend Environment Variables

Edit `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

Replace the values with your actual Razorpay API keys from the dashboard.

### 4. Update Frontend Environment Variables

Edit `frontend/.env`:

```env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

Use the same **Key ID** (it's safe to expose in frontend code).

### 5. Install Dependencies

In the backend directory, install Razorpay SDK:

```bash
cd backend
npm install razorpay
```

### 6. How Payment Flow Works

1. **Generate Billing Report** - Create a billing record for a specific period
2. **Pay Now Button** - Click the "Pay Now" button on a pending billing record
3. **Create Order** - Backend creates a Razorpay order
4. **Razorpay Checkout** - User sees Razorpay's secure payment form
5. **Process Payment** - User completes payment with their preferred method
6. **Verify Signature** - Backend verifies the payment using cryptographic signature
7. **Mark as Paid** - Billing record is updated as paid

### 7. Test Payment

**Use these test credentials:**

- Email: any email
- Contact: any 10-digit number

**Test Cards:**

- Visa: `4111 1111 1111 1111` | Expiry: Any future date | CVV: Any 3 digits
- Mastercard: `5555 5555 5555 4444` | Expiry: Any future date | CVV: Any 3 digits

### 8. Go Live (Production)

When you're ready to accept real payments:

1. Complete full KYC verification on Razorpay
2. Request activation for live mode
3. Get your **live API keys** from the dashboard
4. Update your `.env` files with live keys (they start with `rzp_live_`)
5. Deploy to production

## Troubleshooting

### "Razorpay is loading" Error

- Make sure your internet connection is stable
- Check browser console for any network errors
- Verify that checkout.razorpay.com is accessible

### "Payment signature mismatch"

- Verify that `RAZORPAY_KEY_SECRET` is correctly set in backend `.env`
- Ensure you're using the correct key secret, not the key ID

### Order Creation Fails

- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- Check backend logs for detailed error messages
- Ensure MongoDB is connected and working

## Security Notes

⚠️ **Important:**
- Never expose `RAZORPAY_KEY_SECRET` in frontend code
- Never commit `.env` files with real credentials to version control
- Always use HTTPS in production
- Validate all payments on the backend before marking as paid

## API Endpoints

### Create Payment Order

```
POST /api/billing/create-order
Authorization: Bearer {token}
Body: {
  "billingId": "bill_id",
  "amount": 999.99
}
```

Response: Order details with order ID and amount

### Verify Payment

```
POST /api/billing/verify-payment
Authorization: Bearer {token}
Body: {
  "orderId": "order_id",
  "paymentId": "pay_id",
  "signature": "signature_hash",
  "billingId": "bill_id"
}
```

Response: Confirmation and updated billing record

## References

- [Razorpay Documentation](https://razorpay.com/docs)
- [Razorpay Orders API](https://razorpay.com/docs/api/orders)
- [Razorpay Payment Gateway](https://razorpay.com/docs/payment-gateway)
- [Test Cards](https://razorpay.com/docs/payments/payments-gateway/test-card-details)
