let loading;

export function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = () => {
        loading = null;
        reject(new Error('Could not load the payment window. Check your connection and try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return loading;
}

// payment = the object the API returned: { orderId, amount, currency, keyId, description }
export async function openCheckout({ payment, businessName, prefill, onSuccess, onDismiss, onError }) {
  await loadCheckout();
  const rzp = new window.Razorpay({
    key: payment.keyId,
    order_id: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    name: businessName,
    description: payment.description,
    prefill,
    theme: { color: '#1f6f78' },
    handler: onSuccess, // receives razorpay_payment_id, razorpay_order_id, razorpay_signature
    modal: { ondismiss: onDismiss },
  });
  rzp.on('payment.failed', (r) => onError && onError((r.error && r.error.description) || 'The payment failed. Please try again.'));
  rzp.open();
}
