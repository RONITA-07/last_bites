"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function GlassNavbar() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const router = useRouter();
  const pathname = usePathname();

  // Customer Dashboard & Wallet states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [activeTab, setActiveTab] = useState('impact'); // 'impact' | 'orders' | 'wallet'
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [impactStats, setImpactStats] = useState({ mealsRescued: 0, co2Saved: 0, revenueRecovered: 0 });
  const [impactLoading, setImpactLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [coinsLoading, setCoinsLoading] = useState(false);

  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(false);
  const [topupError, setTopupError] = useState('');

  const openCustomerModal = () => {
    if (!user) return;
    setShowCustomerModal(true);
    setActiveTab('impact');

    // Fetch wallet balance
    setWalletLoading(true);
    fetch(`http://localhost:5000/api/auth/wallet/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.walletBalance !== undefined) {
          setWalletBalance(data.walletBalance);
          const stored = localStorage.getItem('decarb_user');
          const u = stored ? JSON.parse(stored) : user;
          const updated = { ...u, walletBalance: data.walletBalance };
          localStorage.setItem('decarb_user', JSON.stringify(updated));
        }
      })
      .catch(err => console.error('Error fetching wallet:', err))
      .finally(() => setWalletLoading(false));

    // Fetch coins balance
    setCoinsLoading(true);
    fetch(`http://localhost:5000/api/auth/coins/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.coinsBalance !== undefined) {
          setCoinsBalance(data.coinsBalance);
          const stored = localStorage.getItem('decarb_user');
          const u = stored ? JSON.parse(stored) : user;
          const updated = { ...u, coinsBalance: data.coinsBalance };
          localStorage.setItem('decarb_user', JSON.stringify(updated));
        }
      })
      .catch(err => console.error('Error fetching coins:', err))
      .finally(() => setCoinsLoading(false));

    // Fetch personal impact stats
    setImpactLoading(true);
    fetch(`http://localhost:5000/api/analytics/stats?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setImpactStats(data);
      })
      .catch(err => console.error('Error fetching stats:', err))
      .finally(() => setImpactLoading(false));

    // Fetch past orders
    setOrdersLoading(true);
    fetch(`http://localhost:5000/api/order/user/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(sorted);
        }
      })
      .catch(err => console.error('Error fetching orders:', err))
      .finally(() => setOrdersLoading(false));
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    setTopupError('');
    setTopupSuccess(false);

    const amount = Number(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      setTopupError('Please enter a valid amount.');
      return;
    }

    setTopupLoading(true);
    try {
      // 1. Create Order on Backend
      const orderRes = await fetch('http://localhost:5000/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR' }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to initialize payment order');

      // 2. Launch Razorpay modal if SDK is loaded and keys are not mocked
      if (typeof window !== 'undefined' && window.Razorpay && !orderData.isMock) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_fallback_id',
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Last Bite",
          description: "Wallet Top Up",
          order_id: orderData.id,
          handler: async function (response) {
            try {
              // Verify signature
              const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
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

              // Update balance
              const topupRes = await fetch('http://localhost:5000/api/auth/wallet/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, amount }),
              });
              const topupData = await topupRes.json();
              if (!topupRes.ok) throw new Error(topupData.error || 'Top-up failed');

              setWalletBalance(topupData.walletBalance);
              const updatedUser = { ...user, walletBalance: topupData.walletBalance };
              localStorage.setItem('decarb_user', JSON.stringify(updatedUser));
              window.dispatchEvent(new Event('auth-change'));

              setTopupAmount('');
              setTopupSuccess(true);
              setTimeout(() => setTopupSuccess(false), 3000);
            } catch (err) {
              setTopupError(err.message);
            } finally {
              setTopupLoading(false);
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
              setTopupLoading(false);
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback: Simulated Test Payment (No keys configured, or keys are mock)
        console.log('[Razorpay] Simulated payment mode active.');
        setTopupError('Launching Simulated Test Payment... (No real keys configured)');

        setTimeout(async () => {
          try {
            setTopupError('');

            // Call verify with mock order ID
            const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: orderData.id,
                razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.error || 'Verification failed');
            }

            // Update balance
            const topupRes = await fetch('http://localhost:5000/api/auth/wallet/topup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, amount }),
            });
            const topupData = await topupRes.json();
            if (!topupRes.ok) throw new Error(topupData.error || 'Top-up failed');

            setWalletBalance(topupData.walletBalance);
            const updatedUser = { ...user, walletBalance: topupData.walletBalance };
            localStorage.setItem('decarb_user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('auth-change'));

            setTopupAmount('');
            setTopupSuccess(true);
            setTimeout(() => setTopupSuccess(false), 3000);
          } catch (err) {
            setTopupError(err.message);
          } finally {
            setTopupLoading(false);
          }
        }, 2000);
      }
    } catch (err) {
      setTopupError(err.message);
      setTopupLoading(false);
    }
  };

  useEffect(() => {
    // Read the actual theme attribute from documentElement on mount
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);

    // Check local storage for user info on boot
    const storedUser = localStorage.getItem('decarb_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      if (u.coinsBalance !== undefined) setCoinsBalance(u.coinsBalance);
    }

    // Listen for custom authentication changes (e.g. login/register/logout)
    const handleAuthChange = () => {
      const stored = localStorage.getItem('decarb_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        if (u.coinsBalance !== undefined) setCoinsBalance(u.coinsBalance);
      } else {
        setUser(null);
        setCoinsBalance(0);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('decarb_theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('decarb_user');
    localStorage.removeItem('decarb_token');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      height: '70px',
      borderRadius: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      zIndex: 1000,
      boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
    }}>
      {/* Brand Logo */}
      <Link href={
        user
          ? user.role === 'customer' ? '/consumer'
            : user.role === 'restaurant' ? '/restaurant'
              : '/ngo'
          : '/'
      } style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        fontWeight: 800,
        fontSize: '1.4rem',
        color: 'var(--primary)',
        fontFamily: "'Outfit', sans-serif"
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Last Bite" style={{ width: '32px', height: '32px' }} />
        Last <span style={{ color: 'var(--secondary)' }}>Bite</span>
      </Link>

      {/* Nav Links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>
        {!user && (
          <Link href="/" style={{
            color: pathname === '/' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: pathname === '/' ? '700' : '500',
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'var(--transition-smooth)'
          }}>
            Home
          </Link>
        )}

        {user && user.role === 'customer' && (
          <Link href="/consumer" style={{
            color: pathname === '/consumer' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: pathname === '/consumer' ? '700' : '500',
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'var(--transition-smooth)'
          }}>
            Rescue Deals
          </Link>
        )}

        {user && user.role === 'restaurant' && (
          <Link href="/restaurant" style={{
            color: pathname === '/restaurant' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: pathname === '/restaurant' ? '700' : '500',
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'var(--transition-smooth)'
          }}>
            Dashboard
          </Link>
        )}

        {user && user.role === 'restaurant' && (
          <Link href="/restaurant/analytics" style={{
            color: pathname === '/restaurant/analytics' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: pathname === '/restaurant/analytics' ? '700' : '500',
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'var(--transition-smooth)'
          }}>
            Analytics
          </Link>
        )}

        {user && user.role === 'ngo' && (
          <Link href="/ngo" style={{
            color: pathname === '/ngo' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: pathname === '/ngo' ? '700' : '500',
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'var(--transition-smooth)'
          }}>
            NGO Portal
          </Link>
        )}
      </div>

      {/* Auth Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)',
            color: 'var(--text-primary)',
            outline: 'none',
            padding: 0,
          }}
          aria-label="Toggle Theme"
          className="btn-icon"
        >
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.5s ease' }}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.5s ease', transform: 'rotate(45deg)' }}>
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        {user ? (
          <>
            {user.role === 'customer' ? (
              <button
                onClick={openCustomerModal}
                style={{
                  fontSize: '0.85rem',
                  background: 'var(--accent)',
                  color: 'var(--primary)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid rgba(47,107,79,0.2)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'var(--transition-smooth)'
                }}
                className="hover-lift"
              >
                {user.role}
              </button>
            ) : (
              <span style={{
                fontSize: '0.85rem',
                background: 'var(--accent)',
                color: 'var(--primary)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {user.role}
              </span>
            )}
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Hi, {user.name.split(' ')[0]}
            </span>
            <button onClick={handleLogout} className="btn btn-glass" style={{
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            {/* We will route to modals or standard routes. Let's make an intuitive modal trigger or redirect them to sign-in */}
            <Link href="/?auth=login" className="btn btn-glass" style={{
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}>
              Sign In
            </Link>
            <Link href="/?auth=register" className="btn btn-primary" style={{
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}>
              Get Started
            </Link>
          </>
        )}
      </div>

      {/* ── Customer Profile & Dashboard Modal ── */}
      {showCustomerModal && user && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div
            className="modal-card animate-fade-in"
            style={{ maxWidth: '600px', width: '90%', padding: '28px', borderRadius: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Hi, {user.name}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f6b4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z" />
                    <path d="M9 22v-4" />
                  </svg>
                  <span style={{ fontSize: '1.1rem', color: '#d97706', fontWeight: 700, marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                      <circle cx="12" cy="12" r="8" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="9" y1="12" x2="15" y2="12" />
                    </svg>
                    {coinsBalance} Coins
                  </span>
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Customer Profile & Dashboard</p>
              </div>
              <button
                onClick={() => setShowCustomerModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Tabs menu */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveTab('impact')}
                style={{
                  background: activeTab === 'impact' ? 'var(--primary)' : 'none',
                  color: activeTab === 'impact' ? '#fff' : 'var(--text-secondary)',
                  padding: '8px 16px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'var(--transition-smooth)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z" />
                  <path d="M9 22v-4" />
                </svg>
                My Impact
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  background: activeTab === 'orders' ? 'var(--primary)' : 'none',
                  color: activeTab === 'orders' ? '#fff' : 'var(--text-secondary)',
                  padding: '8px 16px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'var(--transition-smooth)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Past Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                style={{
                  background: activeTab === 'wallet' ? 'var(--primary)' : 'none',
                  color: activeTab === 'wallet' ? '#fff' : 'var(--text-secondary)',
                  padding: '8px 16px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'var(--transition-smooth)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
                LastBite Wallet
              </button>
            </div>

            {/* Tab content */}
            <div style={{ minHeight: '260px' }}>
              {/* Impact Tab */}
              {activeTab === 'impact' && (
                <div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Your ecological savings from rescuing surplus food:</p>
                  {impactLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Calculating impact...</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div style={{ background: 'var(--accent)', borderRadius: '18px', padding: '16px', textAlign: 'center', border: '1px solid rgba(47,107,79,0.1)' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                          <path d="M3 12h18" />
                          <path d="M3 12a9 9 0 0 0 18 0" />
                          <path d="M12 2v6" />
                          <path d="M8 4v4" />
                          <path d="M16 4v4" />
                        </svg>
                        <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: '6px 0 2px' }}>{impactStats.mealsRescued}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Meals Rescued</p>
                      </div>
                      <div style={{ background: '#E1F5FE', borderRadius: '18px', padding: '16px', textAlign: 'center', border: '1px solid rgba(2,136,209,0.1)' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0288D1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z" />
                          <path d="M9 22v-4" />
                        </svg>
                        <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0288D1', margin: '6px 0 2px' }}>{impactStats.co2Saved} kg</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CO₂ Saved</p>
                      </div>
                      <div style={{ background: '#E8F5E9', borderRadius: '18px', padding: '16px', textAlign: 'center', gridColumn: 'span 2', border: '1px solid rgba(46,125,50,0.1)' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                          <path d="M12 20V10" />
                          <path d="M18 10a6 6 0 0 0-12 0c0 3 3 3 3 6h6s3 0 3-6z" />
                          <path d="M12 20h4M12 20H8" />
                        </svg>
                        <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2E7D32', margin: '6px 0 2px' }}>{(impactStats.co2Saved / 20).toFixed(1)} trees</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Annual Tree Absorption Equivalent</p>
                      </div>
                      <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: '18px', padding: '16px', textAlign: 'center', gridColumn: 'span 2', border: '1px solid rgba(217,119,6,0.1)' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                          <circle cx="12" cy="12" r="8" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="9" y1="12" x2="15" y2="12" />
                        </svg>
                        <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', margin: '6px 0 2px' }}>{coinsBalance} Coins</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Value: ₹{(coinsBalance / 100).toFixed(2)} (Redeemable at checkout)</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Past Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Rescue History</h3>
                  {ordersLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading past rescues...</div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <p style={{ fontSize: '0.88rem' }}>No orders placed yet. Rescue some delicious meals nearby!</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                      {orders.map(order => {
                        const listing = order.food_id || {};
                        const restName = listing.restaurant_id?.name || 'Partner Store';
                        const dateStr = new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                        return (
                          <div
                            key={order._id}
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: 'var(--surface-alt)', borderRadius: '12px', padding: '12px',
                              border: '1px solid var(--border)'
                            }}
                          >
                            <div>
                              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{listing.title || 'Surplus Box'}</h4>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{restName} • {dateStr}</p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Qty: {order.quantity}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>₹{order.total_price.toFixed(2)}</strong>
                              <div>
                                <span style={{
                                  fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '6px', marginTop: '4px', display: 'inline-block',
                                  background: order.status === 'completed' ? '#dcfce7' : order.status === 'picked' ? '#e0f2fe' : '#fef3c7',
                                  color: order.status === 'completed' ? '#15803d' : order.status === 'picked' ? '#0369a1' : '#b45309'
                                }}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Tab */}
              {activeTab === 'wallet' && (
                <div>
                  <div style={{ background: 'var(--accent)', borderRadius: '18px', padding: '16px', textAlign: 'center', marginBottom: '16px', border: '1px solid rgba(47,107,79,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--primary)', marginBottom: '6px' }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="12" y1="4" x2="12" y2="20" />
                      </svg>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>LastBite Wallet Balance</p>
                    {walletLoading ? (
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>Loading...</h3>
                    ) : (
                      <h3 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>₹{walletBalance.toFixed(2)}</h3>
                    )}
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Add funds here and enjoy one-click checkout payments.</p>
                  </div>

                  <div style={{ background: 'var(--surface-alt)', borderRadius: '18px', padding: '14px', border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Top Up Wallet
                    </h4>

                    {topupSuccess && (
                      <div style={{ background: '#E6F4EA', color: '#2f6b4f', padding: '8px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '10px' }}>
                        Wallet topped up successfully!
                      </div>
                    )}
                    {topupError && (
                      <div style={{ background: '#FCE8E6', color: '#C5221F', padding: '8px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {topupError}
                      </div>
                    )}

                    <form onSubmit={handleTopup} style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', flexGrow: 1 }}>
                        <span style={{ position: 'absolute', left: '12px', top: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>₹</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Amount to add (e.g. 500)"
                          value={topupAmount}
                          onChange={e => setTopupAmount(e.target.value)}
                          className="form-input"
                          style={{ paddingLeft: '22px', height: '40px', fontSize: '0.9rem' }}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={topupLoading}
                        className="btn btn-primary"
                        style={{ height: '40px', padding: '0 16px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                      >
                        {topupLoading ? 'Adding...' : 'Add Funds'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}
