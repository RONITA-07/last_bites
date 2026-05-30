"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { RefreshCw, ShieldCheck, Shield } from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';

// ── Payment Processing Overlay ─────────────────────────────────────────────────
function PaymentOverlay({ stage }) {
  // stage: 'processing' | 'done'
  const steps = [
    {
      id: 'processing',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      label: 'Encrypting your payment…'
    },
    {
      id: 'verifying',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
          <line x1="3" y1="21" x2="21" y2="21" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M5 21V10" />
          <path d="M19 21V10" />
          <path d="M12 21V10" />
          <path d="M4 10l8-6 8 6" />
        </svg>
      ),
      label: 'Verifying with your bank…'
    },
    {
      id: 'confirming',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#16a34a' }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      label: 'Confirming order…'
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 30, 20, 0.82)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeInOverlay 0.3s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: '28px',
        padding: '48px 40px', maxWidth: '400px', width: '90%',
        textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        animation: 'slideUpCard 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {stage === 'processing' ? (
          <>
            {/* Spinner */}
            <div style={{
              width: '72px', height: '72px', margin: '0 auto 24px',
              border: '5px solid #E6F4EA',
              borderTop: '5px solid #2f6b4f',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C1C1C', marginBottom: '8px' }}>
              Processing Payment
            </h2>
            <p style={{ color: '#9AA0A6', fontSize: '0.88rem', marginBottom: '28px' }}>
              Please do not close this page
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              {steps.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '12px',
                  background: '#F4F7F5',
                  animation: `slideUpFade 0.4s ${i * 0.3}s both`,
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>{s.icon}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6F65' }}>{s.label}</span>
                  <div style={{ marginLeft: 'auto', width: '16px', height: '16px', border: '2px solid #E6F4EA', borderTop: '2px solid #2f6b4f', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Success tick */}
            <div style={{
              width: '80px', height: '80px', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #2f6b4f, #4CAF7A)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff',
              boxShadow: '0 8px 30px rgba(47,107,79,0.4)',
              animation: 'confirmPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1C1C1C', marginBottom: '8px' }}>
              Payment Successful
            </h2>
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
              Your order has been confirmed
            </p>
            <p style={{ color: '#9AA0A6', fontSize: '0.82rem' }}>
              Redirecting to your order summary…
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin           { to { transform: rotate(360deg); } }
        @keyframes fadeInOverlay  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUpCard    { from { transform:translateY(40px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes confirmPop     { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }
      `}</style>
    </div>
  );
}

// ── Main Checkout Page ─────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [user, setUser] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [useCoins, setUseCoins] = useState(false);

  // Payment stage: null | 'processing' | 'done'
  const [payStage, setPayStage] = useState(null);
  const [error, setError] = useState('');

  // Simulated Razorpay sandbox states for surplus order checkout
  const [showRazorpayMock, setShowRazorpayMock] = useState(false);
  const [mockOrderId, setMockOrderId] = useState('');
  const [mockAmount, setMockAmount] = useState(0);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockTab, setMockTab] = useState('card'); // 'card' | 'upi' | 'netbanking'
  const [mockResolve, setMockResolve] = useState(null);
  const [mockReject, setMockReject] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('decarb_user');
    if (!stored) { router.push('/?auth=login'); return; }
    const u = JSON.parse(stored);
    if (u.role !== 'customer') { router.push('/'); return; }
    setUser(u);
    setName(u.name || '');
    setEmail(u.email || '');
  }, [router]);

  useEffect(() => {
    if (user) {
      const userId = user.id || user._id;
      fetch(`${API_BASE_URL}/api/auth/wallet/${userId}`)
        .then(r => r.json())
        .then(data => {
          if (data.walletBalance !== undefined) {
            setWalletBalance(data.walletBalance);
          }
        })
        .catch(err => console.error('Error fetching wallet balance:', err));

      fetch(`${API_BASE_URL}/api/auth/coins/${userId}`)
        .then(r => r.json())
        .then(data => {
          if (data.coinsBalance !== undefined) {
            setCoinsBalance(data.coinsBalance);
          }
        })
        .catch(err => console.error('Error fetching coins balance:', err));
    }
  }, [user]);

  useEffect(() => {
    if (user && items.length === 0 && !payStage) router.replace('/consumer/cart');
  }, [user, items, router, payStage]);

  if (!user) return null;

  const co2Total = items.reduce((s, i) => s + Number(i.listing.co2_saved || 0) * i.qty, 0);
  const savingsTotal = items.reduce((s, i) => s + (Number(i.listing.original_price || 0) - Number(i.listing.price || 0)) * i.qty, 0);
  const mealsCount = items.reduce((s, i) => s + i.qty, 0);

  const coinsDiscount = useCoins ? Math.min(coinsBalance / 100, totalPrice) : 0;
  const finalPrice = Math.max(0, Number((totalPrice - coinsDiscount).toFixed(2)));

  const handleMockCheckoutSuccess = async () => {
    setMockLoading(true);
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || 'Verification failed');
      }
      setShowRazorpayMock(false);
      if (mockResolve) mockResolve();
    } catch (err) {
      setError(err.message);
      setShowRazorpayMock(false);
      if (mockReject) mockReject(err);
    } finally {
      setMockLoading(false);
    }
  };

  const handleMockCheckoutDismiss = () => {
    setError('Payment window cancelled by user.');
    setShowRazorpayMock(false);
    if (mockReject) mockReject(new Error('Payment window cancelled.'));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    const userId = user.id || user._id;
    if (method === 'upi' && !upiId.trim()) { setError('Please enter your UPI ID.'); return; }
    if (method === 'card' && (!cardNo.trim() || !expiry.trim() || !cvv.trim())) { setError('Please fill all card details.'); return; }
    if (method === 'wallet' && walletBalance < finalPrice) {
      setError(`Insufficient wallet balance. Total is ₹${finalPrice.toFixed(2)}, but you only have ₹${walletBalance.toFixed(2)}.`);
      return;
    }

    // Step 1: show "processing" overlay
    setPayStage('processing');

    try {
      let appliedDiscount = 0;
      let updatedUserCoins = coinsBalance;

      // 1. Redeem Coins First (Atomic step)
      if (useCoins && coinsBalance > 0) {
        const coinsToRedeem = Math.min(coinsBalance, Math.round(coinsDiscount * 100));
        if (coinsToRedeem > 0) {
          const redeemRes = await fetch(`${API_BASE_URL}/api/auth/coins/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, coinsToRedeem }),
          });
          const redeemData = await redeemRes.json();
          if (!redeemRes.ok) throw new Error(redeemData.error || 'Failed to redeem coins');
          appliedDiscount = coinsToRedeem / 100;
          updatedUserCoins = redeemData.coinsBalance;
        }
      }

      let updatedUserWallet = walletBalance;

      // 2. Perform Payment
      if (method === 'wallet') {
        const payRes = await fetch(`${API_BASE_URL}/api/auth/wallet/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, amount: finalPrice }),
        });
        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.error || 'Wallet payment failed');
        updatedUserWallet = payData.walletBalance;
      }
      else if (method === 'razorpay') {
        // Create payment order
        const orderRes = await fetch(`${API_BASE_URL}/api/payment/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalPrice }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create payment order');

        if (typeof window !== 'undefined' && window.Razorpay && !orderData.isMock) {
          const razorpayPromise = new Promise((resolve, reject) => {
            const options = {
              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_fallback_id',
              amount: orderData.amount,
              currency: orderData.currency,
              name: "Last Bite",
              description: "Order Rescue Payment",
              order_id: orderData.id,
              handler: async function (response) {
                try {
                  const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature
                    })
                  });
                  const verifyData = await verifyRes.json();
                  if (!verifyRes.ok || !verifyData.verified) {
                    throw new Error(verifyData.error || 'Signature verification failed');
                  }
                  resolve(verifyData);
                } catch (err) {
                  reject(err);
                }
              },
              prefill: {
                name: user.name,
                email: user.email,
              },
              theme: {
                color: "#2f6b4f"
              },
              modal: {
                ondismiss: function () {
                  reject(new Error('Payment window cancelled.'));
                }
              }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
          });

          await razorpayPromise;
        } else {
          // Fallback: Simulated Test Payment Sandbox Modal
          console.log('[Razorpay] Simulated payment mode active for checkout.');
          setMockOrderId(orderData.id);
          setMockAmount(finalPrice);
          setShowRazorpayMock(true);

          await new Promise((resolve, reject) => {
            setMockResolve(() => resolve);
            setMockReject(() => reject);
          });
        }
      }

      // Sync local storage user with updated coins and wallet balances
      const updatedUser = { ...user, walletBalance: updatedUserWallet, coinsBalance: updatedUserCoins };
      localStorage.setItem('decarb_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('auth-change'));

      // Place the orders, distributing discount proportionally
      let remainingDiscount = appliedDiscount;
      const [results] = await Promise.all([
        Promise.all(
          items.map(({ listing, qty }) => {
            const itemCost = Number(listing.price) * qty;
            let itemDiscount = 0;
            if (remainingDiscount > 0) {
              if (remainingDiscount >= itemCost) {
                itemDiscount = itemCost;
                remainingDiscount -= itemCost;
              } else {
                itemDiscount = remainingDiscount;
                remainingDiscount = 0;
              }
            }
            return fetch(`${API_BASE_URL}/api/order/place`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                food_id: listing._id,
                quantity: qty,
                discount: Number(itemDiscount.toFixed(2))
              }),
            }).then(r => r.json());
          })
        ),
        new Promise(res => setTimeout(res, 1000)),
      ]);

      const failed = results.find(r => r.error);
      if (failed) throw new Error(failed.error || 'One or more orders failed');

      // Fetch latest coins balance from backend (since placing orders credits new coins)
      try {
        const coinFetch = await fetch(`${API_BASE_URL}/api/auth/coins/${userId}`);
        const coinData = await coinFetch.json();
        if (coinData && coinData.coinsBalance !== undefined) {
          const finalUser = { ...updatedUser, coinsBalance: coinData.coinsBalance };
          localStorage.setItem('decarb_user', JSON.stringify(finalUser));
          setUser(finalUser);
          window.dispatchEvent(new Event('auth-change'));
        }
      } catch (err) {
        console.warn('Failed to update post-order coins balance in local storage:', err);
      }

      // Step 2: show "payment done" overlay
      setPayStage('done');

      // Build order summary data to pass to confirmed page
      const pickupTime = items[0]?.listing?.pickup_time;
      const orderData = {
        items: items.map(i => ({
          title: i.listing.title,
          qty: i.qty,
          price: Number(i.listing.price) * i.qty,
          restaurantName: typeof i.listing.restaurant_id === 'object' && i.listing.restaurant_id
            ? i.listing.restaurant_id.name : 'Partner Store',
          pickup_time: i.listing.pickup_time,
          preparation_date: i.listing.preparation_date,
          preparation_time: i.listing.preparation_time,
        })),
        totalPrice: finalPrice,
        co2Total,
        savingsTotal,
        mealsCount,
        paymentMethod: method,
        orderTime: new Date().toISOString(),
        pickupTime,
      };
      sessionStorage.setItem('decarb_last_order', JSON.stringify(orderData));

      clearCart();

      // Wait 1.8s on success screen then redirect
      setTimeout(() => router.push('/consumer/confirmed'), 1800);
    } catch (err) {
      setPayStage(null);
      setError(err.message);
    }
  };

  return (
    <>
      {/* Payment overlay */}
      {payStage && <PaymentOverlay stage={payStage} />}

      <main className="page-container" style={{ maxWidth: '860px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/consumer/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '14px', fontWeight: 500 }}>
            ← Back to Cart
          </Link>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            Payment
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Secure checkout — your details are never stored.
          </p>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

            {/* ── Left: Form ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Contact */}
              <div className="checkout-section">
                <h2 className="checkout-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Contact Details
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Riya Sharma" required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">Email</label>
                      <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="riya@email.com" required />
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-section">
                <h2 className="checkout-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                  Payment Method
                </h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'upi', label: 'UPI' },
                    { id: 'card', label: 'Card' },
                    { id: 'wallet', label: 'LastBite Wallet' },
                    { id: 'razorpay', label: 'Razorpay Gateway' },
                    { id: 'cod', label: 'Cash on Pickup' },
                  ].map(m => (
                    <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                      className={`payment-tab ${method === m.id ? 'payment-tab--active' : ''}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {m.id === 'upi' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="21" x2="21" y2="21" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M5 21V10" /><path d="M19 21V10" /><path d="M12 21V10" /><path d="M4 10l8-6 8 6" /></svg>}
                      {m.id === 'card' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}
                      {m.id === 'wallet' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /><path d="M19 7h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6Z" /></svg>}
                      {m.id === 'razorpay' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}
                      {m.id === 'cod' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                      {m.label}
                    </button>
                  ))}
                </div>

                {method === 'upi' && (
                  <div className="payment-fields">
                    <label className="form-label">UPI ID</label>
                    <input type="text" className="form-input" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      Accepted: GPay, PhonePe, Paytm, BHIM, any UPI app
                    </p>
                  </div>
                )}

                {method === 'card' && (
                  <div className="payment-fields" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="form-label">Card Number</label>
                      <input type="text" className="form-input" value={cardNo} onChange={e => setCardNo(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Expiry (MM/YY)</label>
                        <input type="text" className="form-input" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="08/27" maxLength={5} />
                      </div>
                      <div>
                        <label className="form-label">CVV</label>
                        <input type="password" className="form-input" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="•••" maxLength={4} />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'wallet' && (
                  <div className="payment-fields" style={{ background: 'var(--accent)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>Wallet Balance:</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>₹{walletBalance.toFixed(2)}</strong>
                    </div>
                    {walletBalance >= finalPrice ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2f6b4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        Sufficient balance. The total amount of ₹{finalPrice.toFixed(2)} will be deducted from your wallet.
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.78rem', color: '#C5221F', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        Insufficient balance. You need ₹{(finalPrice - walletBalance).toFixed(2)} more. Please top up your wallet under the Customer details menu.
                      </p>
                    )}
                  </div>
                )}

                {method === 'razorpay' && (
                  <div className="payment-fields" style={{ background: '#E6F4EA', borderRadius: '12px', padding: '16px', fontSize: '0.88rem', color: '#2f6b4f', fontWeight: 500 }}>
                    Pay securely using cards, UPI, netbanking, or wallets via the **Razorpay test payment gateway**.
                  </div>
                )}

                {method === 'cod' && (
                  <div className="payment-fields" style={{ background: '#E6F4EA', borderRadius: '12px', padding: '16px', fontSize: '0.88rem', color: '#2f6b4f', fontWeight: 500 }}>
                    Pay with cash when you pick up your order. No advance payment needed.
                  </div>
                )}

                {/* Coins Bar */}
                <div style={{
                  marginTop: '20px',
                  background: coinsBalance > 0 ? 'linear-gradient(135deg, #f0f7f4, #e8f3ee)' : '#f9f9f9',
                  border: coinsBalance > 0 ? '1.5px dashed #2f6b4f' : '1.5px solid var(--border)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: coinsBalance > 0 ? 'pointer' : 'default',
                  opacity: coinsBalance > 0 ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                }} onClick={() => coinsBalance > 0 && setUseCoins(!useCoins)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      fontSize: '1.8rem',
                      background: '#fff',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                      color: 'var(--primary)'
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M17 12H7" /></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Use LastBite Coins
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {coinsBalance > 0 ? (
                          <>You have <strong>{coinsBalance}</strong> coins. Redeem to save <strong>₹{(coinsBalance / 100).toFixed(2)}</strong>.</>
                        ) : (
                          <>Earn 1 coin per surplus meal rescued to save on future orders!</>
                        )}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useCoins}
                    disabled={coinsBalance === 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (coinsBalance > 0) {
                        setUseCoins(e.target.checked);
                      }
                    }}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#2f6b4f',
                      cursor: coinsBalance > 0 ? 'pointer' : 'default',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: '#FCE8E6', color: '#C5221F', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  {error}
                </div>
              )}
            </div>

            {/* ── Right: Summary ── */}
            <div className="cart-summary">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Order Summary</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {items.map(({ listing, qty }) => {
                  const formatPrepDate = (dateStr) => {
                    if (!dateStr) return '';
                    try {
                      const parts = dateStr.split('-');
                      if (parts.length === 3) {
                        const date = new Date(parts[0], parts[1] - 1, parts[2]);
                        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                      }
                    } catch (_) { }
                    return dateStr;
                  };

                  return (
                    <div key={listing._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: '#5F6F65', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {listing.title} ×{qty}
                        </span>
                        {(listing.preparation_date || listing.preparation_time) && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                            Prepared: <strong>{formatPrepDate(listing.preparation_date)}{listing.preparation_time ? ` @ ${listing.preparation_time}` : ''}</strong>
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: '#1C1C1C' }}>
                        {Number(listing.price) === 0 ? 'Free' : `₹${(Number(listing.price) * qty).toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '2px solid #EAEEF2', paddingTop: '14px', marginBottom: '16px' }}>
                <div className="summary-row" style={{ color: '#16a34a' }}>
                  <span>You Save</span><span>−₹{savingsTotal.toFixed(2)}</span>
                </div>
                {useCoins && coinsBalance > 0 && (
                  <div className="summary-row" style={{ color: '#d97706', fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M17 12H7" /></svg>
                      Coins Discount
                    </span>
                    <span>−₹{coinsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row summary-row--total" style={{ marginTop: '8px' }}>
                  <span>Total</span><span>₹{finalPrice.toFixed(2)}</span>
                </div>
                <div style={{ marginTop: '10px', background: '#E0F2F1', borderRadius: '10px', padding: '10px 12px', fontSize: '0.78rem', color: '#00695C', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-1 9.8a7 7 0 0 1-7 8.2z" /><path d="M9 22v-4h4" /></svg>
                  <span>This order saves {co2Total.toFixed(1)} kg CO₂ — equivalent to planting {(co2Total / 20).toFixed(1)} trees!</span>
                </div>
              </div>

              <button type="submit" disabled={!!payStage} className="checkout-btn"
                style={{ border: 'none', cursor: payStage ? 'not-allowed' : 'pointer', opacity: payStage ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {payStage ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    Confirm & Pay ₹{finalPrice.toFixed(2)}
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px', fontSize: '0.72rem', color: '#9AA0A6', fontWeight: 500 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Secure & encrypted checkout
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* ── Simulated Razorpay Sandbox Modal Overlay ── */}
      {showRazorpayMock && (
        <div className="modal-overlay" style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card animate-fade-in" style={{
            maxWidth: '440px',
            width: '92%',
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-hover)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #047857)',
              color: '#ffffff',
              padding: '16px 20px',
              borderRadius: '16px 16px 0 0',
              margin: '-24px -24px 20px -24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                  RAZORPAY TEST API SANDBOX
                </span>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, marginTop: '4px', color: '#ffffff' }}>Last Bite Payment Gateway</h4>
              </div>
              <button
                onClick={handleMockCheckoutDismiss}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Amount details */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Amount to Charge</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                ₹{mockAmount.toFixed(2)}
              </h2>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Order ID: {mockOrderId}
              </span>
            </div>

            {/* Selector Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-alt)', padding: '4px', borderRadius: '10px', marginBottom: '16px' }}>
              {['card', 'upi', 'netbanking'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMockTab(tab)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: mockTab === tab ? 'var(--primary)' : 'transparent',
                    color: mockTab === tab ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ minHeight: '130px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              {mockTab === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Card Number</label>
                    <input type="text" placeholder="4111 1111 1111 1111" className="form-input" style={{ height: '36px', fontSize: '0.82rem', marginTop: '3px' }} disabled />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expiry</label>
                      <input type="text" placeholder="12/29" className="form-input" style={{ height: '36px', fontSize: '0.82rem', marginTop: '3px' }} disabled />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CVV</label>
                      <input type="password" placeholder="***" className="form-input" style={{ height: '36px', fontSize: '0.82rem', marginTop: '3px' }} disabled />
                    </div>
                  </div>
                </div>
              )}

              {mockTab === 'upi' && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <rect x="7" y="7" width="3" height="3" />
                    <rect x="14" y="7" width="3" height="3" />
                    <rect x="7" y="14" width="3" height="3" />
                    <rect x="14" y="14" width="3" height="3" />
                  </svg>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scan simulated dynamic QR Code</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Use any sandbox UPI app to trigger response.</p>
                </div>
              )}

              {mockTab === 'netbanking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Select Test Bank</label>
                  <select className="form-input" style={{ height: '38px', fontSize: '0.82rem', padding: '0 10px', marginTop: '3px' }} disabled>
                    <option>State Bank of India (SBI)</option>
                    <option>HDFC Bank Sandbox</option>
                    <option>ICICI Bank Sandbox</option>
                    <option>Axis Bank Sandbox</option>
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleMockCheckoutSuccess}
                disabled={mockLoading}
                type="button"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: mockLoading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  opacity: mockLoading ? 0.7 : 1
                }}
              >
                {mockLoading ? (
                  <>
                    <RefreshCw size={14} className="ra2-spinner" style={{ animation: 'spin 1s linear infinite' }} />
                    Verifying Sandbox...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} /> Simulate Payment Success
                  </>
                )}
              </button>

              <button
                onClick={handleMockCheckoutDismiss}
                disabled={mockLoading}
                type="button"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  cursor: mockLoading ? 'default' : 'pointer'
                }}
              >
                Cancel Sandbox Payment
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '14px', color: 'var(--text-secondary)', fontSize: '0.62rem', fontWeight: 600 }}>
              <Shield size={12} style={{ color: '#10b981' }} /> Secure Sandbox Protected by Razorpay simulator
            </div>
          </div>
        </div>
      )}
    </>
  );
}
