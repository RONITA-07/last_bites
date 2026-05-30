"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  /* ── Auth redirect: if already logged in, go to their domain ── */
  useEffect(() => {
    const stored = localStorage.getItem('decarb_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role === 'customer')    { router.replace('/consumer'); return; }
        if (u.role === 'restaurant') { router.replace('/restaurant'); return; }
        if (u.role === 'ngo')    { router.replace('/ngo'); return; }
      } catch (_) {}
    }
    setLoading(false);
  }, [router]);

  /* Dynamic Motto */
  const mottos = [
    "Every meal saved reduces carbon footprint",
    "Zero food waste future",
    "Turning surplus into impact",
    "Food for all, waste for none",
  ];
  const [mottoIndex, setMottoIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in');

  /* ── Sign-in modal ── */
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  /* Motto ticker */
  useEffect(() => {
    const iv = setInterval(() => {
      setFadeState('out');
      setTimeout(() => { setMottoIndex(p => (p + 1) % mottos.length); setFadeState('in'); }, 500);
    }, 4000);
    return () => clearInterval(iv);
  }, [mottos.length]);

  /* Listen for ?auth=login query */
  useEffect(() => {
    const authType = searchParams.get('auth');
    if (authType === 'login') setShowLogin(true);
    else if (authType === 'register') router.replace('/register');
    else setShowLogin(false);
  }, [searchParams, router]);

  const closeLogin = () => { setShowLogin(false); router.push('/'); };

  const handleRoleCardClick = (role) => {
    router.push(`/register?role=${role}`);
  };

  /* Sign-in submit */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('decarb_token', data.token);
      localStorage.setItem('decarb_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));

      if (data.user.role === 'customer')    router.push('/consumer');
      else if (data.user.role === 'restaurant') router.push('/restaurant');
      else if (data.user.role === 'ngo')    router.push('/ngo');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const roles = [
    {
      id: 'customer',
      label: "I'm a Customer",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2f6b4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2h1l1.5 9h11l1.5-9H21" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /><path d="M5.5 11h13" />
        </svg>
      ),
      desc: 'Rescue delicious surplus meals at great discounts while helping the planet.',
    },
    {
      id: 'restaurant',
      label: "I'm a Restaurant",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2f6b4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
      ),
      desc: 'List excess food, cut waste, and recover lost revenue through our network.',
    },
    {
      id: 'ngo',
      label: "I'm an NGO",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2f6b4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      desc: 'Claim free food donations for communities in need and expand your impact.',
    },
  ];

  const impactStats = [
    { value: '1.2M', label: 'MEALS RESCUED' },
    { value: '450+', label: 'PARTNERS' },
    { value: '2.8K Tons', label: 'CO2 EMISSIONS PREVENTED', wide: true },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', background: 'var(--background)' }}>
        <div className="ra2-spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Redirecting to your dashboard…</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  return (
    <>
      {/* ── Main scrollable area ── */}
      <main className="home-page">

        {/* ─── Hero ─── */}
        <section className="home-hero">
          {/* Ambient Glow */}
          <div className="home-hero__glow" />

          <div className="home-hero__badge animate-fade-in delay-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            ELIMINATE FOOD WASTE TOGETHER
          </div>

          <h1 className="home-hero__title animate-fade-in delay-2">
            Rescue Food.<br />Reduce Waste.
          </h1>

          <p className="home-hero__sub animate-fade-in delay-3">
            Connecting local surplus food listings directly to hungry consumers and distribution NGOs.
          </p>

          {/* Animated motto */}
          <div
            className="home-hero__motto animate-fade-in delay-4"
            style={{ opacity: fadeState === 'in' ? 1 : 0, transform: fadeState === 'in' ? 'translateY(0)' : 'translateY(-8px)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {mottos[mottoIndex]}
          </div>
        </section>

        {/* ─── Role Cards ─── */}
        <section className="home-roles">
          {roles.map((role, idx) => (
            <div key={role.id} className={`home-role-card animate-fade-in delay-${idx + 3}`} onClick={() => handleRoleCardClick(role.id)}>
              <div className="home-role-card__icon">{role.icon}</div>
              <h3 className="home-role-card__title">{role.label}</h3>
              <p className="home-role-card__desc">{role.desc}</p>
              <button className="home-role-card__btn">
                GET STARTED →
              </button>
            </div>
          ))}
        </section>

        {/* ─── Impact Stats ─── */}
        <section className="home-impact animate-fade-in delay-5">
          <h2 className="home-impact__title">Our Shared Impact</h2>
          <div className="home-impact__grid">
            {impactStats.map((s) => (
              <div key={s.label} className={`home-impact__stat${s.wide ? ' home-impact__stat--wide' : ''}`}>
                <span className="home-impact__value">{s.value}</span>
                <span className="home-impact__label">{s.label}</span>
              </div>
            ))}
          </div>
          {/* decorative leaf icon */}
          <div className="home-impact__deco" aria-hidden>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="home-footer animate-fade-in delay-5">
          <div className="home-footer__brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f6b4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Last Bite
          </div>
          <nav className="home-footer__links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Impact</a>
            <a href="#">Contact</a>
          </nav>
          <p className="home-footer__copy">© 2024 Last Bite. Waste less, feed more.</p>
        </footer>
      </main>

      {/* ─── Bottom Nav Bar (mobile) ─── */}
      <nav className="home-bottom-nav" aria-label="Bottom navigation">
        <button className="home-bottom-nav__item home-bottom-nav__item--active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </button>
        <button className="home-bottom-nav__item" onClick={() => router.push('/register?role=restaurant')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
          <span>Rstrnt</span>
        </button>
        <button className="home-bottom-nav__item" onClick={() => router.push('/register?role=ngo')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>Partners</span>
        </button>
        <button className="home-bottom-nav__item" onClick={() => router.push('/?auth=login')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </button>
      </nav>

      {/* ── Sign-In Modal ── */}
      {showLogin && (
        <div className="modal-overlay" onClick={closeLogin}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>Sign In</h2>
              <button onClick={closeLogin} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}>×</button>
            </div>

            {loginError && (
              <div style={{ background: '#FCE8E6', color: '#C5221F', padding: '12px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
                <input type="text" className="form-input" placeholder="name@decarb.io" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</label>
                <input type="password" className="form-input" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={loginLoading} className="btn btn-primary" style={{ height: '50px', borderRadius: '12px', fontSize: '1rem', marginTop: '8px' }}>
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '20px' }}>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => router.push('/register')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Create one →
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}
