"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import RestaurantSidebar from '@/components/RestaurantSidebar';
import Link from 'next/link';

export default function RestaurantLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('decarb_user');
    if (!raw) {
      router.push('/?auth=login');
      return;
    }
    try {
      const u = JSON.parse(raw);
      if (u.role !== 'restaurant') {
        router.push('/');
        return;
      }
      setUser(u);
    } catch (_) {
      router.push('/?auth=login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('decarb_user');
    localStorage.removeItem('decarb_token');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="dash-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', background: 'var(--background)' }}>
        <div className="ra2-spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading Restaurant Portal…</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  // Get active tab for mobile nav
  const activeTab = pathname === '/restaurant' ? 'home' : pathname === '/restaurant/analytics' ? 'analytics' : 'operations';

  return (
    <div className="dash-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-alt)' }}>
      {/* Desktop Sidebar */}
      <RestaurantSidebar user={user} />

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header */}
        <header className="mobile-only-header" style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              {(user.name || 'R')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name || 'Restaurant'}</p>
              <p style={{ fontSize: '0.7rem', color: '#9AA0A6', marginTop: '1px' }}>Restaurant Portal</p>
            </div>
          </div>
          <button onClick={handleSignOut} style={{
            background: 'none',
            border: 'none',
            color: '#C5221F',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            Sign Out
          </button>
        </header>

        {/* Desktop Header */}
        <header className="desktop-only-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Last Bite</span>
            <span>/</span>
            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{activeTab === 'home' ? 'Dashboard' : activeTab}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: '#9AA0A6', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <div style={{ height: '16px', width: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.name}
            </span>
          </div>
        </header>

        {/* Content Children */}
        <main style={{ flex: 1, position: 'relative', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        zIndex: 999,
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.05)'
      }}>
        <Link href="/restaurant" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          color: activeTab === 'home' ? 'var(--primary)' : 'var(--text-secondary)',
          fontSize: '0.7rem',
          fontWeight: activeTab === 'home' ? 700 : 500
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          <span>Dashboard</span>
        </Link>
        <Link href="/restaurant/orders" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          color: activeTab === 'operations' ? 'var(--primary)' : 'var(--text-secondary)',
          fontSize: '0.7rem',
          fontWeight: activeTab === 'operations' ? 700 : 500
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Operations</span>
        </Link>
        <Link href="/restaurant/analytics" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-secondary)',
          fontSize: '0.7rem',
          fontWeight: activeTab === 'analytics' ? 700 : 500
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Analytics</span>
        </Link>
      </nav>

      {/* Responsive Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 880px) {
          .mobile-only-header { display: flex !important; }
          .desktop-only-header { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
          main {
            padding-bottom: 80px !important;
          }
        }
      `}} />
    </div>
  );
}
