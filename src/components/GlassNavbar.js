"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { RefreshCw, ShieldCheck, Shield } from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';

export default function GlassNavbar() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isPremium, setIsPremium] = useState(false);
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

  // Ads system states
  const [showAdsModal, setShowAdsModal] = useState(false);
  const [adList, setAdList] = useState([]);
  const [currentAd, setCurrentAd] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [adStatus, setAdStatus] = useState('not_started'); // 'not_started' | 'watching' | 'completed'
  const [adCoinsValue, setAdCoinsValue] = useState(15);
  const [adLoading, setAdLoading] = useState(false);

  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(false);
  const [topupError, setTopupError] = useState('');

  // Simulated Razorpay sandbox states
  const [showRazorpayMock, setShowRazorpayMock] = useState(false);
  const [mockOrderId, setMockOrderId] = useState('');
  const [mockAmount, setMockAmount] = useState(0);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockTab, setMockTab] = useState('card'); // 'card' | 'upi' | 'netbanking'

  const openCustomerModal = () => {
    if (!user) return;
    setShowCustomerModal(true);
    setActiveTab('impact');

    const userId = user.id || user._id;

    // Fetch wallet balance
    setWalletLoading(true);
    fetch(`${API_BASE_URL}/api/auth/wallet/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.walletBalance !== undefined) {
          setWalletBalance(data.walletBalance);
          const stored = localStorage.getItem('decarb_user');
          const u = stored ? JSON.parse(stored) : user;
          const updated = { ...u, walletBalance: data.walletBalance };
          localStorage.setItem('decarb_user', JSON.stringify(updated));
          setUser(updated);
          window.dispatchEvent(new Event('auth-change'));
        }
      })
      .catch(err => console.error('Error fetching wallet:', err))
      .finally(() => setWalletLoading(false));

    // Fetch coins balance
    setCoinsLoading(true);
    fetch(`${API_BASE_URL}/api/auth/coins/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.coinsBalance !== undefined) {
          setCoinsBalance(data.coinsBalance);
          const stored = localStorage.getItem('decarb_user');
          const u = stored ? JSON.parse(stored) : user;
          const updated = { ...u, coinsBalance: data.coinsBalance };
          localStorage.setItem('decarb_user', JSON.stringify(updated));
          setUser(updated);
          window.dispatchEvent(new Event('auth-change'));
        }
      })
      .catch(err => console.error('Error fetching coins:', err))
      .finally(() => setCoinsLoading(false));

    // Fetch personal impact stats
    setImpactLoading(true);
    fetch(`${API_BASE_URL}/api/analytics/stats?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        setImpactStats(data);
      })
      .catch(err => console.error('Error fetching stats:', err))
      .finally(() => setImpactLoading(false));

    // Fetch past orders
    setOrdersLoading(true);
    fetch(`${API_BASE_URL}/api/order/user/${userId}`)
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
      const orderRes = await fetch(`${API_BASE_URL}/api/payment/order`, {
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

              // Update balance
              const topupRes = await fetch(`${API_BASE_URL}/api/auth/wallet/topup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id || user._id, amount }),
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
        // Fallback: Launch Simulated Test Payment Sandbox Modal
        console.log('[Razorpay] Simulated payment mode active.');
        setMockOrderId(orderData.id);
        setMockAmount(amount);
        setShowRazorpayMock(true);
      }
    } catch (err) {
      setTopupError(err.message);
      setTopupLoading(false);
    }
  };

  const handleMockTopupSuccess = async () => {
    setMockLoading(true);
    try {
      // Call verify with mock order ID
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

      // Update balance
      const topupRes = await fetch(`${API_BASE_URL}/api/auth/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || user._id, amount: mockAmount }),
      });
      const topupData = await topupRes.json();
      if (!topupRes.ok) throw new Error(topupData.error || 'Top-up failed');

      setWalletBalance(topupData.walletBalance);
      const updatedUser = { ...user, walletBalance: topupData.walletBalance };
      localStorage.setItem('decarb_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('auth-change'));

      setTopupAmount('');
      setTopupSuccess(true);
      setShowRazorpayMock(false);
      setTimeout(() => setTopupSuccess(false), 3000);
    } catch (err) {
      setTopupError(err.message);
      setShowRazorpayMock(false);
    } finally {
      setMockLoading(false);
      setTopupLoading(false);
    }
  };

  const handleMockTopupDismiss = () => {
    setTopupError('Payment window cancelled by user.');
    setShowRazorpayMock(false);
    setTopupLoading(false);
  };

  useEffect(() => {
    // Read the actual theme attribute from documentElement on mount
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);

    // Read initial premium state
    const storedPremium = localStorage.getItem('decarb_premium') === 'true';
    setIsPremium(storedPremium);

    // Check local storage for user info on boot
    const storedUser = localStorage.getItem('decarb_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      if (u.coinsBalance !== undefined) setCoinsBalance(u.coinsBalance);
    }

    // Listen for cross-origin messages from the scanner iframe
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PREMIUM_STATUS') {
        const premiumVal = event.data.isPremium;
        setIsPremium(premiumVal);
        localStorage.setItem('decarb_premium', premiumVal ? 'true' : 'false');
      }
    };
    window.addEventListener('message', handleMessage);

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
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('decarb_theme', nextTheme);

    // Broadcast theme update to any scanner iframe on the page
    const iframe = document.querySelector('iframe[title="LastBite AI Scanner"]');
    if (iframe) {
      iframe.contentWindow.postMessage({ type: 'THEME_CHANGE', theme: nextTheme }, '*');
    }
  };

  const handleScannerClick = () => {
    if (pathname === '/consumer/scanner') {
      router.push('/consumer');
    } else {
      router.push('/consumer/scanner');
    }
  };

  const handlePremiumClick = () => {
    if (pathname === '/consumer/scanner') {
      window.dispatchEvent(new Event('open-premium-modal'));
    } else {
      router.push('/consumer/scanner?premium=true');
    }
  };

  const handleAdsClick = async () => {
    setAdLoading(true);
    setAdStatus('not_started');
    setShowAdsModal(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`);
      if (res.ok) {
        const data = await res.json();
        setAdCoinsValue(data.adCoinsValue || 15);
        if (data.activeAds && data.activeAds.length > 0) {
          setAdList(data.activeAds);
          const randomAd = data.activeAds[Math.floor(Math.random() * data.activeAds.length)];
          setCurrentAd(randomAd);
          setCountdown(randomAd.duration || 5);
        }
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (e) {
      setAdCoinsValue(15);
      const defaultAd = {
        title: 'EcoBite Organic Surplus Box',
        company: 'EcoBite Groceries',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fruits-and-vegetables-in-a-market-stall-42284-large.mp4',
        duration: 5,
        description: 'Save 70% on premium organic surpluses! Watch to earn reward coins.'
      };
      setCurrentAd(defaultAd);
      setCountdown(5);
    } finally {
      setAdLoading(false);
    }
  };

  const startWatchingAd = () => {
    setAdStatus('watching');
    setCountdown(currentAd ? currentAd.duration : 5);
  };

  useEffect(() => {
    let timer;
    if (adStatus === 'watching' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (adStatus === 'watching' && countdown === 0) {
      awardAdCoins();
    }
    return () => clearTimeout(timer);
  }, [adStatus, countdown]);

  const awardAdCoins = async () => {
    setAdStatus('completed');
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/coins/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || user._id,
          amount: adCoinsValue
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCoinsBalance(data.coinsBalance);
        
        // Update user state and local storage
        const storedUser = localStorage.getItem('decarb_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          const updated = { ...u, coinsBalance: data.coinsBalance };
          localStorage.setItem('decarb_user', JSON.stringify(updated));
          setUser(updated);
        }
        window.dispatchEvent(new Event('auth-change'));
      }
    } catch (e) {
      console.error('Error awarding coins:', e);
    }
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
        {/* Premium Upgrade Button (Crown/Gold Logo) */}
        {user && user.role === 'customer' && (
          <button
            onClick={handlePremiumClick}
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
              border: isPremium ? '2.5px solid #fbbf24' : '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#000',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              padding: 0,
              outline: 'none',
            }}
            className="hover-lift"
            title={isPremium ? "Premium Active - Click to view plans" : "Unlock Premium Subscription"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isPremium ? "#000000" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isPremium ? "animate-pulse" : ""}>
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
              <path d="M3 20h18" />
            </svg>
          </button>
        )}

        {/* Ads Play Button (Vibrant Logo) */}
        {user && user.role === 'customer' && (
          <button
            onClick={handleAdsClick}
            style={{
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.45)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              padding: 0,
              outline: 'none',
            }}
            className="hover-lift"
            title="Watch Ads & Earn Free Coins"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        )}

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={handleScannerClick} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.15)', color: '#059669',
                  padding: '6px 12px', borderRadius: '20px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }} className="hover-lift">
                  <img src="/ai-scanner-logo.png" alt="AI Scanner" style={{ width: '16px', height: '16px', filter: theme === 'dark' ? 'brightness(1.2)' : 'none' }} />
                  AI Scanner
                </button>
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
              </div>
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

      {/* ── Ads System Modal Overlay ── */}
      {showAdsModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-card animate-fade-in"
            style={{
              maxWidth: '520px',
              width: '95%',
              padding: '24px',
              borderRadius: '24px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-hover)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ec4899' }}>
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  LastBite Ad Revenue
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Watch ad campaigns to earn free GreenCoins!</p>
              </div>
              {/* Only show Close button if not started or finished! Cannot close while watching! */}
              {(adStatus === 'not_started' || adStatus === 'completed') && (
                <button
                  onClick={() => setShowAdsModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}
                >
                  &times;
                </button>
              )}
            </div>

            {/* Modal Body */}
            {adLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Ad Campaign...</div>
            ) : currentAd ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Ad Details Banner */}
                <div style={{ background: 'var(--surface-alt)', borderRadius: '16px', padding: '14px', border: '1px solid var(--border)', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                    SPONSORED CAMPAIGN
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', marginBottom: '2px' }}>
                    {currentAd.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    by {currentAd.company} • Earn {adCoinsValue} Coins
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    {currentAd.description}
                  </p>
                </div>

                {/* Ad Player Segment */}
                <div style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: '#000',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid var(--border)'
                }}>
                  {adStatus === 'not_started' && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(3px)',
                      zIndex: 10,
                      gap: '12px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(236,72,153,0.4)',
                        cursor: 'pointer'
                      }} onClick={startWatchingAd}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </div>
                      <p style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700 }}>
                        Click to watch ad and earn {adCoinsValue} coins
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem' }}>
                        Ad duration: {currentAd.duration} seconds • No skip option
                      </p>
                    </div>
                  )}

                  {adStatus === 'watching' && (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <video
                        src={currentAd.videoUrl}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      
                      {/* Timer Overlay */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        zIndex: 20
                      }}>
                        Reward in: {countdown}s
                      </div>

                      {/* Progress Line Bar */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        zIndex: 20
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: '#ec4899',
                          width: `${((currentAd.duration - countdown) / currentAd.duration) * 100}%`,
                          transition: 'width 1s linear'
                        }} />
                      </div>
                    </div>
                  )}

                  {adStatus === 'completed' && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(16, 185, 129, 0.95)',
                      zIndex: 10,
                      gap: '8px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(255,255,255,0.4)'
                      }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                        Success! Reward Claimed
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>
                        🪙 +{adCoinsValue} GreenCoins credited successfully!
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', marginTop: '6px', margin: 0 }}>
                        Your coins are updated and ready for checkout discounts.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action CTA Button */}
                {adStatus === 'completed' && (
                  <button
                    onClick={() => setShowAdsModal(false)}
                    className="btn btn-primary"
                    style={{ background: '#ec4899', borderColor: '#db2777', color: '#ffffff', width: '100%', py: '12px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: '800' }}
                  >
                    Done • Back to Dashboard
                  </button>
                )}

              </div>
            ) : (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No active ad campaigns at the moment.</div>
            )}

          </div>
        </div>
      )}
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
                onClick={handleMockTopupDismiss}
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
                onClick={handleMockTopupSuccess}
                disabled={mockLoading}
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
                onClick={handleMockTopupDismiss}
                disabled={mockLoading}
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
    </nav>
  );
}
